# AGENTE 7 — PLANO DE INTERVENÇÃO

> Depende do Perfil Integrado produzido pelo [05-Agente6-Integracao-e-Interpretacao.md](05-Agente6-Integracao-e-Interpretacao.md). Grava no RIP na macroseção `plano_de_intervencao`.

---

## 1. FINALIDADE

Transformar as Prioridades do Perfil Integrado em uma trajetória concreta de evolução, estruturada em quatro horizontes de tempo (30, 90, 180 e 365 dias). O Agente 7 **não decide a conduta técnica** (quais exercícios, quais cargas, qual frequência de fisioterapia) — isso é decisão do profissional. O que o Agente 7 organiza é **a lógica de priorização temporal**: o que precisa ser resolvido primeiro, o que pode esperar, e por quê.

**Regra fixa, herdada da Seção 18 do prompt-mestre:** o plano é sempre consequência dos achados — nunca um template genérico aplicado independentemente do resultado da avaliação. Se dois pacientes tiverem Perfis Integrados diferentes, seus planos devem ser visivelmente diferentes, mesmo que ambos "queiram emagrecer" ou "queiram voltar a treinar".

---

## 2. INSUMO ÚNICO: O PERFIL INTEGRADO

O Agente 7 não relê o RIP bruto — ele parte exclusivamente do objeto produzido pelo Agente 6 (Seção 7 daquele documento): Painel por domínio, Potencialidades, Limitações, Riscos, Prioridades (já ordenadas), Discrepâncias e Confiança geral do perfil.

Se a `confiança geral do perfil` for `baixa` (muitos dados pendentes), o Agente 7 deve sinalizar isso ao profissional **antes** de propor a trajetória — um plano construído sobre dados incompletos deve ser rotulado como preliminar, sujeito a revisão assim que os dados pendentes forem resolvidos.

---

## 3. LÓGICA DE ALOCAÇÃO TEMPORAL

Cada Prioridade do Perfil Integrado precisa ser alocada em um dos quatro horizontes. A alocação segue critérios explícitos, não uma distribuição arbitrária:

| Horizonte | Nome | Critério de alocação |
|---|---|---|
| **30 dias** | Adaptação e primeiras correções | Riscos ativos (Seção 4 do Agente 6) que exigem atenção imediata; itens de segurança (ex.: correção de padrão de movimento associado a risco de queda); familiarização do paciente com o processo; educação em saúde inicial |
| **90 dias** | Desenvolvimento inicial | Limitações e Prioridades de base que dependem de tempo fisiológico mínimo para responder (ex.: ganho inicial de força, melhora de mobilidade) — itens que não são urgentes por segurança, mas são fundamentais para sustentar os horizontes seguintes |
| **180 dias** | Consolidação e evolução | Prioridades que dependem do progresso já obtido nos primeiros 90 dias; objetivos de médio prazo declarados pelo paciente (capítulo 4.2 da Anamnese) |
| **365 dias** | Manutenção, autonomia e performance | Objetivos de longo prazo, autonomia do paciente na gestão da própria saúde/treinamento, metas de desempenho quando aplicável ao perfil (ex.: atletas) |

### 3.1 Regra de precedência

Um item nunca pode ser alocado em um horizonte posterior se representar um Risco ativo não resolvido — Riscos sempre entram no horizonte de 30 dias, mesmo que sua resolução completa se estenda além disso (nesse caso, o item aparece em 30 dias como "iniciar monitoramento/encaminhamento" e pode reaparecer em 90 dias como "reavaliar resposta").

---

## 4. INTEGRAÇÃO MULTIPROFISSIONAL

O plano pode envolver, conforme a estrutura da clínica: fisioterapia, treinamento de força, treinamento cardiorrespiratório, mobilidade, equilíbrio, educação em saúde, acompanhamento e encaminhamento multiprofissional.

**Critério para sugerir encaminhamento:** sempre que uma Prioridade ou Risco do Perfil Integrado estiver fora do escopo de atuação da equipe da clínica (ex.: achado de saúde mental que ultrapassa triagem — ver capítulo de Saúde Mental do Agente 2; sinal de alerta cardiovascular/neurológico ainda sem desfecho médico). O Agente 7 apenas **sinaliza a necessidade** — nunca escolhe o profissional específico nem define a conduta desse encaminhamento.

---

## 5. ESTRUTURA DE SAÍDA DO PLANO

```
PLANO DE INTERVENÇÃO INDIVIDUALIZADO

Base: Perfil Integrado de [data da avaliação] — confiança: [alta/média/baixa]

HORIZONTE 30 DIAS — Adaptação e primeiras correções
  - [item] — origem: [Risco/Limitação/Prioridade correspondente do Perfil Integrado]
  - [item] — ...

HORIZONTE 90 DIAS — Desenvolvimento inicial
  - [item] — origem: ...

HORIZONTE 180 DIAS — Consolidação e evolução
  - [item] — origem: ...

HORIZONTE 365 DIAS — Manutenção, autonomia e performance
  - [item] — origem: ...

ENCAMINHAMENTOS SUGERIDOS
  - [especialidade] — motivo: [Risco/achado correspondente]

INDICADORES DE ACOMPANHAMENTO
  - [indicador do Agente 3/5 a ser reavaliado] — frequência sugerida de checagem
```

**Regra fixa:** todo item do plano precisa citar sua origem no Perfil Integrado. Um item sem origem rastreável é, por definição, um item genérico — e não deveria estar ali.

---

## 6. INDICADORES DE ACOMPANHAMENTO (ponte para a Etapa 10)

Para cada Prioridade alocada no plano, o Agente 7 sugere qual indicador objetivo (já coletado pelos Agentes 3 ou 5 na avaliação inicial) deve ser reacompanhado ao longo da execução — e com que frequência aproximada, sem prescrever a periodicidade exata do atendimento clínico, que é decisão do profissional.

Exemplo: se uma Prioridade é "força de membros inferiores reduzida" (originada no 30-Second Chair Stand do Agente 5), o indicador de acompanhamento sugerido é o próprio teste, reaplicado periodicamente — não um teste novo criado apenas para "monitorar".

---

## 7. EXECUÇÃO E ACOMPANHAMENTO (Etapa 10 do prompt-mestre)

Após o plano ser aceito pelo profissional (e apresentado ao paciente na Devolutiva — Agente 8), a etapa de execução é conduzida pelo profissional. O papel do Agente 1 (Coordenador) e do Agente 7 nessa fase passa a ser:

- registrar, ao longo do tempo, os indicadores de acompanhamento definidos na Seção 6, sempre como novos registros atômicos no RIP (nunca sobrescrevendo o valor da avaliação inicial — Seção 3.1 da Etapa 0 já garante isso via `data_hora` e `etapa_origem`);
- registrar adesão relatada e ajustes feitos pelo profissional, com a justificativa (mesma lógica de log de decisões do Agente 1);
- atualizar metas quando o profissional decidir fazê-lo, sempre com registro do motivo.

O sistema deve permitir, a qualquer momento, visualizar a série temporal de qualquer indicador: **avaliação inicial → acompanhamentos → reavaliação**.

---

## 8. REAVALIAÇÃO (Etapa 11 do prompt-mestre)

A reavaliação **não é uma nova avaliação do zero** — ela repete, de forma padronizada (mesmos instrumentos, mesmos protocolos, definidos nos Agentes 3, 4 e 5), os indicadores relevantes da avaliação inicial, determinados pelas Prioridades registradas no plano.

O Agente 6 é acionado novamente sobre os novos dados, gerando um novo Perfil Integrado. O Agente 7 então compara:

```
INDICADOR          ANTES (avaliação inicial)   ATUAL (reavaliação)   META
Chair Stand (rep)  10                          14                    16
TUG (s)            14.2                        11.8                  <12
...
```

A partir dessa comparação, o plano é atualizado: itens que atingiram a meta saem da lista de Prioridades ativas (podem migrar para "manutenção"), itens sem progresso são revisados quanto à estratégia (não automaticamente intensificados — essa é uma decisão clínica do profissional), e novos achados eventuais entram no ciclo normalmente.

---

## 9. REGRAS FIXAS DESTE AGENTE

1. Nunca propor um plano sem origem rastreável no Perfil Integrado.
2. Nunca definir a conduta técnica específica (carga, exercício, técnica de fisioterapia) — isso é atribuição do profissional.
3. Nunca prometer resultado ou prazo como garantia — horizontes de tempo são estruturas de organização, não promessas de desfecho.
4. Riscos ativos sempre precedem Limitações na alocação temporal, independentemente do desejo do paciente de focar em outro objetivo primeiro — mas isso deve ser **conversado e explicado** ao paciente na devolutiva, não imposto silenciosamente.

---

## 10. LIMITAÇÕES

- A alocação temporal (30/90/180/365) é uma heurística organizacional, não uma previsão fisiológica exata de quando cada melhora ocorrerá — tempos de resposta variam por paciente, aderência e condição de base.
- O plano depende inteiramente da qualidade do Perfil Integrado que o originou — um perfil de confiança `baixa` deve gerar um plano explicitamente rotulado como preliminar.
- Ajustes de plano ao longo da execução são sempre decisão do profissional; o Agente 7 organiza e sugere, nunca executa a mudança de forma autônoma.

---

## 11. CONEXÃO COM AS DEMAIS ETAPAS

- **Agente 6 → esta etapa:** único insumo de entrada.
- **Esta etapa → Agente 8 (Devolutiva):** a fase "Planejar" da devolutiva (Seção 17, passo 6, do prompt-mestre) apresenta diretamente a saída deste agente.
- **Esta etapa → Agente 1 (Coordenador):** os indicadores de acompanhamento (Seção 6) tornam-se, na prática, o roteiro de o que verificar em cada atendimento de acompanhamento subsequente.
- **Esta etapa → Etapa 11 (Reavaliação):** a estrutura `ANTES → ATUAL → META` (Seção 8) fecha o ciclo `AVALIAR → MEDIR → INTERPRETAR → PRIORIZAR → INTERVIR → REAVALIAR → EVOLUIR` (Seção 1 do prompt-mestre).

---

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 8 — Relatório e Devolutiva** (Etapas 7 e 8 do prompt-mestre): como transformar o Perfil Integrado e o Plano de Intervenção em um relatório compreensível ao paciente e tecnicamente adequado ao profissional, seguindo o roteiro de conversa RECONHECER → MOSTRAR → EXPLICAR → PRIORIZAR → PROJETAR → PLANEJAR, sem linguagem alarmista.
