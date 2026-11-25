import { authorize, editorData, editorWrite } from '../../server/editor'
import type { Env } from '../../server/env'
import { apiError, json, parseBody, sameOrigin } from '../../server/http'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try { return json(await editorData(await authorize(request, env))) }
  catch (error) { return apiError(error) }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    sameOrigin(request)
    const database = await authorize(request, env)
    return json(await editorWrite(database, await parseBody(request)))
  } catch (error) { return apiError(error) }
}
