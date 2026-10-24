---
name: Cockpit Tweed · Felipe
description: Trabalho, movimento e música em um painel pessoal.
colors:
  primary: "#08ffb1"
  neutral-bg: "#0b0c13"
  surface: "#12141e"
  raised: "#1b1e2b"
  line: "#2c3040"
  ink: "#f6f7fa"
  muted: "#a6adbd"
  danger: "#ffb1b1"
  atmosphere-dark: "#151a29"
  panel-fill: "rgb(18 20 30 / 84%)"
typography:
  headline:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  measure:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.035em"
rounded:
  control: "8px"
  panel: "12px"
  dialog: "12px"
spacing:
  compact: "8px"
  related: "12px"
  group: "20px"
  section: "24px"
  page: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  panel:
    backgroundColor: "{colors.panel-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
---

# Design System: Cockpit Tweed · Felipe

## Overview

**Creative North Star: "Cockpit Tweed"**

Direção escolhida pelo usuário no Impeccable Overdrive. Uma superfície de operação diária com quatro áreas simultâneas no desktop, listas compactas e tipografia hierárquica. O ritmo vem do conteúdo real: tarefas, medidas de corrida, gráficos mensais e rankings musicais.

O teal oficial indica ação e destaque. Por solicitação do usuário, uma cena Unicorn Studio cobre o viewport e aparece através de três blocos translúcidos: Tarefas, Corridas + Evolução e Em rotação. As superfícies mantêm o texto integralmente opaco. Inter oficial é hospedada no projeto; a expansão da corrida conecta a ação aos detalhes.

**Key Characteristics:**
- Quatro áreas no desktop, leitura vertical e atalhos no celular.
- Números tabulares, medidas com unidade e dados parciais identificados.
- Movimento ligado à ação, com fallback estático e respeito à redução de movimento.

## Colors

### Primary
- **Teal Tweed** (`primary`): adicionar tarefa, destaque da primeira área e faixa principal dos rankings, pontos e barras dos gráficos. É a cor oficial `#08ffb1`.

### Neutral
- **Azul-escuro Tweed** (`neutral-bg`): fundo e interiores dos campos.
- **Superfície** (`surface`): painel principal e diálogo.
- **Superfície elevada** (`raised`): contadores e hover de controles.
- **Divisória** (`line`): limites das áreas, linhas e grades dos gráficos.
- **Texto principal** (`ink`): títulos, nomes e medidas.
- **Texto secundário** (`muted`): artistas, datas, unidades e contexto.
- **Erro** (`danger`): falhas e hover de exclusão.

**The Action Color Rule.** Teal destaca ações e dados importantes; o contexto permanece em texto secundário.

## Typography

Inter Regular, Medium e Bold são assets oficiais locais; não depender de carregamento de fontes externo. O título principal usa 32px e cai para 29px no celular. Títulos de área usam 21px, com 22px no celular. Nomes de tarefas e músicas usam 13px no desktop; tarefas sobem para 14px no celular. Nomes de corridas usam 14px e 15px, respectivamente.

Medidas de corrida usam 20px no desktop e 22px no celular; detalhes usam 24px e 23px. Metadados usam 11px; contexto no celular usa 12px. Valores numéricos têm `font-variant-numeric: tabular-nums`.

**The Unit Rule.** Pace sempre aparece como minutos:segundos por quilômetro; FC usa bpm, distância usa km. Não substituir tempo por decimais.

## Layout

Acima de 1279px, quatro áreas se agrupam em três blocos com gap de 22px e proporções `.86 / 2.3 / 1.65`. O bloco central contém Corridas e Evolução, com proporções internas `1.05 / 1.25` e uma divisória. A música contém duas listas de igual largura. A grade ocupa `calc(100dvh - 252px)`, com mínimo de 480px; cada área tem rolagem própria e título sticky com fundo a 93% para manter a legibilidade.

Entre 1051 e 1279px, Tarefas e o bloco de treinos ficam lado a lado; música ocupa a linha seguinte. Até 1050px, os três blocos se empilham. Até 650px, Corridas e Evolução também se empilham dentro do bloco central. Um menu sticky leva aos títulos no celular. O par de listas musicais permanece lado a lado.

Sem largura máxima: a página ocupa a largura disponível, inclusive em ultrawide. Padding lateral `clamp(20px, 1.7vw, 64px)` no desktop e 14px no celular. Padding das áreas de 20–24px; acima de 1800px, 28px. A data e o mês usam inicial maiúscula; o relógio em teal atualiza a cada segundo no fuso America/Sao_Paulo e continua visível no celular.

**The Coverage Rule.** Lacunas de coleta ficam sem linhas ou barras; meses incompletos usam opacidade reduzida e texto explícito. Não interpretar falta de coleta como zero.

## Elevation & Depth

Os três blocos usam `rgb(18 20 30 / 84%)`, bordas de 1px e blur de 6px quando suportado. A transparência está no preenchimento, nunca no texto. O diálogo mantém fundo sólido e sombra `0 18px 40px #0006` para preservar a leitura do mapa e das medidas.

A cena `p7Ff6pfTrb5Gs59C7nLC` usa SDK Unicorn Studio fixado em v1.4.29, resolução limitada e 24fps. Um filtro SVG de luminância mapeia sombras para `#151a29` e luzes para `#08ffb1`, sem alterar o projeto remoto. O fundo é fixed e não captura cliques. Com redução de movimento ou falha de carregamento, permanece um fundo estático na paleta.

## Shapes

Controles com cantos moderados; os três blocos e o diálogo usam 12px. Listas usam divisórias horizontais. Checkboxes quadrados de 17px com cantos de 4px. Ícones são SVG inline com traço de 1.8px; checkmark é desenhado por bordas CSS.

## Components

### Buttons

Adicionar é um botão teal de 34px dentro do campo; hover clareia e active reduz brevemente a escala. Atualizar e Ver mais usam contorno e fundo transparente. Controles desabilitados reduzem opacidade e bloqueiam ações. Foco tem contorno teal de 2px e afastamento de 4px.

### Tasks

Linhas com checkbox, nome e botão de excluir. Texto quebra naturalmente; exclusão nunca ocupa o espaço do nome. A edição tem estado otimista e mensagem de persistência; falha restaura a lista anterior. Concluídas ficam em `details` e podem ser reabertas.

### Runs and Details

A linha inteira é um botão. Data e hora precedem nome, distância, pace e FC. A View Transitions API conecta a linha ao diálogo com duração de 420ms e `cubic-bezier(.16,1,.3,1)`. Sem suporte ou com redução de movimento, o diálogo abre imediatamente. O diálogo usa foco nativo, fechamento por botão e Escape, medidas em grade e Google Maps carregado sob demanda.

### Charts

SVG leve com grades horizontais. Barras teal para distância total; linha clara para média por treino na mesma unidade. Pace e FC usam linhas e pontos teal. Áreas transparentes ampliam os alvos de foco, toque e mouse; o valor selecionado é anunciado por região de status. Valores também estão em tabelas expansíveis. A troca de período interpola geometria por 360ms, sem movimento quando a preferência do sistema pede redução.

### Music

Rankings de 7 e 30 dias, com ordinal, faixa, artista e reproduções. As faixas são links Last.fm; nomes longos quebram sem truncar. Teal destaca a primeira faixa e as contagens. As listas têm atualização e fim das janelas explícitos.

## Do's and Don'ts

### Do:
- **Do** usar os assets oficiais Tweed e as fontes locais.
- **Do** manter unidades, cobertura e estados de persistência visíveis.
- **Do** preservar foco, teclado e redução de movimento.
- **Do** usar movimento para conectar ações e resultados.

### Don't:
- **Don't** representar meses sem coleta como zero ou inventar trajetos.
- **Don't** adicionar áudio ou efeitos que disputem a leitura; a cena de fundo é a animação ambiente explicitamente solicitada.
- **Don't** expor credenciais ou arquivos pessoais no diretório público.
