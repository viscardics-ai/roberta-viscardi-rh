export const themes = [
  { id: 'gestao', label: 'Gestão de Pessoas', lines: ['Gestão', 'de Pessoas'] },
  { id: 'lideranca', label: 'Liderança e Cultura', lines: ['Liderança', 'e Cultura'] },
  { id: 'carreira', label: 'Performance e Carreira', lines: ['Performance', 'e Carreira'] },
  { id: 'bem-estar', label: 'Saúde Mental e Bem-Estar', lines: ['Saúde Mental', 'e Bem-Estar'] },
  { id: 'ia', label: 'IA no RH', lines: ['IA no RH'] },
  { id: 'mercado', label: 'RH e Mercado Imobiliário', lines: ['RH e', 'Mercado Imobiliário'] },
  { id: 'esg', label: 'ESG e Pessoas', lines: ['ESG', 'e Pessoas'] },
  { id: 'ferramentas', label: 'Ferramentas e Métodos', lines: ['Ferramentas', 'e Métodos'] },
] as const

export type Theme = typeof themes[number]['id']
export type Section = { title: string; text: string }
export type Reference = { name: string; url: string }
export type Entry = {
  id: string
  title: string
  summary: string
  category: string
  kind: 'Curadoria' | 'Notícia' | 'Pesquisa' | 'Legislação' | 'Ferramenta' | 'Artigo autoral' | 'Curso' | 'Livro' | 'Podcast' | 'Estudo de caso' | 'Webinar' | 'Evento' | 'Checklist' | 'Modelo'
  themes: Theme[]
  level: 'Introdução' | 'Intermediário' | 'Aprofundado'
  source: string
  url?: string
  originalTitle?: string
  author?: string
  date?: string
  eventDate?: string
  image?: string
  imageAlt?: string
  sections?: Section[]
  references?: Reference[]
  evidence?: 'rss' | 'editorial' | 'autoral'
  legalStatus?: string
  minutes: number
  score?: number
}
export type UpdateStatus = {
  time: string
  state: 'running' | 'ok' | 'partial' | 'failed'
  added: number
  failures: string[]
  ai: string
}
export type PortalData = { state: 'online' | 'static' | 'error'; entries: Entry[]; update: UpdateStatus | null; automatic?: boolean }
export type DiaryEntry = { id: string; title: string; date: string; location: string; format: string; organizer: string; url: string; hours?: string; price?: string }
export const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
export const dayFormat = (date?: string) => date ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(date.length === 10 ? date + 'T12:00:00-03:00' : date)) : ''
export const timeFormat = (date: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date))
export function safeHttps(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port ? url : null
  } catch {
    return null
  }
}
