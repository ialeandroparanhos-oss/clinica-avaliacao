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

## PRÓXIMO PASSO SUGERIDO

Com a arquitetura fixada, a próxima etapa natural é detalhar o **Agente 2 — Anamnese e Questionários**, começando pelos capítulos 7.1 a 7.8 do prompt-mestre (identificação, motivo da procura, histórico de saúde, medicamentos, histórico familiar, atividade física, sono, estilo de vida), já mapeando cada pergunta para um campo do RIP definido na Seção 3.2 deste documento — mas isso fica para quando você der o sinal de seguir.
