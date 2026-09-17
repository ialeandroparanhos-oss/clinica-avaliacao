# AGENTE 8 — RELATÓRIO E DEVOLUTIVA

> Depende do Perfil Integrado ([05-Agente6-Integracao-e-Interpretacao.md](05-Agente6-Integracao-e-Interpretacao.md)) e do Plano de Intervenção ([06-Agente7-Plano-de-Intervencao.md](06-Agente7-Plano-de-Intervencao.md)). Grava no RIP na macroseção `relatorio_e_devolutiva`. É o último agente do ciclo de avaliação — depois dele, o processo entra em execução (Etapa 10).

---

## 1. FINALIDADE

Transformar dados técnicos em uma conversa e em um documento que o paciente entenda de verdade, sem perder o rigor que o profissional precisa para continuar decidindo. É aqui que se cumpre a promessa da Seção 26 do prompt-mestre: o paciente deve sair da devolutiva pensando

> "Agora eu sei como estou. Entendi o que preciso melhorar e por quê. Sei como a clínica pode me ajudar."

— nunca por meio de medo, exagero ou pressão, e sim por meio de **dados + explicação + planejamento + acompanhamento**.

---

## 2. DOIS PÚBLICOS, UM MESMO CONTEÚDO EM DUAS CAMADAS

O Agente 8 não cria dois relatórios desconectados — cria **um único corpo de dados** (o Perfil Integrado + Plano), apresentado em duas camadas de linguagem:

| Camada | Público | Conteúdo |
|---|---|---|
| **Camada técnica** | Profissional / prontuário da clínica | Painel Integrado completo com todos os indicadores, valores brutos, referências utilizadas, alertas e seus desfechos, log de decisões relevantes |
| **Camada de devolutiva** | Paciente | Tradução da camada técnica em linguagem acessível, sem jargão, organizada pelo roteiro de conversa da Seção 4 |

A camada de devolutiva **nunca omite um achado real** — ela apenas traduz a forma de comunicá-lo. Um Risco de Nível 3 continua sendo comunicado ao paciente, só que com o cuidado de tom descrito na Seção 5.

---

## 3. ESTRUTURA DO RELATÓRIO TÉCNICO (uso interno/profissional)

```
RELATÓRIO TÉCNICO DE AVALIAÇÃO INTEGRADA
Paciente: [id] | Data: [data] | Confiança do Perfil: [alta/média/baixa]

1. Resumo da anamnese (achados relevantes por capítulo — Agente 2)
2. Sinais vitais e antropometria (Agente 3)
3. Achados posturais e de movimento (Agente 4)
4. Resultados dos testes funcionais (Agente 5), com valores brutos e referências
5. Painel Integrado de Saúde — 10 domínios classificados (Agente 6)
6. Potencialidades / Limitações / Riscos / Prioridades (Agente 6)
7. Discrepâncias identificadas, ainda não resolvidas pelo profissional (Agente 6)
8. Plano de Intervenção — 30/90/180/365 dias, com origem de cada item (Agente 7)
9. Alertas emitidos e seus desfechos registrados
10. Encaminhamentos sugeridos, se houver
```

Este documento fica no prontuário e serve de referência para o próprio profissional em atendimentos futuros e para a próxima reavaliação.

---

## 4. ROTEIRO DA DEVOLUTIVA AO PACIENTE (Seção 17 do prompt-mestre)

O Agente 8 prepara, para o profissional conduzir, um roteiro de conversa em 6 passos. Ele nunca fala diretamente com o paciente — apenas organiza o que o profissional vai dizer.

### 4.1 RECONHECER

Abrir pela(s) Potencialidade(s) identificada(s) pelo Agente 6 — nunca pelos problemas. Objetivo: o paciente sentir que foi *visto* de forma completa, não reduzido a uma lista de defeitos.

*Exemplo de estrutura sugerida ao profissional:* "Antes de falar sobre o que vamos trabalhar, quero te mostrar algo que veio muito bem na sua avaliação: [Potencialidade + dado que a sustenta]."

### 4.2 MOSTRAR

Apresentar os resultados de forma visual e concreta — o Painel Integrado (10 domínios) é o recurso central aqui, mostrando ao paciente onde ele está em cada área, sem ainda entrar em interpretação aprofundada.

### 4.3 EXPLICAR

Traduzir cada classificação (`ADEQUADO`, `ATENÇÃO`, `PRIORIDADE DE INTERVENÇÃO`, `NECESSITA INVESTIGAÇÃO ADICIONAL`) em linguagem funcional e cotidiana, conectada ao motivo da procura do paciente (capítulo 4.2 da Anamnese). Nunca usar apenas o jargão técnico do teste (ex.: em vez de apenas "TUG = 14,2s", explicar "isso está relacionado à sua agilidade para se levantar e se mover rapidamente no dia a dia").

### 4.4 PRIORIZAR

Apresentar as Prioridades do Perfil Integrado, explicando o critério (Seção 4 do Agente 6) de forma simples: por que aquilo foi escolhido para vir primeiro, especialmente quando um Risco precisa ter precedência sobre o objetivo que o paciente havia priorizado mentalmente (Seção 9, regra 4, do Agente 7) — isso deve ser conversado com transparência, não imposto.

### 4.5 PROJETAR

Mostrar o que pode ser melhorado e em que prazo aproximado, com base nos horizontes do Plano de Intervenção — sem prometer resultado como garantia (Seção 9, regra 3, do Agente 7).

### 4.6 PLANEJAR

Apresentar os próximos passos concretos: o que começa em 30 dias, quais indicadores serão reacompanhados, e quando ocorrerá a próxima reavaliação formal.

---

## 5. REGRAS DE LINGUAGEM NA DEVOLUTIVA

1. **Nunca linguagem alarmista.** Substituir "você está em risco de..." por "este é um ponto que merece atenção prioritária porque...".
2. **Nunca usar achado para pressionar venda.** O plano é apresentado como consequência lógica da avaliação, não como "urgência comercial". Se o paciente decidir não seguir o plano, isso não deve ser usado para gerar culpa ou medo.
3. **Nunca simplificar a ponto de distorcer.** Traduzir para linguagem acessível não significa omitir nuance clinicamente relevante — significa trocar jargão por clareza, mantendo a precisão do achado.
4. **Achados de saúde mental (capítulo do Agente 2) e Riscos de segurança são comunicados com o mesmo cuidado de tom, mas nunca omitidos** — a transparência é parte do valor prometido ao paciente (Seção 26 do prompt-mestre).
5. **Encaminhamentos são apresentados como cuidado, não como “empurrar para outro lugar”** — explicar o motivo e a expectativa de retorno à clínica quando aplicável.

---

## 6. ELEMENTOS VISUAIS SUGERIDOS

- **Painel Integrado** em formato visual (ex.: 10 domínios com código de classificação), preferencialmente com um símbolo/cor consistente para `ADEQUADO`, `ATENÇÃO`, `PRIORIDADE DE INTERVENÇÃO`, `NECESSITA INVESTIGAÇÃO ADICIONAL` — a paleta e o formato exato ficam a critério da identidade visual da clínica, mas a lógica de 4 categorias deve ser preservada para não recriar classificações paralelas.
- **Linha do tempo dos 4 horizontes** (30/90/180/365 dias), com os itens de maior prioridade destacados.
- Em reavaliações futuras: **gráfico ANTES → ATUAL → META** por indicador (Seção 8 do Agente 7), que é o recurso mais poderoso para o paciente perceber evolução concreta.

---

## 7. SINAIS DE ALERTA NA DEVOLUTIVA

Quando houver Risco de Nível 3/4 ainda sem desfecho no momento da devolutiva, o roteiro de conversa não segue direto para "Planejar" — o profissional deve, antes de tudo, garantir que o encaminhamento necessário seja comunicado com clareza e que o paciente compreenda a importância de buscá-lo, sem que isso pareça uma ameaça. O Agente 8 sinaliza esse desvio de roteiro automaticamente sempre que detectar um alerta sem desfecho no Perfil Integrado.

---

## 8. LIMITAÇÕES

- A qualidade da devolutiva depende da habilidade de comunicação do profissional — o roteiro organiza o conteúdo, mas não substitui a escuta e a sensibilidade humana no momento da conversa.
- Traduzir achados técnicos para linguagem simples sempre envolve alguma perda de nuance — o relatório técnico completo (Seção 3) permanece disponível para consulta quando uma decisão futura exigir o detalhe original.
- Elementos visuais (gráficos de evolução) só ganham força a partir da segunda avaliação (reavaliação) — na primeira devolutiva, o valor está mais na clareza do diagnóstico funcional atual do que na comparação temporal.

---

## 9. CONEXÃO COM AS DEMAIS ETAPAS

- **Agente 6 (Integração) → esta etapa:** fonte de todo o conteúdo de "Reconhecer, Mostrar, Explicar, Priorizar".
- **Agente 7 (Plano) → esta etapa:** fonte do conteúdo de "Projetar, Planejar".
- **Esta etapa → Etapa 10 (Execução):** a devolutiva é o momento em que o paciente formalmente entende e aceita o plano — a partir daqui, o ciclo de acompanhamento começa.
- **Esta etapa → Etapa 11 (Reavaliação):** o mesmo roteiro de 6 passos se repete a cada reavaliação, agora enriquecido com a comparação `ANTES → ATUAL → META`, fechando visivelmente o ciclo do projeto (Seção 1 do prompt-mestre): `AVALIAR → MEDIR → INTERPRETAR → PRIORIZAR → INTERVIR → REAVALIAR → EVOLUIR`.

---

## FECHAMENTO DESTA RODADA

Com este documento, os oito agentes da arquitetura (Seção 21 do prompt-mestre) estão especificados em um primeiro nível de profundidade — da Coordenação (00) até o Relatório e Devolutiva (07), cobrindo o ciclo completo de uma avaliação, do primeiro contato até a entrega dos resultados ao paciente:

| Documento | Agente/Etapa |
|---|---|
| [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md) | Arquitetura + Agente 1 (Coordenador) |
| [01-Agente2-Anamnese-e-Questionarios.md](01-Agente2-Anamnese-e-Questionarios.md) | Agente 2 |
| [02-Agente3-Fisica-e-Antropometrica.md](02-Agente3-Fisica-e-Antropometrica.md) | Agente 3 |
| [03-Agente4-Postural-e-Biomecanica.md](03-Agente4-Postural-e-Biomecanica.md) | Agente 4 |
| [04-Agente5-Avaliacao-Funcional.md](04-Agente5-Avaliacao-Funcional.md) | Agente 5 |
| [05-Agente6-Integracao-e-Interpretacao.md](05-Agente6-Integracao-e-Interpretacao.md) | Agente 6 |
| [06-Agente7-Plano-de-Intervencao.md](06-Agente7-Plano-de-Intervencao.md) | Agente 7 |
| [07-Agente8-Relatorio-e-Devolutiva.md](07-Agente8-Relatorio-e-Devolutiva.md) | Agente 8 |

## PRÓXIMOS PASSOS POSSÍVEIS (a seguir, sem necessidade de nova confirmação)

1. **Lista mestre de instrumentos/equipamentos** (Seção 23 do prompt-mestre), consolidando tudo que já apareceu disperso nos documentos 02, 03 e 04 em essencial/recomendado/opcional único.
2. **Etapas 1 e 2** (Pré-atendimento/Agendamento e Recepção/Acolhimento) — as etapas mais simples, que ainda não foram detalhadas.
3. **Templates concretos** de formulário/ficha para cada capítulo da anamnese (Agente 2), prontos para uso em papel ou tela.
4. Revisão cruzada de todos os documentos para checar consistência de nomenclatura de campos do RIP entre os sete documentos já escritos.

Seguirei para o item que fizer mais sentido como próximo passo, a menos que você prefira redirecionar.
