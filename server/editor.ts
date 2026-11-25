import { createRemoteJWKSet, jwtVerify } from 'jose'
import { sources } from '../src/catalog'
import { safeHttps } from '../src/model'
import type { Entry, Reference } from '../src/model'
import { questions } from '../src/editor-model'
import type { Draft, EditorialData, Idea } from '../src/editor-model'
import type { Env } from './env'
import { HttpError } from './http'
import { hasValidSession, passwordEnabled } from './session'

const identityKeys = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export async function authorize(request: Request, env: Env) {
  if (!env.DB) throw new HttpError('Área editorial ainda sem banco de dados.', 503)
  if (await hasValidSession(request, env)) return env.DB
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.EDITOR_EMAIL) {
    if (passwordEnabled(env)) throw new HttpError('Entre com a senha editorial.', 401)
    throw new HttpError('Área editorial ainda sem configuração de acesso.', 503)
  }
  const issuer = safeHttps(env.ACCESS_TEAM_DOMAIN)
  if (!issuer || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.hostname) || issuer.pathname !== '/' || issuer.search || issuer.hash) {
    throw new HttpError('Domínio da autenticação inválido.', 503)
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) throw new HttpError('Entre com a conta editorial autorizada pelo Cloudflare Access.', 401)
  try {
    let jwks = identityKeys.get(issuer.origin)
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer), { timeoutDuration: 2500 })
      identityKeys.set(issuer.origin, jwks)
    }
    const { payload } = await jwtVerify(token, jwks, { issuer: issuer.origin, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'email'] })
    if (typeof payload.email !== 'string' || payload.email.toLowerCase() !== env.EDITOR_EMAIL.toLowerCase()) {
      throw new HttpError('A conta autenticada não tem permissão editorial.', 403)
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError('Sessão editorial inválida ou expirada.', 401)
  }
  return env.DB
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError('Formato inválido.', 400)
  return value as Record<string,unknown>
}

function text(value: unknown, limit: number, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new HttpError('Revise os campos e os limites de caracteres.', 400)
  return value.trim()
}

function references(value: unknown): Reference[] {
  if (!Array.isArray(value) || value.length > 10) throw new HttpError('Inclua até dez referências.', 400)
  return value.map(item => {
    const data = object(item)
    const raw = text(data.url, 500, true)
    const url = safeHttps(raw)
    if (!url || !url.hostname.includes('.')) throw new HttpError('As referências devem usar um endereço HTTPS.', 400)
    return { name: text(data.name, 120, true), url: url.href }
  })
}

export async function editorData(db: D1Database): Promise<EditorialData> {
  const [drafts, ideas, settings] = await db.batch<Record<string, unknown>>([
    db.prepare('SELECT draft,published,updated FROM articles ORDER BY updated DESC LIMIT 100'),
    db.prepare('SELECT data FROM ideas ORDER BY updated DESC LIMIT 200'),
    db.prepare('SELECT id,enabled FROM source_settings'),
  ])
  return {
    drafts: drafts.results.map(row => ({ ...JSON.parse(String(row.draft)), updated: row.updated, published: row.published ?? undefined })),
    ideas: ideas.results.map(row => JSON.parse(String(row.data))),
    settings: Object.fromEntries(settings.results.map(row => [row.id, !!row.enabled])),
  }
}

export async function editorWrite(db: D1Database, body: Record<string,unknown>) {
  const now = new Date().toISOString()
  switch (body.action) {
    case 'draft':
    case 'publish': {
      const publish = body.action === 'publish'
      const input = object(body.draft)
      const id = text(input.id, 36, true)
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) throw new HttpError('Artigo inválido.', 400)
      if (publish && body.approved !== true) throw new HttpError('A aprovação explícita da versão é obrigatória.', 400)
      const draft: Draft = { id, title: text(input.title, 160, true), summary: text(input.summary, 480, publish), body: text(input.body, 25000, publish), references: references(input.references), updated: now }
      const previous = await db.prepare('SELECT updated,published FROM articles WHERE id=?').bind(id).first<{ updated: string; published: string | null }>()
      if (previous?.updated !== input.updated) throw new HttpError('Esta versão foi alterada em outra sessão. Reabra o artigo.', 409)
      const publicEntry: Entry | null = publish ? {
        id: 'autoral-' + id, title: draft.title, summary: draft.summary, source: 'Roberta Viscardi',
        author: 'Roberta Viscardi', category: 'Ponto de Vista', kind: 'Artigo autoral', themes: ['gestao'], level: 'Intermediário',
        minutes: Math.max(1, Math.ceil(draft.body.split(/\s+/).length / 210)), date: previous?.published ?? now, references: draft.references,
        sections: [{ title: 'Artigo', text: draft.body }], evidence: 'autoral',
      } : null
      const published = publish ? previous?.published ?? now : previous?.published ?? null
      const saved = await db.prepare(`INSERT INTO articles(id,draft,public_data,updated,published) VALUES (?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET draft=excluded.draft,public_data=COALESCE(excluded.public_data,articles.public_data),
          updated=excluded.updated,published=COALESCE(articles.published,excluded.published)
        WHERE articles.updated=? RETURNING updated`)
        .bind(id, JSON.stringify(draft), publicEntry ? JSON.stringify(publicEntry) : null, now, published, previous?.updated ?? null)
        .first('updated')
      if (!saved) throw new HttpError('Esta versão foi alterada em outra sessão. Reabra o artigo.', 409)
      return { ...draft, published: published ?? undefined }
    }
    case 'idea': {
      const input = object(body.idea)
      const entryId = text(input.entryId, 80, true)
      if (!/^[a-z0-9-]+$/.test(entryId) || !Array.isArray(input.answers) || input.answers.length !== questions.length) {
        throw new HttpError('Selecione uma matéria e revise a reflexão.', 400)
      }
      const idea: Idea = { entryId, title: text(input.title, 220, true), answers: input.answers.map(item => text(item, 2400)), updated: now }
      await db.prepare('INSERT INTO ideas(entry_id,data,updated) VALUES (?,?,?) ON CONFLICT(entry_id) DO UPDATE SET data=excluded.data, updated=excluded.updated')
        .bind(entryId, JSON.stringify(idea), now).run()
      return idea
    }
    case 'source': {
      if (!sources.some(source => source.feed && source.id === body.id) || typeof body.enabled !== 'boolean') throw new HttpError('Fonte inválida.', 400)
      await db.prepare('INSERT INTO source_settings(id,enabled) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled')
        .bind(body.id as string, Number(body.enabled)).run()
      return { ok: true }
    }
    default: throw new HttpError('Operação inválida.', 400)
  }
}
