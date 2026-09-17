# AGENTE 5 — AVALIAÇÃO FUNCIONAL

> Depende de todos os documentos anteriores. Só é liberado pelo Agente 1 após `prontidao_e_seguranca_para_exercicio` (Agente 2) estar `completa` (ver [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md), Seção 4.2). Grava no RIP na macroseção `avaliacao_funcional`.

---

## 1. FINALIDADE

Avaliar força, resistência muscular, potência, mobilidade, flexibilidade, equilíbrio, coordenação, agilidade, marcha e capacidade cardiorrespiratória — sempre com testes selecionados, nunca aplicados em bloco. Este é o agente onde o princípio da Seção 13 do prompt-mestre é mais crítico:

> "O que este teste acrescentará à compreensão deste paciente?"

Se a resposta não for clara, o teste não deve ser aplicado.

---

## 2. PRINCÍPIO DE SELEÇÃO — ANTES DE QUALQUER TESTE

O Agente 5 nunca sugere uma bateria fixa. Ele consulta, no RIP:

1. As **tags de perfil** atribuídas pelo Agente 1 (`idoso`, `sedentario`, `atleta`, `dor_persistente`, `condicao_cronica`, `pos_cirurgico` etc.);
2. Os **alertas ativos** (Seção 7 da Etapa 0) — nenhum teste é sugerido se houver alerta de Nível 3/4 relacionado à região ou ao sistema envolvido;
3. O **objetivo declarado** do paciente (capítulo 4.2 da Anamnese) — testes devem responder a esse objetivo, não apenas preencher categorias;
4. Os **achados posturais/de movimento** do Agente 4 — para decidir se um teste precisa de adaptação (ex.: evitar apoio unipodal sem suporte em paciente com histórico recente de queda, preferindo uma variante com apoio leve).

### 2.1 Matriz de seleção orientativa (ponto de partida, não regra rígida)

| Perfil | Testes prioritários | Testes a evitar ou adaptar |
|---|---|---|
| `idoso` / risco de queda | 30-Second Chair Stand, TUG, apoio unipodal, velocidade da marcha | Testes de esforço máximo sem liberação médica |
| `sedentario` sem outras bandeiras | Chair Stand, teste de caminhada (6 ou 2 min conforme capacidade), dinamometria | Testes de agilidade de alta intensidade na primeira sessão |
| `atleta` / treinado | Dinamometria, testes de mobilidade específicos da modalidade, capacidade cardiorrespiratória mais exigente | Chair Stand isolado tem baixo valor discriminativo nesse perfil |
| `dor_persistente` | Testes de mobilidade/flexibilidade adaptados, evitar testes de impacto/alta carga na região dolorosa | Qualquer teste que reproduza a dor sem necessidade clara |
| `pos_cirurgico` recente | Apenas testes liberados explicitamente pelo profissional responsável, geralmente de baixa demanda | Todos os testes de alta demanda até liberação |

---

## 3. INSTRUMENTOS — LISTA MESTRE DESTA ETAPA

| Categoria | Instrumento |
|---|---|
| Essencial | cadeira sem apoio de braço (altura padronizada, ~43-44 cm de assento) |
| Essencial | cronômetro |
| Essencial | fita métrica ou marcação de percurso |
| Essencial | cones ou marcadores de percurso |
| Recomendado | dinamômetro manual (handgrip) |
| Recomendado | corredor de pelo menos 20-30 m para teste de caminhada de 6 minutos |
| Recomendado | escala de percepção subjetiva de esforço (Borg) |
| Opcional | oxímetro de pulso (monitorar SpO₂ durante testes de esforço) |
| Opcional | banco/degrau padronizado, goniômetro, fita de flexibilidade (banco de Wells ou equivalente) |

---

## 4. TESTES — DETALHAMENTO

Cada teste segue o padrão da Seção 13 do prompt-mestre: objetivo, indicação, contraindicações/precauções, materiais, espaço, preparação, posicionamento, instruções, execução, critérios de validade, critérios de interrupção, resultado, valores normativos, interpretação, erros comuns, referências.

### 4.1 30-Second Chair Stand (Teste de Sentar e Levantar em 30 segundos)

| Campo | Conteúdo |
|---|---|
| Objetivo | Estimar força/resistência de membros inferiores, relevante para funcionalidade e risco de queda |
| Indicação | Ampla — especialmente perfis `idoso` e `sedentario` |
| Contraindicações/precauções | Dor aguda em membros inferiores/coluna que impeça a tarefa; instabilidade de equilíbrio grave sem supervisão próxima |
| Materiais | Cadeira sem braços, encostada em parede (ou estabilizada), cronômetro |
| Espaço | Área para posicionar a cadeira com espaço livre à frente |
| Preparação | Explicar a tarefa e permitir 1 repetição de familiarização |
| Posicionamento | Paciente sentado no meio do assento, pés apoiados no chão na largura dos ombros, braços cruzados sobre o peito |
| Instruções ao paciente | "Fique de pé e sente-se completamente o maior número de vezes possível em 30 segundos, no seu próprio ritmo" |
| Execução | Cronometrar 30 segundos a partir do sinal de início; contar o número de vezes que o paciente se levanta totalmente (extensão completa de quadril/joelho) |
| Critérios de validade | Contar apenas repetições completas (levantar totalmente e sentar totalmente) |
| Critérios de interrupção | Dor, tontura, fadiga excessiva, perda de equilíbrio |
| Resultado | Número de repetições completas em 30 segundos |
| Valores normativos | Publicados por faixa etária e sexo no Senior Fitness Test (Rikli & Jones) — consultar a tabela oficial vigente; não estimar de memória |
| Interpretação | Comparar com a faixa normativa correspondente à idade/sexo do paciente; usar como linha de base para acompanhamento longitudinal, não apenas como valor isolado |
| Erros comuns | Permitir impulso com os braços; contar repetições parciais; cadeira instável durante o teste |
| Referência | Rikli RE, Jones CJ — *Senior Fitness Test Manual* (Human Kinetics) |

### 4.2 Five Times Sit-to-Stand (5x Sentar-Levantar)

| Campo | Conteúdo |
|---|---|
| Objetivo | Avaliar força funcional de membros inferiores e velocidade de transferência sentado-em-pé |
| Indicação | Complementa ou substitui o Chair Stand quando o interesse é o tempo de execução, não a resistência muscular em 30s |
| Contraindicações/precauções | Mesmas do item 4.1 |
| Materiais | Cadeira sem braços, cronômetro |
| Posicionamento | Braços cruzados sobre o peito, pés apoiados |
| Instruções | "Levante e sente-se 5 vezes o mais rápido possível, com segurança" |
| Execução | Cronometrar do comando de início até o quinto momento em que o paciente estiver totalmente em pé (ou sentado, conforme o protocolo adotado — fixar um critério e mantê-lo) |
| Critérios de interrupção | Mesmos do item 4.1 |
| Resultado | Tempo total em segundos |
| Valores normativos | Cutoffs de risco funcional aumentado são citados de forma variável entre estudos (frequentemente na faixa de 12-15 segundos para adultos mais velhos, dependendo da fonte) — **confirmar o valor de referência na publicação específica adotada pela clínica antes de comunicar risco ao paciente** |
| Interpretação | Tempo mais alto indica menor força/potência funcional de membros inferiores; correlacionar com achados de equilíbrio e histórico de quedas |
| Referência | Bohannon RW — múltiplos estudos de validação do Five Times Sit-to-Stand Test |

### 4.3 Timed Up and Go (TUG)

| Campo | Conteúdo |
|---|---|
| Objetivo | Avaliar mobilidade funcional básica combinando transferência, marcha e mudança de direção — amplamente usado como triagem de risco de queda |
| Indicação | Especialmente perfis `idoso`, histórico de quedas |
| Contraindicações/precauções | Instabilidade grave sem supervisão próxima e sem dispositivo auxiliar de marcha, se necessário |
| Materiais | Cadeira com braços (altura padrão ~46 cm), cronômetro, marcação de 3 metros no chão, cone |
| Espaço | Percurso de 3 metros em linha reta, sem obstáculos |
| Posicionamento inicial | Paciente sentado na cadeira com as costas apoiadas, apoiando os braços quando necessário |
| Instruções | "Ao meu sinal, levante-se, caminhe até o cone em ritmo confortável e seguro, contorne-o, volte e sente-se novamente" |
| Execução | Cronometrar do comando "vá" até o paciente sentar-se novamente com as costas apoiadas |
| Critérios de validade | Permitir o uso do dispositivo auxiliar habitual do paciente, se houver, e registrar esse fato junto ao resultado |
| Critérios de interrupção | Perda de equilíbrio, tontura, dor aguda |
| Resultado | Tempo em segundos |
| Valores normativos | Valor de corte amplamente citado na literatura como indicativo de risco aumentado de queda em idosos: ≥ 12 segundos (validações subsequentes ao estudo original) — confirmar sempre a versão/população de referência mais adequada ao paciente avaliado |
| Interpretação | Tempo maior sugere maior risco de queda e menor mobilidade funcional; nunca comunicar isoladamente como "diagnóstico de risco de queda" — é um dado de triagem entre vários |
| Erros comuns | Não padronizar o comando de início; permitir "corrida" em vez de ritmo habitual; marcação de distância incorreta |
| Referência | Podsiadlo D, Richardson S, 1991 (publicação original); Shumway-Cook A et al., 2000 (validação do ponto de corte de risco de queda) |

### 4.4 Apoio unipodal (Single Leg Stance)

| Campo | Conteúdo |
|---|---|
| Objetivo | Avaliar equilíbrio estático |
| Indicação | Perfis `idoso`, histórico de quedas, avaliação de estabilidade de tornozelo/joelho |
| Contraindicações/precauções | Realizar sempre próximo a uma superfície de apoio (parede, barra) quando houver qualquer suspeita de instabilidade; nunca testar sem supervisão próxima em paciente com histórico recente de queda |
| Materiais | Cronômetro; superfície de apoio próxima disponível |
| Posicionamento | Paciente em pé, mãos na cintura (ou variante com braços cruzados, conforme protocolo escolhido — manter fixo entre reavaliações), eleva um dos pés do chão sem tocar a perna de apoio |
| Instruções | "Fique nesta posição o máximo de tempo possível, com os olhos abertos (ou fechados, conforme a variante escolhida)" |
| Execução | Cronometrar do momento em que o pé sai do chão até o paciente tocar o chão, perder a posição das mãos, ou atingir o tempo-teto definido pelo protocolo (comumente 30 ou 60 segundos) |
| Critérios de interrupção | Perda de equilíbrio, necessidade de apoio externo, tontura |
| Resultado | Tempo em segundos, perna testada, olhos abertos/fechados |
| Valores normativos | Variam amplamente por idade e pela variante do teste (olhos abertos vs. fechados, apoio de mãos livre vs. cruzado) — não existe um único ponto de corte universal; usar a tabela normativa específica da variante escolhida |
| Interpretação | Comparar bilateralmente (assimetria relevante entre os lados é, em si, um achado); usar como linha de base longitudinal |
| Referência | Literatura de avaliação de equilíbrio geriátrico — escolher e citar a variante/publicação específica adotada pela clínica |

### 4.5 Velocidade da marcha habitual (Gait Speed)

| Campo | Conteúdo |
|---|---|
| Objetivo | Medir a velocidade de marcha em ritmo habitual — indicador funcional simples e robusto, associado na literatura a desfechos de saúde relevantes em idosos |
| Materiais | Percurso marcado (comumente 4 a 10 metros), com trechos de aceleração e desaceleração antes/depois da zona cronometrada, cronômetro |
| Instruções | "Caminhe no seu ritmo normal, como se estivesse andando na rua" (não pedir velocidade máxima, a menos que essa seja a variante escolhida) |
| Execução | Cronometrar apenas o trecho central marcado, ignorando as zonas de aceleração/desaceleração |
| Resultado | Velocidade em m/s |
| Valores normativos | Amplamente citados na literatura: velocidade em torno de 1,2-1,4 m/s é comum em adultos saudáveis; valores abaixo de aproximadamente 1,0 m/s em idosos têm sido associados a maior risco de desfechos adversos de saúde em diversos estudos populacionais; valores muito baixos (< 0,8 m/s) são frequentemente usados como indicador de mobilidade comprometida — **estes números são citados de forma consistente na literatura, mas variam conforme o estudo populacional; confirmar a referência específica antes de comunicar como "ponto de corte" ao paciente** |
| Interpretação | Considerar idade, altura (que influencia o comprimento do passo) e objetivo do paciente |
| Referência | Studenski S et al., *Gait speed and survival in older adults*, JAMA, 2011, entre outros estudos populacionais sobre velocidade de marcha |

### 4.6 Teste de caminhada de 6 minutos (TC6)

| Campo | Conteúdo |
|---|---|
| Objetivo | Avaliar capacidade funcional submáxima (integra função cardiovascular, respiratória e musculoesquelética) |
| Indicação | Amplo — especialmente útil quando um teste de esforço máximo não é indicado ou disponível |
| Contraindicações/precauções | Seguir a triagem de prontidão (Agente 2); evento cardiovascular agudo recente; angina instável |
| Materiais | Corredor plano de pelo menos 20-30 m, cones para marcar as extremidades, cronômetro, cadeiras disponíveis ao longo do percurso para descanso se necessário, oxímetro (recomendado) |
| Espaço | Corredor reto, superfície plana e antiderrapante |
| Preparação | Paciente em repouso sentado por 10 minutos antes do início; sem exercício vigoroso nas 2 horas anteriores |
| Instruções | "Caminhe o mais rápido possível, no seu próprio ritmo, durante 6 minutos, cobrindo a maior distância possível. Você pode diminuir o ritmo, parar e descansar se necessário, mas retome assim que puder" |
| Execução | Usar frases padronizadas de incentivo em intervalos fixos (ex.: a cada minuto), sem incentivo excessivo que distorça o esforço real do paciente |
| Critérios de interrupção | Dor torácica, tontura intensa, palidez, sudorese fria excessiva, queda relevante de SpO₂ (quando monitorada), exaustão que o paciente não consiga administrar mesmo com pausa |
| Resultado | Distância total percorrida em metros |
| Valores normativos | Existem equações de predição de distância esperada por idade, sexo, peso e altura (ex.: Enright & Sherrill, 1998) — usar a equação para comparar o percentual do previsto alcançado, em vez de um valor absoluto fixo |
| Interpretação | Comparar com o valor previsto pela equação de referência e, principalmente, acompanhar a evolução longitudinal do próprio paciente |
| Erros comuns | Incentivo verbal não padronizado (motivar demais ou de menos, distorcendo o resultado); corredor mais curto que o necessário, com muitas curvas |
| Referência | American Thoracic Society, *ATS Statement: Guidelines for the Six-Minute Walk Test*, Am J Respir Crit Care Med, 2002; Enright PL, Sherrill DL, 1998 (equações de valores previstos) |

### 4.7 Teste de caminhada de 2 minutos (alternativa)

| Campo | Conteúdo |
|---|---|
| Objetivo | Alternativa ao TC6 quando o espaço disponível ou a condição do paciente não permite 6 minutos completos |
| Indicação | Pacientes com capacidade funcional muito reduzida, espaço físico limitado na clínica, ou populações específicas em que a versão de 2 minutos já está validada na literatura correspondente |
| Execução | Mesma lógica de padronização do TC6 (corredor marcado, frases de incentivo padronizadas, critérios de interrupção idênticos), porém cronometrando 2 minutos |
| Resultado | Distância total percorrida em metros |
| Valores normativos | Não intercambiáveis diretamente com os do TC6 — usar equações/tabelas específicas para a versão de 2 minutos quando disponíveis para a população em questão |
| Limitações | Menos estudada e com menos equações de referência amplamente validadas do que o TC6; preferir o TC6 sempre que o paciente e o espaço permitirem |

### 4.8 Dinamometria de preensão manual (Handgrip Strength)

| Campo | Conteúdo |
|---|---|
| Objetivo | Medir força de preensão manual — indicador simples e amplamente estudado de força global e, em idosos, componente de rastreio de sarcopenia |
| Materiais | Dinamômetro manual (ex.: tipo Jamar ou equivalente calibrado) |
| Preparação | Explicar a tarefa; permitir uma tentativa de familiarização |
| Posicionamento | Sentado, ombro aduzido e neutro, cotovelo fletido a 90°, antebraço em posição neutra, punho entre 0° e 30° de extensão (protocolo recomendado pela American Society of Hand Therapists) |
| Execução | Solicitar contração máxima e sustentada por ~3-5 segundos; realizar 2-3 tentativas por mão, com descanso entre elas; registrar o maior valor de cada mão |
| Resultado | kgf (quilograma-força) por mão |
| Valores normativos | O consenso europeu de sarcopenia (EWGSOP2, 2019) cita como força de preensão reduzida valores abaixo de aproximadamente 27 kg em homens e 16 kg em mulheres — **confirmar esses valores na versão vigente do consenso antes de aplicá-los clinicamente**, pois documentos de consenso são periodicamente revisados |
| Interpretação | Comparar entre os lados (dominante costuma ser mais forte) e, quando pertinente, frente aos critérios de sarcopenia; sempre contextualizar com idade, sexo e nível de atividade |
| Erros comuns | Posição de punho/cotovelo não padronizada entre medidas; não permitir familiarização; comparar dinamômetros de modelos diferentes ao longo do tempo |
| Referência | Consenso Europeu de Sarcopenia (EWGSOP2); protocolo de posicionamento da American Society of Hand Therapists (ASHT) |

### 4.9 Mobilidade articular (categoria geral)

**Quando aplicar:** quando a anamnese, a observação postural (Agente 4) ou a queixa do paciente apontarem uma articulação/região específica de interesse — não como bateria padrão em todas as articulações.

**Abordagem:** goniometria específica da articulação de interesse, seguindo protocolo padronizado (posicionamento do eixo do goniômetro, braços fixo e móvel alinhados aos referenciais anatômicos), com no mínimo 2 medidas por movimento.

**Referência:** normas de goniometria clínica (ex.: American Academy of Orthopaedic Surgeons).

### 4.10 Flexibilidade (categoria geral)

**Quando aplicar:** quando relevante ao objetivo do paciente (ex.: praticantes de modalidades que demandam amplitude, queixas de encurtamento muscular referido).

**Exemplo de teste:** Sit-and-Reach (banco de Wells ou equivalente), avaliando flexibilidade de cadeia posterior (isquiotibiais/lombar).

**Cuidado:** resultado de flexibilidade não deve ser usado isoladamente para prescrever alongamento — é apenas um dado de linha de base.

---

## 5. REGRA DE INTERPRETAÇÃO TRANSVERSAL (todos os testes)

Sempre separar:

- **Resultado bruto** (ex.: "TUG = 14,2 segundos");
- **Interpretação** (ex.: "acima do valor de referência comumente citado para risco aumentado de queda");
- **Hipótese/implicação** (ex.: "compatível com o histórico de queda relatado na anamnese e com a redução de força observada no Chair Stand — merece atenção prioritária no plano");
- nunca um diagnóstico funcional fechado sem o julgamento clínico do profissional.

---

## 6. CRITÉRIOS GERAIS DE INTERRUPÇÃO (aplicáveis a todos os testes de esforço)

Interromper imediatamente qualquer teste funcional/cardiorrespiratório diante de: dor torácica, falta de ar desproporcional, tontura importante, palidez ou sudorese fria excessiva, queda relevante de SpO₂ quando monitorada, ou qualquer sinal que o profissional julgue como risco. A decisão de interromper é sempre do profissional presente, nunca uma regra automática que impeça o julgamento clínico em tempo real.

---

## 7. LIMITAÇÕES GERAIS DESTA ETAPA

- Testes de campo (não laboratoriais) são estimativas práticas, não substituem avaliação médica especializada quando indicada (ex.: ergoespirometria para capacidade cardiorrespiratória precisa).
- Valores normativos citados aqui variam entre fontes e populações — este documento aponta a existência e a fonte original de cada valor, mas a clínica deve manter as tabelas normativas oficiais atualizadas como material de consulta, não memorizadas de forma aproximada.
- Um único teste nunca deve ser usado isoladamente para decisões de conduta — a força do protocolo está no cruzamento de múltiplos testes (Agente 6).
- Testes de equilíbrio e força têm variabilidade dia a dia (sono, dor, motivação) — resultados devem ser lidos com essa variabilidade em mente, especialmente em reavaliações próximas no tempo.

---

## 8. CONEXÃO COM AS DEMAIS ETAPAS

- **Agente 2 (Prontidão) → esta etapa:** gate de segurança obrigatório antes de qualquer teste.
- **Agente 4 (Postural/Biomecânica) → esta etapa:** achados de movimento orientam adaptação/priorização de testes.
- **Esta etapa → Agente 6 (Integração):** cada resultado numérico entra no Painel Integrado de Saúde (Seção 16 do prompt-mestre) nos domínios força, mobilidade, equilíbrio, capacidade cardiorrespiratória.
- **Esta etapa → Agente 7 (Plano):** testes com resultado abaixo do esperado tornam-se prioridades diretas de intervenção nos ciclos de 30/90/180/365 dias.
- **Esta etapa → Etapa 11 (Reavaliação):** todos os testes aqui descritos são desenhados para repetição padronizada, permitindo a comparação `ANTES → ATUAL → META`.

---

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 6 — Integração e Interpretação** (Etapa 7 do prompt-mestre): como cruzar os dados de todos os agentes anteriores para construir o Perfil Integrado de Saúde e Capacidade Funcional, identificar potencialidades/limitações/riscos/prioridades, e montar o Painel Integrado de Saúde (Seção 16) com critérios de classificação explícitos.
