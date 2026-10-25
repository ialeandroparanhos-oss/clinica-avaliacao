# AGENTE 4 — AVALIAÇÃO POSTURAL E BIOMECÂNICA

> **Responsável: Dra. Paula** (nome provisório; troca em `src/lib/agentes.ts`) — postura e biomecânica (assistente de IA; ver o padrão de especialista e integridade em `00-Arquitetura-Geral-dos-Agentes.md`, Seção 11).

> Depende de [00-Arquitetura-Geral-dos-Agentes.md](00-Arquitetura-Geral-dos-Agentes.md), [01-Agente2-Anamnese-e-Questionarios.md](01-Agente2-Anamnese-e-Questionarios.md) e [02-Agente3-Fisica-e-Antropometrica.md](02-Agente3-Fisica-e-Antropometrica.md). Grava no RIP na macroseção `postura_e_biomecanica`.

---

## 1. FINALIDADE

Documentar, de forma sistemática e comparável ao longo do tempo, o alinhamento postural, as assimetrias, a qualidade dos padrões de movimento e as possíveis compensações do paciente — como **um retrato objetivo**, não como um veredito sobre a causa de qualquer dor ou disfunção.

Este é o ponto do projeto onde o risco de sobre-interpretação é maior: uma "escoliose funcional leve" ou uma "anteriorização de cabeça" são achados extremamente comuns na população em geral, inclusive assintomática. O papel do Agente 4 é justamente impedir que um achado postural isolado vire, indevidamente, uma explicação causal para a queixa do paciente.

---

## 2. PROTOCOLO GERAL

A etapa tem dois componentes complementares:

1. **Registro fotográfico estático padronizado** (4 vistas) — documenta alinhamento em repouso.
2. **Observação de padrões de movimento** — documenta como o paciente se move sob demandas funcionais simples (agachar, alcançar, subir num degrau), revelando compensações que a foto estática não mostra.

Nenhum dos dois substitui o outro: postura estática adequada não garante padrão de movimento adequado, e vice-versa.

---

## 3. INSTRUMENTOS — LISTA MESTRE DESTA ETAPA

| Categoria | Instrumento |
|---|---|
| Essencial | câmera (celular com boa resolução é suficiente) |
| Essencial | tripé, para eliminar variação de altura/ângulo entre fotos e entre sessões |
| Essencial | fita métrica, para marcar a distância fixa câmera-paciente |
| Recomendado | simetrógrafo (grade de fundo com linhas horizontais/verticais) |
| Recomendado | prumo (fio de prumo), para referência vertical em fotos e observação direta |
| Recomendado | marcadores anatômicos adesivos (pontos de referência palpáveis) |
| Recomendado | goniômetro e inclinômetro, para quantificar amplitudes e ângulos específicos quando indicado |
| Opcional | bastão, para observação de mobilidade de ombro e padrões de rotação |
| Opcional | plataforma de força ou sistemas de análise de movimento, quando a clínica dispuser — fora do escopo padrão deste protocolo de base |

---

## 4. PROTOCOLO FOTOGRÁFICO PADRONIZADO

### 4.1 Preparação do ambiente

- Fundo neutro, idealmente com o simetrógrafo (linhas de referência horizontal/vertical).
- Iluminação uniforme, sem sombras fortes de um só lado — evitar contraluz (janela atrás do paciente).
- Câmera fixada em tripé, na altura aproximada do quadril do paciente, sempre à mesma distância (marcar o ponto no chão com fita, para reprodutibilidade entre sessões).

### 4.2 Preparação do paciente

- Roupa que permita visualizar os pontos anatômicos de referência (idealmente roupa íntima esportiva ou similar, respeitando o conforto e o consentimento do paciente).
- Paciente descalço.
- Cabelos presos, quando cobrirem pontos de referência da coluna cervical.
- Explicar ao paciente, antes de fotografar, a finalidade das fotos e obter consentimento explícito para o registro de imagem, conforme a política da clínica.

### 4.3 Pontos anatômicos de referência (marcação opcional, mas recomendada)

Processo espinhoso de C7, ângulos inferiores das escápulas, espinhas ilíacas ântero-superiores (EIAS), espinhas ilíacas póstero-superiores (EIPS), patelas, maléolos mediais — marcar com adesivo quando o objetivo for mensuração angular posterior, não apenas registro visual.

### 4.4 As quatro vistas

| Vista | Distância da câmera | O que padronizar |
|---|---|---|
| Anterior | Fixa (ex.: 2,5 m, ajustar ao ambiente e manter constante) | Paciente de frente para a câmera, pés na largura dos ombros, olhando para frente, braços relaxados ao lado do corpo |
| Posterior | Mesma distância | Paciente de costas, mesma orientação dos pés |
| Lateral direita | Mesma distância | Paciente de perfil, maléolo lateral alinhado com um ponto de referência fixo no chão |
| Lateral esquerda | Mesma distância | Espelha a lateral direita |

**Regra fixa:** a distância câmera-paciente, a altura da câmera e o ponto onde o paciente se posiciona devem ser **idênticos em todas as reavaliações** do mesmo paciente — sem isso, qualquer comparação de "evolução postural" é metodologicamente inválida.

### 4.5 O que observar em cada vista (guia para o profissional, não conclusão automática)

| Vista | Observar |
|---|---|
| Anterior | nivelamento dos ombros, nivelamento e rotação da cabeça, alinhamento do tronco em relação à linha média, nivelamento das EIAS, alinhamento dos joelhos (valgo/varo), posição e alinhamento dos pés |
| Posterior | nivelamento dos ângulos inferiores das escápulas, alinhamento da coluna em relação ao fio de prumo (curvaturas laterais aparentes), nivelamento das EIPS, alinhamento do calcâneo (valgo/varo) |
| Lateral (D e E) | posição da cabeça em relação ao ombro (anteriorização), curvaturas da coluna (cifose torácica, lordose lombar aparentes), posição da pelve (anteroversão/retroversão aparente), alinhamento do joelho (flexo/recurvato aparente), alinhamento do tornozelo/pé |

Cada achado é registrado como **observação descritiva**, não como diagnóstico postural fechado (ex.: registrar "ombro direito aparentemente mais baixo que o esquerdo à inspeção visual", não "escoliose").

---

## 5. AVALIAÇÃO DE PADRÕES DE MOVIMENTO

Complementa o registro estático observando o paciente em movimento. Selecionar os movimentos conforme o perfil e o objetivo do paciente — não aplicar uma bateria fixa e extensa por padrão.

### 5.1 Exemplos de padrões observacionais comuns

| Padrão de movimento | O que observa |
|---|---|
| Agachamento livre (squat) | profundidade alcançada, alinhamento do joelho em relação ao pé (valgo dinâmico), inclinação de tronco, elevação dos calcanhares, compensações lombares |
| Agachamento unipodal | controle de quadril/joelho no plano frontal, estabilidade de tornozelo, compensações de tronco |
| Elevação de braços acima da cabeça (overhead reach) | mobilidade de ombro, compensação lombar (hiperextensão), assimetria entre os lados |
| Subida em degrau | controle de quadril e joelho durante fase de apoio único, compensações de tronco |
| Toque no chão em pé (hip hinge/flexão de tronco) | padrão de movimento lombopélvico, distribuição entre flexão de quadril e flexão lombar |

**Nota:** existem protocolos comerciais estruturados e padronizados de rastreio de movimento (ex.: Functional Movement Screen — FMS), que exigem certificação específica do avaliador e possuem critérios de pontuação próprios e licenciados. Este documento não reproduz esses critérios proprietários; se a clínica optar por adotar um protocolo comercial certificado, ele deve ser aplicado seguindo o manual oficial do próprio detentor do protocolo, e o Agente 4 apenas organiza o registro do resultado no RIP — não substitui a certificação nem o manual do método.

### 5.2 Registro de mensurações angulares específicas (quando indicado)

Quando a observação visual identificar um achado que mereça quantificação (ex.: amplitude de dorsiflexão de tornozelo aparentemente reduzida, notada durante o agachamento), o goniômetro ou inclinômetro pode ser usado para uma medida pontual complementar — sempre descrita com o método, o instrumento e o número de medidas realizadas, seguindo o mesmo rigor de padronização das demais etapas.

### 5.3 Análise automática das fotos e parecer do agente (implementado no sistema)

A aba Postural analisa as 4 fotos e redige um parecer descritivo, que o avaliador revisa.

**Como funciona**
- Um modelo de estimativa de pose (MediaPipe Pose Landmarker) localiza ~20 pontos do corpo na foto (orelhas, ombros, cotovelos, punhos, quadris, joelhos, tornozelos, calcanhares, pés). A análise roda **no navegador do avaliador**: a foto não é enviada a nenhum serviço de IA; só o modelo (~30 MB) é baixado na primeira vez e fica em cache.
- A imagem é desenhada no estilo de aplicativos de análise postural: esqueleto, articulações, linha de prumo tracejada, grade, cantoneiras e etiquetas com o valor medido.
- Medidas, por vista:
  - **Anterior/posterior:** inclinação da linha dos ombros e dos quadris (°); inclinação da cabeça (°); inclinação do tronco (°); desvio dos joelhos em relação ao eixo quadril–tornozelo (valgo/varo aparente); deslocamento da cabeça e dos quadris em relação à linha de prumo (% da altura nariz–tornozelo).
  - **Laterais:** posição da cabeça em relação ao ombro (ângulo); inclinação do tronco; flexão/recurvato do joelho; deslocamento de orelha, ombro, quadril e joelho em relação à linha de prumo do tornozelo.
- Referências práticas de destaque (**do sistema, sem validação publicada**): diferença ≥ 3° = "discreta"; ≥ 6° = "evidente"; joelho ≥ 4° / 8°; tronco de perfil ≥ 5°; cabeça à frente ≥ 10°. Pontos com visibilidade < 0,5 são ignorados.
- O parecer é montado só com linguagem descritiva ("à inspeção da foto...", "aparente"), cita a evidência fraca entre postura e dor, lista as limitações e sugere confirmação clínica (palpação, nivelamento, goniometria, testes de movimento). Fica em campo editável, com marca de "revisado e aprovado pelo avaliador"; o relatório técnico indica se é rascunho automático ou revisado. O parecer **não** entra no cálculo do Perfil Integrado.

**Estilo do parecer e salvamento automático (valem para todas as abas):**
- O avaliador escolhe, em cada parecer, entre **"sucinto e objetivo"** (uma linha por tema) e **"mais explicativo"** (critério usado, como ler o resultado, limites e próximo passo). A escolha fica lembrada. Trocar o estilo ou gerar de novo nunca apaga um texto editado sem confirmação, e o parecer avisa quando os dados mudaram depois de gerado.
- Há parecer em: Anamnese (Sofia), Física (Marco), Postural (Agente 4), Funcional (Rita), Cardiorrespiratória (Caio) e Perfil Integrado (Íris). Todos usam os mesmos resultados do painel integrado; não criam classificação nova.
- Tudo o que é digitado, as fotos enviadas, as análises e os pareceres são **gravados automaticamente como rascunho** (cerca de 1,5 s após a última alteração e ao sair da aba). O rascunho atualiza a ficha atual do paciente; o botão **Salvar** é o que registra a avaliação no histórico usado nas reavaliações.

**Escápulas: marcação manual (opcional) na foto posterior.** O modelo de pose não enxerga as escápulas, então o avaliador clica nos pontos, de preferência sobre **marcadores adesivos colocados na pele antes da foto**:
- Protocolo: paciente de pé, relaxado, braços ao lado do corpo; câmera na altura do meio das costas, na mesma distância em todas as reavaliações; marcadores em C7, no início da prega entre os glúteos (linha média), no ângulo inferior de cada escápula e na raiz da espinha da escápula de cada lado; dois adesivos a distância conhecida (ex.: 10 cm) como referência de escala.
- Medidas: inclinação da linha dos ângulos inferiores e da linha das raízes da espinha (°); distância de cada ponto à linha média (cm com a escala; sem ela, só a razão D/E).
- **Limite (D'hondt et al. 2020, PMID 33131391):** em revisão de 31 instrumentos, não há evidência suficiente para recomendar nenhum instrumento clínico de avaliação da escápula. Por isso não há corte de normalidade, o termo "discinesia" não é usado e o registro serve apenas para comparar o mesmo paciente, com a mesma técnica, no tempo. O teste de deslizamento lateral clássico exige fotos com o braço em 3 posições; aqui só se registra a posição de repouso.

**Outras ideias de registro (ainda não implementadas):** teste de Thomas modificado (flexores do quadril), rotação torácica, rotação cervical, flexão e rotação externa de ombro por goniometria (já disponíveis na goniometria livre) e Y-Balance para estabilidade dinâmica.

**O que o método NÃO mede:** escápulas, curvaturas da coluna, inclinação pélvica e rotações. O erro cresce com câmera inclinada, pessoa pequena no quadro, roupa larga e pés cortados; o sistema avisa quando detecta enquadramento ruim (tornozelos fora do quadro, pessoa ocupando < 55% da altura).

---

## 6. REGRA DE LINGUAGEM OBRIGATÓRIA (Seção 12 do prompt-mestre)

Este é o ponto mais sensível de todo o Agente 4. **Nunca afirmar que uma alteração postural isolada é causa de dor ou disfunção.** Usar exclusivamente linguagem de correlação, nunca de causalidade direta:

- "pode estar associado a..."
- "merece investigação adicional em conjunto com..."
- "é compatível com o padrão relatado na anamnese, mas não o explica isoladamente"
- "deve ser correlacionado com os achados funcionais e com a queixa de dor"

Nunca usar: "a causa da dor é...", "isso está causando...", "esse desvio é responsável por...".

**Justificativa científica desta regra:** alterações posturais estáticas têm associação fraca e inconsistente com dor na literatura biomecânica atual — presença de assimetria postural é comum também em pessoas assintomáticas. Tratar achado postural como "a causa" seria cientificamente insustentável e clinicamente arriscado (pode gerar medo do movimento/cinesiofobia no paciente, tema já levantado no capítulo de Dor do Agente 2).

---

## 7. SINAIS DE ALERTA

| Achado | Nível | Ação |
|---|---|---|
| Assimetria estrutural progressiva referida pelo paciente (piora perceptível ao longo do tempo, fora de contexto de treinamento) | 2 | Sinalizar para investigação adicional, possível encaminhamento |
| Deformidade estrutural evidente não referida anteriormente na anamnese, especialmente em criança/adolescente em fase de crescimento | 2-3 | Sinalizar encaminhamento para avaliação especializada (ortopedia) |
| Dor aguda desencadeada durante a observação de movimento, fora do padrão de dor já mapeado na anamnese | 2 | Interromper aquele movimento específico; registrar; não insistir para "completar o protocolo" |

---

## 8. LIMITAÇÕES

- Avaliação postural fotográfica é observacional e qualitativa — mesmo com marcadores e mensuração angular pontual, não tem a precisão de sistemas de captura de movimento 3D.
- Achados posturais estáticos têm relação fraca e não linear com sintomas — evitar qualquer linguagem que sugira relação direta de causa e efeito.
- A confiabilidade interexaminador da inspeção visual é moderada — por isso a padronização do protocolo fotográfico (distância, altura, iluminação) é mais importante do que parece à primeira vista.
- Protocolos comerciais de rastreio de movimento (quando usados) têm seus próprios critérios proprietários, que não são substituídos por este documento.
- A análise automática (Seção 5.3) é uma estimativa por foto 2D: os cortes de 3° e 6° são referências práticas do sistema, não limites validados; o lado direito/esquerdo segue o lado anatômico do paciente (foto sem espelhamento) e deve ser conferido pelo avaliador.

---

## 9. REFERÊNCIAS / BASE CONCEITUAL

- Literatura em biomecânica clínica sobre a fraca associação entre alterações posturais estáticas isoladas e dor musculoesquelética — usar essa evidência para justificar a Seção 6 acima ao formar profissionais no uso do protocolo.
- Manuais de goniometria e avaliação postural clínica (ex.: normas de goniometria da American Academy of Orthopaedic Surgeons — AAOS, ou equivalentes) para os procedimentos padronizados de mensuração angular.
- Documentação oficial de protocolos comerciais de rastreio de movimento, quando adotados pela clínica (a ser referenciada especificamente se e quando esse protocolo for licenciado).

---

## 10. CONEXÃO COM AS DEMAIS ETAPAS

- **Dor (Agente 2) → esta etapa:** direciona quais movimentos observar com mais cautela e ajuda a interpretar (nunca a "confirmar causa") achados posturais à luz da queixa relatada.
- **Esta etapa → Agente 5 (Funcional):** compensações observadas aqui (ex.: valgo dinâmico de joelho no agachamento) orientam quais testes funcionais específicos priorizar ou adaptar.
- **Esta etapa → Agente 6 (Integração):** alimenta o domínio "postura/movimento" do Perfil Integrado — sempre como achado a ser cruzado, nunca isoladamente conclusivo.
- **Esta etapa → Etapa 11 (Reavaliação):** as mesmas 4 vistas fotográficas, no mesmo setup padronizado, permitem comparação visual direta `ANTES → ATUAL`.

---

## ATUALIZAÇÃO 15/10/2026 — ANÁLISE DE MOVIMENTO (pedido do profissional)

**Pedido:** complementar a postura estática com a análise de um movimento, por exemplo a **flexão de tronco**, em duas vistas: **sagital** (de lado) e **frontal**.

- **Onde:** aba Postural, seção "Análise de movimento" (antes do parecer). Código: `lib/avaliacao/movimento.ts` e `components/avaliador/AnaliseMovimento.tsx`.
- **Movimentos disponíveis (5):** flexão de tronco, extensão de tronco, inclinação lateral de tronco, agachamento (sem carga) e elevação dos braços acima da cabeça. Cada um traz o texto de como executar e posicionar a câmera.
- **Por movimento e por vista (sagital e frontal):** foto no ponto máximo (arquivo privado da clínica, mesma pasta das fotos posturais, sem envio a serviço de IA); **roteiro de observação** (caixas para marcar); anotação livre; e **ângulo medido na própria foto** (3 pontos, ou inclinação de uma linha em relação à vertical). Na flexão de tronco há também a **distância dedos-chão (cm)**.
- **Parecer da Dra. Paula:** o parecer (sucinto e explicativo) ganhou o bloco "Análise de movimento" e se atualiza enquanto o texto não for editado. Quando o paciente nega dor mas o avaliador marcou dor ou desconforto no movimento, a Dra. Íris aponta a discrepância para conversar na devolutiva.
- **Limites (também escritos na tela e no parecer):** é registro **descritivo e aparente à inspeção**; os roteiros de observação são um **roteiro prático do sistema, sem corte nem validação publicada**; o ângulo é 2D e depende do enquadramento e da inclinação da câmera; nada disso define diagnóstico ou causa de dor. Não entra no cálculo do domínio de mobilidade do perfil (que continua usando os testes objetivos).
- **Dados:** gravados em `postural.movimentos` (sem mudança no banco); o autosave e o histórico já cobrem.
- **Vídeo do movimento, análise inicial automática (16/10/2026):** em cada vista há "Enviar vídeo". O navegador amostra o vídeo (cerca de 5 quadros por segundo, até 50 quadros), detecta os pontos do corpo em cada quadro com o mesmo motor da foto (MediaPipe, **neste computador: o vídeo não é enviado a nenhum serviço de IA**; só o modelo é baixado) e calcula: inclinação máxima do tronco em relação à vertical e o instante em que ocorre, menor ângulo ombro-quadril-joelho e do joelho (lado mais visível), punhos acima dos ombros (elevação dos braços) e desvio lateral do tronco (vista frontal, em relação à imagem). O **quadro do ponto máximo** vira a foto da vista (e pode receber a medição de ângulo); o vídeo é guardado no arquivo privado da clínica **somente se tiver até 45 MB** (limite do armazenamento); acima disso a análise e o quadro são guardados e o vídeo não. Código: `lib/avaliacao/videoMovimento.ts` (conta, testada) e `lib/avaliacao/videoPose.ts` (leitura no navegador). Entra no parecer da Dra. Paula como "análise inicial automática do vídeo (2D, a confirmar pelo avaliador)".
  - **Limites:** é triagem 2D de primeira passada; depende de câmera parada, corpo inteiro, vista correta e luz; descarta só quadros com pico isolado e absurdo; há avisos quando o corpo é detectado em poucos quadros, quando a vista parece errada e quando o vídeo é muito curto; **não há corte de normalidade e não substitui a observação do avaliador**, que marca o roteiro. Não foi validada contra medida por goniômetro nem por captura de movimento. Testado com vídeos sintéticos; **falta a conferência com um vídeo real do profissional.**
- **Adequação do vídeo para leitura (17/10/2026, pedido do profissional):** depois de cada análise, o app diz se o vídeo foi **adequado, adequado com ressalvas ou NÃO adequado** para a leitura automática, **com o porquê** (selo verde, amarelo ou vermelho e a lista de critérios, cada um com o que foi medido). Critérios: corpo detectado nos quadros (≥ 80% ok; < 60% falha); duração (de 3 a 40 s ok; < 2 s falha); corpo inteiro no quadro (tornozelos visíveis e dentro da imagem); tamanho da pessoa na imagem (tronco ≥ 18% da altura do quadro ok; < 12% falha); câmera parada e pés no lugar (deslocamento dos tornozelos em relação ao tronco); resolução (lado menor ≥ 480 px ok; < 360 px falha); luz e contraste (brilho médio de 60 a 200 de 255 ok; < 40 ou > 225 falha); movimento presente (variação de pelo menos 15°, ou 0,4 comprimento de tronco nos punhos); movimento completo (ponto máximo no meio do vídeo, e não no começo ou no fim); vista compatível com a escolhida. Qualquer falha = não adequado; só ressalvas = adequado com ressalvas. A frase de adequação também entra no parecer. Código: `avaliarAdequacao` em `lib/avaliacao/videoMovimento.ts` (testada); luz e resolução vêm de `videoPose.ts`.
  - **Limites:** os limites são **referências práticas do sistema, sem validação publicada**; dizem se a leitura automática 2D é confiável, **não se o movimento do paciente está bom ou ruim**. Análises de vídeo gravadas antes desta data não têm o veredito (reenviar o vídeo para obtê-lo).
- **Margem de erro dos ângulos de vídeo (P1, aprovada e feita em 19/10/2026):** a tela e o parecer trazem o aviso de que ângulos medidos automaticamente em vídeo têm erro: num estudo de 2026 com 46 pacientes (cotovelo, Rode et al., PLoS One, PMID 42490640; resumo lido, texto completo não lido), o melhor método automático teve erro mínimo detectável de cerca de 7° e a avaliação visual foi melhor na extensão; **para tronco, quadril e joelho a margem não foi validada**. Orientação: não interpretar diferenças da ordem de 7° ou menos, entre momentos ou entre lados, e confirmar com goniômetro ou inclinômetro. O estudo entrou na base científica da Dra. Paula. Nota: os cortes práticos de 3° e 6° são das fotos estáticas; para vídeo vale esta cautela maior.
- **P2 em andamento (24/10/2026):** com os 2 primeiros vídeos reais (1 paciente, flexão de tronco, de lado e de frente) foram corrigidos dois defeitos. (1) Na flexão vista de frente os ombros descem abaixo do quadril e o sistema escrevia "176° de desvio lateral"; agora o desvio lateral é medido no plano da imagem, só nos quadros em que o tronco não está muito encurtado, e a flexão de frente aparece como "tronco encurtado na imagem (X% do maior comprimento)", com a orientação de ler o ângulo na vista de lado. (2) O critério "corpo inteiro no quadro" mandava sempre afastar a câmera; agora separa pés cortados pela imagem (afastar a câmera) de pés dentro da imagem mas sem leitura confiável (conferir luz, contraste e o que cobre os pés). Os limites de tolerância não mudaram: 2 vídeos de 1 movimento não bastam. Análises gravadas antes desta data mantêm o texto antigo; reenviar o vídeo gera o novo. O profissional confirmou que o veredito de reprovado do vídeo de frente bateu com o que viu. Falta enviar vídeos de outros movimentos (agachamento, elevação dos braços, extensão e inclinação lateral, de lado e de frente), filmados como no guia de desenhos do POP (etapa 9); os agentes lembram a cada conversa.
- **Pendente:** o profissional pode pedir novos movimentos (ex.: rotação de tronco, ponte, apoio unipodal) ou corrigir o roteiro de observação de cada um.

## ATUALIZAÇÃO 26/10/2026 — MODO SIMPLES DA AVALIAÇÃO POSTURAL (pedido do profissional)

O profissional não trabalha com avaliação postural e achou a aba ampla demais. Decisão (opção A, com a opinião da Dra. Paula): **modo simples como padrão**, com o restante atrás do botão "Mostrar modo avançado". Motivo: assimetrias leves são comuns, a ligação entre a postura estática e a dor é pequena na literatura que o sistema já registra (Rani 2023, PMID 36825268; D'hondt 2020, PMID 33131391, sem instrumento clínico de escápula com evidência suficiente), e o que mais ajuda a prescrever é ver como a pessoa agacha e flexiona o tronco.

**Modo simples:** (1) três fotos, de frente, de costas e de lado (lateral direita); (2) **lista curta do que o avaliador viu**, por vista, em caixas de marcar: de frente (cabeça inclinada, ombros desnivelados, pelve desnivelada, joelhos para dentro, joelhos para fora, pés muito virados), de costas (ombros desnivelados, escápulas diferentes, desvio lateral da coluna, pelve desnivelada, calcanhares desalinhados ou arco caído), de lado (cabeça à frente, ombros arredondados, curva lombar aumentada ou reduzida, pelve projetada, joelhos travados), e "Nada de relevante nesta vista"; (3) dois movimentos em foto no ponto máximo, **agachamento e flexão de tronco**, com o roteiro de marcar de sempre (sem vídeo e sem medida de ângulo); (4) **parecer curto** da Dra. Paula: o que foi visto, os movimentos, "Atenção na execução do treino" (pontos de observação por achado, como acompanhar o joelho no agachamento ou comparar os lados nos exercícios unilaterais; **não é prescrição nem promessa de corrigir a postura**; escápula e desvio de coluna só pedem registro, comparação e, se acentuado ou com dor, encaminhamento) e a frase de limite ("Assimetrias leves são comuns e, sozinhas, não indicam problema..."). Tempo estimado: 10 a 12 minutos (antes, 20 a 30).

**Modo avançado (nada foi apagado):** lateral esquerda, análise automática das fotos, marcação das escápulas, vídeo com análise de adequação e os movimentos elevação dos braços, extensão e inclinação lateral. **A ficha que já tem registros avançados abre sozinha no avançado**, para nada ficar escondido; o modo escolhido fica gravado na ficha. A lista curta vale nos dois modos e entra no começo do parecer avançado.

**Onde mais mudou:** os relatórios e o cruzamento de discrepâncias leem os achados marcados junto com o texto livre de cada vista; a supervisão da Nina passou a chamar a área de "Postura e movimento" e a contar também a lista curta e os movimentos (não só as fotos). A P2 (calibrar a adequação do vídeo) passou a ser opcional, porque o vídeo é do modo avançado. Código: `lib/avaliacao/posturaSimples.ts` (função pura, 32 verificações) e `components/avaliador/AbaPostural.tsx`. POP versão 1.2 e guia de desenhos atualizados (agora com a flexão de tronco).
## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 5 — Avaliação Funcional** (Etapa 6 do prompt-mestre): critérios de seleção de testes por perfil de paciente, e o detalhamento completo (objetivo, indicação, contraindicações, materiais, execução, critérios de validade/interrupção, valores normativos, interpretação) dos testes citados no prompt-mestre — 30-Second Chair Stand, Five Times Sit-to-Stand, Timed Up and Go, apoio unipodal, velocidade da marcha, teste de caminhada de 6 minutos, dinamometria, entre outros.
