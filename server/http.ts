import { readText } from './feed'

export class HttpError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

export const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})

export function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  if (origin !== new URL(request.url).origin) throw new HttpError('Origem da requisição inválida.', 403)
}

export async function parseBody(request: Request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new HttpError('Envie JSON.', 415)
  try {
    const parsed: unknown = JSON.parse(await readText(request, 46_000))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string,unknown>
  } catch { /* invalid JSON or limit exceeded */ }
  throw new HttpError('Dados inválidos ou acima do limite.', 400)
}

export function apiError(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status)
  console.error('Erro no portal', error instanceof Error ? error.name : 'Erro')
  return json({ error: 'O serviço está temporariamente indisponível.' }, 503)
}
