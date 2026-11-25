import { normalize } from './model'
import type { Entry, Theme } from './model'

const illustrations = {
  'saude-ocupacional': 'Atendimento de saúde a um profissional da construção',
  jornada: 'Relógio e agenda sobre uma mesa de trabalho',
  canteiro: 'Trabalhadores com capacetes em um canteiro de obras',
  'planejamento-obra': 'Profissionais revisando o planejamento em um canteiro de obras',
  justica: 'Balança da Justiça ao lado de documentos',
  contrato: 'Mãos assinando um documento de trabalho',
  residencial: 'Fachada e jardim de um edifício residencial',
  imoveis: 'Entrega de chaves de um imóvel',
  lideranca: 'Liderança conversando com uma equipe em reunião',
  capacitacao: 'Profissionais participando de uma capacitação',
  'bem-estar': 'Duas pessoas conversando em um ambiente de trabalho',
  sustentabilidade: 'Edifício comercial com terraços arborizados',
  tecnologia: 'Profissional trabalhando com ferramentas digitais',
  planejamento: 'Equipe organizando ideias em um quadro de planejamento',
  economia: 'Relatórios sobre uma mesa em um escritório com vista para a cidade',
  recrutamento: 'Profissionais em uma entrevista de trabalho',
} as const

type Illustration = keyof typeof illustrations
type CoverGroup = {
  primary: readonly [Illustration, ...Illustration[]]
  alternatives: readonly Illustration[]
}

const health: CoverGroup = { primary: ['saude-ocupacional'], alternatives: ['bem-estar', 'planejamento-obra'] }
const schedules: CoverGroup = { primary: ['jornada'], alternatives: ['contrato', 'planejamento'] }
const constructionSchedules: CoverGroup = { primary: ['planejamento-obra', 'canteiro'], alternatives: ['jornada', 'contrato'] }
const construction: CoverGroup = { primary: ['canteiro', 'planejamento-obra'], alternatives: ['residencial', 'sustentabilidade'] }
const law: CoverGroup = { primary: ['justica', 'contrato'], alternatives: ['jornada', 'bem-estar'] }
const property: CoverGroup = { primary: ['residencial', 'imoveis'], alternatives: ['economia', 'sustentabilidade'] }
const economy: CoverGroup = { primary: ['economia'], alternatives: ['residencial', 'planejamento'] }
const leadership: CoverGroup = { primary: ['lideranca', 'planejamento'], alternatives: ['bem-estar', 'capacitacao'] }
const training: CoverGroup = { primary: ['capacitacao'], alternatives: ['lideranca', 'tecnologia'] }
const wellness: CoverGroup = { primary: ['bem-estar'], alternatives: ['saude-ocupacional', 'lideranca'] }
const sustainability: CoverGroup = { primary: ['sustentabilidade'], alternatives: ['residencial', 'canteiro'] }
const technology: CoverGroup = { primary: ['tecnologia'], alternatives: ['capacitacao', 'planejamento-obra'] }
const hiring: CoverGroup = { primary: ['recrutamento'], alternatives: ['capacitacao', 'lideranca'] }

const constructionWords = /\b(construcao(?: civil)?|canteiros?|obras?|engenharia)\b/
const scheduleWords = /\b(jornadas?|escalas?|turnos?|horarios?|banco de horas|horas extras)\b/
const topics: readonly [RegExp, CoverGroup][] = [
  [/\b(seconci|saude ocupacional|medicina do trabalho|assistencia medica|atendimentos? medicos?|ambulancia|ambulatorios?)\b/, health],
  [scheduleWords, schedules],
  [/\b(justica|tribunal|tribunais|tst|trt|clt|jurisprudencia|indenizacoes|indenizacao|decisoes? judiciais?|sentenca|processo trabalhista)\b/, law],
  [/\b(inteligencia artificial|ferramentas digitais|gestao digital|automacao|bim|algoritmos?|inovacao digital)\b/, technology],
  [/\b(esg|sustentavel|sustentabilidade|descarbonizacao|energia solar|energia limpa|emissoes)\b/, sustainability],
  [/\b(capacitacao|cursos?|treinamentos?|aprendizagem|qualificacao|educacao|formacao)\b/, training],
  [/\b(saude mental|bem-estar|burnout|psicossocial|psicossociais|seguranca psicologica)\b/, wellness],
  [/\b(recrutamento|contratacoes|contratacao|vagas|seleciona|selecao|mao de obra|novos talentos|oportunidades de trabalho)\b/, hiring],
  [/\b(contratos?|acordos? coletivos?|convencao coletiva|regularizacao trabalhista|normas? trabalhistas?)\b/, law],
  [/\b(reforma tributaria|juros|inflacao|tributos?|investimentos?|financiamento|mercado financeiro|pib)\b/, economy],
  [/\b(imoveis|imovel|imobiliaria|imobiliario|apartamentos?|moradia|locacao|habitacao|fipezap)\b/, property],
  [constructionWords, construction],
  [/\b(lideres?|lideranca|cultura organizacional|gestao de equipes|confianca|colaboracao|feedback)\b/, leadership],
]

const themeCovers: Record<Theme, CoverGroup> = {
  ia: technology,
  esg: sustainability,
  'bem-estar': wellness,
  mercado: property,
  carreira: training,
  lideranca: leadership,
  ferramentas: leadership,
  gestao: hiring,
}

function coverGroup(text: string) {
  if (scheduleWords.test(text) && constructionWords.test(text)) return constructionSchedules
  return topics.find(([pattern]) => pattern.test(text))?.[1]
}

function imagePath(name: Illustration) {
  return '/images/noticias/' + name + '.webp'
}

export function withNewsCover(entry: Entry, usedImages?: ReadonlySet<string>): Entry {
  if (entry.evidence !== 'rss') return entry
  const heading = normalize(entry.title + ' ' + (entry.originalTitle ?? ''))
  const theme = (Object.keys(themeCovers) as Theme[]).find(item => entry.themes.includes(item))
  const { primary, alternatives } = coverGroup(heading) ?? coverGroup(normalize(entry.summary))
    ?? (entry.category === 'Legislação' ? law : theme ? themeCovers[theme] : leadership)
  const offset = Array.from(entry.id).reduce((value, character) => (31 * value + character.charCodeAt(0)) >>> 0, 0) % primary.length
  const ordered = [...primary.slice(offset), ...primary.slice(0, offset), ...alternatives]
  const image = ordered.find(name => !usedImages?.has(imagePath(name))) ?? primary[offset]
  return { ...entry, image: imagePath(image), imageAlt: illustrations[image] }
}

export function distinctNewsCovers(entries: readonly Entry[]): Entry[] {
  const used = new Set(entries.flatMap(entry => entry.evidence !== 'rss' && entry.image ? [entry.image] : []))
  return entries.map(entry => {
    const covered = withNewsCover(entry, used)
    if (covered.image) used.add(covered.image)
    return covered
  })
}
