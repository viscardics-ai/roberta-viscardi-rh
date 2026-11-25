# Roberta Viscardi | RH & Pessoas

Portal de conhecimento e tendências em pessoas, gestão e mercado imobiliário. Informação que se transforma em visão estratégica.

O portal reúne notícia via RSS, análises de referência com fontes, biblioteca, agenda e um briefing para Business Partners. O espaço **Ponto de Vista** recebe exclusivamente versões explicitamente aprovadas na área editorial.

## Execução local

Use Node.js 22 ou superior e npm. O repositório oficial é [viscardics-ai/roberta-viscardi-rh](https://github.com/viscardics-ai/roberta-viscardi-rh).

```sh
npm ci
npm run dev
```

Abra o endereço fornecido pelo Vite. A prévia estática mostra as leituras de referência, a navegação, a pesquisa, os favoritos e o histórico. Favoritos e histórico são persistidos no mesmo navegador com armazenamento local. A busca combina termos sem diferença de acentuação. Em produção, ela usa a janela atual do acervo público.

Para executar também as Pages Functions e o D1 local:

```sh
npm run build
npx wrangler d1 migrations apply DB --local
npm run dev:cloudflare
```

Abra o endereço do Wrangler. Em **Notícias** ou no fim da página inicial, clique em **Atualizar portal**. É necessário acesso de saída aos feeds. Para depurar sem registrar credenciais, use os logs do Wrangler. O banco local fica em `.wrangler/state`.

## Fontes e fluxo editorial

O arquivo [src/catalog.ts](src/catalog.ts) contém as fontes sugeridas no briefing. Os canais RSS confirmados nesta implementação são Agência Brasil (Economia), TST, CBIC, Great Place to Work Brasil, InfoMoney e McKinsey. Os demais registros mantêm um link de consulta direta. O canal da McKinsey passa pela tradução antes de entrar no acervo. A área editorial permite ativar e desativar cada feed.

Para ampliar a coleta, confirme a autorização para uso do feed, o endereço HTTPS final, conteúdo e idioma. Cadastre o endereço final no código, teste o feed e publique uma nova versão. A coleta recusa redirecionamentos e se limita aos endereços constantes do catálogo. O portal guarda trechos curtos e links de origem. HTML externo é convertido em texto, e o servidor mantém ETag e Last-Modified quando fornecidos. Os países e datas da notícia seguem a informação publicada pela fonte.

A coleta classifica por termos editoriais, aplica pesos de relevância e elimina duplicidades por URL canônica e título normalizado. Há intervalo global de 15 minutos entre coletas manuais, uma única execução simultânea e até 20 novas notícias por execução. Falhas são registradas por fonte, com preservação do acervo válido. O Radar é derivado do acervo da última coleta e destaca as lacunas em sua cobertura. Os textos iniciais são curadoria de referência. Os cenários práticos são ilustrativos. Nenhum texto inicial é assinado em nome da Roberta.

O calendário de referência está em [src/content.ts](src/content.ts). Para incluir uma atividade, confira data, horário, formato, local, organização, valor e inscrição com o organizador. A agenda esconde atividades cuja data inicial passou. Para modificar uma atividade, atualize a curadoria verificada e publique a nova versão do código.

## Cloudflare D1

No painel da conta Cloudflare, selecione o plano gratuito. Crie um banco D1 chamado `robertaviscardi` e copie o identificador:

```sh
npx wrangler login
npx wrangler d1 create robertaviscardi
```

Substitua o UUID zerado em `wrangler.jsonc` e `wrangler.cron.jsonc` pelo ID do banco. Aplique o esquema antes de publicar:

```sh
npx wrangler d1 migrations apply DB --remote
```

A migração cria notícias, fontes configuradas, cache, análises, histórico de coletas, limites, artigos com cópia pública separada do rascunho e banco de ideias. As categorias e os metadados das leituras de referência e dos eventos ficam no acervo inicial versionado. O ID do banco pode ser versionado. Tokens e valores privados ficam na Cloudflare ou em variáveis locais ignoradas pelo Git.

## Publicação gratuita no Cloudflare Pages

1. No painel **Workers & Pages**, crie um projeto Pages com integração Git. Autorize o acesso ao repositório oficial.
2. Escolha `robertaviscardi` como nome do projeto, sujeito a disponibilidade. Use `main` como branch de produção.
3. Configure **Build command** como `npm run build`, **Build output directory** como `dist` e Node.js 22 ou superior. Mantenha a raiz do repositório como diretório do projeto.
4. Confirme o binding `DB` no deploy e aplique as migrações antes de testar. A pasta `functions/` da raiz é usada pelas Pages Functions. O fallback SPA padrão do Pages atende as rotas do React Router.
5. Valide o endereço fornecido pelo painel, teste uma rota direta e execute a primeira coleta pela interface.

[Integração Git no Pages](https://developers.cloudflare.com/pages/configuration/git-integration/) · [Bindings do Pages](https://developers.cloudflare.com/pages/functions/bindings/)

### Atualização às 7h (Brasília)

Com o mesmo ID D1 nos dois arquivos de configuração, publique somente o Worker agendado:

```sh
npx wrangler deploy --config wrangler.cron.jsonc
```

O Cron Trigger roda às 10h UTC para corresponder a 7h em Brasília. O Worker compartilha o bloqueio de concorrência da atualização manual e opera sem um computador local ligado. Após confirmar o agendamento e verificar a primeira execução nos logs, configure `AUTOMATIC_UPDATES=true` em Pages. Mantenha o valor falso quando o Cron estiver fora de serviço. Para testar agendamento localmente, use `wrangler dev --config wrangler.cron.jsonc --test-scheduled` e consulte `/__scheduled?cron=0+10+*+*+*` no ambiente do Wrangler.

[Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

### Workers AI

O site funciona com `ENABLE_AI=false`. Para habilitar, confirme que o modelo configurado está disponível no plano gratuito. Acrescente `"ai": { "binding": "AI" }` à configuração do Pages e do Worker. Adicione `ENABLE_AI=true` às variáveis dos dois serviços. Se desejar, defina `AI_MODEL`, cujo padrão é `@cf/meta/llama-3.1-8b-instruct-fast`.

A análise é opcional e usa título e trecho efetivamente recebidos. A resposta do provedor é validada e as hipóteses ficam identificadas no artigo. O fato de referência vem do feed. Títulos e resumos internacionais mantêm o link original. Há no máximo duas chamadas por coleta e seis por dia no mesmo banco. Análises salvas são reaproveitadas. Ao exceder a cota ou ter falha de provedor, a coleta em português continua. Monitore consumo no painel, que aplica a franquia da conta. O arquivo [server/ai.ts](server/ai.ts) é o ponto de integração com outro provedor. Mantenha o plano gratuito e preserve a configuração de IA desativada em ambientes que não a utilizam.

[Preço e franquia da IA](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Limites de Workers](https://developers.cloudflare.com/workers/platform/limits/) · [Limites do D1](https://developers.cloudflare.com/d1/platform/limits/)

### Área editorial

No domínio gratuito `pages.dev`, use o login por senha do portal. Defina dois segredos diferentes no Cloudflare Pages, **EDITOR_PASSWORD** com pelo menos 24 caracteres e **EDITOR_SESSION_KEY** com pelo menos 32. Gere valores aleatórios com um gerenciador de senhas ou com `openssl rand -base64 32`. Compartilhe apenas a senha editorial com a Roberta, por um canal privado. A sessão vence em quatro horas e há um limite de seis tentativas por cliente a cada hora. Para revogar sessões existentes, substitua a chave de sessão. Para teste local, use esses valores em `.dev.vars`, na raiz do projeto.

Se a organização preferir a política centralizada, deixe esses dois segredos vazios e use Cloudflare Access. No Cloudflare Zero Trust, crie uma aplicação Access self-hosted para o domínio de produção. Proteja **/editor** e **/api/editor** na mesma aplicação e autorize apenas o e-mail da Roberta. Use o domínio público e o ambiente que estão efetivamente associados a essa política. Configure no Pages **ACCESS_TEAM_DOMAIN**, **ACCESS_AUD** e **EDITOR_EMAIL** com os valores da aplicação. Use o domínio completo do time em HTTPS e o identificador **Application Audience (AUD)**.

Abra **Área editorial** no rodapé e autentique-se pelo método configurado. Para publicar, complete a leitura, abra a prévia, marque a aprovação explícita da versão e pressione **Publicar versão**. Alterações de rascunho em um artigo já público exigem nova aprovação para substituir a versão pública. É possível salvar referências, exportar texto para LinkedIn, registrar reflexões privadas e configurar fontes. O banco de ideias não é exposto no acervo público.

No modo Access, o backend verifica assinatura, emissor, público, validade e e-mail do JWT. Sessão e configuração de identidade são necessárias para usar a área editorial. Verifique a disponibilidade do domínio de Pages na configuração da aplicação Access e, se necessário, associe ao Pages um domínio que você já administre.

[Validação do token do Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)

### Imagem da Roberta e newsletter

A interface usa o monograma RV até que haja uma fotografia real autorizada. Coloque a imagem em `public/images/` e defina `VITE_ROBERTA_PHOTO=/images/nome-do-arquivo.webp` nas variáveis de build. Cópias vetoriais da identidade e do monograma estão em `public/identidade.svg` e `public/favicon.svg`. As imagens de capa são ilustrações geradas para o portal.

O card da newsletter informa a indisponibilidade de inscrições. Ele não coleta endereços. A conexão de um provedor de envio é uma etapa futura.

## Manutenção e testes

```sh
npm run test
npm run build
npx playwright install chromium
PORTAL_SCREENSHOTS=docs/validacao npm run test:e2e
```

A variável `PLAYWRIGHT_CHROMIUM_EXECUTABLE` permite usar o Chromium já instalado. Os testes de navegador verificam o carrossel, pesquisa, filtros, favoritos, histórico, exportação, resposta da atualização, estados indisponíveis e resoluções desktop e mobile. A suíte unitária verifica RSS/Atom, limpeza de conteúdo, cache, relevância e bloqueio de destinos que não constam no catálogo. Veja as capturas em [docs/validacao](docs/validacao).

Ao editar o acervo, confira primeiro as fontes. Para manter compatibilidade, crie uma migração nova em vez de reescrever uma já aplicada. Revise periodicamente validade de feed e eventos, acessibilidade, limites da conta e logs do Cron. A edição pública de artigos exige autorização editorial. Referências legais são informativas e devem ser verificadas com a fonte oficial e orientação profissional quando cabível.
