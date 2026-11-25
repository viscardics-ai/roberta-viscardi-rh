import type { DiaryEntry, Entry } from './model'

const nr1 = 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1'
const wef = 'https://www.weforum.org/publications/the-future-of-jobs-report-2025'
const poa = 'https://prefeitura.poa.br/gp/noticias/usina-do-gasometro-e-reaberta-apos-restauracao-completa'
const abc = 'https://www.abrhrs.org.br/curso/formacao-em-gestao-dos-riscos-psicossociais'

export const initialEntries: Entry[] = [
  {
    id: 'gestao-de-pessoas-imobiliario', title: 'Gestão de Pessoas no Setor Imobiliário de Alto Padrão',
    summary: 'Tendências, desafios e boas práticas para atrair, desenvolver e reter talentos em um mercado cada vez mais competitivo.',
    category: 'Mercado & Pessoas', kind: 'Curadoria', themes: ['mercado','gestao','lideranca'], level: 'Aprofundado',
    source: 'Curadoria do portal', evidence: 'editorial', minutes: 6, image: '/images/orla.webp', imageAlt: 'Ilustração editorial da Orla do Guaíba ao entardecer',
    references: [{ name: 'Prefeitura de Porto Alegre · Orla e Usina do Gasômetro', url: poa }, { name: 'World Economic Forum · The Future of Jobs Report 2025', url: wef }],
    sections: [
      { title: 'O contexto', text: 'Em uma negociação de alto valor, a experiência depende de várias transições: qualificação inicial, visita, proposta, documentação e pós-venda. Uma transição mal conduzida pode desfazer a confiança construída na visita. A orla de Porto Alegre ilustra outro aspecto do atendimento: conhecer o entorno de um imóvel faz parte do repertório, mas informações sobre infraestrutura e obras devem ser confirmadas em fontes oficiais.' },
      { title: 'Por que isso importa para o RH?', text: 'A qualidade do atendimento deve aparecer no desenho da função. Avalie a capacidade de escutar, explicar riscos e recuperar uma conversa difícil. Durante a seleção, peça que todos os candidatos respondam à mesma situação fictícia e use critérios observáveis. No desenvolvimento, acompanhe a qualidade da passagem entre áreas junto com as metas comerciais.' },
      { title: 'O olhar da Business Partner', text: 'Comece pela etapa em que clientes e equipes mais sentem retrabalho. Converse com gestão comercial, documentação e pós-venda para localizar a origem. Uma etapa pode falhar por desconhecimento, incentivo inadequado ou falta de clareza sobre quem decide. Cada causa pede uma intervenção diferente.' },
      { title: 'Impacto no mercado imobiliário', text: 'Mapeie empregados, corretores autônomos e outros prestadores antes de propor rotinas de gestão. Combine resultados e interfaces compatíveis com cada vínculo e faça a validação jurídica de mudanças na operação. Evite deduzir o vínculo a partir do título do contrato ou da função.' },
      { title: 'Na prática', text: '1. Escolha uma transição que gere retrabalho e descreva o comportamento esperado.\n2. Faça uma simulação com cenário fictício e calibração de critérios.\n3. Teste uma mudança pequena com a liderança durante quatro semanas.\n4. Compare a qualidade da passagem, o tempo de resposta e os motivos de escalonamento antes de ampliar.' },
      { title: 'Contraponto', text: 'Picos de demanda, diferenças entre carteiras e mudanças de processo podem deslocar os indicadores. Use a observação qualitativa para complementar as métricas e evite atribuir resultados a uma intervenção com base em uma única comparação.' },
      { title: 'Pergunta estratégica', text: 'Em qual transição da jornada do cliente a equipe perde mais confiança, e que comportamento de liderança poderia mudar esse resultado?' },
    ],
  },
  {
    id: 'talento-cultura-proposito', title: 'Talento, Cultura e Propósito: o novo diferencial no imobiliário de alto padrão',
    summary: 'Como traduzir a promessa de atendimento premium em critérios de seleção, integração e desenvolvimento da equipe.',
    category: 'Mercado & Pessoas', kind: 'Curadoria', themes: ['mercado','lideranca','gestao','carreira'], level: 'Intermediário',
    source: 'Curadoria do portal', evidence: 'editorial', minutes: 5, image: '/images/imobiliario.webp', imageAlt: 'Ilustração editorial de um edifício residencial contemporâneo',
    references: [{ name: 'World Economic Forum · Relatório de competências e trabalho', url: wef }],
    sections: [
      { title: 'O contexto', text: 'Em atendimento consultivo, o discurso de marca precisa aparecer em decisões cotidianas: como a equipe encaminha uma dúvida, como responde a um atraso e como comunica limites ao cliente. Esses comportamentos podem servir de base para seleção e integração.' },
      { title: 'O olhar da Business Partner', text: 'Peça às lideranças exemplos reais de comportamentos que valorizam e descreva o que tornaria cada exemplo replicável. Use casos fictícios para testar julgamentos. Um roteiro comum e uma rubrica com cinco critérios ajudam entrevistadores a comparar evidências.' },
      { title: 'Impacto no mercado imobiliário', text: 'Padrões de comunicação, tratamento de informações e repasse de solicitações precisam ser claros para diferentes participantes da jornada comercial. Alinhe as práticas de desenvolvimento e coordenação ao vínculo aplicável, com apoio jurídico quando necessário.' },
      { title: 'Na prática', text: 'Desenhe uma integração em três etapas: observar um atendimento, simular um problema de documentação e explicar como acionaria o responsável pelo pós-venda. Feche cada etapa com uma devolutiva sobre o comportamento observado.' },
      { title: 'Contraponto', text: 'Afinidade cultural é um critério fácil de confundir com familiaridade pessoal. Procure decisões e condutas observáveis que admitam estilos e trajetórias diferentes.' },
      { title: 'Pergunta estratégica', text: 'Qual valor da marca conseguimos observar em uma conversa difícil com um cliente, e como ensinamos esse comportamento?' },
    ],
  },
  {
    id: 'nr-1-riscos-psicossociais', title: 'NR-1 em 2026: o que mudou e o que o RH precisa acompanhar',
    summary: 'O novo texto do capítulo 1.5 inclui expressamente os fatores de risco psicossociais relacionados ao trabalho no gerenciamento de riscos ocupacionais.',
    category: 'Legislação', kind: 'Legislação', themes: ['bem-estar','gestao','esg'], level: 'Aprofundado',
    source: 'Ministério do Trabalho e Emprego', url: nr1, author: 'Ministério do Trabalho e Emprego', eventDate: '2026-05-26', evidence: 'editorial',
    legalStatus: 'Norma vigente · capítulo 1.5 em vigor desde 26/05/2026', minutes: 6, image: '/images/legislacao.webp', imageAlt: 'Ilustração editorial de um martelo de madeira',
    references: [{ name: 'Fundacentro · Diretrizes para aplicar a NR-1', url: 'https://www.gov.br/fundacentro/pt-br/comunicacao/noticias/noticias/2026/maio/fundacentro-lanca-diretrizes-para-aplicar-nr-1-com-inclusao-dos-riscos-psicossociais' }],
    sections: [
      { title: 'A notícia', text: 'A nova redação do capítulo 1.5 da NR-1 entrou em vigor em 26 de maio de 2026, conforme o Ministério do Trabalho e Emprego. O texto inclui expressamente os fatores de risco psicossociais relacionados ao trabalho no Gerenciamento de Riscos Ocupacionais (GRO).' },
      { title: 'O contexto', text: 'A Portaria MTE nº 1.419/2024 alterou a redação do capítulo. A Portaria MTE nº 765/2025 prorrogou o início da vigência. O Ministério publica a norma, manuais e perguntas frequentes para apoiar a aplicação. A Fundacentro orienta a análise da organização e da gestão do trabalho.' },
      { title: 'Por que isso importa para o RH?', text: 'Organização da carga, clareza dos papéis e conflitos fazem parte da conversa sobre prevenção. O RH pode articular a participação dos trabalhadores com a equipe de saúde e segurança do trabalho (SST) e ajudar a priorizar mudanças que reduzam a exposição.' },
      { title: 'O olhar da Business Partner', text: 'Separe sinais de risco, hipóteses e ações. Em uma equipe comercial, a recorrência de tarefas urgentes no fim da jornada pode justificar investigar a distribuição do trabalho, a previsibilidade das escalas e o fluxo de aprovação. Registre padrões agregados e preserve a confidencialidade.' },
      { title: 'Na prática', text: 'Defina responsáveis com SST, combine os canais de escuta, priorize fatores ligados ao trabalho e acompanhe as medidas com prazos e revisão. Valide o enquadramento aplicável e as obrigações específicas com SST e orientação jurídica especializada.' },
      { title: 'Pergunta estratégica', text: 'Que condição de trabalho podemos alterar neste trimestre para reduzir a exposição ao risco, e como verificaremos essa mudança?' },
    ],
  },
  {
    id: 'futuro-do-trabalho-competencias', title: 'O futuro do trabalho: competências, IA e o papel estratégico do RH',
    summary: 'Leitura do Future of Jobs Report sobre como transformar cenários globais em decisões locais de desenvolvimento.',
    category: 'Tendências', kind: 'Pesquisa', themes: ['ia','carreira','gestao','lideranca'], level: 'Aprofundado',
    source: 'World Economic Forum', author: 'World Economic Forum', url: wef, date: '2025-01-08', evidence: 'editorial', minutes: 7,
    image: '/images/futuro.webp', imageAlt: 'Ilustração editorial de uma reunião executiva ao pôr do sol',
    sections: [
      { title: 'O estudo', text: 'O relatório reúne respostas de mais de mil empregadores em 55 economias sobre mudanças esperadas no emprego e nas competências entre 2025 e 2030. É uma pesquisa de expectativas empresariais, acompanhada de extrapolações.' },
      { title: 'O contexto', text: 'Os empregadores consultados apontam mudanças tecnológicas junto com fatores econômicos, demográficos e ambientais. Para o RH, o valor da pesquisa está em identificar hipóteses para testar com a liderança. Uma competência citada como prioritária no cenário global precisa fazer sentido na operação antes de entrar no plano de desenvolvimento.' },
      { title: 'O olhar da Business Partner', text: 'Escolha um processo e liste as tarefas que exigem julgamento, as que dependem de informações externas e as que podem ser apoiadas por IA. Para uma experiência piloto, combine um indicador de tempo e um de qualidade. Confirme como a equipe registrará erros e manterá a revisão humana.' },
      { title: 'Impacto no mercado imobiliário', text: 'Uma aplicação candidata é revisar rascunhos produzidos a partir de descrições fictícias de imóveis. Avalie precisão, clareza e consistência. Dados de clientes, informações sigilosas e decisões que exigem validação profissional ficam fora desse piloto editorial.' },
      { title: 'Contraponto', text: 'A pesquisa agrega expectativas de grandes empregadores. A amostra global e o horizonte de projeção limitam a extrapolação direta para o mercado de Porto Alegre e para equipes de pequeno porte.' },
      { title: 'Pergunta estratégica', text: 'Qual tarefa seria uma boa candidata a um experimento com IA sem perder a responsabilidade humana pela qualidade?' },
    ],
  },
  {
    id: 'roteiro-business-partner', title: 'Roteiro de conversa estratégica com lideranças',
    summary: 'Um modelo reutilizável para sair de um pedido genérico e chegar a um problema de negócio que a liderança consiga acompanhar.',
    category: 'Na Prática', kind: 'Modelo', themes: ['ferramentas','gestao','lideranca'], level: 'Intermediário', minutes: 4, source: 'Curadoria do portal', evidence: 'editorial',
    sections: [
      { title: 'Entender a decisão', text: 'Qual decisão precisa ser tomada? Quem vive o problema? Que exemplo concreto ocorreu recentemente? Qual seria o custo de continuar como estamos?' },
      { title: 'Definir evidência', text: 'Liste dois sinais observáveis e uma explicação alternativa. Escolha uma forma segura e proporcional de coletar evidências, com dados agregados quando houver informação de pessoas.' },
      { title: 'Combinar um teste', text: 'Escreva a hipótese em uma frase. Defina o menor teste possível, o responsável, a data de revisão e o critério para ajustar ou encerrar a ação.' },
      { title: 'Pergunta estratégica', text: 'Se a hipótese estiver errada, qual sinal devemos ver primeiro?' },
    ],
  },
  {
    id: 'clt', title: 'Consolidação das Leis do Trabalho (CLT)', summary: 'Texto consolidado com as alterações e remissões legais. Consulte a redação e a vigência do dispositivo aplicável ao caso.',
    category: 'Legislação', kind: 'Legislação', themes: ['gestao','bem-estar'], level: 'Aprofundado', source: 'Planalto', author: 'Presidência da República', url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm', legalStatus: 'Legislação vigente · texto consolidado', minutes: 5,
  },
  {
    id: 'lgpd', title: 'Lei Geral de Proteção de Dados Pessoais (LGPD)', summary: 'Referência oficial para discutir finalidade, necessidade e segurança no tratamento de dados pessoais em processos de RH.',
    category: 'Legislação', kind: 'Legislação', themes: ['gestao','esg','ia'], level: 'Aprofundado', source: 'Planalto', author: 'Presidência da República', url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', legalStatus: 'Legislação vigente · consulte o art. 65 sobre vigência', minutes: 5,
  },
  {
    id: 'normas-regulamentadoras', title: 'Normas Regulamentadoras vigentes', summary: 'Catálogo oficial das NRs. Use como ponto de partida para identificar a norma, sua versão publicada e os materiais de orientação.',
    category: 'Legislação', kind: 'Legislação', themes: ['bem-estar','esg'], level: 'Intermediário', source: 'Ministério do Trabalho e Emprego', url: nr1.replace(/\/nr-1$/, ''), legalStatus: 'Catálogo de normas vigentes', minutes: 4,
  },
  {
    id: 'formacao-riscos-psicossociais', title: 'Formação em Gestão dos Riscos Psicossociais', summary: 'Formação da ABRH-RS sobre fatores de risco psicossociais e sua gestão. Confira a programação e as condições com a organizadora.',
    category: 'Cursos e Eventos', kind: 'Curso', themes: ['bem-estar','gestao'], level: 'Intermediário', source: 'ABRH-RS', author: 'ABRH-RS', url: abc, eventDate: '2027-03-01', minutes: 2,
  },
  {
    id: 'checklist-integracao', title: 'Checklist de integração para atendimento consultivo', summary: 'Prepare as primeiras semanas com critérios de passagem, prática guiada e feedback sobre atendimentos simulados.',
    category: 'Na Prática', kind: 'Checklist', themes: ['ferramentas','mercado','carreira'], level: 'Introdução', source: 'Curadoria do portal', evidence: 'editorial', minutes: 3,
    sections: [{ title: 'Antes do início', text: 'Defina a liderança responsável, as pessoas de referência e os pontos de passagem do atendimento. Separe situações fictícias de visita, proposta e documentação.' }, { title: 'Primeira semana', text: 'Revise as responsabilidades e conduza uma simulação de atendimento. Combine um horário para feedback e defina como sinalizar dúvidas.' }, { title: 'Após 30 dias', text: 'Revise uma transição bem executada e uma que gerou retrabalho. Registre a próxima prática, a evidência esperada e a data de revisão.' }],
  },
]

export const diary: DiaryEntry[] = [
  { id: 'formacao-riscos', title: 'Formação em Gestão dos Riscos Psicossociais', date: '2027-03-01', location: 'Online', format: 'Curso', hours: '19h às 22h (Brasília)', organizer: 'ABRH-RS', url: abc },
  { id: 'formacao-bp', title: 'Formação em Business Partner de RH', date: '2027-03-15', location: 'ABRH-RS · Porto Alegre (organizadora)', format: 'Curso', organizer: 'ABRH-RS', url: 'https://www.abrhrs.org.br/cursos/business-partner-de-rh' },
]

export const featureIds = ['gestao-de-pessoas-imobiliario','nr-1-riscos-psicossociais','futuro-do-trabalho-competencias']
export const weeklyIds = ['talento-cultura-proposito','nr-1-riscos-psicossociais','futuro-do-trabalho-competencias']
