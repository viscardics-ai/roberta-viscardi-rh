import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowRight, BarChart3, Bell, Binoculars, BookOpen, Bookmark, Building2, CalendarDays, ChevronRight, Clock3, Crown, Gavel, GraduationCap, HeartPulse, House, Layers3, Lightbulb, Mail, Menu, Monitor, Newspaper, RefreshCw, Scale, Search, Sprout, Target, TrendingUp, UsersRound,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { dayFormat, themes, timeFormat } from './model'
import type { Entry } from './model'
import { usePortal } from './state'
import { featureIds, weeklyIds } from './content'
import { distinctNewsCovers } from './covers'

const sections = [
  { path: '/', title: 'Início', icon: House },
  { path: '/noticias', title: 'Notícias', icon: Newspaper },
  { path: '/analises', title: 'Análises', icon: BarChart3 },
  { path: '/tendencias', title: 'Tendências', icon: Binoculars },
  { path: '/carreira', title: 'Carreira e Liderança', icon: UsersRound },
  { path: '/legislacao', title: 'Legislação e Compliance', icon: Scale },
  { path: '/estudos', title: 'Estudos', icon: BookOpen },
  { path: '/na-pratica', title: 'Na Prática', icon: Lightbulb },
]
const topicIcons = [UsersRound, Crown, TrendingUp, HeartPulse, Monitor, Building2, Sprout, Layers3]
const quickLinks = [
  { to: '/agenda', lines: ['Agenda','de RH'], icon: CalendarDays },
  { to: '/legislacao', lines: ['Legislação','Trabalhista'], icon: Gavel },
  { to: '/na-pratica', lines: ['Ferramentas','e Modelos'], icon: UsersRound },
  { to: '/agenda?tipo=curso', lines: ['Cursos','e Eventos'], icon: GraduationCap },
]

export function Header() {
  const [menu, setMenu] = useState(false)
  const location = useLocation()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { entries, history, busy, update } = usePortal()
  const unread = entries.some(item => item.kind === 'Notícia' && !history.includes(item.id))
  useEffect(() => {
    setMenu(false)
    setSearch(location.pathname === '/busca' ? new URLSearchParams(location.search).get('q') ?? '' : '')
  }, [location])
  function submit(event: FormEvent) {
    event.preventDefault()
    if (search.trim()) navigate('/busca?' + new URLSearchParams({ q: search.trim() }).toString())
  }
  return <header className="header wrap">
    <div className="header-top">
      <Link className="brand" to="/" aria-label="Roberta Viscardi, início">
        <img src="/favicon.svg" width="72" height="56" alt="" />
        <span className="brand-divider" />
        <span className="brand-wordmark"><b>Roberta Viscardi</b><small><i />RH &amp; PESSOAS<i /></small></span>
      </Link>
      <div className="brand-description">Portal de Conhecimento e Tendências em<br className="desktop-break" /> Pessoas, Gestão e Mercado Imobiliário</div>
      <form className="search" role="search" onSubmit={submit}>
        <button type="submit" aria-label="Buscar"><Search size={23} /></button>
        <input aria-label="Buscar notícias, análises e temas de RH" placeholder="Buscar notícias, análises, temas de RH..." value={search} maxLength={160} onChange={e => setSearch(e.target.value)} />
      </form>
      <div className="top-actions">
        <button className="icon-button update-icon" aria-label="Atualizar portal" title="Atualizar portal" onClick={() => void update()} disabled={busy}><RefreshCw className={busy ? 'spin' : ''} size={20} /></button>
        <Link className="icon-button" aria-label="Favoritos" title="Favoritos" to="/favoritos"><Bookmark /></Link>
        <Link className="icon-button bell" aria-label="Notificações e histórico" title="Notificações e histórico" to="/atividade"><Bell />{unread && <i />}</Link>
        <button className="icon-button menu-toggle" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu /></button>
      </div>
    </div>
    <nav className={menu ? 'navigation expanded' : 'navigation'} aria-label="Menu principal">
      {sections.map(({ path, title, icon: Icon }) => <NavLink to={path} end={path === '/'} key={path}><Icon size={26} strokeWidth={2.05} /><span>{title}</span></NavLink>)}
    </nav>
  </header>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

export function BookmarkButton({ entry }: { entry: Entry }) {
  const { favorites, toggleSave } = usePortal()
  const saved = favorites.includes(entry.id)
  return <button className={'icon-button bookmark' + (saved ? ' saved' : '')} aria-pressed={saved} aria-label={saved ? 'Remover dos favoritos' : 'Salvar matéria'} title={saved ? 'Remover dos favoritos' : 'Salvar matéria'} onClick={() => toggleSave(entry.id)}><Bookmark size={23} fill={saved ? 'currentColor' : 'none'} /></button>
}

export function ArticleCard({ entry }: { entry: Entry }) {
  const { history } = usePortal()
  return <article className="article-card">
    {entry.image && <Link className="card-photo" to={'/materia/' + entry.id} tabIndex={-1} aria-hidden="true"><img src={entry.image} alt="" loading="lazy" /></Link>}
    <div className="card-body">
      <p className="eyebrow">{entry.category}{entry.kind === 'Notícia' && !history.includes(entry.id) && <span className="unread-dot" title="Matéria não lida" />}</p>
      <h3><Link to={'/materia/' + entry.id}>{entry.title}</Link></h3>
      <p className="card-source" title={entry.source}>{entry.source}{entry.date ? ' · ' + dayFormat(entry.date) : ''}</p>
      <div className="card-footer"><span><Clock3 size={20} />{entry.minutes} min de leitura</span><BookmarkButton entry={entry} /></div>
    </div>
  </article>
}

export function StatusPanel() {
  const { portal, busy, loading, update } = usePortal()
  const status = portal.update
  return <section className="status-panel" aria-label="Estado da atualização">
    <div>
      <h3>Atualização editorial</h3>
      {loading ? <p className="skeleton status-skeleton" aria-label="Consultando estado da atualização" /> : <>
        <p>{portal.state === 'static' ? 'Coleta indisponível neste ambiente.' : portal.state === 'error' ? 'Servidor temporariamente indisponível.' : status ? 'Última execução em ' + timeFormat(status.time) + ' (Brasília).' : 'Aguardando a primeira coleta.'}</p>
        {status && <p>{status.state === 'ok' ? 'Concluída' : status.state === 'partial' ? 'Concluída com indisponibilidades' : status.state === 'running' ? 'Em andamento' : 'Falha na coleta'} · {status.added} novos conteúdos{status.failures.length ? ' · Fontes indisponíveis: ' + status.failures.join(', ') : ''}</p>}
        {status && <p>{status.ai}</p>}
        {portal.automatic && <p>Atualização diária programada para 7h (Brasília).</p>}
      </>}
    </div>
    <button className="secondary-button" onClick={() => void update()} disabled={busy}><RefreshCw size={17} className={busy ? 'spin' : ''} />{busy ? 'Atualizando…' : 'Atualizar portal'}</button>
  </section>
}

function Carousel({ entries }: { entries: Entry[] }) {
  const [slide, setSlide] = useState(0)
  const active = entries[slide % entries.length]
  return <section className="hero" aria-roledescription="carrossel" aria-label="Matérias em destaque">
    <img className={'hero-photo' + (active.id === featureIds[0] ? ' waterfront' : '')} src={active.image || '/images/futuro.webp'} alt={active.imageAlt || ''} fetchPriority="high" />
    <div className="hero-shade" />
    <div className="brush hero-brush-top" />
    <div className="brush hero-brush-bottom" />
    <div className="hero-copy" aria-live="polite">
      <span className="hero-badge">Em destaque</span>
      <h1>{active.id === featureIds[0] ? <>Gestão de Pessoas no<br className="hero-break" /> Setor Imobiliário de Alto Padrão</> : active.title}</h1>
      <p>{active.summary}</p>
      <Link className="primary-button" to={'/materia/' + active.id}>Ler análise completa <ArrowRight size={20} /></Link>
    </div>
    <div className="hero-dots" aria-label="Selecionar destaque">
      {entries.map((entry, index) => <button type="button" key={entry.id} aria-label={'Destaque ' + (index + 1) + ': ' + entry.title} aria-pressed={index === slide % entries.length} onClick={() => setSlide(index)} />)}
    </div>
  </section>
}

export function Avatar() {
  const [fallback, setFallback] = useState(false)
  const photo = import.meta.env.VITE_ROBERTA_PHOTO
  return <span className="avatar">
    {photo && !fallback ? <img src={photo} alt="Roberta Viscardi" onError={() => setFallback(true)} /> : <img src="/favicon.svg" alt="Monograma RV" />}
  </span>
}

function Sidebar() {
  const { flash } = usePortal()
  return <aside className="sidebar" aria-label="Editorias e atalhos">
    <Link className="market" to="/panorama">
      <div className="market-title"><Building2 size={57} strokeWidth={1.4} /><div><p>Panorama do Mercado</p><h2>RH e Imobiliário</h2></div></div>
      <p>Movimentações, tendências e impactos<br className="desktop-break" /> no desenvolvimento de pessoas no<br className="desktop-break" /> mercado de alto padrão.</p>
      <span className="brush market-brush" />
    </Link>
    <section className="quick"><SectionTitle>Acesso rápido</SectionTitle><div className="quick-grid">
      {quickLinks.map(({ to, lines, icon: Icon }) => <Link className="tile" key={to} to={to}><Icon size={35} strokeWidth={1.7} /><span>{lines.map(line => <span key={line}>{line}</span>)}</span></Link>)}
    </div></section>
    <section className="point"><SectionTitle>Ponto de Vista</SectionTitle>
      <Link to="/ponto-de-vista" className="point-content"><Avatar /><div><h3>Roberta Viscardi</h3><p>Reflexões, análises e aprendizados<br className="desktop-break" /> sobre pessoas, cultura e o futuro do trabalho.</p></div><ChevronRight size={30} /></Link>
    </section>
    <Link className="practice-card" to="/na-pratica"><Target size={48} strokeWidth={1.9} /><div><h2>Na Prática</h2><p>Soluções, métodos e ideias aplicáveis<br className="desktop-break" /> ao dia a dia do RH.</p></div><ChevronRight size={29} /></Link>
    <section className="newsletter">
      <Mail size={39} strokeWidth={1.8} />
      <div><h2>Receba a curadoria da Roberta</h2><p>Um resumo semanal com as principais notícias, análises e insights de RH e do mercado imobiliário.</p>
      <button className="primary-button" onClick={() => flash('Inscrições para a curadoria ainda indisponíveis.')}>Quero receber</button><small>Inscrições em breve</small></div>
    </section>
  </aside>
}

export function Home() {
  const { entries } = usePortal()
  const editorial = featureIds.map(id => entries.find(item => item.id === id)!)
  const fresh = entries.filter(item => item.evidence === 'rss' && item.date && Date.now() - Date.parse(item.date) <= 7 * 86400000)
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.date || '').localeCompare(a.date || ''))
  const featured = fresh.find(item => item.sections?.length)
  const carousel = featured ? [editorial[0], featured, editorial[1]] : editorial
  const weekly = distinctNewsCovers([...fresh, ...weeklyIds.map(id => entries.find(item => item.id === id)!)].slice(0, 3))
  return <main className="wrap home-grid" id="conteudo">
    <div className="editorial">
      <Carousel entries={carousel} />
      <section className="topics"><SectionTitle>Explore por tema</SectionTitle>
        <div className="topic-grid">{themes.map(({ id, lines }, index) => {
          const Icon = topicIcons[index]
          return <Link className="tile" to={'/tema/' + id} key={id}><Icon size={34} strokeWidth={1.75} /><span>{lines.map(line => <span key={line}>{line}</span>)}</span></Link>
        })}</div>
      </section>
      <section className="weekly"><SectionTitle>Destaques da semana</SectionTitle>
        <div className="article-grid weekly-grid">{weekly.map(entry => <ArticleCard key={entry.id} entry={entry} />)}</div>
      </section>
      <section className="radar-preview">
        <SectionTitle>Radar da Business Partner</SectionTitle>
        <Link to="/radar">Abrir briefing executivo <ArrowRight size={18} /></Link>
      </section>
      <StatusPanel />
    </div>
    <Sidebar />
  </main>
}

export function Footer() {
  return <footer className="footer wrap"><span>Roberta Viscardi · RH &amp; Pessoas<br /><small>Informação que se transforma em visão estratégica.</small></span><nav aria-label="Links complementares">
    <Link to="/biblioteca">Biblioteca</Link><Link to="/radar">Radar</Link><Link to="/fontes">Fontes</Link><a href="/editor">Área editorial</a>
  </nav></footer>
}
