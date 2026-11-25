import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { distinctNewsCovers, withNewsCover } from '../src/covers'
import type { Entry } from '../src/model'

const feedEntry: Entry = {
  id: 'noticia-teste',
  title: '',
  summary: '',
  category: 'Mercado & Pessoas',
  kind: 'Notícia',
  themes: ['mercado'],
  level: 'Introdução',
  source: 'CBIC',
  evidence: 'rss',
  image: '/images/imobiliario.webp',
  minutes: 1,
}

test('substitui capas antigas usando o assunto da manchete', () => {
  const headlines = [
    'Seconci-Rio completa 38 anos de atendimentos a trabalhadores da construção',
    'MTE detalha regras da escala 5×2 e redução da jornada',
    'CBIC alerta para impactos do fim da escala 6×1 na construção civil',
  ]
  const covered = distinctNewsCovers(headlines.map((title, index) => ({ ...feedEntry, id: 'noticia-' + index, title })))
  assert.match(covered[0].image ?? '', /saude-ocupacional/)
  assert.match(covered[1].image ?? '', /jornada/)
  assert.match(covered[2].image ?? '', /planejamento-obra|canteiro/)
  for (const entry of covered) {
    assert.ok(entry.image && existsSync('public' + entry.image))
    assert.ok(entry.imageAlt)
  }
})

test('seleciona uma capa estável e varia imagens de assunto repetido na grade', () => {
  const entries = ['a', 'b', 'c'].map(id => ({ ...feedEntry, id, title: 'Nova capacitação para profissionais do setor' }))
  assert.deepEqual(withNewsCover(entries[0]), withNewsCover({ ...entries[0] }))
  const covered = distinctNewsCovers(entries)
  assert.equal(new Set(covered.map(entry => entry.image)).size, 3)
  const curated = { ...feedEntry, evidence: 'editorial' as const }
  assert.equal(withNewsCover(curated), curated)
})
