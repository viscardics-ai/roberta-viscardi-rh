import { SignJWT, jwtVerify } from 'jose'
import type { Env } from './env'
import { digest } from './feed'
import { HttpError } from './http'

const cookieName = '__Host-rv-editor'
const minutes = 4 * 60
const encoder = new TextEncoder()

export function passwordEnabled(env: Env) {
  return !!env.DB && (env.EDITOR_PASSWORD?.length ?? 0) >= 24 && (env.EDITOR_SESSION_KEY?.length ?? 0) >= 32
}

export async function hasValidSession(request: Request, env: Env) {
  if (!passwordEnabled(env)) return false
  const cookie = request.headers.get('Cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(cookieName + '='))
  if (!cookie || cookie.length > 1000) return false
  try {
    await jwtVerify(cookie.slice(cookieName.length + 1), encoder.encode(env.EDITOR_SESSION_KEY!), {
      algorithms: ['HS256'], issuer: new URL(request.url).origin,
      audience: 'roberta-viscardi-editor', subject: 'editor', requiredClaims: ['iat', 'exp'],
    })
    return true
  } catch { return false }
}

export async function signIn(request: Request, env: Env, password: unknown) {
  if (!passwordEnabled(env)) throw new HttpError('Login por senha indisponível.', 503)
  const client = request.headers.get('CF-Connecting-IP') || 'local'
  const key = 'login-' + (await digest(env.EDITOR_SESSION_KEY! + ':' + client)).slice(0, 24)
  const bucket = new Date().toISOString().slice(0, 13)
  const db = env.DB!
  const limit = await db.prepare(`
    INSERT INTO rate_limits(key,bucket,count) VALUES (?,?,1)
    ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,
      count=CASE WHEN rate_limits.bucket=excluded.bucket THEN rate_limits.count+1 ELSE 1 END
    WHERE rate_limits.bucket<>excluded.bucket OR rate_limits.count<6
    RETURNING count
  `).bind(key, bucket).first<number>('count')
  if (limit === null) throw new HttpError('Limite de tentativas. Tente novamente na próxima hora.', 429)
  const provided = typeof password === 'string' && password.length <= 512 ? password : ''
  const compareKey = await crypto.subtle.importKey('raw', encoder.encode(env.EDITOR_SESSION_KEY!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  const signature = await crypto.subtle.sign('HMAC', compareKey, encoder.encode(env.EDITOR_PASSWORD!))
  if (!await crypto.subtle.verify('HMAC', compareKey, signature, encoder.encode(provided))) throw new HttpError('Senha inválida.', 401)
  await db.prepare('DELETE FROM rate_limits WHERE key=? OR (key LIKE ? AND bucket<?)').bind(key, 'login-%', new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 13)).run()
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' }).setIssuer(new URL(request.url).origin)
    .setAudience('roberta-viscardi-editor').setSubject('editor').setIssuedAt().setExpirationTime(minutes + 'm')
    .sign(encoder.encode(env.EDITOR_SESSION_KEY!))
  return editorCookie(token, minutes * 60)
}

export function editorCookie(value: string, age: number) {
  return cookieName + '=' + value + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + age
}
