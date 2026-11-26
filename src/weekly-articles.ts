import type { Entry } from './model'

export const weeklyArticles: [Entry, ...Entry[]] = [
  {
    id: 'quando-tudo-e-urgente',
    title: 'Quando tudo é urgente, o que ainda cabe?',
    summary: 'Como a liderança pode negociar prioridades e reduzir a sobrecarga da equipe.',
    category: 'Gestão de Pessoas',
    kind: 'Curadoria',
    themes: ['gestao', 'lideranca', 'bem-estar', 'mercado'],
    level: 'Aprofundado',
    source: 'Redação do portal',
    date: '2026-11-26',
    evidence: 'editorial',
    minutes: 6,
    image: '/images/artigos/quando-tudo-e-urgente.webp',
    imageAlt: 'Dois colegas conversam em uma sala clara, sentados à mesa com um caderno aberto',
    references: [
      { name: 'Organização Mundial da Saúde · Saúde mental no trabalho', url: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work' },
      { name: 'Ministério do Trabalho e Emprego · Norma Regulamentadora nº 1', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' },
      { name: 'Fundacentro · Diretrizes para aplicar a NR-1 com inclusão dos riscos psicossociais', url: 'https://www.gov.br/fundacentro/pt-br/comunicacao/noticias/noticias/2026/maio/fundacentro-lanca-diretrizes-para-aplicar-nr-1-com-inclusao-dos-riscos-psicossociais' },
    ],
    sections: [
      {
        title: 'A mensagem das 17h42',
        text: 'Imagine uma quinta-feira no pós-venda de uma incorporadora. Marina está conferindo a documentação de um imóvel que será entregue na manhã seguinte. Às 17h42, chega uma mensagem do comercial. Um comprador quer receber ainda hoje a simulação de uma mudança no contrato. Pouco depois, outra área pede uma planilha para a primeira reunião de sexta. As duas mensagens terminam com “é rapidinho”.\n\nMarina conhece as consequências de um atraso na entrega. Também sabe pelo histórico que a simulação costuma voltar com dúvidas e que conferir a planilha exige consultar outra área. Responde que vai tentar. No fim, manda tudo. Na reunião da manhã seguinte, ninguém vê que ela terminou a conferência do imóvel depois do jantar. Vê apenas três tarefas concluídas.\n\nUma quinta-feira assim pode acontecer. A questão aparece quando o esforço extraordinário vira a medida do que a empresa passa a esperar numa quinta-feira comum.',
      },
      {
        title: 'O sucesso de ontem pode esconder a falta de capacidade de hoje',
        text: 'Uma lista de tarefas concluídas diz pouco sobre as condições da entrega. Talvez uma pessoa experiente tenha adiado o almoço para revisar o trabalho de colegas. Talvez o time tenha deixado de documentar uma decisão e já saiba que vai precisar reconstruí-la depois. Se o relatório registra apenas o prazo cumprido, esses custos desaparecem da conversa.\n\nNa prática, a liderança pode conhecer cada pedido e ainda assim desconhecer a soma. O comercial vê uma negociação. O financeiro vê uma planilha. O pós-venda vê uma entrega. Cada urgência parece razoável de perto. É no ponto em que as três entram na mesma agenda que alguém precisa decidir o que pode esperar. Se ninguém assume essa decisão, a escolha acaba na mão de quem tem menos poder para mudar o prazo.\n\nA OMS inclui a carga excessiva e a baixa autonomia sobre o trabalho entre os fatores que podem afetar a saúde mental. Desde 26 de maio de 2026, o capítulo 1.5 da NR-1 inclui expressamente os fatores de risco psicossociais relacionados ao trabalho no gerenciamento de riscos ocupacionais. A orientação da Fundacentro ajuda a conectar a norma ao dia a dia. Observar como o trabalho é organizado é parte de descobrir onde agir.',
      },
      {
        title: 'Dizer “não cabe” precisa mudar alguma coisa',
        text: 'Imagine que Marina consiga avisar sobre a sobrecarga. A resposta mais importante vem depois. Se a gestora agradece a franqueza e mantém as três entregas, Marina aprende que falar foi permitido, mas ainda terá de resolver tudo sozinha. Na próxima vez, pode economizar o tempo da conversa.\n\nUma resposta diferente seria “A entrega do imóvel fica para amanhã como combinado. Eu vou negociar a planilha para depois da reunião e avisar o comercial de que a simulação vai às 11h. Existe algum compromisso com o comprador que eu ainda não conheça?”. A pergunta final importa. Quem executa o trabalho costuma saber de dependências e promessas que a liderança só enxerga quando pede detalhes.\n\nHá urgências reais. Em uma vistoria, um problema de segurança muda as prioridades na hora. Nessa situação, cuidar da carga significa nomear o que foi suspenso, avisar as áreas afetadas e retomar os combinados quando a emergência passar. Quando o mesmo tipo de urgência se repete, vale investigar em que ponto do processo ele poderia ter sido previsto.',
      },
      {
        title: 'Um mês de teste com uma equipe',
        text: 'Na primeira semana, reconstrua duas situações reais com quem fez o trabalho. O que entrou, por qual canal, quem podia decidir e qual entrega perdeu espaço? Convide também quem costuma cobrir as ausências ou refazer tarefas. A suposta folga de uma área pode ser o esforço invisível de outra.\n\nNas duas semanas seguintes, teste um combinado. Todo novo pedido urgente vem com o motivo do prazo e passa por alguém com autoridade para renegociar a fila. Se a demanda entrar, a pessoa responsável explicita o que muda e comunica a decisão às áreas. Escolha um processo em que o tema apareça com frequência, como documentação de vendas ou atendimento pós-entrega. Preserve um caminho rápido para emergências de verdade.\n\nNa quarta semana, compare sinais simples. Quantos pedidos chegaram sem prazo justificado? Quantos foram resolvidos fora da jornada? O retrabalho ou o tempo de resposta ao cliente mudou? Use registros do fluxo em nível de equipe e converse sobre o que os números deixam de fora. Com apoio de Saúde e Segurança do Trabalho, trate dados de saúde pelos canais apropriados e preserve a confidencialidade das pessoas.',
      },
      {
        title: 'Quando organizar a fila já não basta',
        text: 'Se a equipe continuar recebendo mais trabalho do que consegue entregar, uma fila melhor só deixará a diferença mais visível. Esse é um resultado útil para o RH. Dá à liderança uma base para discutir dimensionamento, revisão de metas, cobertura em horários de pico e qualidade das informações que chegam de outras áreas. Talvez duas aprovações façam o mesmo papel. Talvez haja uma vaga aberta há meses. Cada hipótese pede uma decisão diferente.\n\nObserve também para onde o trabalho foi. Uma redução nas mensagens fora do horário no pós-venda pode coincidir com mais horas extras no comercial. A mudança precisa melhorar o fluxo entre as equipes. Os dados de um mês orientam a próxima conversa, especialmente quando o volume de vendas, a escala ou a composição da equipe variam.',
      },
      {
        title: 'A pergunta para a próxima reunião',
        text: 'Antes de pedir que a equipe faça mais um esforço, escolha uma demanda que chegou fora do combinado e pergunte “Se ela entrar hoje, o que vamos adiar e quem vai avisar?”. Faça a escolha na reunião, com quem conhece o trabalho. Esse é um jeito concreto de dividir com a equipe a responsabilidade pela próxima quinta-feira.',
      },
    ],
  },
]
