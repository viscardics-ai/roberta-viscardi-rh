import { sources } from '../src/catalog'
import type { Source } from '../src/catalog'
import { safeHttps } from '../src/model'
import type { Entry, UpdateStatus } from '../src/model'
import { assist, enabledAI, reserveAiBudget } from './ai'
import type { Env } from './env'
import { parseFeed, readText } from './feed'
import type { FeedEntry } from './feed'

const activeSources = sources.filter(source => source.feed)
const urlAllowlist = new Set(activeSources.map(source => source.feed))
const manualDelay = 15 * 60_000
const leaseTime = 4 * 60_000
const feedLimit = 850_000
const analysisLimit = 2
const maxInserts = 20

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
  const response = await request(url.href, { headers, redirect: 'error', signal: AbortSignal.timeout(7500) })
  if (response.status === 304) return { items: [], source }
  if (!response.ok || !/(?:xml|rss|atom)/i.test(response.headers.get('content-type') || '')) throw new Error('Feed indisponível ou formato incompatível.')
  const xml = await readText(response, feedLimit)
  return { items: await parseFeed(xml, source), cache: { etag: response.headers.get('etag'), modified: response.headers.get('last-modified') }, source }
}

async function recentRun(db: D1Database) {
  return db.prepare('SELECT started FROM update_runs ORDER BY started DESC LIMIT 1').first<string>('started')
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
  if (!await getLease(db, id, now)) throw new UpdateError('Já existe uma coleta em andamento.', 429)
  let started = false
  const status: UpdateStatus = { state: 'running', time: new Date(now).toISOString(), added: 0, failures: [], ai: enabledAI(env) ? 'IA habilitada.' : 'IA desativada ou ainda sem configuração.' }
  try {
    const last = await recentRun(db)
    if (trigger === 'manual' && last && now - Date.parse(last) < manualDelay) {
      throw new UpdateError('Aguarde 15 minutos entre coletas manuais.', 429)
    }
    await db.prepare('INSERT INTO update_runs(id,started,status) VALUES (?,?,?)').bind(id, status.time, JSON.stringify(status)).run()
    started = true
    const configured = await db.prepare('SELECT id,enabled FROM source_settings').all<{ id: string; enabled: number }>()
    const disabled = new Set(configured.results.filter(row => !row.enabled).map(row => row.id))
    const selected = activeSources.filter(source => !disabled.has(source.id) && (source.lang !== 'en' || enabledAI(env)))
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
    if (international > 0 && enabledAI(env)) candidates.unshift(...candidates.splice(international, 1))
    for (const record of candidates) {
      const { entry, titleKey, source } = record
      const translated = source.lang === 'en'
      if (existing.has(entry.url) || existing.has(titleKey)) continue
      if (status.added >= maxInserts || (translated && aiAttempts >= analysisLimit)) {
        pendingSource.add(source.id)
        continue
      }
      const addAI = enabledAI(env) && aiAttempts < analysisLimit && !budgetExhausted
      let assessment: Awaited<ReturnType<typeof assist>> | undefined
      if (addAI) {
        if (await reserveAiBudget(db)) {
          aiAttempts++
          try {
            assessment = await assist(env, entry, translated)
            aiSuccesses++
          } catch { aiFailures++ }
        } else budgetExhausted = true
      }
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
      const sections = assessment?.sections.length ? [{ title: 'A notícia · trecho da fonte', text: data.summary }, ...assessment.sections] : []
      const change = sections.length
        ? (await db.batch([insert, db.prepare('INSERT OR IGNORE INTO analyses(entry_id,provider,created,data) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM entries WHERE id=?)').bind(data.id, env.AI_MODEL || 'Workers AI', status.time, JSON.stringify(sections), data.id)]))[0]
        : await insert.run()
      status.added += change.meta.changes
      existing.add(entry.url)
      existing.add(titleKey)
    }
    for (const { source, cache: next } of successful) {
      if (next && !pendingSource.has(source.id)) {
        await db.prepare('INSERT INTO source_cache(id,etag,modified) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET etag=excluded.etag, modified=excluded.modified')
          .bind(source.id, next.etag, next.modified).run()
      }
    }
    status.state = successful.length ? status.failures.length ? 'partial' : 'ok' : 'failed'
    if (!selected.length) status.failures.push('Nenhuma fonte de coleta ativa')
    if (enabledAI(env)) status.ai = budgetExhausted ? 'Limite diário de IA alcançado. O acervo foi preservado.' :
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
