# AGENTE 3 — AVALIAÇÃO FÍSICA E ANTROPOMÉTRICA

> Depende de [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md) e de [01-Agente2-Anamnese-e-Questionarios.md](01-Agente2-Anamnese-e-Questionarios.md). Grava no RIP na macroseção `antropometria_e_sinais_vitais`.

---

## 1. FINALIDADE

Obter, de forma padronizada e reprodutível, os dados físicos objetivos do paciente (sinais vitais, antropometria, composição corporal) que servirão de linha de base para: (a) checagem de segurança antes das etapas seguintes; (b) comparação longitudinal nas reavaliações (Etapa 11); (c) insumo para o Perfil Integrado (Agente 6).

Esta etapa só é liberada pelo Agente 1 depois que `prontidao_e_seguranca_para_exercicio` estiver resolvida (ver Etapa 0, Seção 4.2) — sinais vitais de repouso, porém, podem e devem ser coletados mesmo antes disso, pois fazem parte da própria triagem de segurança.

---

## 2. PRINCÍPIOS GERAIS DESTA ETAPA

1. **Padronização acima de tudo.** O valor de uma medida antropométrica está na sua comparabilidade ao longo do tempo — uma medida mal padronizada na avaliação inicial invalida toda a curva de evolução do paciente.
2. **Ordem lógica de coleta:** sinais vitais de repouso → antropometria básica (peso/altura) → circunferências → composição corporal. Medir sinais vitais depois de esforço ou deslocamento gera erro sistemático.
3. **Nem toda medida é necessária para todo paciente.** O Agente 3 seleciona o subconjunto relevante de acordo com as tags de perfil (ex.: paciente idoso → priorizar circunferência de panturrilha, indicador de massa muscular, além do IMC; paciente atleta → priorizar composição corporal detalhada em vez de apenas IMC, que é pouco informativo nesse perfil).
4. **Três medidas, uma verdade.** Sempre que o protocolo pedir, registrar múltiplas medidas e usar a média — nunca um valor único quando a variabilidade da técnica for conhecida (dobras cutâneas, PA).

---

## 3. INSTRUMENTOS — LISTA MESTRE DESTA ETAPA

| Categoria | Instrumento |
|---|---|
| Essencial | balança calibrada |
| Essencial | estadiômetro (ou fita métrica fixada em parede, na ausência de estadiômetro) |
| Essencial | fita antropométrica inextensível |
| Essencial | esfigmomanômetro (aneroide ou digital validado) e estetoscópio (se aneroide) |
| Essencial | frequencímetro ou palpação manual com cronômetro |
| Recomendado | oxímetro de pulso |
| Recomendado | adipômetro (compasso de dobras cutâneas) |
| Opcional | balança de bioimpedância (BIA) |
| Opcional | fita métrica adicional para panturrilha/braço em protocolos de rastreio de sarcopenia |

A IA nunca deve presumir que todos esses instrumentos estão disponíveis — deve sempre perguntar/confirmar o que a clínica possui antes de sugerir o protocolo de composição corporal (dobras vs. bioimpedância vs. apenas antropometria básica).

---

## 4. SINAIS VITAIS

### 4.1 Pressão arterial (PA)

| Campo | Conteúdo |
|---|---|
| Objetivo | Rastrear valores pressóricos de repouso como parte da triagem de segurança e da linha de base de saúde cardiovascular |
| Instrumento | Esfigmomanômetro aneroide + estetoscópio, ou aparelho digital validado (braço) |
| Calibração | Aneroide: verificar calibração periódica conforme rotina da clínica; digital: usar apenas modelos validados clinicamente |
| Preparação do ambiente | Local silencioso, temperatura agradável |
| Preparação do paciente | Repouso sentado de 5 minutos antes da medida; sem cafeína, exercício ou tabaco nos 30 minutos anteriores; bexiga vazia |
| Posicionamento | Sentado, costas apoiadas, pés apoiados no chão (não cruzados), braço apoiado na altura do coração |
| Execução passo a passo | 1) posicionar o manguito 2-3 cm acima da fossa cubital; 2) insuflar até 30 mmHg acima do desaparecimento do pulso radial; 3) desinsuflar lentamente (~2-3 mmHg/s); 4) registrar fase I de Korotkoff (sistólica) e fase V (diastólica) |
| Número de medidas | Mínimo 2 medidas com 1-2 minutos de intervalo; usar a média. Se a diferença entre elas for grande, realizar uma terceira |
| Registro | mmHg (sistólica/diastólica), braço utilizado, posição, horário |
| Valores de referência | Ampla e consensualmente citados na literatura: PA ótima < 120/80 mmHg; valores a partir de 140/90 mmHg em repouso, confirmados em mais de uma ocasião, são compatíveis com hipertensão. **Usar sempre a diretriz vigente da Sociedade Brasileira de Cardiologia ou equivalente para a classificação completa por faixas — não fixar aqui todas as faixas intermediárias, pois diretrizes são revisadas periodicamente** |
| Interpretação | Resultado isolado ≠ diagnóstico de hipertensão, que exige medidas repetidas em ocasiões diferentes |
| Erros comuns | manguito de tamanho incorreto para a circunferência do braço; braço sem apoio; paciente falando durante a medida; desinsuflação rápida demais |
| Sinal de alerta | PA sistólica ≥ 180 mmHg e/ou diastólica ≥ 110 mmHg, especialmente com sintomas associados (cefaleia intensa, visão turva, dor torácica) → **Nível 4**, interrompe a sequência de testes físicos e funcionais até avaliação médica |
| Limitações | uma única medida de consultório não estabelece diagnóstico; a "hipertensão do jaleco branco" é um viés conhecido |
| Referências | Diretrizes correntes da Sociedade Brasileira de Cardiologia (Diretrizes Brasileiras de Hipertensão Arterial) — confirmar a versão vigente no momento da aplicação |

### 4.2 Frequência cardíaca de repouso (FC)

| Campo | Conteúdo |
|---|---|
| Objetivo | Linha de base cardiovascular e insumo para prescrição de intensidade de exercício aeróbico |
| Instrumento | Frequencímetro, oxímetro com leitura de FC, ou palpação manual (radial ou carotídea) com cronômetro |
| Preparação | Paciente sentado, em repouso há pelo menos 5 minutos |
| Execução | Palpação: contar batimentos durante 30 ou 60 segundos (60s reduz erro de extrapolação) |
| Registro | bpm, método utilizado, horário |
| Valores de referência | Faixa normal amplamente aceita para adultos em repouso: 60-100 bpm. Atletas bem treinados podem apresentar valores mais baixos como adaptação fisiológica normal |
| Interpretação | Deve ser sempre lida em conjunto com o histórico (uso de betabloqueadores altera a resposta, por exemplo — ver capítulo Medicamentos da anamnese) |
| Sinal de alerta | FC de repouso persistentemente > 100 bpm (taquicardia) sem explicação evidente (ansiedade situacional, cafeína recente), ou < 50 bpm em paciente sintomático (tontura, fraqueza) e sem histórico de treinamento que justifique bradicardia de adaptação → **Nível 2-3**, avaliar com o profissional antes de prosseguir |
| Limitações | Medida pontual sofre influência de ansiedade situacional ("efeito da primeira visita") |

### 4.3 Saturação periférica de oxigênio (SpO₂)

| Campo | Conteúdo |
|---|---|
| Objetivo | Triagem básica de oxigenação, sobretudo relevante em pacientes com queixas respiratórias ou condições cardiorrespiratórias conhecidas |
| Instrumento | Oxímetro de pulso |
| Preparação | Mãos aquecidas; remover esmalte escuro/postiço do dedo utilizado, se possível |
| Execução | Posicionar o sensor no dedo, aguardar estabilização do sinal (alguns segundos) |
| Registro | % de SpO₂, dedo/mão utilizado |
| Valores de referência | Valor amplamente aceito como normal em ar ambiente, ao nível do mar: ≥ 95%. Em altitudes elevadas ou em pacientes com doença respiratória crônica conhecida, os valores de referência mudam e devem ser confirmados com a equipe médica |
| Sinal de alerta | SpO₂ < 90%, ou queda relevante após esforço leve → **Nível 3-4** |
| Limitações | Instrumento de triagem, não substitui gasometria; leituras podem ser afetadas por má perfusão periférica, frio, movimento |

---

## 5. ANTROPOMETRIA BÁSICA

### 5.1 Peso corporal

| Campo | Conteúdo |
|---|---|
| Objetivo | Massa corporal total, base para IMC e acompanhamento longitudinal |
| Instrumento | Balança calibrada (mecânica ou digital) |
| Calibração | Verificar com peso padrão conhecido periodicamente, conforme rotina da clínica |
| Preparação do paciente | Idealmente com roupas leves, sem calçado; mesmo horário do dia em reavaliações, quando possível |
| Execução | Paciente parado, peso distribuído igualmente entre os pés, sem apoio |
| Registro | kg, com uma casa decimal; horário e condição (jejum ou não), quando relevante |
| Erros comuns | balança em piso irregular ou não calibrada; paciente com objetos pesados no bolso |
| Limitações | não distingue massa magra de massa gorda — por isso não deve ser interpretado isoladamente |

### 5.2 Altura/Estatura

| Campo | Conteúdo |
|---|---|
| Objetivo | Base para cálculo do IMC e de índices relacionados |
| Instrumento | Estadiômetro fixo ou portátil |
| Preparação | Paciente descalço |
| Posicionamento | Pés unidos, calcanhares, glúteos e escápulas em contato com a superfície vertical quando possível; cabeça no plano de Frankfurt (linha imaginária do meato acústico ao rebordo orbital inferior, paralela ao chão) |
| Execução | Solicitar inspiração profunda no momento da leitura; cursor do estadiômetro em contato firme, mas sem compressão, no topo da cabeça |
| Registro | cm, com uma casa decimal |
| Erros comuns | cabeça fora do plano de Frankfurt; paciente na ponta dos pés; leitura com o cursor angulado |

### 5.3 IMC (Índice de Massa Corporal)

| Campo | Conteúdo |
|---|---|
| Objetivo | Indicador populacional simples de adequação peso/altura — triagem, não diagnóstico individual de adiposidade |
| Cálculo | IMC = peso (kg) / altura² (m²) |
| Valores de referência (OMS, adultos) | < 18,5 baixo peso; 18,5–24,9 eutrofia; 25,0–29,9 sobrepeso; ≥ 30,0 obesidade (com subclassificações graus I, II, III na literatura, se necessário aprofundar) |
| Interpretação | O IMC não diferencia massa muscular de massa gorda — um paciente muito musculoso pode ter IMC elevado sem excesso de adiposidade. **Nunca usar isoladamente para decisões sobre composição corporal**; sempre cruzar com circunferências e, quando disponível, composição corporal |
| Limitações | Pouco sensível em atletas, idosos (perda de estatura) e por si só não indica distribuição de gordura (que é o que mais importa para risco cardiometabólico) |
| Referência | Organização Mundial da Saúde — classificação internacional de IMC para adultos |

---

## 6. CIRCUNFERÊNCIAS

### 6.1 Circunferência de cintura

| Campo | Conteúdo |
|---|---|
| Objetivo | Estimar adiposidade central, mais associada a risco cardiometabólico do que o IMC isolado |
| Instrumento | Fita antropométrica inextensível |
| Preparação | Paciente em pé, abdômen relaxado, ao final de uma expiração normal |
| Ponto de referência | Ponto médio entre a última costela e a crista ilíaca (protocolo mais usado na literatura internacional) — a clínica deve fixar um único protocolo e mantê-lo em todas as reavaliações |
| Execução | Fita paralela ao chão, ajustada sem comprimir a pele |
| Número de medidas | 2 medidas; se divergirem, uma terceira |
| Registro | cm |
| Valores de referência (OMS) | Risco cardiometabólico aumentado: ≥ 94 cm em homens / ≥ 80 cm em mulheres. Risco substancialmente aumentado: ≥ 102 cm em homens / ≥ 88 cm em mulheres. Esses valores foram estabelecidos para populações caucasianas — há discussão na literatura sobre pontos de corte específicos por etnia, que deve ser considerada pelo profissional |
| Erros comuns | medir após inspiração forçada; fita torta ou comprimindo a pele; ponto de referência inconsistente entre avaliações |
| Referência | Organização Mundial da Saúde — *Waist Circumference and Waist-Hip Ratio: Report of a WHO Expert Consultation* |

### 6.2 Circunferência de quadril e relação cintura-quadril (RCQ)

| Campo | Conteúdo |
|---|---|
| Objetivo | Complementa a circunferência de cintura na estimativa de distribuição de gordura corporal |
| Execução | Medida na maior circunferência glútea, fita paralela ao chão |
| Cálculo | RCQ = circunferência de cintura / circunferência de quadril |
| Interpretação | Valores mais altos indicam padrão de distribuição de gordura mais central ("andróide"); a OMS também publica pontos de corte de RCQ associados a maior risco — confirmar a versão vigente do documento de referência antes de comunicar ao paciente |

### 6.3 Circunferência de panturrilha (quando indicado)

| Campo | Conteúdo |
|---|---|
| Objetivo | Indicador de massa muscular, particularmente relevante em avaliação de idosos como parte do rastreio de sarcopenia |
| Execução | Maior perímetro da panturrilha, paciente sentado com joelho a 90°, pé apoiado |
| Uso recomendado | Priorizar em pacientes com tag de perfil `idoso` — não é medida de rotina para todos os perfis |
| Referência | Consenso Europeu de Sarcopenia (EWGSOP) cita a circunferência de panturrilha como um dos indicadores de rastreio de baixa massa muscular — confirmar o ponto de corte na versão vigente do consenso |

---

## 7. COMPOSIÇÃO CORPORAL

A composição corporal é a etapa em que mais se corre o risco de "inventar precisão que não existe" — todos os métodos de campo (dobras cutâneas, bioimpedância) são **estimativas indiretas**, com margem de erro relevante. O papel do Agente 3 aqui é ajudar o profissional a escolher e aplicar o método disponível com rigor, e a comunicar o resultado com a incerteza que ele de fato tem.

### 7.1 Dobras cutâneas

| Campo | Conteúdo |
|---|---|
| Objetivo | Estimar percentual de gordura corporal a partir da espessura do tecido subcutâneo em pontos anatômicos padronizados |
| Instrumento | Adipômetro (compasso de dobras cutâneas) calibrado |
| Protocolos comuns | Protocolo de 3 dobras ou de 7 dobras de Jackson & Pollock, entre outros disponíveis na literatura — a clínica deve escolher um protocolo e mantê-lo fixo para todas as reavaliações do mesmo paciente, pois protocolos diferentes não são diretamente comparáveis |
| Preparação | Marcar os pontos anatômicos do protocolo escolhido no lado direito do corpo (convenção usual) |
| Execução | Pinçar a dobra (pele + tecido subcutâneo, sem músculo) com os dedos, aplicar o adipômetro 1 cm abaixo dos dedos, ler após ~2 segundos de estabilização do ponteiro |
| Número de medidas | Mínimo 2 medidas por ponto, com rotação entre os pontos antes de repetir (evita compressão do tecido); usar a média |
| Registro | mm por ponto, protocolo utilizado, equação de predição utilizada para o cálculo do % de gordura |
| Interpretação | O percentual de gordura resultante depende diretamente da equação de predição escolhida — dois profissionais usando dobras idênticas, mas equações diferentes, podem chegar a valores diferentes. **Nunca comparar resultados entre protocolos/equações diferentes na mesma série histórica do paciente** |
| Erros comuns | pinçar músculo junto com a dobra; não aguardar estabilização do ponteiro; medir do lado errado do corpo; trocar o ponto anatômico entre avaliações |
| Limitações | técnica muito dependente da habilidade do avaliador (erro interexaminador relevante); pouco preciso em obesidade grave |
| Referência | Jackson AS, Pollock ML — equações generalizadas de predição de densidade corporal a partir de dobras cutâneas (confirmar a equação específica utilizada e sua população de validação) |

### 7.2 Bioimpedância elétrica (BIA)

| Campo | Conteúdo |
|---|---|
| Objetivo | Estimar percentual de gordura, massa magra e água corporal por meio da resistência à passagem de corrente elétrica de baixa intensidade |
| Instrumento | Balança ou aparelho de bioimpedância (mono ou multifrequencial, membro-a-membro ou de mão) |
| Preparação do paciente | Jejum de 2-4h, sem exercício físico nas 12h anteriores, bexiga vazia, sem consumo de álcool/cafeína no dia, hidratação habitual (evitar avaliar em estado de desidratação ou hiper-hidratação aguda) — seguir as instruções específicas do fabricante do equipamento |
| Execução | Seguir rigorosamente o protocolo do fabricante (postura, contato dos eletrodos, tempo parado antes da leitura) |
| Registro | % de gordura, massa magra, água corporal (conforme o que o aparelho oferecer), modelo do equipamento utilizado |
| Interpretação | Aparelhos de diferentes fabricantes/modelos usam equações proprietárias distintas — **resultados de aparelhos diferentes não são comparáveis entre si**. Manter o mesmo aparelho em todas as reavaliações do mesmo paciente |
| Erros comuns | não seguir o jejum/repouso prévio; comparar resultados de aparelhos diferentes; comparar com dobras cutâneas como se fossem o mesmo método |
| Limitações | sensível ao estado de hidratação do paciente no momento do exame; menos confiável em extremos de composição corporal (obesidade grave, atletas muito magros) |

---

## 8. REGRA DE INTERPRETAÇÃO TRANSVERSAL

Como em toda etapa do projeto (Seção 14 do prompt-mestre), separar sempre:

- **Resultado bruto** (ex.: "circunferência de cintura = 96 cm");
- **Interpretação** (ex.: "acima do ponto de corte de risco cardiometabólico aumentado para o sexo");
- **Hipótese/implicação** (ex.: "merece correlação com o histórico familiar e com os hábitos de atividade física levantados na anamnese");
- nunca um diagnóstico de doença metabólica, que é atribuição médica.

---

## 9. LIMITAÇÕES GERAIS DESTA ETAPA

- Métodos de campo de composição corporal (dobras, BIA) são estimativas indiretas, não os métodos de referência laboratorial (ex.: DEXA, pesagem hidrostática) — devem ser comunicados ao paciente como tal.
- Pontos de corte de risco (IMC, circunferência de cintura) são baseados em estudos populacionais e podem não capturar bem casos individuais atípicos (atletas, composição corporal fora do padrão).
- Sinais vitais de consultório sofrem variabilidade situacional; uma medida isolada não fecha diagnóstico.
- Toda medida antropométrica depende da técnica do avaliador — a padronização descrita aqui existe justamente para reduzir esse erro, mas não o elimina.

---

## 10. CONEXÃO COM AS DEMAIS ETAPAS

- **Prontidão (Agente 2) → esta etapa:** sinais vitais alterados de forma grave bloqueiam a continuidade até checagem do profissional (Nível 3-4, Etapa 0 Seção 7).
- **Esta etapa → Agente 5 (Funcional):** IMC, circunferências e sinais vitais moderam a seleção de testes cardiorrespiratórios e de esforço (ex.: paciente hipertenso não controlado não deve ser submetido a teste de esforço máximo sem liberação médica).
- **Esta etapa → Agente 6 (Integração):** compõe o domínio "composição corporal" do Painel Integrado de Saúde (Seção 16 do prompt-mestre).
- **Esta etapa → Etapa 11 (Reavaliação):** todo valor aqui registrado vira ponto de comparação `ANTES → ATUAL → META`, desde que o mesmo protocolo/equipamento seja mantido — daí a ênfase em padronização ao longo de todo este documento.

---

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 4 — Avaliação Postural e Biomecânica** (Etapa 5 do prompt-mestre): protocolo fotográfico padronizado (vistas anterior, posterior, lateral direita e esquerda), pontos anatômicos de referência, instrumentos (câmera, tripé, simetrógrafo, prumo, goniômetro, inclinômetro), e a linguagem científica obrigatória para não transformar achado postural isolado em causa de dor.
