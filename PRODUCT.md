# Painel pessoal · Felipe

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegado pelo usuário. HTML, CSS e JavaScript modular; funções Node.js na Vercel e exportador Python no computador. Interface pequena sem necessidade de framework. Persistência em Vercel Blob privado.

## Users
Felipe Rijo consulta sua rotina e mantém tarefas em computadores e celulares, de qualquer lugar, sem login.

## Product Purpose
Reunir tarefas, corridas ao ar livre, evolução mensal e músicas mais ouvidas em um painel de consulta frequente.

## Operating Context
Substitui o painel Flask em agenciatweed.com.br/tweedtraining. Código em agenciatweed/painel-pessoal-felipe e projeto Vercel de mesmo nome. Garmin e Last.fm são coletados por processos já existentes em H:\Garmin e H:\Lastfm. O novo exportador lê arquivos locais; não altera nem executa esses coletores.

## Capabilities and Constraints
- Criar, concluir, reabrir e excluir tarefas online com persistência entre dispositivos.
- Corridas Garmin, sem esteira ou atividades virtuais; detalhes e trajeto real sobre Google Maps.
- Evolução mensal: distância total, média de distância por treino, pace em min:seg/km e FC média em bpm.
- Músicas mais ouvidas em janelas móveis de 7 e 30 dias, lado a lado dentro da seção musical.
- Quatro áreas principais no desktop, agrupadas em três blocos (Tarefas, Corridas + Evolução e Em rotação), largura fluida para ultrawide e leitura responsiva no celular.
- Fundo Unicorn Studio fornecido pelo usuário, com tonalização Tweed, blocos levemente transparentes e relógio atual em São Paulo.
- Usuário confirmou consulta e edição públicas, sem login. O armazenamento privado evita arquivos pessoais no repositório público; os dados exibidos continuam acessíveis pelo painel público.
- Usuário escolheu código público e dados em armazenamento privado. Tarefas não serão commitadas no Git público.
- O computador precisa executar a sincronização para atualizar arquivos coletados. A interface informa atualização e cobertura; falta de coleta não equivale a zero.
- Chaves e tokens de coleta nunca são publicados. Chave Maps de navegador configurada por variável de ambiente.

## Brand Commitments
Identidade oficial Agência Tweed: https://github.com/agenciatweed/brand-guidelines-tweed. Preservar logo, Inter e cores oficiais.

## Evidence on Hand
Painel e tarefas existentes em ../tweedtraining. JSON Garmin e arquivos FIT em H:\Garmin\dados_locais\raw; histórico adicional em H:\Garmin\raw. CSVs anuais Last.fm em H:\Lastfm. Dados reais; não inventar cobertura, rotas ou resultados.

## Product Principles
1. Acesso imediato e operações simples.
2. Origem, atualização e lacunas dos dados ficam visíveis.
3. Preservar tarefas e dados locais existentes.
4. Código público não contém arquivos pessoais nem credenciais.
