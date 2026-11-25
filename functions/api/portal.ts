import type { Env } from '../../server/env'
import type { Entry, PortalData, UpdateStatus } from '../../src/model'
import { apiError, json } from '../../server/http'

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return json({ state: 'static', entries: [], update: null } satisfies PortalData)
  const db = env.DB
  try {
    const params = new URL(request.url).searchParams
    const ids = params.getAll('id').filter(id => /^(noticia|autoral)-[a-f0-9-]{12,36}$/.test(id)).slice(0, 50)
    const placeholders = ids.map(() => '?').join(',')
    const newsQuery = `SELECT e.data,a.data AS analysis FROM entries e LEFT JOIN analyses a ON a.entry_id=e.id ${ids.length ? 'WHERE e.id IN (' + placeholders + ')' : 'ORDER BY e.published DESC NULLS LAST, e.score DESC LIMIT 200'}`
    const articlesQuery = `SELECT public_data FROM articles WHERE public_data IS NOT NULL ${ids.length ? 'AND id IN (' + placeholders + ')' : 'ORDER BY published DESC LIMIT 100'}`
    const [news, articles, updates] = await db.batch<Record<string, unknown>>([
      db.prepare(newsQuery).bind(...ids),
      db.prepare(articlesQuery).bind(...ids.map(id => id.replace(/^autoral-/, ''))),
      db.prepare('SELECT status,started,completed FROM update_runs ORDER BY started DESC LIMIT 1'),
    ])
    const entries: Entry[] = [
      ...articles.results.map(row => JSON.parse(String(row.public_data)) as Entry),
      ...news.results.map(row => {
        const entry = JSON.parse(String(row.data)) as Entry
        if (row.analysis) {
          entry.sections = JSON.parse(String(row.analysis))
          entry.minutes = 3
          entry.level = 'Intermediário'
        }
        return entry
      }),
    ]
    const update = updates.results.length ? JSON.parse(String(updates.results[0].status)) as UpdateStatus : null
    if (update?.state === 'running' && Date.now() - Date.parse(update.time) > 4 * 60_000) {
      update.state = 'failed'
      update.failures = ['A execução anterior foi interrompida.']
    }
    return json({ state: 'online', entries, update, automatic: env.AUTOMATIC_UPDATES === 'true' } satisfies PortalData)
  } catch (error) { return apiError(error) }
}
