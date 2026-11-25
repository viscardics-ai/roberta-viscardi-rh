import type { Env } from '../../server/env'
import { apiError, json, sameOrigin } from '../../server/http'
import { UpdateError, updatePortal } from '../../server/update'

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    sameOrigin(request)
    return json(await updatePortal(env, 'manual'))
  } catch (error) {
    if (error instanceof UpdateError) return json({ error: error.message }, error.code)
    return apiError(error)
  }
}
