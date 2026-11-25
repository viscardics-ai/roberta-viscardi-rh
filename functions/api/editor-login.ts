import type { Env } from '../../server/env'
import { apiError, json, parseBody, sameOrigin } from '../../server/http'
import { editorCookie, passwordEnabled, signIn } from '../../server/session'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json({ enabled: passwordEnabled(env) })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    sameOrigin(request)
    const body = await parseBody(request)
    const cookie = body.action === 'logout' ? editorCookie('', 0) : await signIn(request, env, body.password)
    const response = json({ ok: true })
    response.headers.set('Set-Cookie', cookie)
    return response
  } catch (error) { return apiError(error) }
}
