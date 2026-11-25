export type Source = {
  id: string
  name: string
  group: string
  home: string
  feed?: string
  lang?: string
  official?: boolean
}

export const sources: Source[] = [
  { id: 'hbr', name: 'Harvard Business Review', group: 'RH e gestão', home: 'https://hbr.org/' },
  { id: 'shrm', name: 'SHRM', group: 'RH e gestão', home: 'https://www.shrm.org/' },
  { id: 'cipd', name: 'CIPD', group: 'RH e gestão', home: 'https://www.cipd.org/' },
  { id: 'mit', name: 'MIT Sloan Management Review', group: 'RH e gestão', home: 'https://sloanreview.mit.edu/' },
  { id: 'gallup', name: 'Gallup', group: 'RH e gestão', home: 'https://www.gallup.com/workplace/' },
  { id: 'deloitte', name: 'Deloitte Insights', group: 'RH e gestão', home: 'https://www.deloitte.com/us/en/insights.html' },
  { id: 'mckinsey', name: 'McKinsey', group: 'RH e gestão', home: 'https://www.mckinsey.com/', feed: 'https://www.mckinsey.com/insights/rss', lang: 'en' },
  { id: 'gptw', name: 'Great Place to Work Brasil', group: 'RH e gestão', home: 'https://gptw.com.br/', feed: 'https://gptw.com.br/feed/' },
  { id: 'abrh', name: 'ABRH Brasil', group: 'RH e gestão', home: 'https://www.abrhbrasil.org.br/' },
  { id: 'abrhrs', name: 'ABRH-RS', group: 'RH e gestão', home: 'https://www.abrhrs.org.br/' },
  { id: 'vocerh', name: 'Você RH', group: 'RH e gestão', home: 'https://vocerh.abril.com.br/' },
  { id: 'fia', name: 'FIA Business School', group: 'RH e gestão', home: 'https://fia.com.br/' },
  { id: 'fdc', name: 'Fundação Dom Cabral', group: 'RH e gestão', home: 'https://www.fdc.org.br/' },
  { id: 'mte', name: 'Ministério do Trabalho e Emprego', group: 'Legislação', home: 'https://www.gov.br/trabalho-e-emprego/', official: true },
  { id: 'tst', name: 'Tribunal Superior do Trabalho', group: 'Legislação', home: 'https://www.tst.jus.br/', feed: 'https://www.tst.jus.br/noticias/-/journal/rss/57294?doAsGroupId=10157&refererPlid=10730&_15_groupId=10157', official: true },
  { id: 'trt4', name: 'TRT da 4ª Região', group: 'Legislação', home: 'https://www.trt4.jus.br/', official: true },
  { id: 'dou', name: 'Diário Oficial da União', group: 'Legislação', home: 'https://www.in.gov.br/', official: true },
  { id: 'planalto', name: 'Portal da Legislação do Planalto', group: 'Legislação', home: 'https://www4.planalto.gov.br/legislacao', official: true },
  { id: 'fundacentro', name: 'Fundacentro', group: 'Legislação', home: 'https://www.gov.br/fundacentro/', official: true },
  { id: 'ibge', name: 'IBGE', group: 'Economia e negócios', home: 'https://agenciadenoticias.ibge.gov.br/', official: true },
  { id: 'bcb', name: 'Banco Central', group: 'Economia e negócios', home: 'https://www.bcb.gov.br/', official: true },
  { id: 'valor', name: 'Valor Econômico', group: 'Economia e negócios', home: 'https://valor.globo.com/' },
  { id: 'infomoney', name: 'InfoMoney', group: 'Economia e negócios', home: 'https://www.infomoney.com.br/', feed: 'https://www.infomoney.com.br/feed/' },
  { id: 'agencia', name: 'Agência Brasil', group: 'Economia e negócios', home: 'https://agenciabrasil.ebc.com.br/', feed: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
  { id: 'secovi', name: 'Secovi-RS', group: 'Mercado imobiliário', home: 'https://www.secovirsagademi.com.br/' },
  { id: 'sinduscon', name: 'Sinduscon-RS', group: 'Mercado imobiliário', home: 'https://www.sinduscon-rs.com.br/' },
  { id: 'creci', name: 'CRECI-RS', group: 'Mercado imobiliário', home: 'https://www.creci-rs.gov.br/' },
  { id: 'cbic', name: 'CBIC', group: 'Mercado imobiliário', home: 'https://cbic.org.br/', feed: 'https://cbic.org.br/feed/' },
  { id: 'brain', name: 'Brain Inteligência Estratégica', group: 'Mercado imobiliário', home: 'https://brain.srv.br/' },
  { id: 'fipezap', name: 'FipeZAP', group: 'Mercado imobiliário', home: 'https://www.fipe.org.br/pt-br/indices/fipezap/' },
  { id: 'worklab', name: 'Microsoft WorkLab', group: 'Futuro do trabalho', home: 'https://www.microsoft.com/en-us/worklab/' },
  { id: 'wef', name: 'World Economic Forum', group: 'Futuro do trabalho', home: 'https://www.weforum.org/' },
  { id: 'oit', name: 'Organização Internacional do Trabalho', group: 'Futuro do trabalho', home: 'https://www.ilo.org/' },
  { id: 'linkedin', name: 'LinkedIn Economic Graph', group: 'Futuro do trabalho', home: 'https://economicgraph.linkedin.com/' },
]
