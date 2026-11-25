import type { Reference } from './model'

export const questions = [
  'O que aprendi?',
  'Com o que concordo?',
  'Com o que discordo?',
  'Como isso se aplica ao meu trabalho?',
  'Que pergunta esse conteúdo me despertou?',
  'Isso pode virar um artigo?',
] as const

export type Draft = {
  id: string
  title: string
  summary: string
  body: string
  references: Reference[]
  updated?: string
  published?: string
}
export type Idea = { entryId: string; title: string; answers: string[]; updated?: string }
export type EditorialData = { drafts: Draft[]; ideas: Idea[]; settings: Record<string, boolean> }
