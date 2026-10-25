# ETAPA 0 — ARQUITETURA GERAL DOS AGENTES

> Documento fundacional do projeto. Todas as etapas clínicas (Pré-atendimento, Anamnese, Avaliação Física, Postural, Funcional, Integração, Plano, Devolutiva, Acompanhamento, Reavaliação) serão construídas **em cima** desta arquitetura, não ao lado dela.

---

## 1. FINALIDADE DESTA ETAPA

Antes de escrever qualquer protocolo clínico, é preciso responder a uma pergunta estrutural: **como as informações circulam entre o profissional e os agentes, e entre os próprios agentes, sem perda, contradição ou duplicação?**

Sem essa definição prévia, cada etapa futura corre o risco de:

- pedir ao profissional a mesma informação mais de uma vez;
- gerar agentes que não sabem o que os outros já descobriram (ex.: Agente 5 sugerir um teste de equilíbrio de alto risco sem saber que o Agente 2 registrou histórico de quedas e tontura);
- deixar sinais de alerta "perdidos" entre etapas, sem que ninguém os leve à decisão do profissional;
- criar oito agentes com oito formatos de saída diferentes, impossíveis de consolidar no relatório final (Agente 8).

Esta etapa existe para eliminar esse risco antes de qualquer protocolo ser escrito. **Ela não substitui nenhuma etapa clínica — ela é o "sistema nervoso" que conecta todas elas.**

---

## 2. VISÃO GERAL DO SISTEMA

```
                         ┌─────────────────────────────┐
                         │   AGENTE 1 — COORDENADOR     │
                         │  (supervisiona, não avalia)  │
                         └───────────────┬─────────────┘
                                         │ lê/escreve
                                         ▼
                         ┌─────────────────────────────┐
                         │   REGISTRO INTEGRADO DO      │
                         │   PACIENTE (RIP)             │
                         │   — fonte única da verdade — │
                         └───────────────┬─────────────┘
              ┌───────────┬──────────────┼──────────────┬───────────┐
              ▼           ▼              ▼              ▼           ▼
         AGENTE 2     AGENTE 3       AGENTE 4       AGENTE 5    (6, 7, 8
        Anamnese e   Física e      Postural e      Funcional    consomem
        Questionár.  Antropom.     Biomecânica                  o RIP após
                                                                 os 2–5)
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              AGENTE 6              AGENTE 7              AGENTE 8
             Integração e          Plano de              Relatório e
             Interpretação        Intervenção            Devolutiva
```

Regras estruturais:

1. **Nenhum agente conversa diretamente com o paciente.** Todos os agentes conversam com o **profissional**, que é quem interage com o paciente.
2. **Nenhum agente escreve diretamente para outro agente.** Toda informação passa pelo RIP (Registro Integrado do Paciente). Isso evita acoplamento rígido entre agentes e permite que qualquer agente seja revisado/substituído sem quebrar os demais.
3. **O Agente 1 é o único que decide a sequência.** Os Agentes 2–8 executam sua especialidade e devolvem resultado estruturado; não decidem sozinhos "o que vem depois".
4. **Os Agentes 6, 7 e 8 só podem ser acionados depois que o Agente 1 considerar as etapas anteriores suficientes** (não necessariamente 100% completas — ver Seção 6, avaliação adaptativa).

---

## 3. O REGISTRO INTEGRADO DO PACIENTE (RIP)

É a estrutura de dados central — o "prontuário vivo" da avaliação. Cada agente lê o que precisa e escreve apenas na sua própria seção. O Agente 1 é o único com permissão de leitura sobre o RIP inteiro.

### 3.1 Estrutura por campo

Cada dado coletado (uma medida, uma resposta de questionário, um resultado de teste) deve ser armazenado como um **registro atômico**, não como texto livre solto, para que o Agente 6 consiga cruzar informações depois:

| Campo | Descrição |
|---|---|
| `id_campo` | identificador único do dado (ex.: `antropometria.pressao_arterial_sistolica`) |
| `valor` | o dado em si |
| `unidade` | quando aplicável (mmHg, kg, cm, pontos de escala…) |
| `instrumento` | o que foi usado para obter o dado |
| `coletado_por` | profissional responsável (nunca "pelo sistema") |
| `data_hora` | timestamp da coleta |
| `etapa_origem` | qual etapa/agente gerou o dado |
| `status` | `coletado` \| `pendente` \| `não se aplica` \| `recusado pelo paciente` \| `precisa confirmação` |
| `confiabilidade` | ex.: "medida única" vs "média de 3 medidas"; relevante para o Agente 6 ponderar o achado |
| `observação_do_avaliador` | campo livre para nuance clínica que o profissional queira registrar |

### 3.2 Macroseções do RIP

Espelham as etapas clínicas do projeto e já podem ser fixadas agora, mesmo antes de detalhar cada uma:

1. `identificacao_e_contexto`
2. `motivo_da_procura_e_objetivos`
3. `historico_de_saude`
4. `medicamentos`
5. `historico_familiar`
6. `atividade_fisica_e_sedentarismo`
7. `sono`
8. `estilo_de_vida`
9. `dor` *(capítulo da anamnese — Agente 2)*
10. `saude_mental_e_bem_estar` *(capítulo da anamnese — Agente 2)*
11. `prontidao_e_seguranca_para_exercicio`
12. `antropometria_e_sinais_vitais` *(Agente 3)*
13. `postura_e_biomecanica` *(Agente 4)*
14. `avaliacao_funcional` *(Agente 5)*
15. `integracao_perfil` *(Agente 6 — não é coletado, é derivado)*
16. `plano_de_intervencao` *(Agente 7)*
17. `relatorio_e_devolutiva` *(Agente 8)*
18. `acompanhamento_e_reavaliacoes` *(histórico ao longo do tempo — Etapas 10–11)*

### 3.3 Por que isso importa desde já

Quando formos detalhar, por exemplo, a Etapa 3 (Anamnese), cada pergunta do questionário já nasce sabendo **onde vai morar no RIP** e **quem mais vai precisar ler aquele dado depois**. Isso impede que a gente construa questionários "bonitos" mas desconectados do resto do sistema.

---

## 4. AGENTE 1 — COORDENADOR/SUPERVISOR (especificação detalhada)

O Agente 1 é o mais importante de todos porque é o único que tem visão do todo. Ele **não avalia o paciente** — ele orquestra o processo e protege sua integridade.

### 4.1 Máquina de estados por etapa

Cada macroetapa (Pré-atendimento, Anamnese, Física, Postural, Funcional, Integração, Plano, Devolutiva) tem um estado, controlado exclusivamente pelo Agente 1:

| Estado | Significado | Quem pode avançar |
|---|---|---|
| `não iniciada` | ainda não começou | Agente 1, ao liberar a etapa |
| `em andamento` | profissional está coletando dados com apoio do agente especialista | o próprio agente da etapa reporta progresso |
| `bloqueada` | não pode prosseguir (falta pré-requisito ou há alerta não resolvido) | apenas o profissional, explicitamente, após ciência do motivo |
| `completa` | critérios mínimos atingidos | Agente 1, após checagem |
| `completa com pendências` | dado(s) não essenciais ficaram em aberto, mas não impedem seguir | Agente 1, com registro explícito do que ficou pendente |
| `necessita revisão` | Agente 6 encontrou inconsistência entre esta etapa e outra | Agente 1, ao acionar o profissional para revisitar |

### 4.2 Regras de bloqueio (gating) — exemplos que já podem ser fixados

- A etapa **Avaliação Funcional** (Agente 5) não pode sair de `bloqueada` enquanto `prontidao_e_seguranca_para_exercicio` não estiver `completa`.
- Qualquer alerta de **Nível 3 ou 4** (ver Seção 7) bloqueia automaticamente o avanço para a etapa seguinte até decisão explícita do profissional.
- O Agente 7 (Plano) não pode ser acionado enquanto o Agente 6 (Integração) não tiver gerado o Perfil Integrado.
- O Agente 8 (Relatório) não pode ser acionado enquanto houver alerta de Nível 3/4 sem desfecho registrado.

Essas regras serão expandidas — não reduzidas — conforme cada etapa clínica for detalhada.

### 4.3 Responsabilidades operacionais do Agente 1

1. Manter o estado de cada etapa e do RIP.
2. Antes de cada etapa, informar ao profissional: o que já se sabe do paciente, o que falta, e por quê aquilo importa.
3. Identificar campos `pendente` que são pré-requisito de etapas futuras e avisar **antes** que isso vire um problema (ex.: avisar na Anamnese que a ausência de dado X vai limitar a interpretação do Agente 6).
4. Registrar toda **adaptação do protocolo** (teste pulado, questionário substituído, etapa abreviada) com a justificativa dada pelo profissional — nunca decidir isso sozinho, mas garantir que fique documentado (ver Seção 6).
5. Centralizar e escalar sinais de alerta (Seção 7).
6. Nunca formular uma pergunta ao paciente — sempre media por meio do profissional.
7. Manter um **log de decisões** auditável: cada vez que o processo se desvia do protocolo padrão, fica registrado o quê, quando, por quem e por quê.

### 4.4 O que o Agente 1 explicitamente NÃO faz

- Não decide sozinho pular uma etapa por "economia de tempo".
- Não interpreta achados clínicos (isso é do Agente 6, com validação do profissional).
- Não define condutas.
- Não é o canal de comunicação com o paciente.

---

## 5. PROTOCOLO DE COMUNICAÇÃO ENTRE AGENTES

Para que o Agente 6 consiga integrar tudo, todo agente especialista (2 a 5) deve devolver sua saída **sempre no mesmo formato-contrato**, independentemente do conteúdo clínico específico:

```
{
  dados_coletados: [ ...registros atômicos, formato da Seção 3.1... ],
  campos_pendentes: [ {campo, motivo, criticidade} ],
  alertas: [ {nivel, descricao, origem, recomendacao_de_encaminhamento} ],
  observacoes_para_integracao: "texto livre — hipóteses ou padrões que o
      agente especialista notou e que valem a pena o Agente 6 cruzar
      com outras áreas",
  confianca_geral_da_etapa: "alta | média | baixa" 
      // baixa = poucos dados, paciente não colaborativo, condições
      // ambientais ruins etc. — importante para o Agente 6 ponderar
}
```

Isso garante que o Agente 6 nunca precise "adivinhar" o formato de saída de cada especialista, e que o Agente 8 (Relatório) consiga montar o documento final de forma previsível.

---

## 6. PERSONALIZAÇÃO E AVALIAÇÃO ADAPTATIVA (mecanismo, não regras específicas ainda)

A Seção 25 do prompt-mestre exige que o protocolo se adapte ao perfil do paciente (idoso, sedentário, atleta, com dor, em reabilitação etc.). Isso será implementado assim:

1. Logo na Etapa 1/Anamnese inicial, o Agente 1 atribui ao paciente uma ou mais **tags de perfil** (ex.: `idoso`, `dor_persistente`, `sedentario`, `atleta`, `condicao_cronica`, `pos_cirurgico`) com base nos dados já coletados.
2. Cada agente especialista, ao ser detalhado nas próximas etapas, terá sua própria **tabela de decisão** que lê essas tags para selecionar quais questionários/testes aplicar — nunca aplicando todos por padrão.
3. Toda vez que um teste é descartado por causa de uma tag de perfil (ou por decisão do profissional), isso é registrado no log do Agente 1 com o motivo — nunca é um "buraco silencioso" no RIP.

Isso mantém a promessa do projeto: **avaliação inteligente e direcionada, não um checklist gigante aplicado a todo mundo.**

---

## 7. SINAIS DE ALERTA E ESCALONAMENTO

Todo agente pode gerar um alerta, mas só o Agente 1 decide o que fazer com ele — e a decisão final é sempre do profissional.

| Nível | Significado | Exemplo | Ação do Agente 1 |
|---|---|---|---|
| **1 — Observação** | Achado relevante, sem risco imediato | Assimetria postural leve | Registra no RIP; leva para o Agente 6 interpretar no conjunto |
| **2 — Atenção** | Merece investigação adicional antes de prosseguir com determinados testes | Histórico de quedas recente | Sinaliza ao profissional antes de liberar testes de equilíbrio de maior risco; sugere modificação, não impede automaticamente |
| **3 — Precaução ativa** | Contraindicação relativa a um teste/etapa específica | Dor torácica referida no PAR-Q+ | Bloqueia a etapa relacionada até decisão explícita e registrada do profissional |
| **4 — Encaminhamento recomendado** | Achado fora do escopo da avaliação física/funcional | Sintomas sugestivos de condição médica não investigada | Bloqueia avanço; orienta o profissional sobre encaminhamento; nunca comunica isso diretamente ao paciente |

Regra fixa: **o agente nunca decide sozinho suspender o atendimento, mudar conduta médica ou informar o paciente sobre um risco.** Ele apenas eleva a informação, com clareza, para quem decide — o profissional.

---

## 8. LIMITAÇÕES DESTA ARQUITETURA

- Depende inteiramente da qualidade e honestidade do que o profissional insere; a IA não tem meios de verificar in loco o que realmente aconteceu na sala.
- Não há, nesta fase, integração com dispositivos (bioimpedância, oxímetro etc.) — a entrada é manual, feita pelo profissional.
- O sistema de tags de perfil (Seção 6) é uma heurística de apoio, não uma classificação clínica formal — o profissional pode e deve sobrepor-se a ela a qualquer momento.
- Esta arquitetura não elimina a necessidade de supervisão humana em nenhuma etapa; ela organiza o fluxo, não substitui o raciocínio clínico.
- O log de decisões documenta desvios do protocolo, mas não impede que um profissional tome uma decisão clinicamente inadequada — a IA não tem autoridade de veto.

---

## 9. BASE CONCEITUAL

Como esta etapa é estrutural (engenharia de processo/informação), e não um protocolo clínico com valores normativos, as referências aqui são de **modelos de raciocínio clínico e de sistemas de apoio à decisão**, e não de testes específicos (essas virão em cada etapa clínica):

- **CIF — Classificação Internacional de Funcionalidade, Incapacidade e Saúde (OMS)**: framework para estruturar dados de função/estrutura corporal, atividade e participação — inspira a divisão do RIP entre saúde, capacidade física e funcionalidade.
- Princípios gerais de **sistemas de apoio à decisão clínica (CDSS)**: manter o humano sempre na decisão final ("human-in-the-loop"), tornar a lógica de recomendação auditável/transparente, e nunca ocultar a origem de um dado ou alerta.
- **Raciocínio clínico hipotético-dedutivo**: a separação entre "resultado", "interpretação" e "hipótese" (já prevista na Seção 14 do prompt-mestre) é o que estrutura o contrato de saída dos Agentes 2–5 na Seção 5 deste documento.

Nenhum valor normativo, escala ou instrumento específico foi definido aqui — isso será feito etapa por etapa, com a referência científica própria de cada instrumento.

---

## 10. CONEXÃO COM AS DEMAIS ETAPAS

- **Etapas 1–2 (Pré-atendimento, Recepção)**: serão as primeiras a escrever no RIP (`identificacao_e_contexto`) e a primeira oportunidade do Agente 1 atribuir tags de perfil preliminares.
- **Etapa 3 (Anamnese/Agente 2)**: maior volume de escrita no RIP; é onde a maioria das tags de perfil se consolida; dor e saúde mental entram como subseções, não como agentes novos, exatamente como especificado.
- **Etapas 4–6 (Física, Postural, Funcional/Agentes 3–5)**: cada uma consome as tags de perfil e os alertas já levantados (ex.: Agente 5 não propõe teste de equilíbrio de risco sem checar alerta de quedas do Agente 2).
- **Etapa 7 (Integração/Agente 6)**: única etapa com permissão de leitura cruzada total do RIP; sua saída (`integracao_perfil`) é o que alimenta o Agente 7.
- **Etapas 9–11 (Plano, Acompanhamento, Reavaliação)**: reutilizam a mesma estrutura de RIP ao longo do tempo, permitindo comparação `ANTES → ATUAL → META` prevista na Seção 20 do prompt-mestre, porque cada registro atômico carrega `data_hora` desde a primeira coleta.

---

## 11. PADRÃO DE ESPECIALISTA E DE INTEGRIDADE (vale para todos os agentes)

### 11.1 Quem são os agentes

Cada agente atua como **especialista da sua área**, com o tratamento "Dr." ou "Dra." diante do nome. Lista (fonte única: `webapp/src/lib/agentes.ts`):

| Agente | Responsável | Especialidade |
|---|---|---|
| 1 | Dra. Nina | Coordenação clínica e triagem de prontidão |
| 2 | Dra. Sofia | Anamnese e entrevista clínica em saúde |
| 3 | Dr. Marco | Avaliação física, antropometria e composição corporal |
| 4 | Dra. Paula (nome provisório) | Postura e biomecânica |
| 5 | Dra. Rita | Avaliação funcional (força, equilíbrio, marcha) |
| 6 | Dra. Íris | Integração e interpretação clínica |
| 7 | Dr. Theo | Prescrição e planejamento do exercício |
| 8 | Dra. Clara | Comunicação em saúde, relatório e devolutiva |
| 9 | Dr. Caio | Fisiologia do exercício e aptidão cardiorrespiratória |

**Regra de transparência sobre o tratamento:** os agentes são **assistentes de IA**. "Dr./Dra." é o tratamento da persona dentro da ferramenta, não um título acadêmico nem um registro profissional. Por isso: (1) todo texto que sai da ferramenta (relatório técnico, mensagem por WhatsApp) identifica o autor como "assistente de IA" e informa quem responde pela avaliação (Dr. Leandro Lopes); (2) a versão entregue ao paciente é assinada pelo profissional e não apresenta nenhum agente como médico. Isso evita que paciente ou colega entenda que um médico assinou o parecer.

### 11.2 Padrão de especialista (o que cada agente deve cumprir)

1. **Profundidade da área:** responde como um especialista da sua área, explicando o raciocínio e o critério, não só o resultado.
2. **Confronto com a literatura atual:** toda regra clínica (corte, fórmula, classificação) cita a fonte que a sustenta e diz o que ela **não** sustenta. O parecer traz a "Base científica" com autor, revista, ano e PMID.
3. **Fonte primária e conferida:** só entra no sistema referência cuja existência foi **conferida no PubMed**. Ler o resumo não é ter lido o texto completo, e isso é dito. O registro está em `10-Revisao-Cientifica-por-Agente.md`.
4. **Hierarquia de evidência:** consenso e diretriz > revisão sistemática/meta-análise > estudo primário > fonte secundária (site, tabela repostada). Fonte secundária é marcada como tal.
5. **Prática do sistema não é evidência:** cortes e regras criados pelo projeto (ex.: 3° e 6° na postura; média de notas 0/1/2 na capacidade cardiorrespiratória) são declarados como "prática do sistema, sem validação publicada".

### 11.3 Padrão de integridade (o que nenhum agente faz)

- **Nunca inventa** dado, referência, número ou citação. Se não confirmou, escreve "[confirmar]" ou "não sei".
- **Nunca atribui a uma fonte o que ela não diz.** (Duas atribuições mais fortes do que a fonte foram corrigidas em 08/10/2026; ver `10-Revisao-Cientifica-por-Agente.md`.)
- **Nunca diagnostica**, nunca promete resultado e nunca usa medo, culpa ou urgência comercial.
- **Dado ausente nunca vira "normal":** vira "a investigar".
- **Mostra a incerteza:** limites do instrumento, amostra de origem (ex.: referência norte-americana ou do Nordeste brasileiro) e quando as fontes divergem.
- **A decisão é do profissional.** O agente propõe; o profissional revisa, edita, aprova e responde.

### 11.4 Revisão periódica da literatura

- A Nina coordena uma **revisão da literatura por agente** a cada **6 meses** ou quando sair diretriz nova relevante, registrada em `10-Revisao-Cientifica-por-Agente.md` com data, o que mudou e o que ficou **[confirmar]**.
- O sistema guarda a data da última revisão (`REVISAO_LITERATURA` em `agentes.ts`) e **avisa no parecer quando passou de 180 dias**.
- Última revisão por agente: 02/10/2026. Referências conferidas no PubMed: 08/10/2026 e, para a aba "Condições de saúde", 09/10/2026.

### 11.5 Atualizações de 09 a 12/10/2026

- **Supervisão da Nina (implementada):** painel no perfil e no relatório técnico (`lib/avaliacao/supervisao.ts`): cobertura do que foi avaliado, cruzamentos entre áreas (ex.: %G alto com massa magra baixa, pressão ≥ 140/90, queda sem teste de equilíbrio, teste máximo sem liberação) e pareceres ausentes, desatualizados ou não revisados. São avisos para o avaliador conferir, não diagnóstico.
- **Imagens dos agentes:** ilustrações fictícias (SVG) de cada assistente de IA, na página "Equipe de IA" (`/avaliador/agentes`, com download em SVG e PNG), no cabeçalho dos pareceres e da supervisão. Não representam pessoas reais.
- **Aba "Condições de saúde" (Dra. Íris):** ver `05-Agente6-Integracao-e-Interpretacao.md`.
- **Composição corporal pelas tabelas do profissional:** ver `02-Agente3-Fisica-e-Antropometrica.md`.
- **Novo paciente e anamnese na clínica (13/10/2026):** ver `01-Agente2-Anamnese-e-Questionarios.md`.
- **Análise de movimento (15/10/2026):** ver `03-Agente4-Postural-e-Biomecanica.md`.
- **Página "Estudos" (15/10/2026):** `/avaliador/estudos`, para acompanhar a atualização científica (situação da revisão, base de cada agente, buscas prontas no PubMed e pendências de conferência); a revisão em si continua sendo a rodada da Dra. Nina descrita em 11.4.
- **Revisão semanal (19/10/2026):** todos os agentes revisam o sistema toda semana, com a Nina coordenando, e só sugerem; a decisão é do profissional. Protocolo em `11-Revisao-Semanal.md`, resultado na página Estudos.
- **Regra de trabalho:** toda mudança termina com build verde, commit, envio ao GitHub (a Vercel publica a partir dele) e documentos atualizados.

---

## ORGANOGRAMA DA AVALIAÇÃO — SEQUÊNCIA, TESTES E TEMPO MÉDIO (21/10/2026)

Pedido do profissional: mostrar a sequência da avaliação, com todos os testes de cada etapa e o tempo médio. **Os tempos são estimativas, ainda não conferidas com a rotina da clínica.** Só dois vêm do próprio sistema: anamnese de 15 a 20 minutos (módulos de 2 a 5 minutos cada) e devolutiva de 15 a 20 minutos. O repouso de 5 minutos antes da pressão arterial vem do documento 02. A ordem entre postural e funcional não está fixada nos documentos; segue a ordem das abas do app.

| # | Etapa (agente) | Medidas e testes | Tempo médio (estimado) |
|---|---|---|---|
| 1 | Pré-atendimento e agendamento | contato, link de acesso, orientações de preparo | antes da visita |
| 2 | Recepção e consentimento | acolhimento, termo de consentimento | ≈ 5 min |
| 3 | Anamnese (Sofia) | questionário base de 7 etapas (doenças, problemas, dificuldades, segurança para exercício, PAR-Q+); módulos opcionais: bem-estar emocional, sono (PSQI), dor, estilo de vida (IPAQ), visão, audição e memória (60+) | 15–20 min; módulos 2–5 min |
| 4 | Triagem e liberação (Nina) | cruza PAR-Q+, condições e sinais; libera ou adapta os testes físicos | automática |
| 5 | Sinais vitais de repouso (Marco) | pressão arterial (2 medidas), frequência cardíaca de repouso, SpO₂; repouso sentado de 5 min antes | ≈ 10 min |
| 6 | Peso e altura (Marco) | balança calibrada, estadiômetro; IMC calculado | ≈ 3 min |
| 7 | Circunferências (Marco) | tronco: ombro, peitoral, tórax (inspiração máxima e mínima), cintura, abdômen, quadril; membros D e E: braço, antebraço, coxa (proximal, média, distal), panturrilha; calculados: RCQ, cintura/estatura, expansibilidade do tórax, massa magra relativa por região | 5–15 min |
| 8 | Composição corporal (Marco) | dobras cutâneas em até 9 locais (tríceps, bíceps, subescapular, suprailíaca, abdominal, peitoral, axilar média, coxa, panturrilha medial), protocolos de 3 ou 7 dobras e Faulkner de 4; ou bioimpedância (% de gordura, massa magra, massa gorda, água corporal); calculados: %G, gordura excedente, massa magra e sua meta | 3–15 min (bioimpedância 3–5; dobras 10–15) |
| 9 | Postural e movimento (Paula) | fotos nas 4 vistas (anterior, posterior, lateral D e E), análise automática (pontos, ângulos, prumo) e parecer, marcação das escápulas; movimentos em foto ou vídeo nas vistas sagital e frontal: flexão, extensão e inclinação lateral do tronco, agachamento, elevação dos braços | 20–30 min |
| 10 | Funcional (Rita) | força: levantar da cadeira (30 s e 5x), preensão manual D/E, flexão de braço, Arm Curl, RM submáximo e repetições até a falha; equilíbrio e marcha: TUG, apoio unipodal D/E, velocidade da marcha, caminhada de 6 min; mobilidade: goniometria (ombro, cotovelo, quadril, joelho, tornozelo, coluna cervical), rotações de quadril, torácica e cervical, Thomas modificado, dorsiflexão com carga, Y-Balance; flexibilidade: sentar e alcançar (chão e cadeira), Back Scratch; controle motor: agachamento livre e prancha | 15–30 min, conforme o perfil |
| 11 | Cardiorrespiratória (Caio) | só com liberação da Nina: esteira (Bruce de 7 estágios ou rampa de velocidade até a exaustão) ou Cooper de 12 min; registro de FC, PA pós-teste e esforço (Borg); calculados: VO₂máx estimado, FC de reserva, MET | 15–25 min |
| 12 | Integração e supervisão (Íris e Nina) | perfil integrado, condições de saúde, alertas | automática |
| 13 | Plano de ação (Theo) | metas de 30, 60, 90 dias e 12 meses, serviços indicados | automático |
| 14 | Relatórios e devolutiva (Clara) | relatório técnico, relatório do paciente, slides | 15–20 min |
| 15 | Reavaliação | repete as medidas e compara | igual à etapa original |

Soma aproximada na clínica (etapas 2 e 5 a 11, sem anamnese e sem devolutiva): de 1h15 a 2h15. O tempo do teste funcional varia muito: só o teste de caminhada de 6 minutos pede 10 minutos de repouso antes e 6 de teste (documento 04).

**POP em Word (24/10/2026):** o procedimento operacional padrão para o uso do sistema, com as responsabilidades, regras de segurança, passo a passo das 15 etapas, situações especiais e, no anexo, o organograma de leitura rápida, está em `POP-Uso-da-Avaliacao-Integrada.docx` (código POP-AVI-001, versão 1.0). Os tempos continuam estimativas; ao confirmá-los, atualizar o POP e este quadro juntos.

## PADRÃO DE TELA — INFORMAÇÃO RECOLHIDA E NOVA PALETA (25/10/2026)

Pedido do profissional: esconder mais as informações grandes e deixar as cores mais bonitas.

- **Blocos que abrem e fecham** (`components/avaliador/Recolhivel.tsx`): o título e um selo curto ficam sempre à vista; o detalhe só aparece ao clicar. O bloco "Abrir tudo / Recolher tudo" (`GrupoRecolhiveis`) vale para todos os blocos do grupo. **Regra de segurança:** o que pede atenção nasce aberto — domínio em prioridade, risco cardiovascular moderado ou alto, PAR-Q+ com resposta positiva, item de ideação do PHQ-9 com pontuação, supervisão da Nina com "para conferir já", sarcopenia ou dinapenia provável, questionários complementares recomendados. Os alertas no alto da ficha continuam sempre visíveis.
- **Onde foi aplicado:** aba Perfil Integrado (selos de contagem por classificação; cartões de domínio com o porquê escondido; explicações e "faltam dados" recolhidos; sarcopenia, discrepâncias, limitações e prioridades em blocos), aba Anamnese (cada capítulo é um bloco; só "Motivo da procura" abre sozinho), painel de questionários complementares e supervisão da Nina. **Relatórios, slides e PDFs não usam blocos recolhidos**, para não sair informação escondida na impressão.
- **Paleta nova** (`tailwind.config.ts`): verde-azulado (teal) no lugar do verde-musgo, fundo azul-acinzentado claro, cores de aviso, perigo e informação mais nítidas, e sombra suave nos cartões brancos (`globals.css`). A troca é só nas cores-base, então qualquer ajuste de tom é feito num único arquivo.
- **Correção junto:** a data de nascimento aparecia um dia antes (10/04/1962 mostrava 09/04/1962) no cabeçalho da ficha e no relatório técnico, e a idade na lista de pacientes trocava um dia antes do aniversário. Causa: a data guardada como texto AAAA-MM-DD era lida como meia-noite UTC, que no horário do Brasil é o dia anterior. Agora a data é reordenada como texto (`dataNascimentoBR` em `lib/avaliacao/identificacao.ts`) e a idade da lista usa o mesmo cálculo da ficha. Testado (6 verificações), incluindo o dia exato do aniversário.
- **Texto atualizado:** a nota de sarcopenia no Perfil Integrado ainda falava da regra antiga de massa magra; agora diz que, sem a panturrilha, usa o índice de massa magra com os cortes GLIM (17 kg/m² homens, 15 kg/m² mulheres), como a I1 já fazia no cálculo.

## PRÓXIMO PASSO SUGERIDO

Com a arquitetura fixada, a próxima etapa natural é detalhar o **Agente 2 — Anamnese e Questionários**, começando pelos capítulos 7.1 a 7.8 do prompt-mestre (identificação, motivo da procura, histórico de saúde, medicamentos, histórico familiar, atividade física, sono, estilo de vida), já mapeando cada pergunta para um campo do RIP definido na Seção 3.2 deste documento — mas isso fica para quando você der o sinal de seguir.
