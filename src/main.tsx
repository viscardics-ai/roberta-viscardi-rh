import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles.css'
import { Footer, Header, Home } from './components'
import { Agenda, Article, Collection, NotFound, PointOfView, Radar, Saved, Sources } from './pages'
import { Editor } from './editor'
import { PortalProvider } from './state'

function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return <div className={pathname === '/' ? 'app home-page' : 'app'}>
    <a className="skip" href="#conteudo">Pular para o conteúdo</a>
    <div className="brush page-brush-top" />
    {pathname === '/' && <div className="brush page-brush-bottom" />}
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/materia/:id" element={<Article />} />
      <Route path="/tema/:id" element={<Collection />} />
      <Route path="/noticias" element={<Collection mode="noticias" />} />
      <Route path="/analises" element={<Collection mode="analises" />} />
      <Route path="/tendencias" element={<Collection mode="tendencias" />} />
      <Route path="/carreira" element={<Collection mode="carreira" />} />
      <Route path="/legislacao" element={<Collection mode="legislacao" />} />
      <Route path="/estudos" element={<Collection mode="estudos" />} />
      <Route path="/na-pratica" element={<Collection mode="na-pratica" />} />
      <Route path="/panorama" element={<Collection mode="panorama" />} />
      <Route path="/biblioteca" element={<Collection mode="biblioteca" />} />
      <Route path="/busca" element={<Collection mode="busca" />} />
      <Route path="/favoritos" element={<Saved />} />
      <Route path="/atividade" element={<Saved activity />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/fontes" element={<Sources />} />
      <Route path="/radar" element={<Radar />} />
      <Route path="/ponto-de-vista" element={<PointOfView />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><PortalProvider><App /></PortalProvider></BrowserRouter></StrictMode>)
