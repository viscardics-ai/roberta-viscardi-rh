import { useEffect, useState } from 'react'
import { api } from './api'
import type { ReactNode } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, NotebookPen } from 'lucide-react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArticleCard, Avatar, BookmarkButton, SectionTitle, StatusPanel } from './components'
import { diary, initialEntries } from './content'
import { sources } from './catalog'
import { dayFormat, normalize, safeHttps, themes } from './model'
import type { Entry, PortalData } from './model'
import { usePortal } from './state'

export const practicalKinds: Entry['kind'][] = ['Ferramenta', 'Checklist', 'Modelo', 'Estudo de caso']
const libraryKinds: Entry['kind'][] = [...practicalKinds, 'Curadoria', 'Pesquisa', 'Legislação', 'Artigo autoral', 'Curso', 'Livro', 'Podcast', 'Webinar', 'Evento']
type CollectionKey = keyof typeof collections
const collections = {
  noticias: { title: 'Notícias', text: 'Acompanhe a cobertura das fontes monitoradas pelo portal.', filter: (item: Entry) => item.kind === 'Notícia' },
  analises: { title: 'Análises', text: 'Leituras para contextualizar fatos, avaliar impactos e preparar conversas com lideranças.', filter: (item: Entry) => !!item.sections?.length && !practicalKinds.includes(item.kind) && item.kind !== 'Artigo autoral' },
  tendencias: { title: 'Tendências', text: 'Competências, tecnologia e mudanças na organização do trabalho.', filter: (item: Entry) => item.category === 'Tendências' || item.themes.includes('ia') },
  carreira: { title: 'Carreira e Liderança', text: 'Desenvolvimento profissional, cultura e práticas de liderança.', filter: (item: Entry) => item.themes.includes('carreira') || item.themes.includes('lideranca') },
  legislacao: { title: 'Legislação e Compliance', text: 'Normas, orientações oficiais e notícias de jurisprudência. Consulte as fontes e valide casos específicos com orientação jurídica.', filter: (item: Entry) => item.category === 'Legislação' || item.kind === 'Legislação' },
  estudos: { title: 'Estudos', text: 'Pesquisas de mercado e referências para aprofundar a leitura.', filter: (item: Entry) => item.kind === 'Pesquisa' },
  'na-pratica': { title: 'Na Prática', text: 'Métodos, checklists e modelos para aplicar em conversas e decisões de RH.', filter: (item: Entry) => practicalKinds.includes(item.kind) },
  panorama: { title: 'Panorama do Mercado', text: 'RH e imobiliário, com foco em Porto Alegre, Rio Grande do Sul e equipes de alto padrão.', filter: (item: Entry) => item.themes.includes('mercado') },
  biblioteca: { title: 'Biblioteca profissional', text: 'Filtre leituras, pesquisas, cursos e ferramentas por tema, tipo e nível de aprofundamento.', filter: (item: Entry) => libraryKinds.includes(item.kind) },
  busca: { title: 'Resultados da busca', text: '', filter: () => true },
}

function Heading({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return <header className={'page-header' + (children ? ' flex' : '')}>
    <div><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{children}
  </header>
}

export function External({ href, children, button }: { href: string; children: ReactNode; button?: boolean }) {
  return safeHttps(href) ? <a className={button ? 'secondary-button' : 'text-link'} href={href} target="_blank" rel="noopener noreferrer">{children}{button && <ExternalLink size={15} />}</a> : null
}

export function Collection({ mode }: { mode?: CollectionKey }) {
  const { id } = useParams()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const { entries, loading } = usePortal()
  const page = Math.max(1, Number(params.get('pagina')) || 1)
  const theme = themes.find(item => item.id === id)
  if (!mode && !theme) return <NotFound />
  const selected = mode ? collections[mode] : { title: theme!.label, text: 'Leituras relacionadas ao tema.', filter: (item: Entry) => item.themes.includes(theme!.id) }
  const query = params.get('q') ?? ''
  const category = params.get('categoria') ?? ''
  const kind = params.get('tipo') ?? ''
  const subject = params.get('tema') ?? ''
  const level = params.get('nivel') ?? ''
  const start = params.get('de') ?? ''
  const end = params.get('ate') ?? ''
  const pool = entries.filter(selected.filter)
  const categories = [...new Set(pool.map(item => item.category))].sort()
  const kinds = [...new Set(pool.map(item => item.kind))].sort()
  const results = pool.filter(item => {
    const searchable = normalize([item.title, item.originalTitle, item.summary, item.source, item.category, ...themes.filter(group => item.themes.includes(group.id)).map(group => group.label)].join(' '))
    return normalize(query).trim().split(/\s+/).every(token => searchable.includes(token))
      && (!category || item.category === category) && (!kind || item.kind === kind)
      && (!subject || item.themes.some(entry => entry === subject)) && (!level || level === item.level)
      && (!start || !!item.date && item.date.slice(0,10) >= start)
      && (!end || !!item.date && item.date.slice(0,10) <= end)
  })
  const total = Math.max(1, Math.ceil(results.length / 18))
  const current = Math.min(page, total)
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next, { replace: key === 'q' })
  }
  return <main className="page wrap" id="conteudo" key={location.pathname}>
    <Heading title={selected.title} intro={mode === 'busca' && query ? 'Busca por “' + query + '”' : selected.text}>
      {mode === 'estudos' && <Link className="secondary-button" to="/biblioteca">Abrir biblioteca</Link>}
      {mode === 'panorama' && <External href="https://www.fipe.org.br/pt-br/indices/fipezap/" button>Consultar FipeZAP</External>}
    </Heading>
    {mode === 'legislacao' && <section className="research-note page-section"><strong>Consultas oficiais</strong><ul className="sources-links">
      <li><External href="https://www.tst.jus.br/jurisprudencia">Jurisprudência do TST</External></li>
      <li><External href="https://www3.mte.gov.br/sistemas/mediador/ConsultarInstColetivo">Convenções e acordos coletivos · Sistema Mediador</External></li>
      <li><External href="https://www12.senado.leg.br/transparencia/atividade-legislativa">Propostas em tramitação no Senado</External></li>
      <li><External href="https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/combate-a-discriminacao">Discriminação e inclusão · Ministério do Trabalho e Emprego</External></li>
    </ul></section>}
    <form className="filters" onSubmit={e => e.preventDefault()}>
      <label className="field">Palavra-chave<input value={query} maxLength={160} type="search" onChange={e => change('q', e.target.value)} /></label>
      <label className="field">Categoria<select aria-label="Categoria" value={category} onChange={e => change('categoria', e.target.value)}><option value="">Todas</option>{categories.map(label => <option key={label}>{label}</option>)}</select></label>
      {!theme && <label className="field">Tema<select aria-label="Tema" value={subject} onChange={e => change('tema', e.target.value)}><option value="">Todos</option>{themes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      {mode === 'biblioteca' && <>
        <label className="field">Tipo<select aria-label="Tipo" value={kind} onChange={e => change('tipo', e.target.value)}><option value="">Todos</option>{kinds.map(label => <option key={label}>{label}</option>)}</select></label>
        <label className="field">Nível<select aria-label="Nível" value={level} onChange={e => change('nivel', e.target.value)}><option value="">Todos</option>{['Introdução','Intermediário','Aprofundado'].map(label => <option key={label}>{label}</option>)}</select></label>
      </>}
      <label className="field">De<input value={start} type="date" onChange={e => change('de', e.target.value)} /></label>
      <label className="field">Até<input value={end} type="date" onChange={e => change('ate', e.target.value)} /></label>
      {!!params.size && <button className="secondary-button" type="button" onClick={() => setParams({})}>Limpar filtros</button>}
    </form>
    <p className="results" aria-live="polite">{results.length} {results.length === 1 ? 'conteúdo' : 'conteúdos'}</p>
    {results.length ? <div className="article-grid">{results.slice((current - 1) * 18, current * 18).map(item => <ArticleCard key={item.id} entry={item} />)}</div> : loading ? <p className="skeleton status-skeleton" aria-label="Consultando conteúdos" /> : <p className="empty">{mode === 'noticias' && !pool.length ? 'Nenhuma notícia coletada até o momento.' : 'Nenhum conteúdo corresponde aos filtros.'}</p>}
    {total > 1 && <div className="pager"><button className="secondary-button" disabled={current <= 1} onClick={() => change('pagina', String(current - 1))}><ChevronLeft size={18} />Anterior</button><span>{current} de {total}</span><button className="secondary-button" disabled={current >= total} onClick={() => change('pagina', String(current + 1))}>Próxima<ChevronRight size={18} /></button></div>}
    {mode === 'noticias' && <StatusPanel />}
  </main>
}

export function downloadText(name: string, value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Article() {
  const { id } = useParams()
  const { entries, loading, markRead, flash } = usePortal()
  const [remote, setRemote] = useState<{ id?: string; entry?: Entry } | null>(null)
  const entry = entries.find(item => item.id === id) ?? (remote?.id === id ? remote?.entry : undefined)
  useEffect(() => {
    if (entry || !id || !/^(noticia|autoral)-[a-f0-9-]{12,36}$/.test(id)) return
    let current = true
    api<PortalData>('portal?id=' + encodeURIComponent(id)).then(result => {
      if (current) setRemote({ id, entry: result.entries.find(item => item.id === id) })
    }, () => { if (current) setRemote({ id }) })
    return () => { current = false }
  }, [id, entry?.id])
  const fetchingEntry = !!id && /^(noticia|autoral)-[a-f0-9-]{12,36}$/.test(id) && remote?.id !== id
  useEffect(() => { if (entry) markRead(entry.id) }, [entry?.id])
  if (!entry) return loading || fetchingEntry ? <main className="page wrap" id="conteudo"><div className="skeleton" aria-label="Carregando matéria" /></main> : <NotFound />
  const references = [...(entry.url ? [{ name: entry.source + ' · Fonte original', url: entry.url }] : []), ...(entry.references ?? [])]
  function exportEntry(item: Entry) {
    downloadText(item.id + '.txt', [item.title, item.summary, item.source, item.legalStatus, ...item.sections?.map(section => section.title + '\n' + section.text) ?? [], ...references.map(ref => ref.name + '\n' + ref.url)].filter(Boolean).join('\n\n'))
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      flash('Link copiado.')
    } catch { flash('Copie o endereço da matéria na barra do navegador.') }
  }
  return <main id="conteudo" className="page wrap reading">
    <Link className="back" to={entry.kind === 'Artigo autoral' ? '/ponto-de-vista' : '/'}><ArrowLeft size={16} /> Voltar {entry.kind === 'Artigo autoral' ? 'a Ponto de Vista' : 'ao início'}</Link>
    <p className="eyebrow">{entry.category}</p>
    <h1>{entry.title}</h1><p className="lead">{entry.summary}</p>
    <div className="reading-meta"><span>{entry.author ?? entry.source}</span><span>{entry.date ? 'Publicação: ' + dayFormat(entry.date) : 'Data de publicação indisponível'}</span>{entry.eventDate && <span>Data de referência: {dayFormat(entry.eventDate)}</span>}<span>{entry.minutes} min de leitura</span><span>{entry.level}</span></div>
    {entry.legalStatus && <p className="legal-status">{entry.legalStatus}</p>}
    <div className="action-row">
      <BookmarkButton entry={entry} />
      <button className="secondary-button" onClick={() => void share()}><Copy size={16} />Copiar link</button>
      <button className="secondary-button" onClick={() => exportEntry(entry)}><Download size={16} />Exportar texto</button>
      <a className="secondary-button" href={'/editor?ideia=' + encodeURIComponent(entry.id)}><NotebookPen size={16} />Banco de Ideias</a>
    </div>
    {entry.image && <figure><img className="reading-photo" src={entry.image} alt={entry.imageAlt || ''} /><figcaption>{entry.imageAlt} · Imagem ilustrativa gerada para o portal.</figcaption></figure>}
    {entry.evidence === 'rss' && <p className="research-note">Fonte consultada via RSS. O portal dispõe do título e do trecho publicado no feed. {entry.sections?.length ? 'Leitura assistida por IA. As sugestões são hipóteses para investigação.' : 'Consulte o texto original para aprofundar a leitura.'}</p>}
    {entry.evidence === 'editorial' && <p className="research-note">Curadoria de referência do portal. Os cenários e exercícios são ilustrativos.</p>}
    {entry.originalTitle && <p className="results">Título original: {entry.originalTitle}</p>}
    {entry.sections?.map(({ title, text }) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}
    {!!references.length && <section><h2>Fontes e evidências</h2><ul className="sources-links">{references.map(ref => <li key={ref.url}><External href={ref.url}>{ref.name}</External></li>)}</ul></section>}
    <div className="action-row">{themes.filter(theme => entry.themes.includes(theme.id)).map(theme => <Link key={theme.id} className="secondary-button" to={'/tema/' + theme.id}>{theme.label}</Link>)}</div>
  </main>
}

export function Saved({ activity = false }: { activity?: boolean }) {
  const { entries, favorites, history } = usePortal()
  const selection = (activity ? history : favorites).map(id => entries.find(item => item.id === id)).filter((item): item is Entry => !!item)
  const unread = entries.filter(item => item.kind === 'Notícia' && !history.includes(item.id))
  return <main className="page wrap" id="conteudo">
    <Heading title={activity ? 'Notificações e histórico' : 'Favoritos'} intro="Os registros desta seção ficam neste navegador." />
    {activity && <section className="page-section"><SectionTitle>Matérias não lidas</SectionTitle>{unread.length ? <div className="article-grid">{unread.slice(0,12).map(item => <ArticleCard key={item.id} entry={item} />)}</div> : <p className="empty">Nenhuma notícia nova por aqui.</p>}</section>}
    <section className="page-section">
      {activity && <SectionTitle>Histórico de leitura</SectionTitle>}
      {selection.length ? <div className="article-grid">{selection.map(item => <ArticleCard key={item.id} entry={item} />)}</div> : <p className="empty">{activity ? 'As matérias abertas aparecem aqui.' : 'Salve uma matéria pelo ícone de favorito para ler depois.'}</p>}
    </section>
  </main>
}

export function Radar() {
  const { entries, portal } = usePortal()
  const recent = entries.filter(item => item.kind === 'Notícia' && item.date && Date.now() - Date.parse(item.date) <= 7 * 86400000)
    .sort((a,b) => (b.score ?? 0) - (a.score ?? 0) || (b.date ?? '').localeCompare(a.date ?? ''))
  const picks = recent.slice(0,5)
  const legal = recent.find(item => item.category === 'Legislação')
  const market = recent.find(item => item.themes.includes('mercado'))
  const trends = recent.find(item => item.category === 'Tendências') ?? initialEntries[3]
  const feature = initialEntries[0]
  const method = initialEntries[4]
  const panels = [
    { title: 'Tendência de gestão de pessoas', item: trends, empty: '' },
    { title: 'Atualização trabalhista', item: legal, empty: 'Nenhuma atualização trabalhista relevante coletada nos últimos sete dias.' },
    { title: 'Movimentação imobiliária', item: market, empty: 'Nenhuma movimentação imobiliária relevante coletada nos últimos sete dias.' },
    { title: 'Leitura aprofundada', item: feature, empty: '' },
    { title: 'Ferramenta ou metodologia', item: method, empty: '' },
  ]
  return <main className="page wrap" id="conteudo">
    <Heading title="Radar da Business Partner" intro={portal.update ? 'Briefing executivo baseado na última coleta de ' + dayFormat(portal.update.time) + '. Reserve de 10 a 15 minutos para as leituras recomendadas.' : 'Briefing de referência enquanto o portal aguarda a primeira coleta.'} />
    <section className="brief-item"><h2>Notícias em foco</h2>
      {picks.length ? <ol>{picks.map(item => <li key={item.id}><Link className="text-link" to={'/materia/' + item.id}>{item.title}</Link> · {item.source}</li>)}</ol> : <p>Nenhuma notícia recente foi coletada pelas fontes monitoradas.</p>}
    </section>
    <div className="brief-grid page-section">
      {panels.map(({ title, item, empty }) => <section className="brief-item" key={title}><h2>{title}</h2>{item ? <><Link className="text-link" to={'/materia/' + item.id}>{item.title}</Link><p>{item.summary}</p></> : <p>{empty}</p>}</section>)}
      <section className="brief-item"><h2>Pergunta estratégica</h2><p>{feature.sections?.find(section => section.title === 'Pergunta estratégica')?.text}</p></section>
      <section className="brief-item"><h2>Aplicação profissional</h2><p>Selecione uma transição na jornada comercial, combine um comportamento observável com a liderança e defina uma data de revisão.</p></section>
    </div>
    <StatusPanel />
  </main>
}

export function Agenda() {
  const [params, setParams] = useSearchParams()
  const kind = params.get('tipo') || ''
  const events = diary.filter(item => Date.parse(item.date + 'T23:59:59-03:00') >= Date.now() && (!kind || normalize(item.format) === kind))
  return <main className="page wrap" id="conteudo">
    <Heading title="Agenda de RH" intro="Cursos e eventos com data confirmada na página dos organizadores. Confira vagas e condições no link de cada atividade." />
    <label className="field filters">Formato<select value={kind} onChange={e => setParams(e.target.value ? { tipo: e.target.value } : {})}><option value="">Todos</option><option value="curso">Curso</option><option value="evento">Evento</option></select></label>
    <div className="events">{events.length ? events.map(item => <article className="event" key={item.id}><time dateTime={item.date}>{dayFormat(item.date)}</time><div><h2>{item.title}</h2><p>{item.format} · {item.location} · {item.organizer}</p><p>{item.hours || 'Horário no calendário oficial'} · {item.price || 'Valores com a organização'}</p></div><External href={item.url} button>Consultar inscrição</External></article>) : <p className="empty">Nenhuma atividade confirmada para este filtro.</p>}</div>
    <div className="page-section"><External href="https://www.abrhrs.org.br/congregarh-e-outros-eventos" button>Calendário ABRH-RS</External></div>
  </main>
}

export function Sources() {
  return <main className="page wrap" id="conteudo"><Heading title="Fontes do portal" intro="Consulte as páginas oficiais e os canais com coleta configurada." />
    {[...new Set(sources.map(source => source.group))].map(group => <section key={group} className="page-section"><SectionTitle>{group}</SectionTitle><div className="source-list">
      {sources.filter(source => source.group === group).map(source => <div className="source-row" key={source.id}><div><strong>{source.name}</strong>{source.official && <span> · Fonte oficial</span>}</div><span className="source-state">{source.feed ? 'RSS compatível' : 'Consulta direta'}</span><External href={source.home} button>Acessar</External></div>)}
    </div></section>)}
  </main>
}

export function PointOfView() {
  const { entries } = usePortal()
  const published = entries.filter(item => item.evidence === 'autoral')
  return <main className="page wrap" id="conteudo"><Heading title="Ponto de Vista" intro="Reflexões de Roberta Viscardi sobre pessoas, cultura e o futuro do trabalho."><Avatar /></Heading>
    {published.length ? <div className="article-grid">{published.map(item => <ArticleCard key={item.id} entry={item} />)}</div> : <p className="empty">Os artigos assinados aparecem aqui após aprovação da Roberta.</p>}
  </main>
}

export function NotFound() {
  return <main className="page wrap" id="conteudo"><Heading title="Página indisponível" intro="O conteúdo pode ter mudado de endereço ou ainda estar em edição." /><Link className="secondary-button" to="/"><ArrowLeft size={17} />Voltar ao início</Link></main>
}
