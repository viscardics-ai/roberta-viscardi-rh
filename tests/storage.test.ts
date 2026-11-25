import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { Miniflare } from 'miniflare'
import { sources } from '../src/catalog'
import { authorize, editorData, editorWrite } from '../server/editor'
import { hasValidSession, signIn } from '../server/session'
import { updatePortal } from '../server/update'

let runtime: Miniflare
let db: D1Database

before(async () => {
  runtime = new Miniflare({
    enableDevRegistry: false,
    telemetry: { enabled: false },
    cf: false,
    workers: [{ config: {
      name: 'rv-editorial-test',
      compatibilityDate: '2026-05-15',
      manifest: { mainModule: 'index.js', modules: {
        'index.js': { type: 'esm', contents: 'export default { fetch() { return new Response("ready") } }' },
      } },
      env: { DB: { type: 'd1', id: crypto.randomUUID() } },
    } }],
  })
  db = (await runtime.getD1Database('DB')) as unknown as D1Database
  const migration = await readFile('migrations/0001_portal.sql', 'utf8')
  await db.batch(migration.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => db.prepare(sql)))
})

after(async () => { await runtime?.dispose() })

test('persiste coleta em D1, mantém válidos durante falhas e impede repetição imediata', async () => {
  const active = sources.filter(source => source.feed && source.lang !== 'en')
  const selected = active[0]
  await db.batch(active.slice(1).map(source => db.prepare('INSERT INTO source_settings (id,enabled) VALUES (?,0)').bind(source.id)))
  const feed = `<rss><channel>
    <item><title>Mercado de trabalho contrata para funções de gestão de pessoas</title><link>https://example.org/emprego</link>
    <description>Texto descritivo fornecido no feed</description><pubDate>${new Date().toUTCString()}</pubDate></item>
    <item><title>Mercado de trabalho contrata para funções de gestão de pessoas</title><link>https://example.org/duplicada</link></item>
  </channel></rss>`
  let etag: string | null = null
  const upstream: typeof fetch = async (url, init) => {
    assert.equal(url, selected.feed)
    etag = new Headers(init?.headers).get('If-None-Match')
    return new Response(feed, { headers: { 'Content-Type': 'application/rss+xml', ETag: '"v1"' } })
  }
  const first = await updatePortal({ DB: db }, 'manual', upstream)
  assert.equal(first.added, 1)
  assert.equal(first.state, 'ok')
  assert.equal(etag, null)
  await assert.rejects(updatePortal({ DB: db }, 'manual', upstream), /15 minutos/)
  const next = await updatePortal({ DB: db }, 'scheduled', upstream)
  assert.equal(next.added, 0)
  assert.equal(etag, '"v1"')
  const failed = await updatePortal({ DB: db }, 'scheduled', async () => new Response('', { status: 503 }))
  assert.equal(failed.state,'failed')
  assert.deepEqual(failed.failures,[selected.name])
  assert.equal(await db.prepare('SELECT count(*) AS total FROM entries').first('total'), 1)
  await assert.rejects(updatePortal({ DB: db }, 'manual', upstream), /1 minuto/)
  const afterFailure = new Date(Date.now() - 2 * 60_000).toISOString()
  const earlierRuns = new Date(Date.now() - 20 * 60_000).toISOString()
  await db.prepare("UPDATE update_runs SET started=CASE WHEN json_extract(status,'$.state')='failed' THEN ? ELSE ? END")
    .bind(afterFailure, earlierRuns).run()
  const recovered = await updatePortal({ DB: db }, 'manual', upstream)
  assert.equal(recovered.state, 'ok')
  assert.equal(recovered.added, 0)
})

test('exige sessão e aprovação explícita, mantendo rascunho e versão pública separados', async () => {
  const env = { DB: db, EDITOR_PASSWORD: crypto.randomUUID(), EDITOR_SESSION_KEY: crypto.randomUUID() }
  const unauthenticated = new Request('https://portal.example.org/api/editor')
  await assert.rejects(authorize(unauthenticated, env), /senha editorial/)
  await assert.rejects(signIn(unauthenticated, env, 'senha-incorreta'), /Senha inválida/)
  const cookie = await signIn(unauthenticated, env, env.EDITOR_PASSWORD)
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/)
  const authenticated = new Request(unauthenticated.url, { headers: { Cookie: cookie.split(';')[0] } })
  assert.equal(await hasValidSession(authenticated, env), true)
  assert.equal(await hasValidSession(authenticated, { ...env, EDITOR_SESSION_KEY: crypto.randomUUID() }), false)
  const editorDb = await authorize(authenticated, env)
  const input = { id: crypto.randomUUID(), title: 'Texto de teste', summary: 'Resumo de teste', body: 'Conteúdo original', references: [] }
  const draft = await editorWrite(editorDb, { action: 'draft', draft: input })
  assert.equal(await db.prepare('SELECT public_data FROM articles').first('public_data'), null)
  await assert.rejects(editorWrite(editorDb, { action: 'publish', draft, approved: false }), /aprovação explícita/)
  const published = await editorWrite(editorDb, { action: 'publish', draft, approved: true })
  assert.ok('published' in published && published.published)
  await editorWrite(editorDb, { action: 'draft', draft: { ...published, title: 'Título em revisão' } })
  const publicState = await db.prepare('SELECT public_data FROM articles').first<string>('public_data')
  assert.equal(JSON.parse(publicState!).title, 'Texto de teste')
  assert.equal((await editorData(editorDb)).drafts[0].title, 'Título em revisão')
})

test('consulta os feeds públicos e grava notícias reais no D1 local', { skip: process.env.PORTAL_LIVE_FEEDS !== '1' }, async context => {
  await db.prepare('DELETE FROM source_settings').run()
  const report = await updatePortal({ DB: db }, 'scheduled')
  context.diagnostic(JSON.stringify(report))
  assert.notEqual(report.state, 'failed')
  assert.ok(report.added > 0)
  assert.ok((await db.prepare('SELECT count(*) AS total FROM entries').first<number>('total') ?? 0) > 1)
})
