import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { api, PortalError, staticData } from './api'
import { initialEntries } from './content'
import type { Entry, PortalData, UpdateStatus } from './model'

function useLocal<T>(key: string, fallback: T) {
  const name = 'rv:' + key
  const [value, set] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(name)
      return stored ? JSON.parse(stored) as T : fallback
    } catch { return fallback }
  })
  useEffect(() => {
    try { localStorage.setItem(name, JSON.stringify(value)) } catch { /* local storage can be disabled */ }
  }, [value, name])
  return [value, set] as const
}

type LibraryState = {
  entries: Entry[]
  portal: PortalData
  busy: boolean
  loading: boolean
  favorites: string[]
  history: string[]
  markRead: (id: string) => void
  toggleSave: (id: string) => void
  update: () => Promise<void>
  reload: () => Promise<void>
  flash: (text: string) => void
}

const LibraryContext = createContext<LibraryState | null>(null)
export function usePortal() {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('Portal fora do contexto.')
  return context
}

export function PortalProvider({ children }: PropsWithChildren) {
  const [portal, setPortal] = useState<PortalData>(staticData)
  const [favorites, setFavorites] = useLocal<string[]>('favorite', [])
  const [history, setHistory] = useLocal<string[]>('history', [])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [archived, setArchived] = useState<Entry[]>([])
  const reload = async () => {
    try {
      const next = await api<PortalData>('portal')
      setPortal(next)
    } catch (err) {
      if (!(err instanceof PortalError) || err.status >= 500) {
        setPortal(previous => ({ ...previous, state: 'error' }))
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4800)
    return () => window.clearTimeout(timer)
  }, [toast])
  async function update() {
    if (busy) return
    if (portal.state !== 'online') {
      setToast('Atualização indisponível. O servidor com D1 precisa estar conectado.')
      return
    }
    setBusy(true)
    try {
      const result = await api<UpdateStatus>('update', { method: 'POST' })
      setToast(result.state === 'failed' ? 'As fontes estão indisponíveis no momento.' : result.added + (result.added === 1 ? ' novo conteúdo.' : ' novos conteúdos.'))
      await reload()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Falha na atualização.')
      await reload()
    } finally { setBusy(false) }
  }
  function toggleSave(id: string) {
    const exists = favorites.includes(id)
    setFavorites(previous => exists ? previous.filter(item => item !== id) : [...previous, id])
    setToast(exists ? 'Matéria removida dos favoritos.' : 'Matéria salva neste navegador.')
  }
  function markRead(id: string) {
    setHistory(previous => previous[0] === id ? previous : [id, ...previous.filter(item => item !== id)].slice(0, 250))
  }
  const entries = [...portal.entries, ...initialEntries, ...archived.filter(item => !portal.entries.some(current => current.id === item.id))]
  const missing = [...new Set([...favorites, ...history])].filter(id => !entries.some(item => item.id === id))
  const requested = missing.join(',')
  useEffect(() => {
    if (portal.state !== 'online' || !requested) return
    const ids = requested.split(',')
    const groups = Array.from({ length: Math.ceil(ids.length / 50) }, (_, index) => ids.slice(index * 50, index * 50 + 50))
    let cancelled = false
    Promise.allSettled(groups.map(group => api<PortalData>('portal?' + new URLSearchParams(group.map(id => ['id', id])).toString()))).then(results => {
      if (cancelled) return
      const found = results.flatMap(result => result.status === 'fulfilled' ? result.value.entries : [])
      if (found.length) setArchived(previous => [...previous, ...found])
    })
    return () => { cancelled = true }
  }, [portal.state, requested])
  return <LibraryContext.Provider value={{ entries, portal, loading, busy, favorites, history, markRead, toggleSave, update, reload, flash: setToast }}>
    {children}
    <div className="toast-region" aria-live="polite">{toast && <p className="toast">{toast}</p>}</div>
  </LibraryContext.Provider>
}
