# Painel pessoal · Felipe

Tarefas, corridas Garmin, evolução mensal e Last.fm com identidade Tweed.

## Rodar localmente

Requer Node.js 24 e Python 3.12+.

```powershell
npm install
python -m pip install --target .local/python -r requirements.txt
python scripts/sync_data.py
npm run dev
```

Abra http://127.0.0.1:8793. O modo local persiste em `.local/data`, nunca no diretório publicado.

## Dados e sincronização

`scripts/sync_data.py` lê `H:\Garmin\dados_locais\raw` e o formato anterior em `H:\Garmin\raw\activities`, unifica IDs e extrai GPS dos FIT/JSON. Exclui esteira, atividades virtuais e outras modalidades. Somente campos usados pelo painel são exportados. Não modifica os coletores nem acessa as APIs Garmin/Strava.

Last.fm é agregado dos CSVs anuais em `H:\Lastfm`, usando janelas móveis de 7 e 30 dias em relação à exportação. Scrobbles duplicados são eliminados por timestamp. Nenhuma chave Last.fm é enviada à Vercel.

```powershell
python scripts/sync_data.py --upload
```

O envio usa a configuração **local e ignorada pelo Git** em `.local/sync.json`: campos `url` e `secret`. O destino é fixado em `https://painel-pessoal-felipe.vercel.app`. A exportação inicial importa `../tweedtraining/todos.json` somente se ainda não houver tarefas online; sincronizações posteriores nunca substituem tarefas editadas no painel.

**Cobertura:** cada mês informa se o intervalo inteiro foi coletado. Meses sem coleta ficam como lacunas. Corridas individuais do formato antigo não provam que um mês está completo. Pace mensal é ponderado pela distância; FC mensal é ponderada pela duração dos treinos com FC. A média de distância usa o número de corridas válidas. O pace usa a velocidade média informada pelo Garmin, com duração/distância como fallback, em segundos/km.

## Persistência online

Código no GitHub público; dados em Vercel Blob **privado**, na região São Paulo. API Node serve o conteúdo ao painel. Por escolha expressa do usuário, consulta e edição são públicas e não exigem login. O armazenamento privado impede exposição dos arquivos no repositório e por URLs Blob diretas; **não torna privados os dados que o painel público exibe**.

Tarefas usam gravação condicional por ETag e até cinco tentativas em caso de edição concorrente. Cada criação tem ID idempotente e conclusão define um estado explícito. O painel consulta as tarefas a cada 30 segundos e ao retornar à aba. Exclusões são definitivas; o armazenamento não é um backup versionado de tarefas.

Variáveis Vercel:

- `BLOB_STORE_ID`: ID do armazenamento privado vinculado ao projeto; autenticação por Vercel OIDC.
- `PANEL_SYNC_SECRET`: segredo exclusivo de ingestão; nunca exposto ao navegador.
- `GOOGLE_MAPS_API_KEY`: chave de navegador fornecida pelo usuário; somente este valor é disponibilizado pela rota de configuração. Maps JavaScript API, faturamento e autorização do domínio precisam estar ativos no Google Cloud. Restringir HTTP referrers ao domínio do painel e localhost quando necessário.

## Publicação

Repositório: https://github.com/agenciatweed/painel-pessoal-felipe

Projeto Vercel: `painel-pessoal-felipe`; produção em https://painel-pessoal-felipe.vercel.app. A versão foi publicada a partir da branch `main` pelo conector Vercel. O vínculo permanente GitHub → Vercel ainda não foi configurado: a revisão automática bloqueou dispensar o convite de 2FA durante a conexão pelo navegador. Até concluir essa conexão na conta, novos pushes precisam de uma publicação explícita pelo conector. Isso não afeta a sincronização dos dados.

Não publicar a pasta antiga `tweedtraining`: ela contém credenciais legadas. `.gitignore` exclui `.local`, `.env`, dados, dependências e capturas. Commits de código não são necessários para atualizar dados.

## Verificação

```powershell
npm test
python -m unittest discover -s tests -p test_export.py -v
npm run build
```

Testes sintéticos cobrem arredondamento de pace, ciclo de tarefas, repetição de requisições, conflito entre dispositivos, exclusão de esteira e janelas musicais.

## Design e Impeccable

`PRODUCT.md` registra as decisões confirmadas pelo usuário; `DESIGN.md` e `.impeccable/design.json` documentam a interface construída. `.impeccable/config.json` guarda a escolha por desenvolvimento direto em código. A direção e o contrato registrados pelo Impeccable estão em `.impeccable/surfaces/public-index-html.md`.

O Overdrive segue a direção **Cockpit Tweed** escolhida pelo usuário: quatro áreas com rolagem própria no desktop, atalhos no celular, gráficos com interpolação de geometria e expansão dos detalhes via View Transitions. Redução de movimento e navegadores sem suporte preservam a abertura estática do diálogo. As transições de interface usam APIs nativas do navegador.

O fundo usa a cena Unicorn Studio fornecida pelo usuário (`p7Ff6pfTrb5Gs59C7nLC`), com o SDK v1.4.29 carregado uma única vez do CDN indicado. `atmosphere.css` aplica uma tonalização SVG entre azul-escuro e teal e agrupa as áreas em três blocos translúcidos com 22px de espaço. A largura não tem limite máximo. O efeito fica atrás de toda a página, não captura cliques, usa 24fps e não carrega WebGL quando há preferência por redução de movimento. Se o CDN ou a cena estiverem indisponíveis, o painel continua funcional sobre fundo estático. Data e relógio usam America/Sao_Paulo; o relógio atualiza a cada segundo.

Sincronização automática criada no Codex: **Sincronizar painel pessoal**, a cada 30 minutos. Requer o Codex aberto neste computador e acesso às pastas locais. Executa somente `python scripts/sync_data.py --upload`; não modifica os coletores nem publica código. Notificações somente em falhas.

O fundo tem uma camada de azul Tweed a 38% para reduzir sua luminosidade. O acompanhamento nativo do mouse está habilitado; os movimentos são recebidos pelo SDK na janela, mantendo `pointer-events: none` no fundo para preservar os cliques nos controles.

Assets oficiais fixados no commit `45ae3fdb063a1a0a6d63d7f367d51add32a87039` das [brand guidelines Tweed](https://github.com/agenciatweed/brand-guidelines-tweed). Origens em `public/assets/ORIGINS.json`.
