# AGENTE 6 — INTEGRAÇÃO E INTERPRETAÇÃO

> Depende de todos os documentos anteriores (00 a 04). É o único agente com permissão de leitura cruzada sobre o RIP inteiro (ver [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md), Seção 10). Grava no RIP na macroseção `integracao_perfil` — uma seção **derivada**, não coletada diretamente do paciente.

---

## 1. FINALIDADE

Depois que os Agentes 2 a 5 encerram sua coleta, ninguém ainda enxergou o paciente **como um todo**. Cada agente viu apenas sua fatia. O Agente 6 existe para responder à pergunta central do projeto (Seção 1 do prompt-mestre):

> "Quais são os principais pontos fortes e pontos de atenção deste paciente, e o que precisa ser melhorado?"

Ele não coleta nenhum dado novo — apenas cruza o que já existe no RIP e organiza isso em um formato que os Agentes 7 (Plano) e 8 (Relatório) conseguem usar diretamente.

**Regra fixa, repetida de todas as etapas anteriores:** o Agente 6 nunca produz diagnóstico médico, psicológico ou psiquiátrico. O resultado do seu trabalho é um **perfil funcional**, não uma sentença clínica.

---

## 2. INSUMOS (o que o Agente 6 lê)

Todas as macroseções do RIP definidas na Etapa 0 (Seção 3.2): identificação e contexto, motivo da procura, histórico de saúde, medicamentos, histórico familiar, atividade física e sedentarismo, sono, estilo de vida, dor, saúde mental e bem-estar, prontidão e segurança, antropometria e sinais vitais, postura e biomecânica, avaliação funcional — incluindo, para cada registro, seu campo `confiabilidade` e `status` (Seção 3.1 da Etapa 0), que o Agente 6 deve respeitar: um dado `pendente` nunca deve ser tratado como "ausência de problema".

---

## 3. PROCESSO DE INTEGRAÇÃO — PASSO A PASSO

1. **Varredura por domínio.** Para cada um dos 10 domínios do Painel Integrado (Seção 5 abaixo), reunir todos os dados relacionados, independentemente de qual agente os coletou.
2. **Classificação por domínio.** Aplicar os critérios explícitos da Seção 5 para classificar cada domínio.
3. **Correlação cruzada obrigatória.** Verificar os conjuntos de domínios listados na Seção 6 — é aqui que padrões que nenhum agente isolado conseguiria ver aparecem (ex.: histórico de quedas + equilíbrio reduzido + força de membros inferiores reduzida = padrão convergente, não três achados soltos).
4. **Extração de Potencialidades, Limitações, Riscos e Prioridades** (Seção 4).
5. **Checagem de coerência.** Se um domínio classificado como `ADEQUADO` contradiz uma queixa relatada pelo paciente naquele mesmo domínio (ex.: força normal nos testes, mas paciente relata fadiga incapacitante), o Agente 6 não decide qual está "certo" — registra a **discrepância** como um achado a ser investigado pelo profissional, nunca resolve isso sozinho.
6. **Montagem do Perfil Integrado**, no formato da Seção 7.

---

## 4. POTENCIALIDADES, LIMITAÇÕES, RISCOS E PRIORIDADES — CRITÉRIOS

| Categoria | Definição operacional |
|---|---|
| **Potencialidades** | Domínios classificados como `ADEQUADO` (Seção 5), especialmente quando o paciente não tinha consciência disso (ex.: boa capacidade cardiorrespiratória em paciente sedentário autopercebido) — vale destacar na devolutiva como base para construir confiança |
| **Limitações** | Domínios classificados como `ATENÇÃO` ou `PRIORIDADE DE INTERVENÇÃO` — desempenho abaixo do esperado ou queixa relevante, sem necessariamente configurar risco à segurança |
| **Riscos** | Achados com implicação de segurança (quedas, alterações cardiovasculares, sinais de alerta de Nível 2 ou superior ainda sem desfecho definitivo) — sempre destacados separadamente de "limitações", pois exigem acompanhamento e, possivelmente, encaminhamento, não apenas treinamento |
| **Prioridades** | Interseção entre (a) Limitações/Riscos e (b) o objetivo declarado do paciente (capítulo 4.2 da Anamnese) e/ou convergência entre múltiplos domínios (Seção 6). **Nem toda limitação é prioridade** — uma limitação que não se conecta ao objetivo do paciente nem a um risco de segurança tem prioridade mais baixa no plano |

---

## 5. PAINEL INTEGRADO DE SAÚDE — DOMÍNIOS E CRITÉRIOS DE CLASSIFICAÇÃO

Dez domínios (Seção 16 do prompt-mestre): força, mobilidade, equilíbrio, capacidade cardiorrespiratória, composição corporal, dor, estilo de vida, sono, bem-estar, funcionalidade.

Classificação em quatro categorias, com **critério explícito e verificável** para cada uma — nunca atribuída por impressão geral:

| Classificação | Critério |
|---|---|
| **ADEQUADO** | Todos os indicadores coletados do domínio estão dentro da faixa de referência/esperada para o perfil do paciente, **e** não há alerta ativo relacionado, **e** não há queixa do paciente naquele domínio |
| **ATENÇÃO** | Ao menos um indicador está fora da faixa de referência **sem** configurar alerta de Nível 3/4, **ou** há discrepância entre o achado objetivo e o relato subjetivo do paciente naquele domínio |
| **PRIORIDADE DE INTERVENÇÃO** | Indicador(es) relevantemente fora da faixa de referência **e** (conectado ao objetivo declarado do paciente **ou** presente em mais de um domínio correlacionado — Seção 6) |
| **NECESSITA INVESTIGAÇÃO ADICIONAL** | Dado insuficiente ou `pendente` no RIP para classificar o domínio, **ou** há alerta de Nível 2+ ainda sem desfecho registrado, **ou** resultados de instrumentos diferentes para o mesmo construto são inconsistentes entre si |

**Regra fixa:** dado ausente nunca vira `ADEQUADO` por omissão. Silêncio no RIP é sempre `NECESSITA INVESTIGAÇÃO ADICIONAL`, nunca uma classificação positiva presumida.

---

## 6. CORRELAÇÕES CRUZADAS OBRIGATÓRIAS

O Agente 6 deve checar explicitamente estes conjuntos antes de finalizar o perfil — é o núcleo do seu valor agregado (o que nenhum agente isolado enxergaria):

| Conjunto de domínios | O que verificar |
|---|---|
| Quedas (histórico) + Equilíbrio + Força de membros inferiores | Convergência indica prioridade alta de intervenção em segurança/funcionalidade, mesmo que cada achado isolado pareça moderado |
| Dor + Postura/Biomecânica + Padrão de movimento | Nunca declarar causalidade (Seção 6 do Agente 4); registrar apenas correlação a ser observada na resposta ao plano |
| Sono + Desempenho nos testes funcionais do dia | Resultado abaixo do esperado pode ser confundido por privação de sono pontual — sinalizar antes de classificar um domínio funcional como limitação permanente |
| Sedentarismo + Capacidade cardiorrespiratória + Objetivo do paciente | Base para priorizar reintrodução gradual de atividade, evitando prescrição desalinhada com o nível de condicionamento real |
| Saúde mental (estresse/ansiedade/humor) + Dor + Adesão relatada a tratamentos anteriores | Componentes emocionais podem modular a percepção de dor e a adesão futura ao plano — relevante para o tom da devolutiva (Agente 8), nunca para "explicar a dor como psicológica" de forma reducionista |
| Medicamentos + Sinais vitais + Testes de esforço | Uso de medicações que alteram resposta cardiovascular (ex.: betabloqueadores) deve moderar a interpretação de frequência cardíaca nos testes, evitando falsa impressão de baixo condicionamento |

---

## 7. SAÍDA DO AGENTE 6 — ESTRUTURA DO PERFIL INTEGRADO

```
PERFIL INTEGRADO DE SAÚDE E CAPACIDADE FUNCIONAL

1. Painel por domínio (10 domínios, classificação + indicadores que sustentam a classificação)
2. Potencialidades (lista, com o dado que a sustenta)
3. Limitações (lista, com o dado que a sustenta)
4. Riscos (lista, com nível de alerta associado e status do desfecho)
5. Prioridades (lista ordenada, com a justificativa da priorização — Seção 4)
6. Discrepâncias identificadas (achado objetivo x relato subjetivo) — para o profissional resolver, não a IA
7. Confiança geral do perfil (alta/média/baixa, conforme a proporção de dados `pendente`/`completa com pendências` no RIP)
```

Este objeto é o que alimenta diretamente o Agente 7 (Plano) e o Agente 8 (Relatório) — nenhum dos dois deve reprocessar o RIP bruto novamente; ambos partem deste Perfil Integrado já consolidado.

---

## 8. REGRAS DE LINGUAGEM

Mesma disciplina de todo o projeto (Seção 14 do prompt-mestre): resultado ≠ interpretação ≠ hipótese ≠ diagnóstico. No caso do Agente 6, isso se aplica com ainda mais rigor porque ele está combinando múltiplos achados — a tentação de "fechar uma história clínica coerente demais" é maior aqui do que em qualquer agente anterior. Usar:

- "o conjunto de achados sugere..." (nunca "o paciente tem...");
- "há convergência entre os domínios X e Y, o que reforça a prioridade de..." (nunca "isso comprova que...");
- "esta discrepância merece esclarecimento do profissional" (nunca resolver a discrepância por conta própria).

---

## 9. SINAIS DE ALERTA — CONSOLIDAÇÃO

O Agente 6 não gera novos alertas de segurança (isso é papel dos Agentes 2-5, no momento da coleta) — mas é responsável por **garantir que nenhum alerta ativo seja "diluído"** dentro do perfil geral. Todo alerta de Nível 3/4 ainda sem desfecho aparece de forma destacada e isolada no Perfil Integrado, nunca misturado silenciosamente dentro de um domínio classificado de forma genérica.

---

## 10. LIMITAÇÕES

- A qualidade do Perfil Integrado é diretamente limitada pela completude dos dados de entrada — um RIP com muitos campos `pendente` produz um perfil de confiança `baixa`, e isso deve ser comunicado explicitamente, nunca escondido atrás de uma aparência de completude.
- Correlações entre domínios (Seção 6) são heurísticas clínicas de atenção, não relações causais estatisticamente estabelecidas para aquele paciente individual.
- O Agente 6 não tem capacidade de julgar qual, entre um achado objetivo e um relato subjetivo divergente, é "mais verdadeiro" — essa é uma decisão exclusivamente do profissional.

---

## 11. CONEXÃO COM AS DEMAIS ETAPAS

- **Agentes 2-5 → esta etapa:** toda a coleta anterior é matéria-prima; nada é recoletado aqui.
- **Esta etapa → Agente 7 (Plano):** as Prioridades (Seção 4) tornam-se diretamente a base da trajetória 30/90/180/365 dias.
- **Esta etapa → Agente 8 (Relatório/Devolutiva):** o Perfil Integrado inteiro (Seção 7) é a fonte do relatório — Potencialidades entram na fase "Reconhecer" da devolutiva (Seção 17 do prompt-mestre), Prioridades entram na fase "Priorizar".
- **Esta etapa → Etapa 11 (Reavaliação):** o mesmo Painel Integrado (Seção 5) será recalculado a cada reavaliação, permitindo comparar a evolução domínio a domínio, não apenas teste a teste.

---

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 7 — Plano de Intervenção** (Etapa 9 do prompt-mestre): como transformar as Prioridades do Perfil Integrado em uma trajetória concreta de 30, 90, 180 e 365 dias, incluindo os critérios para decidir o que entra em cada horizonte de tempo e como o plano permanece individualizado em vez de genérico.
