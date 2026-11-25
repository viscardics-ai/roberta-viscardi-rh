import { XMLParser } from 'fast-xml-parser'
import { normalize, safeHttps } from '../src/model'
import type { Entry, Theme } from '../src/model'
import type { Source } from '../src/catalog'

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true, processEntities: false })
type FeedNode = Record<string, unknown>
function list(value: unknown): FeedNode[] {
  return (Array.isArray(value) ? value : value ? [value] : []).filter((node): node is FeedNode => !!node && typeof node === 'object')
}
function value(input: unknown): string {
  if (typeof input === 'string') return input
  if (input && typeof input === 'object') return value((input as FeedNode)['#text'])
  return ''
}

const namedEntities: Record<string,string> = { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>', nbsp: ' ', rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—', hellip: '…' }
export function plain(input: string) {
  const decoded = input.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z]+);/gi, (whole, token: string) => {
    if (!token.startsWith('#')) return namedEntities[token.toLowerCase()] ?? whole
    const hex = token[1]?.toLowerCase() === 'x'
    const code = Number.parseInt(token.slice(hex ? 2 : 1), hex ? 16 : 10)
    return code > 0 && code < 0x110000 && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ''
  })
  return decoded.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->|<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

export async function readText(response: Response | Request, limit: number) {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let result = ''
  let size = 0
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) return result + decoder.decode()
      size += chunk.value.byteLength
      if (size > limit) throw new Error('Limite do documento excedido.')
      result += decoder.decode(chunk.value, { stream: true })
    }
  } finally { await reader.cancel().catch(() => undefined) }
}

const rules: { theme: Theme; matches: RegExp; weight: number }[] = [
  { theme: 'gestao', matches: /\b(recursos humanos|gestao de pessoas|emprego|empregos|empregado[s]?|empregador|trabalhador|trabalhadores|recrutamento|rh|workforce|talent|labor market|hiring|empregabilidade|desemprego|mercado de trabalho|trabalho formal)\b/, weight: 4 },
  { theme: 'lideranca', matches: /\b(lideranca|lideres|cultura organizacional|leadership|gestao de equipes|cultura corporativa)\b/, weight: 4 },
  { theme: 'carreira', matches: /\b(carreira|competencias|capacitacao|desenvolvimento profissional|skills|upskilling|career|qualificacao)\b/, weight: 3 },
  { theme: 'bem-estar', matches: /\b(saude mental|psicossociai[s]?|psicossocial|burnout|assedio|seguranca do trabalho|jornada de trabalho|workplace safety|well-being)\b/, weight: 5 },
  { theme: 'ia', matches: /\b(inteligencia artificial|generative ai|gen ai|automation|automacao|futuro do trabalho)\b/, weight: 3 },
  { theme: 'mercado', matches: /\b(imobiliari[oa]|imoveis|construcao civil|real estate|incorporadoras|locacao residencial|fipezap|alto padrao)\b/, weight: 5 },
  { theme: 'esg', matches: /\b(diversidade|igualdade salarial|inclusao no trabalho|equidade|esg|diversity|acessibilidade)\b/, weight: 4 },
  { theme: 'ferramentas', matches: /\b(metodologia|checklist|roteiro|framework|cartilha|guia pratico)\b/, weight: 2 },
]
const legalPattern = /\b(clt|lgpd|nr-1\b|justica do trabalho|tst|trabalhista[s]?|convencao coletiva|assedio moral|norma regulamentadora|vinculo empregaticio)\b/

export function classify(title: string, summary: string, source: Source) {
  const headline = normalize(title)
  const combined = headline + ' ' + normalize(summary)
  const themes: Theme[] = []
  let score = 0
  for (const rule of rules) {
    if (rule.matches.test(combined)) {
      themes.push(rule.theme)
      score += rule.weight + (rule.matches.test(headline) ? 2 : 0)
    }
  }
  const legal = source.group === 'Legislação' || legalPattern.test(combined)
  if (legal) {
    score += source.official ? 4 : 2
    if (!themes.includes('gestao')) themes.push('gestao')
  }
  if (source.id === 'cbic' && !themes.includes('mercado')) {
    themes.push('mercado')
    score += 4
  }
  if (themes.includes('mercado') && /porto alegre|rio grande do sul|gaucho|alto padrao/.test(combined)) score += 3
  return { themes, score, category: legal ? 'Legislação' : themes.includes('mercado') ? 'Mercado & Pessoas' : themes.includes('ia') ? 'Tendências' : 'Gestão de Pessoas' }
}

export async function digest(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}

function canonical(raw: string) {
  const url = safeHttps(raw.trim().replace(/^http:\/\//i, 'https://'))
  if (!url || !url.hostname.includes('.')) return undefined
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|trk$|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.href
}

export type FeedEntry = { entry: Entry & { url: string }; titleKey: string; source: Source }

export async function parseFeed(xml: string, source: Source, now = Date.now()): Promise<FeedEntry[]> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || !/<(?:rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error('Formato XML não aceito.')
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } }
    feed?: { entry?: unknown }
    'rdf:RDF'?: { item?: unknown }
  }
  if (!parsed.rss?.channel && !parsed.feed && !parsed['rdf:RDF']) throw new Error('Feed sem canal.')
  const raw = list(parsed.rss?.channel?.item ?? parsed.feed?.entry ?? parsed['rdf:RDF']?.item)
  const items: FeedEntry[] = []
  for (const record of raw.slice(0, 28)) {
    const title = plain(value(record.title)).slice(0, 220)
    const rawLink = typeof record.link === 'string' ? record.link : list(record.link).find(node => !node['@_rel'] || node['@_rel'] === 'alternate')?.['@_href']
    const url = canonical(value(rawLink).replace(/&amp;/gi, '&'))
    if (!title || !url || /\b(publieditorial|conteudo patrocinado|advertorial)\b/.test(normalize(title))) continue
    const excerpt = plain(value(record.description ?? record.summary))
    const summary = excerpt.length > 380 ? excerpt.slice(0, 375).replace(/\s+\S*$/, '') + '…' : excerpt
    const classification = classify(title, summary, source)
    if (classification.score < 4) continue
    const moment = Date.parse(value(record.pubDate ?? record.published ?? record.updated ?? record['dc:date']))
    if (Number.isFinite(moment) && (moment > now + 900000 || moment < now - 45 * 86400000)) continue
    const authorNode = list(record.author)[0]
    const author = plain(value(record['dc:creator']) || value(authorNode?.name)).slice(0, 120)
    const entry: FeedEntry['entry'] = {
      id: 'noticia-' + (await digest(url)).slice(0, 24), title, url,
      summary: summary || 'A fonte publicou o título e o link desta matéria.',
      author: author || undefined, category: classification.category, themes: classification.themes, score: classification.score,
      kind: 'Notícia', source: source.name, date: Number.isFinite(moment) ? new Date(moment).toISOString() : undefined,
      evidence: 'rss', level: 'Introdução', minutes: 1,
      legalStatus: classification.category === 'Legislação' ? 'Notícia sobre tema trabalhista · consulte a fonte oficial para confirmar natureza e vigência' : undefined,
    }
    items.push({ entry, titleKey: await digest(normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()), source })
  }
  return items
}
