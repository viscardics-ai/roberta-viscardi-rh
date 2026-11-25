import type { PortalData } from './model'

export class PortalError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/' + path, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new PortalError(response.status === 401 || response.status === 403 ? 'Acesso restrito. Entre pelo Cloudflare Access.' : 'Servidor do portal indisponível neste ambiente.', response.status)
  }
  const body = await response.json() as { error?: string }
  if (!response.ok) throw new PortalError(body.error || 'Não foi possível concluir a operação.', response.status)
  return body as T
}

export const staticData: PortalData = { state: 'static', entries: [], update: null }
