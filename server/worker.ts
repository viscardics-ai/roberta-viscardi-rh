import type { Env } from './env'
import { updatePortal } from './update'

export default {
  async scheduled(_controller: ScheduledController, env: Env) {
    await updatePortal(env, 'scheduled')
  },
}
