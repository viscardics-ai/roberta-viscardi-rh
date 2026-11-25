import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, FilePenLine, Globe2, Lightbulb, Rss } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from './api'
import { sources } from './catalog'
import { downloadText } from './pages'
import { usePortal } from './state'
import { questions } from './editor-model'
import type { Draft, EditorialData, Idea } from './editor-model'

const editorialSources = sources.filter(source => source.feed)
const initialData: EditorialData = { drafts: [], ideas: [], settings: {} }
const emptyDraft = (): Draft => ({ id: crypto.randomUUID(), title: '', summary: '', body: '', references: [] })
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'A operação não foi concluída.'

export function Editor() {
  const [params, setParams] = useSearchParams()
  const { entries, flash, reload } = usePortal()
  const linked = params.get('ideia')
  const [session, setSession] = useState<'loading' | 'blocked' | 'open'>('loading')
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<'artigos' | 'ideias' | 'fontes'>(linked ? 'ideias' : 'artigos')
  const [draft, setDraft] = useState(emptyDraft)
  const [idea, setIdea] = useState<Idea>({ entryId: '', title: '', answers: questions.map(() => '') })
  const [ideaSearch, setIdeaSearch] = useState('')
  const [preview, setPreview] = useState(false)
  const [approve, setApprove] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [passwordLogin, setPasswordLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [logoutAvailable, setLogoutAvailable] = useState(false)
  async function loadSession() {
    try {
      const result = await api<EditorialData>('editor')
      setData(result)
      setSession('open')
      if (sessionStorage.getItem('rv:password-session')) setLogoutAvailable(true)
    } catch (err) {
      setError(errorMessage(err))
      setSession('blocked')
      try {
        const login = await api<{ enabled: boolean }>('editor-login')
        setPasswordLogin(login.enabled)
      } catch { /* Cloudflare Access or static preview */ }
    }
  }
  useEffect(() => { void loadSession() }, [])
  useEffect(() => {
    if (!linked || session !== 'open') return
    const item = entries.find(entry => entry.id === linked)
    const existing = data.ideas.find(entry => entry.entryId === linked)
    if (existing || item) {
      setIdea(existing || { entryId: item!.id, title: item!.title, answers: questions.map(() => '') })
      setTab('ideias')
    }
  }, [linked, session, entries.length, data.ideas])

  function selectDraft(item: Draft) {
    setDraft(item)
    setPreview(false)
    setApprove(false)
    setError('')
  }
  const action = async (callback: () => Promise<void>) => {
    setSaving(true)
    setError('')
    try { await callback() } catch (err) { setError(errorMessage(err)) } finally { setSaving(false) }
  }
  function login(event: FormEvent) {
    event.preventDefault()
    void action(async () => {
      await api('editor-login', { method: 'POST', body: JSON.stringify({ password }) })
      setPassword('')
      sessionStorage.setItem('rv:password-session', '1')
      await loadSession()
    })
  }
  function logout() {
    void action(async () => {
      await api('editor-login', { method: 'POST', body: JSON.stringify({ action: 'logout' }) })
      sessionStorage.removeItem('rv:password-session')
      setLogoutAvailable(false)
      setData(initialData)
      selectDraft(emptyDraft())
      await loadSession()
    })
  }

  function saveDraft(event: FormEvent, publish = false) {
    event.preventDefault()
    if (!draft.title.trim() || (publish && (!approve || !draft.body.trim() || !draft.summary.trim()))) {
      setError('Preencha o título, o resumo e o texto e confirme a publicação.')
      return
    }
    void action(async () => {
      const saved = await api<Draft>('editor', { method: 'POST', body: JSON.stringify({ action: publish ? 'publish' : 'draft', draft, approved: approve }) })
      setData(previous => ({ ...previous, drafts: [saved, ...previous.drafts.filter(item => item.id !== saved.id)] }))
      setDraft(saved)
      setApprove(false)
      if (publish) await reload()
      flash(publish ? 'Artigo publicado.' : 'Rascunho salvo.')
    })
  }
  function saveIdea(event: FormEvent) {
    event.preventDefault()
    void action(async () => {
      const saved = await api<Idea>('editor', { method: 'POST', body: JSON.stringify({ action: 'idea', idea }) })
      setData(previous => ({ ...previous, ideas: [saved, ...previous.ideas.filter(item => item.entryId !== saved.entryId)] }))
      setIdea(saved)
      flash('Reflexão salva.')
    })
  }
  function editIdea(entryId: string, title: string) {
    setParams({})
    setIdea(data.ideas.find(item => item.entryId === entryId) || { entryId, title, answers: questions.map(() => '') })
    setIdeaSearch('')
    setError('')
  }

  return <main className="page wrap" id="conteudo">
    <header className="page-header"><h1>Área editorial</h1><p>Artigos, reflexões privadas e configuração das fontes monitoradas.</p></header>
    {session === 'loading' && <div className="skeleton status-skeleton" aria-label="Verificando acesso" />}
    {session === 'blocked' && <div className="empty" role="status">{error}{passwordLogin
      ? <form className="editor-form" onSubmit={login}><label className="field editor-search">Senha editorial<input type="password" required value={password} maxLength={512} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label><div><button className="secondary-button" disabled={saving}>Entrar</button></div></form>
      : <p>Use a conta autorizada na política da área editorial.</p>}
    </div>}
    {session === 'open' && <>
      <div className="action-row" aria-label="Ferramentas editoriais">
        <button className="secondary-button" aria-pressed={tab === 'artigos'} onClick={() => { setTab('artigos'); setError('') }}><FilePenLine size={17} />Artigos</button>
        <button className="secondary-button" aria-pressed={tab === 'ideias'} onClick={() => { setTab('ideias'); setError('') }}><Lightbulb size={17} />Banco de Ideias</button>
        <button className="secondary-button" aria-pressed={tab === 'fontes'} onClick={() => { setTab('fontes'); setError('') }}><Rss size={17} />Coleta</button>
        {logoutAvailable && <button className="secondary-button" disabled={saving} onClick={logout}>Encerrar sessão</button>}
      </div>
      {error && <p className="error-text page-section" role="alert">{error}</p>}
      {tab === 'artigos' && <div className="editor-grid">
        <aside className="editor-list">
          <button className="secondary-button" onClick={() => selectDraft(emptyDraft())}>Novo artigo</button>
          {data.drafts.map(item => <button key={item.id} aria-pressed={item.id === draft.id} className="secondary-button" onClick={() => selectDraft(item)}>{item.title} · {item.published ? 'Publicado' : 'Rascunho'}</button>)}
        </aside>
        <form className="editor-form" onSubmit={event => saveDraft(event, preview && approve)}>
          <label className="field">Título<input value={draft.title} maxLength={160} required onChange={e => { setDraft({ ...draft, title: e.target.value }); setApprove(false) }} /></label>
          <label className="field">Resumo<textarea value={draft.summary} maxLength={480} onChange={e => { setDraft({ ...draft, summary: e.target.value }); setApprove(false) }} /></label>
          <label className="field">Texto<textarea value={draft.body} rows={10} maxLength={25000} onChange={e => { setDraft({ ...draft, body: e.target.value }); setApprove(false) }} /></label>
          {draft.references.map((ref, index) => <div key={index} className="filters">
            <label className="field">Nome da referência<input value={ref.name} required maxLength={120} onChange={e => { setDraft({ ...draft, references: draft.references.map((item,i) => i === index ? { ...item, name: e.target.value } : item) }); setApprove(false) }} /></label>
            <label className="field">Link da referência<input type="url" required value={ref.url} maxLength={500} onChange={e => { setDraft({ ...draft, references: draft.references.map((item,i) => i === index ? { ...item, url: e.target.value } : item) }); setApprove(false) }} /></label>
            <button type="button" className="secondary-button" onClick={() => { setDraft({ ...draft, references: draft.references.filter((_,i) => i !== index) }); setApprove(false) }}>Remover referência</button>
          </div>)}
          <div className="action-row">
            <button type="button" className="secondary-button" disabled={draft.references.length >= 10} onClick={() => { setDraft({ ...draft, references: [...draft.references, { name: '', url: '' }] }); setApprove(false) }}>Adicionar referência</button>
            <button type="button" className="secondary-button" onClick={() => { setPreview(!preview); setApprove(false) }}>{preview ? 'Fechar prévia' : 'Visualizar antes de publicar'}</button>
            <button type="button" className="secondary-button" disabled={!draft.title.trim()} onClick={() => downloadText('artigo-linkedin.txt', [draft.title, draft.summary, draft.body, ...draft.references.map(ref => ref.name + '\n' + ref.url)].filter(Boolean).join('\n\n'))}><Download size={16} />Exportar para LinkedIn</button>
          </div>
          {preview && <div className="editor-preview"><h2>{draft.title || 'Artigo sem título'}</h2><p>{draft.summary}</p><p>{draft.body}</p>{draft.references.map(ref => <p key={ref.url}>{ref.name} · {ref.url}</p>)}</div>}
          {preview && <label className="approval"><input type="checkbox" checked={approve} onChange={e => setApprove(e.target.checked)} />Aprovo publicar esta versão em nome de Roberta Viscardi.</label>}
          <div className="action-row">
            <button type="button" className="secondary-button" disabled={saving} onClick={e => saveDraft(e)}>Salvar rascunho</button>
            {preview && <button type="submit" className="primary-button" disabled={!approve || saving}><Globe2 size={17} />Publicar versão</button>}
            {draft.published && <Link className="secondary-button" to={'/materia/autoral-' + draft.id}>Ver versão publicada</Link>}
          </div>
        </form>
      </div>}
      {tab === 'ideias' && <div className="editor-grid">
        <aside className="editor-list">
          {data.ideas.map(item => <button key={item.entryId} className="secondary-button" aria-pressed={item.entryId === idea.entryId} onClick={() => editIdea(item.entryId,item.title)}>{item.title}</button>)}
        </aside>
        <form className="editor-form" onSubmit={saveIdea}>
          <label className="field editor-search">Buscar matéria para uma nova ideia<input value={ideaSearch} maxLength={160} onChange={e => setIdeaSearch(e.target.value)} /></label>
          {ideaSearch.trim() && <div className="editor-list">{entries.filter(item => item.title.toLowerCase().includes(ideaSearch.trim().toLowerCase())).slice(0,6).map(item => <button type="button" className="secondary-button" key={item.id} onClick={() => editIdea(item.id,item.title)}>{item.title}</button>)}</div>}
          {idea.entryId && <><h2>{idea.title}</h2>{questions.map((question, index) => <label className="field" key={question}>{question}<textarea maxLength={2400} value={idea.answers[index] || ''} onChange={e => setIdea({ ...idea, answers: idea.answers.map((value,i) => i === index ? e.target.value : value) })} /></label>)}
          <div><button type="submit" className="primary-button" disabled={saving}>Salvar reflexão</button></div></>}
        </form>
      </div>}
      {tab === 'fontes' && <section className="page-section source-list">
        {editorialSources.map(source => <label className="source-row" key={source.id}><strong>{source.name}</strong><span className="source-state">{source.lang === 'en' ? 'RSS em inglês · requer tradução por IA' : 'RSS em português'}</span><input type="checkbox" aria-label={'Monitorar ' + source.name} disabled={saving} checked={data.settings[source.id] ?? true} onChange={e => {
          const enabled = e.target.checked
          void action(async () => {
            await api('editor', { method: 'POST', body: JSON.stringify({ action: 'source', id: source.id, enabled }) })
            setData(previous => ({ ...previous, settings: { ...previous.settings, [source.id]: enabled } }))
            flash('Configuração salva.')
          })
        }} /></label>)}
      </section>}
    </>}
  </main>
}
