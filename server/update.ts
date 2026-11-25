import { sources } from '../src/catalog'
import type { Source } from '../src/catalog'
import { safeHttps } from '../src/model'
import type { Entry, UpdateStatus } from '../src/model'
import { AiResponseError, assist, enabledAI, reserveAiBudget } from './ai'
import type { Env } from './env'
import { parseFeed, readText } from './feed'
import type { FeedEntry } from './feed'

const activeSources = sources.filter(source => source.feed)
const urlAllowlist = new Set(activeSources.map(source => source.feed))
const manualDelay = 15 * 60_000
const failedRunDelay = 60_000
const leaseTime = 4 * 60_000
const feedLimit = 850_000
const analysisLimit = 2
const maxInserts = 20
const analysisFailure = 'IA parcialmente indisponível. 0 respostas processadas.'

export class UpdateError extends Error {
  constructor(message: string, readonly code: number) { super(message) }
}

type CacheRow = { etag: string | null; modified: string | null }
type FeedResult = { items: FeedEntry[]; cache?: CacheRow; source: Source }

export async function fetchSource(source: Source, cache?: CacheRow, request: typeof fetch = fetch): Promise<FeedResult> {
  const url = source.feed && safeHttps(source.feed)
  if (!url || !urlAllowlist.has(url.href)) throw new Error('Feed fora do catálogo autorizado.')
  const headers = new Headers({ Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml', 'User-Agent': 'RV-Pessoas-Portal/1.0' })
  if (cache?.etag) headers.set('If-None-Match', cache.etag)
  if (cache?.modified) headers.set('If-Modified-Since', cache.modified)
  const response = await request(url.href, { headers, redirect: 'manual', signal: AbortSignal.timeout(7500) })
  if (response.status === 304) return { items: [], source }
  if (!response.ok || !/(?:xml|rss|atom)/i.test(response.headers.get('content-type') || '')) throw new Error('Feed indisponível ou formato incompatível.')
  const xml = await readText(response, feedLimit)
  return { items: await parseFeed(xml, source), cache: { etag: response.headers.get('etag'), modified: response.headers.get('last-modified') }, source }
}

async function recentRun(db: D1Database) {
  return db.prepare("SELECT started,json_extract(status,'$.state') AS state,json_extract(status,'$.ai') AS ai FROM update_runs ORDER BY started DESC LIMIT 1")
    .first<{ started: string; state: UpdateStatus['state']; ai: string | null }>()
}

async function getLease(db: D1Database, id: string, now: number) {
  return db.prepare(`INSERT INTO refresh_lease(id,holder,until_ms) VALUES (1,?,?)
    ON CONFLICT(id) DO UPDATE SET holder=excluded.holder,until_ms=excluded.until_ms
    WHERE refresh_lease.until_ms<=? RETURNING holder`).bind(id, now + leaseTime, now).first<string>('holder')
}

export async function updatePortal(env: Env, trigger: 'manual' | 'scheduled', request: typeof fetch = fetch): Promise<UpdateStatus> {
  if (!env.DB) throw new UpdateError('O banco de dados ainda não está conectado.', 503)
  const db = env.DB
  const now = Date.now()
  const id = crypto.randomUUID()
  const aiEnabled = enabledAI(env)
  if (!await getLease(db, id, now)) throw new UpdateError('Já existe uma coleta em andamento.', 429)
  let started = false
  const status: UpdateStatus = { state: 'running', time: new Date(now).toISOString(), added: 0, failures: [], ai: aiEnabled ? 'IA habilitada.' : 'IA desativada ou ainda sem configuração.' }
  try {
    const last = await recentRun(db)
    const previousFailed = last?.state === 'failed' || (aiEnabled && last?.ai?.startsWith(analysisFailure))
    const delay = previousFailed ? failedRunDelay : manualDelay
    if (trigger === 'manual' && last && now - Date.parse(last.started) < delay) {
      throw new UpdateError(previousFailed ? 'Aguarde 1 minuto antes de tentar novamente.' : 'Aguarde 15 minutos entre coletas manuais.', 429)
    }
    await db.prepare('INSERT INTO update_runs(id,started,status) VALUES (?,?,?)').bind(id, status.time, JSON.stringify(status)).run()
    started = true
    const configured = await db.prepare('SELECT id,enabled FROM source_settings').all<{ id: string; enabled: number }>()
    const disabled = new Set(configured.results.filter(row => !row.enabled).map(row => row.id))
    const selected = activeSources.filter(source => !disabled.has(source.id) && (source.lang !== 'en' || aiEnabled))
    const cached = await db.prepare('SELECT id,etag,modified FROM source_cache').all<CacheRow & { id: string }>()
    const cache = new Map(cached.results.map(row => [row.id, row]))
    const results = await Promise.allSettled(selected.map(source => fetchSource(source, cache.get(source.id), request)))
    const successful: FeedResult[] = []
    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') successful.push(result.value)
      else status.failures.push(selected[index].name)
    }
    const candidates = successful.flatMap(result => result.items).sort((a,b) => (b.entry.score ?? 0) - (a.entry.score ?? 0) || (b.entry.date || '').localeCompare(a.entry.date || ''))
    let aiAttempts = 0
    let aiFailures = 0
    let aiSuccesses = 0
    let budgetExhausted = false
    let analysisIssue = ''
    const assessed = new Set<string>()
    const canAnalyze = () => aiEnabled && aiAttempts < analysisLimit && !budgetExhausted
    async function analyze(entry: Entry, translate: boolean) {
      if (!canAnalyze()) return undefined
      if (!await reserveAiBudget(db)) {
        budgetExhausted = true
        return undefined
      }
      aiAttempts++
      assessed.add(entry.id)
      try {
        const analysis = await assist(env, entry, translate)
        aiSuccesses++
        return analysis
      } catch (error) {
        aiFailures++
        if (error instanceof AiResponseError) {
          analysisIssue = error.message
        } else {
          const code = error instanceof Error ? error.message.match(/\b5\d{3}\b/)?.[0] : undefined
          analysisIssue = 'Erro no serviço Workers AI' + (code ? ' (código ' + code + ')' : '') + '.'
        }
        console.warn('Falha no Workers AI', error instanceof Error ? error.message.slice(0, 200) : 'Erro desconhecido')
      }
    }
    function saveAnalysis(entry: Entry, sections: NonNullable<Entry['sections']>) {
      const content = [{ title: 'A notícia · trecho da fonte', text: entry.summary }, ...sections]
      return db.prepare('INSERT OR IGNORE INTO analyses(entry_id,provider,created,data) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM entries WHERE id=?)')
        .bind(entry.id, env.AI_MODEL || 'Workers AI', status.time, JSON.stringify(content), entry.id)
    }
    const pendingSource = new Set<string>()
    const existing = new Set<string>()
    for (let index = 0; index < candidates.length; index += 40) {
      const batch = candidates.slice(index, index + 40)
      const markers = batch.map(() => '?').join(',')
      const matched = await db.prepare('SELECT url,title_key FROM entries WHERE url IN (' + markers + ') OR title_key IN (' + markers + ')')
        .bind(...batch.map(item => item.entry.url), ...batch.map(item => item.titleKey)).all<{ url: string; title_key: string }>()
      for (const row of matched.results) {
        existing.add(row.url)
        existing.add(row.title_key)
      }
    }
    const international = candidates.findIndex(item => item.source.lang === 'en' && !existing.has(item.entry.url) && !existing.has(item.titleKey))
    if (international > 0 && aiEnabled) candidates.unshift(...candidates.splice(international, 1))
    for (const record of candidates) {
      const { entry, titleKey, source } = record
      const translated = source.lang === 'en'
      if (existing.has(entry.url) || existing.has(titleKey)) continue
      if (status.added >= maxInserts || (translated && aiAttempts >= analysisLimit)) {
        pendingSource.add(source.id)
        continue
      }
      const assessment = await analyze(entry, translated)
      if (translated && !assessment?.title) {
        pendingSource.add(source.id)
        continue
      }
      const originalTitle = translated ? entry.title : undefined
      const data: Entry = {
        ...entry, originalTitle,
        title: assessment?.title || entry.title,
        summary: assessment?.summary || entry.summary,
      }
      const params = [data.id, entry.url, titleKey, source.id, data.category, data.date ?? null, data.score || 0, status.time, JSON.stringify(data)]
      const insert = db.prepare('INSERT OR IGNORE INTO entries(id,url,title_key,source_id,category,published,score,created,data) VALUES (?,?,?,?,?,?,?,?,?)').bind(...params)
      const change = assessment?.sections.length
        ? (await db.batch([insert, saveAnalysis(data, assessment.sections)]))[0]
        : await insert.run()
      status.added += change.meta.changes
      existing.add(entry.url)
      existing.add(titleKey)
    }
    if (canAnalyze()) {
      const cutoff = new Date(now - 7 * 86400000).toISOString()
      const pending = await db.prepare(`SELECT e.data FROM entries e
        LEFT JOIN analyses a ON a.entry_id=e.id
        WHERE a.entry_id IS NULL AND e.published>=?
        ORDER BY e.score DESC, e.published DESC LIMIT ?`)
        .bind(cutoff, analysisLimit + assessed.size).all<{ data: string }>()
      for (const row of pending.results) {
        const entry = JSON.parse(row.data) as Entry
        if (assessed.has(entry.id)) continue
        const analysis = await analyze(entry, false)
        if (analysis?.sections.length) await saveAnalysis(entry, analysis.sections).run()
      }
    }
    for (const { source, cache: next } of successful) {
      if (next && !pendingSource.has(source.id)) {
        await db.prepare('INSERT INTO source_cache(id,etag,modified) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET etag=excluded.etag, modified=excluded.modified')
          .bind(source.id, next.etag, next.modified).run()
      }
    }
    status.state = successful.length ? status.failures.length ? 'partial' : 'ok' : 'failed'
    if (!selected.length) status.failures.push('Nenhuma fonte de coleta ativa')
    if (aiEnabled) status.ai = budgetExhausted ? 'Limite diário de IA alcançado. O acervo foi preservado.' :
      aiFailures && !aiSuccesses ? analysisFailure + ' ' + analysisIssue :
      aiFailures ? 'IA parcialmente indisponível. ' + aiSuccesses + ' respostas processadas.' :
      aiAttempts ? aiSuccesses + ' respostas de IA processadas.' : 'IA habilitada. Nenhuma análise nova nesta coleta.'
    return status
  } catch (error) {
    status.state = 'failed'
    if (started) status.failures.push('Falha interna na coleta')
    if (error instanceof UpdateError) throw error
    console.error('Falha na coleta editorial', error instanceof Error ? error.name : 'Erro')
    throw new UpdateError('A coleta foi interrompida. Os conteúdos salvos continuam disponíveis.', 502)
  } finally {
    try {
      if (started) await db.prepare('UPDATE update_runs SET completed=?,status=? WHERE id=?').bind(new Date().toISOString(), JSON.stringify(status), id).run()
    } finally {
      await db.prepare('DELETE FROM refresh_lease WHERE id=1 AND holder=?').bind(id).run()
    }
  }
}
