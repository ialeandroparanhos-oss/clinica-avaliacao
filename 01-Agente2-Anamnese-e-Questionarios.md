# AGENTE 2 — ANAMNESE E QUESTIONÁRIOS

> Depende de [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md). Todos os campos citados aqui são gravados no RIP (Registro Integrado do Paciente) nas macroseções `identificacao_e_contexto`, `motivo_da_procura_e_objetivos`, `historico_de_saude`, `medicamentos`, `historico_familiar`, `atividade_fisica_e_sedentarismo`, `sono`, `estilo_de_vida`, `dor`, `saude_mental_e_bem_estar` e `prontidao_e_seguranca_para_exercicio`.

---

## 1. FINALIDADE

O Agente 2 conduz a etapa mais extensa da avaliação — e a que mais alimenta as demais. Sua função é ajudar o profissional a fazer uma anamnese **completa sem ser burocrática**, garantindo que nenhuma informação crítica para a segurança (Seção 10 do prompt-mestre) ou para a personalização (tags de perfil, Seção 6 da Etapa 0) fique de fora.

O Agente 2 nunca fala com o paciente. Ele:

- sugere ao profissional quais perguntas fazer e em que ordem;
- sugere qual questionário validado aplicar, e só quando ele agrega valor real (nunca por padrão);
- explica ao profissional como aplicar e pontuar cada instrumento;
- ajuda a registrar as respostas no formato do RIP;
- sinaliza ao Agente 1 quando encontra um dado que configura alerta (Seção 7 da Etapa 0).

---

## 2. PROTOCOLO GERAL DE CONDUÇÃO

1. O profissional conduz a conversa naturalmente — a anamnese **não deve parecer um formulário lido em voz alta**.
2. O Agente 2 acompanha em paralelo, indicando ao profissional, capítulo a capítulo, o que ainda falta cobrir.
3. Questionários validados são aplicados **como instrumentos formais dentro da conversa**, não substituem a entrevista clínica.
4. Cada capítulo (7.1 a 7.8, mais dor, saúde mental e prontidão) gera um bloco de dados atômicos no RIP, seguindo o contrato de saída da Seção 5 da Etapa 0 (`dados_coletados`, `campos_pendentes`, `alertas`, `observacoes_para_integracao`, `confianca_geral_da_etapa`).
5. Ao final da anamnese, o Agente 2 devolve ao Agente 1 uma primeira sugestão de **tags de perfil** (ex.: `idoso`, `sedentario`, `dor_persistente`, `condicao_cronica`) para orientar as etapas seguintes — sujeitas a confirmação do profissional.

---

## 3. INSTRUMENTOS/MATERIAIS NECESSÁRIOS

| Categoria | Item |
|---|---|
| Essencial | computador/tablet para registro; ambiente reservado e silencioso; questionários validados (impressos ou digitais) |
| Essencial | termo de consentimento, quando a clínica exigir |
| Recomendado | mapa corporal impresso para localização de dor |
| Recomendado | acesso a versões validadas em português dos instrumentos citados abaixo |
| Opcional | gravação de áudio da anamnese (mediante consentimento), para o profissional revisar depois |

---

## 4. CAPÍTULOS DA ANAMNESE

### 4.1 Identificação e contexto (RIP: `identificacao_e_contexto`)

**Objetivo:** situar o paciente social e ocupacionalmente — muitas demandas físicas nascem da rotina, não da patologia.

**Investigar:** idade, sexo, profissão, rotina diária, jornada de trabalho, demandas físicas do trabalho, tempo sentado por dia, atividades diárias típicas.

**Por que importa:** tempo sentado e demandas ocupacionais alimentam diretamente a tag `sedentario` ou `demanda_ocupacional_fisica`, que vai orientar quais testes funcionais fazem sentido no Agente 5.

**Sinal de alerta:** nenhum específico deste capítulo — é contextual.

---

### 4.2 Motivo da procura (RIP: `motivo_da_procura_e_objetivos`)

**Objetivo:** entender a demanda real do paciente, não presumida pelo profissional.

**Investigar:** motivo da procura, queixa principal, o que deseja melhorar, atividades que deixou de realizar por causa de alguma limitação, objetivos, expectativas em relação à clínica e ao processo.

**Por que importa:** este capítulo ancora a etapa de Devolutiva (Etapa 8) e o Plano (Etapa 9) — o plano deve responder ao que o paciente veio buscar, não apenas ao que foi "achado" na avaliação.

**Cuidado:** distinguir objetivo declarado (o que o paciente diz) de objetivo funcional subjacente (ex.: paciente diz "quero mais força", mas a queixa real é não conseguir carregar os netos no colo). O profissional deve registrar os dois.

---

### 4.3 Histórico de saúde (RIP: `historico_de_saude`)

**Objetivo:** mapear histórico clínico relevante para segurança e para interpretação dos achados.

**Investigar:** doenças, cirurgias, hospitalizações, lesões, fraturas, quedas, tratamentos anteriores, acompanhamento médico atual, fisioterapia prévia, outras condições relevantes.

**Sinal de alerta (Nível 2):** histórico de quedas nos últimos 12 meses → deve ser cruzado obrigatoriamente com a etapa de equilíbrio no Agente 5 (bloqueio leve: exige adaptação do protocolo, não impede a etapa).

**Sinal de alerta (Nível 3):** cirurgia ou lesão recente (ex.: últimos 3 meses) na região que seria avaliada funcionalmente → precaução ativa, testes daquela região precisam de liberação/adaptação explícita do profissional.

---

### 4.4 Medicamentos (RIP: `medicamentos`)

**Objetivo:** registrar, nunca opinar.

**Investigar:** nome do medicamento, dose (quando informada), frequência, motivo do uso, tempo de utilização.

**Regra fixa:** o Agente 2 nunca recomenda suspensão, ajuste ou substituição de medicamento. Serve apenas para: (a) registro; (b) apoiar o profissional a notar medicamentos que podem interferir em sinais vitais, equilíbrio ou desempenho físico (ex.: anti-hipertensivos e resposta de frequência cardíaca ao esforço; benzodiazepínicos e risco de queda) — sempre como **observação a ser confirmada pelo profissional ou pelo médico assistente**, nunca como afirmação clínica fechada.

---

### 4.5 Histórico familiar (RIP: `historico_familiar`)

**Objetivo:** levantar fatores de risco hereditários relevantes para orientar prevenção — não para estimar risco individual com precisão clínica (isso exigiria calculadoras de risco validadas, fora do escopo deste agente).

**Investigar, quando pertinente:** hipertensão, diabetes, doenças cardiovasculares, AVC, morte cardiovascular precoce em familiares de primeiro grau, obesidade, doenças metabólicas, outras condições relevantes.

**Cuidado:** tratar como fator contextual de prevenção/educação em saúde, nunca como base para "diagnóstico de risco" — isso seria atribuição médica.

---

### 4.6 Atividade física e comportamento sedentário (RIP: `atividade_fisica_e_sedentarismo`)

**Objetivo:** caracterizar o nível atual de atividade física — e diferenciá-lo do comportamento sedentário, que são construtos distintos (uma pessoa pode cumprir a recomendação semanal de exercício e ainda assim passar 10h/dia sentada).

**Investigar:** prática atual, frequência, duração, intensidade, modalidades (musculação, aeróbico, esportes), histórico de treinamento, interrupções e motivos.

**Instrumento sugerido — IPAQ (International Physical Activity Questionnaire):**

| Aspecto | Descrição |
|---|---|
| Objetivo | estimar o nível de atividade física habitual (caminhada, esforço moderado, esforço vigoroso, tempo sentado) |
| População | adultos de 15 a 69 anos, uso internacional |
| Formato | versão curta (4 perguntas) ou longa (mais detalhada por domínio: trabalho, transporte, doméstico, lazer) |
| Aplicação | referente aos últimos 7 dias |
| Pontuação | classifica o nível de atividade em categorias gerais (ex.: insuficientemente ativo, ativo, muito ativo); consultar o manual oficial e a versão validada em português para os critérios exatos de categorização |
| Cuidado | é autorreferido — sujeito a viés de memória e de desejabilidade social |
| Referência original | Craig CL et al., *International Physical Activity Questionnaire: 12-country reliability and validity*, Med Sci Sports Exerc, 2003 |

**Sinal de alerta:** nenhum de segurança direto — mas nível muito baixo de atividade prévia é insumo importante para o Agente 1 atribuir a tag `sedentario`, que por sua vez modera a intensidade dos testes funcionais sugeridos pelo Agente 5 (princípio de progressão segura).

---

### 4.7 Sono (RIP: `sono`)

**Objetivo:** o sono afeta recuperação, dor, desempenho e adesão ao treinamento — negligenciá-lo é comum e problemático.

**Investigar:** duração, qualidade, horário, despertares noturnos, dificuldade para iniciar o sono, sonolência diurna, sensação de recuperação ao acordar.

**Instrumento sugerido — PSQI (Pittsburgh Sleep Quality Index):**

| Aspecto | Descrição |
|---|---|
| Objetivo | avaliar qualidade e padrão do sono no último mês |
| População | adultos em geral |
| Formato | 19 itens autoaplicados, agrupados em 7 componentes (qualidade subjetiva, latência, duração, eficiência habitual, distúrbios, uso de medicação para dormir, disfunção diurna) |
| Pontuação | escore global de 0 a 21; valores mais altos indicam pior qualidade do sono. Confirmar o ponto de corte na versão validada/manual oficial em português antes de usá-lo clinicamente — não assumir o número de cor |
| Cuidado | é retrospectivo (últimas 4 semanas) e autorreferido |
| Referência original | Buysse DJ et al., *The Pittsburgh Sleep Quality Index*, Psychiatry Research, 1989 |

**Sinal de alerta (Nível 1–2):** privação de sono relevante ou queixa de insônia persistente → registrar como fator que pode confundir testes de desempenho físico no dia da avaliação (o profissional deve considerar isso ao interpretar resultados abaixo do esperado).

---

### 4.8 Estilo de vida (RIP: `estilo_de_vida`)

**Objetivo:** captar hábitos gerais que influenciam saúde e capacidade física, sem transformar a anamnese em consulta nutricional ou médica.

**Investigar:** alimentação de forma geral (não prescritiva), hidratação, consumo de álcool, tabagismo, rotina profissional, lazer, percepção de estresse, barreiras à prática de exercícios, disponibilidade de tempo, rede de apoio social.

**Cuidado:** o Agente 2 não deve gerar orientação nutricional nem quantificar ingestão calórica — apenas registrar o relato do paciente como contexto.

---

## 5. CAPÍTULO — DOR (RIP: `dor`)

Capítulo da anamnese, não um agente independente (conforme Seção 8 do prompt-mestre).

**Objetivo:** caracterizar a dor de forma estruturada o suficiente para orientar decisões de segurança e priorização, sem estabelecer diagnóstico de causa.

**Investigar:** localização, intensidade, duração, frequência, características (queimação, pontada, peso, formigamento etc.), início, fatores agravantes, fatores de melhora, dor em repouso, dor durante movimento, dor noturna, impacto no sono/trabalho/treinamento/atividades diárias, tratamentos anteriores.

### Instrumentos

| Instrumento | Objetivo | Formato |
|---|---|---|
| **EVA (Escala Visual Analógica)** | Intensidade da dor | Linha de 10 cm, paciente marca a intensidade percebida |
| **NRS (Numeric Rating Scale)** | Intensidade da dor | Escala numérica de 0 (sem dor) a 10 (pior dor imaginável) — mais simples de aplicar verbalmente que a EVA |
| **Mapa corporal** | Localização e irradiação | Diagrama do corpo onde o paciente marca a(s) região(ões) dolorosa(s) |
| **TSK (Tampa Scale of Kinesiophobia)** | Medo do movimento relacionado à dor | Quando há suspeita de que o comportamento de evitação (não a limitação física em si) esteja limitando a função. Referência original: Kori SH, Miller RP, Todd DD, 1990 |
| **PSEQ (Pain Self-Efficacy Questionnaire)** | Confiança do paciente em realizar atividades apesar da dor | Útil em dor persistente/crônica. Referência original: Nicholas MK, 2007 |

Usar TSK e PSEQ apenas quando a dor for um componente relevante do quadro (ex.: dor persistente/crônica) — não aplicar por padrão em toda avaliação, conforme o princípio da Seção 13 do prompt-mestre ("o que este instrumento acrescentará à compreensão deste paciente?").

**Regra de interpretação (Seção 14 do prompt-mestre):** separar sempre:
- **Resultado** (ex.: "NRS = 6/10 na região lombar, presente há 3 meses");
- **Interpretação** (ex.: "dor de intensidade moderada, persistente, compatível com padrão mecânico segundo relato");
- **Hipótese/implicação** (ex.: "pode estar associada ao padrão de movimento observado na avaliação postural — merece correlação");
- nunca um **diagnóstico** (isso é atribuição médica, fora do escopo).

**Sinais de alerta relacionados à dor (Nível 3–4):** dor torácica, dor noturna que não melhora em nenhuma posição, dor associada a perda de peso inexplicada, febre, alterações neurológicas progressivas (fraqueza, alteração de sensibilidade, alteração de controle esfincteriano) → estas são **bandeiras vermelhas** e exigem encaminhamento, não avaliação funcional imediata.

---

## 6. CAPÍTULO — SAÚDE MENTAL E BEM-ESTAR (RIP: `saude_mental_e_bem_estar`)

Também um capítulo da anamnese, não um agente independente (Seção 9 do prompt-mestre). Objetivo: **triagem e caracterização, nunca diagnóstico.**

**Investigar:** estresse percebido, ansiedade, humor, qualidade de vida, motivação, percepção geral de saúde, impacto emocional da dor, confiança para realizar exercícios, barreiras emocionais.

### Instrumentos possíveis (aplicar conforme indicação, não em bloco)

| Instrumento | Objetivo | Itens/Faixa | Referência original |
|---|---|---|---|
| **PSS-10 (Perceived Stress Scale)** | Nível de estresse percebido nas últimas 4 semanas | 10 itens, escore 0–40 | Cohen S, Kamarck T, Mermelstein R, 1983 |
| **GAD-7** | Triagem de sintomas de ansiedade generalizada | 7 itens, escore 0–21 | Spitzer RL et al., 2006 |
| **PHQ-9** | Triagem de sintomas depressivos | 9 itens, escore 0–27 | Kroenke K, Spitzer RL, Williams JB, 2001 |
| **WHOQOL-bref** | Qualidade de vida (domínios físico, psicológico, social, ambiental) | 26 itens | The WHOQOL Group, 1998 |

**Regra fixa:** pontuações elevadas em GAD-7 ou PHQ-9 (ou qualquer item relacionado a ideação de autolesão, quando presente em instrumentos que o incluam) são **sempre tratadas como achado de triagem**, nunca como diagnóstico de ansiedade/depressão. O papel do Agente 2 aqui é apenas: identificar o achado, explicar seu significado como triagem, e sugerir ao profissional considerar encaminhamento para avaliação especializada (psicologia/psiquiatria).

**Sinal de alerta (Nível 4):** qualquer indício de ideação suicida ou de autolesão relatado durante a anamnese → escalonamento imediato e prioritário; interrompe a lógica normal da avaliação física até que o profissional trate a questão adequadamente (encaminhamento). Este é o único ponto do protocolo em que a etapa física passa a ser secundária.

**Nota sobre versões:** confirmar sempre a versão validada para português brasileiro e o manual oficial de cada instrumento antes do uso clínico — não presumir que pontos de corte internacionais se aplicam sem verificação.

---

## 7. PRONTIDÃO E SEGURANÇA PARA EXERCÍCIO (RIP: `prontidao_e_seguranca_para_exercicio`)

Este bloco é aplicado **antes** de qualquer teste físico/funcional (bloqueio estrutural definido na Seção 4.2 da Etapa 0).

**Investigar:** dor torácica, síncope, quase síncope (tontura com sensação de desmaio iminente), tontura, falta de ar desproporcional ao esforço relatado, palpitações, sintomas cardiovasculares, sintomas neurológicos, eventos de saúde recentes, alterações recentes de saúde.

### Instrumento — PAR-Q+ (Physical Activity Readiness Questionnaire for Everyone)

| Aspecto | Descrição |
|---|---|
| Objetivo | triagem de prontidão para atividade física, identificando quando é necessária avaliação médica antes de progressão de exercício |
| População | qualquer pessoa antes de iniciar ou aumentar atividade física |
| Formato | perguntas de triagem geral + seções de acompanhamento específicas por condição, quando alguma resposta geral é positiva |
| Mantenedor | Canadian Society for Exercise Physiology (CSEP) — usar sempre a versão mais atual publicada |
| Cuidado | é um instrumento de triagem, não substitui avaliação médica quando indicada |

### Fluxo de decisão do Agente 1 a partir deste bloco

1. Toda resposta positiva a um item de risco cardiovascular/neurológico agudo → **Nível 3 ou 4** (Seção 7 da Etapa 0), conforme gravidade.
2. Enquanto houver alerta de Nível 3/4 sem desfecho registrado pelo profissional, a etapa de Avaliação Funcional (Agente 5) permanece `bloqueada`.
3. O Agente 2 nunca decide sozinho liberar ou impedir a continuidade — apenas eleva a informação de forma clara e objetiva.

---

## 8. REGRAS TRANSVERSAIS DESTE AGENTE

1. Nunca transformar um questionário de triagem em diagnóstico.
2. Nunca aplicar um instrumento "porque existe" — cada um precisa responder a uma necessidade real deste paciente (idade, queixa, objetivo, risco).
3. Sempre registrar resultado bruto (pontuação) separadamente da leitura clínica que o profissional fizer dele.
4. Nunca inventar ponto de corte ou valor normativo não confirmado — sinalizar ao profissional quando for necessário checar o manual oficial/versão validada em português.
5. Toda alteração significativa de humor, ideação de autolesão, ou sinal de alerta cardiovascular/neurológico tem prioridade sobre a continuidade normal do protocolo.

---

## 9. LIMITAÇÕES

- Todos os instrumentos aqui são autorrelatados — sujeitos a viés de memória, desejabilidade social e estado emocional do dia.
- Instrumentos de triagem de saúde mental (PSS-10, GAD-7, PHQ-9) não diagnosticam — identificam necessidade de investigação adicional.
- O histórico familiar de risco cardiovascular/metabólico é indicativo, não uma estimativa de risco individual validada (para isso existem calculadoras de risco específicas, fora do escopo deste agente).
- A qualidade da anamnese depende diretamente da habilidade do profissional em conduzir a entrevista — o Agente 2 apoia, não substitui a escuta clínica.

---

## 10. CONEXÃO COM AS DEMAIS ETAPAS

- **Etapa 0 (Arquitetura):** todo dado aqui é gravado como registro atômico no RIP, com o contrato de saída padrão do Agente 2.
- **Prontidão → Agente 5 (Funcional):** bloqueio direto — nenhum teste funcional é liberado sem essa checagem resolvida.
- **Quedas (4.3) e Equilíbrio → Agente 5:** alerta obrigatório antes de qualquer teste de equilíbrio de maior risco.
- **Dor (Seção 5) → Agente 4 (Postural/Biomecânica) e Agente 5 (Funcional):** informa quais movimentos merecem cautela ou adaptação durante a observação e os testes.
- **Saúde mental (Seção 6) → Agente 8 (Devolutiva):** orienta o tom e a abordagem da conversa de devolutiva — nunca usar achados de sofrimento psíquico de forma alarmista.
- **Todos os capítulos → Agente 1:** alimentam as tags de perfil que vão moderar a seleção de testes em todas as etapas seguintes (Seção 6 da Etapa 0).
- **Todos os capítulos → Agente 6 (Integração):** nenhum dado da anamnese "some" — tudo está disponível para cruzamento posterior no Perfil Integrado.

---

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 3 — Avaliação Física e Antropométrica** (Etapa 4 do prompt-mestre): sinais vitais, peso, altura, IMC, circunferências, composição corporal — cada medida com objetivo, instrumento, calibração, preparação, execução passo a passo, registro, valores de referência, interpretação, erros comuns e referências, conforme o padrão da Seção 11 do prompt-mestre.
