# AGENTE 7 — PLANO DE INTERVENÇÃO

> **Responsável: Dr. Theo** — prescrição e planejamento do exercício (assistente de IA; ver o padrão de especialista e integridade em `00-Arquitetura-Geral-dos-Agentes.md`, Seção 11).

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

## REVISÃO 07/10/2026 — PLANO COM CIÊNCIA E DECISÃO DO AVALIADOR

**Horizontes:** 30, 60, 90 dias e **anual (365)**. O horizonte de 180 dias foi retirado; itens antigos nele aparecem numa seção "plano anterior" para serem movidos.

**O que o sistema sugere (apoio à decisão, nunca prescrição automática).** A partir do Perfil Integrado e dos dados do paciente (FC alvo calculada, dor por região, testes, objetivo declarado), cada domínio em "prioridade" ou "atenção" gera sugestões por horizonte com:
- a **dose** (frequência, volume, intensidade, progressão);
- o **resultado do paciente** que a motivou;
- a **evidência** (resumo, nível de certeza, ressalva e links das fontes);
- o **indicador** de sucesso (como saber se funcionou);
- a frase do paciente ligada à prioridade, quando existe.

Domínios cobertos: força (inclui conduta na triagem de sarcopenia/dinapenia), equilíbrio/quedas, capacidade cardiorrespiratória, composição corporal, dor (com sinais de alerta e fatores psicossociais), sono, bem-estar emocional, estilo de vida, mobilidade e funcionalidade. Além disso: **segurança** (liberação médica quando PAR-Q+ positivo, risco cardiovascular alto ou alerta de precaução), **pendências** de avaliação e **reavaliações programadas** em 30/60/90/365 dias.

**Regras de sequência.** No início entram no máximo **3 frentes de intervenção** ao mesmo tempo (adesão); as demais começam um horizonte depois, com aviso no texto. Ordem de precedência: prioridade antes de atenção; dentro da classe, dor e bem-estar (condicionam o exercício); depois o que se liga ao objetivo do paciente; depois a ordem funcional (equilíbrio, força, cardio, função, composição, sono, mobilidade, estilo de vida). O avaliador pode mover qualquer item de horizonte.

**Decisão item a item.** Todo item chega "a revisar". O avaliador marca **Concordo**, **Discordo** (com o motivo, que fica registrado), **Editar** (guarda o texto sugerido original) ou **adiciona** itens manuais. Só os itens aprovados (concordo, editado, manual) entram no resumo, no relatório técnico e no relatório do paciente. "Gerar sugestões" de novo só acrescenta o que falta: não duplica nem altera o que já foi decidido. Planos antigos (sem status) contam como aprovados. O salvamento do plano deixou de apagar as metas da aba Reavaliação.

**Base científica usada** (consultada em resumos e páginas de síntese entre 02 e 07/10/2026; confirmar na fonte): OMS 2020; ACSM 2026 (treino de força, adultos saudáveis), 2011 (aeróbio e flexibilidade), 2009 (peso) e 2015 (triagem); Cochrane 2019 (quedas); ICFSR 2021; EWGSOP2; PROT-AGE e ESPEN (proteína); AHA 2016, Mandsager 2018 e Kodama 2009 (aptidão e mortalidade); meta-análise 2023 de HIIT; Singh 2023 (exercício e saúde mental); ACP 2016 (insônia); NICE NG59 e modelo de monitoramento da dor; Michie 2009 (técnicas de mudança de comportamento).

**Limites.** As doses seguem a literatura de adultos saudáveis e devem ser adaptadas a doenças, dor e risco cardiovascular. A evidência de dor vem de diretriz de dor lombar e de ensaios em tendinopatias (extrapolar com cautela). O motor ordena e sugere, mas não substitui o raciocínio clínico.

## REVISÃO 08/10/2026 — SERVIÇOS DA CLÍNICA NO PLANO

O Dr. Theo agora sugere, a partir dos achados da avaliação e da anamnese, **quais serviços da clínica podem entrar no plano e quando** (30, 60, 90 dias ou anual): fisioterapia, musculação, Pilates, RPG, medicina tradicional chinesa (acupuntura), massoterapia e psicologia. Código: `lib/integracao/servicos.ts`; tela: aba Plano, bloco "Serviços da clínica que podem entrar no plano".

**Como funciona**
- Cada serviço traz: **por que** (os achados que o motivaram), **quando** (etapas por horizonte, com a sequência entre serviços), se é **indicado** ou **opcional**, e o que a **literatura** diz (nível de evidência, divergências e referências conferidas).
- O avaliador concorda, discorda (com o motivo), edita a classificação e as etapas, ou remove. Só o aprovado vai para o relatório e para o paciente.
- O gerar de novo não duplica serviços e não altera os que você já decidiu.

**Regras (gatilhos) e sequência**
- **Fisioterapia:** dor com intensidade a partir de 4/10 ou sem cronicidade, relato de inflamação, lesão ou cirurgia, problema articular no PAR-Q+, mobilidade com assimetria, risco de queda. Etapas: 30 dias iniciar; 60 reavaliar a continuidade; 90 alta ou manutenção.
- **Musculação:** força reduzida, triagem de sarcopenia, composição corporal com atenção, sedentarismo ou 60 anos ou mais. Se houver **fase delicada** (dor de 7/10 ou mais, inflamação ou sinal de alerta), o fortalecimento fica dentro da fisioterapia e a **musculação começa aos 90 dias**; sem isso, começa aos 30.
- **Pilates:** dor lombar ou cervical, mobilidade com assimetria, core alterado, equilíbrio com atenção, ou dor musculoesquelética em reabilitação. Entra aos 60 dias quando há fisioterapia no início.
- **RPG:** só com dor crônica na coluna (opcional).
- **Acupuntura/MTC:** só com dor musculoesquelética crônica (opcional, evidência divergente).
- **Massoterapia:** dor tipo peso/aperto, estresse de 5/10 ou mais ou trabalho com demanda física (opcional, apoio de conforto).
- **Psicologia:** triagem de bem-estar com atenção ou prioridade, fatores psicossociais da dor, estresse alto, sono muito ruim; ideação de autolesão = indicado e prioridade de encaminhamento.
- **Sinal de alerta** (bandeira vermelha ou liberação médica necessária): os serviços com exercício só começam **após a liberação médica**.

**Exemplo-guia do profissional (reproduzido pelo sistema):** dor no joelho com inflamação → fisioterapia nas primeiras semanas; no 2º mês acrescentar Pilates e reavaliar a continuidade da fisioterapia; musculação a partir de 3 meses; acupuntura opcional.

**Evidência conferida no PubMed (resumo e limites)**
- Exercício terapêutico na artrose de joelho: reduz dor (alta qualidade) e melhora função (moderada) — Fransen 2015, Cochrane. Para dor lombar: NICE NG59 (educação e exercício).
- Pilates na dor lombar: melhor que nenhuma intervenção (qualidade baixa a moderada), **sem superioridade sobre outros exercícios** — Yamato 2015, Cochrane. Para outras queixas o sistema não tem dado conferido; por isso é sempre opcional.
- RPG na dor lombar crônica: 7 ensaios (334 pacientes), melhor que outros programas de exercício; poucos estudos — Gonzalez-Medina 2021.
- Acupuntura: revisão de revisões (2017-2022) com efeito positivo em dor crônica, dor lombar e artrose de joelho (autores ligados a sociedade de medicina chinesa; qualidade variável); **a NICE (NG59, 2016) não recomenda acupuntura na dor lombar**. Por isso é opcional e nunca substitui o exercício.
- Massagem na dor lombar: alívio só a curto prazo, evidência baixa a muito baixa — Furlan 2015, Cochrane.
- Terapia cognitivo-comportamental na dor crônica: benefício pequeno ou muito pequeno — Williams 2020, Cochrane.
- Exercício supervisionado x não supervisionado em ≥ 60 anos: seguro nos dois, presença igual; a supervisão somou ganho extra principalmente na força do joelho — Gómez-Redondo 2024.

**Integridade comercial:** é apoio à decisão, não tabela de vendas. O sistema só sugere serviço com achado que o justifique; marca como opcional o que tem evidência fraca ou divergente; não mostra preço; e o paciente só vê os serviços que o profissional aprovou, em linguagem simples e como convite ("se você quiser" nos opcionais), de acordo com a regra de não usar achado para pressionar venda (documento 07, Seção 5).

## REVISÃO 30/10/2026 — SERVIÇOS DA CLÍNICA: QUAIS COMBINAM COM O QUADRO, POR ONDE COMEÇAR E O QUE CADA PROFISSÃO FAZ (pedido do profissional)

**Pedido:** no plano, a partir dos resultados e dos pareceres, indicar **quais serviços da clínica** combinam com o quadro atual (psicologia, medicina chinesa, fisioterapia e suas áreas, musculação e Pilates), lendo o que cada profissão faz e em que ajuda. Exemplo dado: dor intensa na anamnese → serviços para a dor primeiro; depressão → serviços para o humor. **O sistema não prescreve exercício** (tipo, carga, frequência, "leve a moderado"): isso é do profissional de cada serviço.

**O que mudou:**
1. **Lista de serviços = a da clínica.** RPG e massoterapia deixaram de ser serviços à parte: o RPG passou a ser uma técnica dentro da fisioterapia (área "coluna e postura") e a massoterapia não é oferecida. Planos antigos que já têm esses itens decididos continuam abrindo; os que estavam só "sugeridos" saem na próxima sugestão.
2. **Fisioterapia por áreas.** O cartão da fisioterapia lista as áreas indicadas para o quadro, cada uma com o motivo e o que faz: **ortopédica e musculoesquelética** (dor, lesão, cirurgia, artrose), **coluna e postura** (dor de coluna, core alterado, inclui RPG), **geriátrica / equilíbrio e prevenção de quedas** (queda no último ano ou equilíbrio ruim; o nome "geriátrica" só a partir de 60 anos), **neurofuncional** (AVC, Parkinson, neuropatia, tontura), **cardiorrespiratória** (condição do coração ou do pulmão; só com liberação médica) e **pélvica** (queixa urinária, pélvica, gestação ou pós-parto). As três últimas dependem do que está escrito na anamnese e do PAR-Q+: o sistema avisa que o avaliador deve confirmar.
3. **Por onde começar.** Cada serviço mostra "Começar agora" (primeira etapa nas primeiras semanas) ou "Entra depois (60 ou 90 dias)", e o painel abre com um quadro "Por onde começar / Entram depois". A lista fica ordenada: indicados que começam agora, depois os demais.
4. **Leitura das profissões e dos benefícios.** Cada cartão tem "Em que ajuda neste quadro" (calculado com os achados da pessoa) e um bloco "Quem atua e o que faz" (fisioterapeuta, psicólogo(a), profissional de medicina tradicional chinesa, profissional de educação física, instrutor(a) de Pilates), descrevendo o campo de atuação e em que costuma ajudar. É descrição da profissão, não promessa de resultado.
5. **Dor alta e humor.** Dor intensa (7/10 ou mais) leva a fisioterapia para o início e a musculação para depois; a medicina chinesa entra como apoio opcional também na dor intensa (a revisão conferida é de dor crônica e o texto diz isso). Humor ou ansiedade na triagem levam a **psicologia** para o início e a musculação como apoio opcional, com a referência conferida no PubMed (**Noetel et al., BMJ 2024, PMID 38355154**: o treino de força foi uma das modalidades com efeito moderado sobre os sintomas depressivos em pessoas com depressão, com confiança baixa ou muito baixa; aqui há só triagem, e o texto diz que o treino é apoio e não tratamento). A medicina chinesa para estresse, sono e humor aparece como opção do paciente **sem referência**: não foi achada no PubMed uma revisão que sirva para esse uso, e o sistema diz isso.
6. **Textos sem prescrição.** As etapas deixaram de trazer frequência, carga ou intensidade ("2x/semana", "carga leve a moderada"); dizem que o profissional define o treino.
7. **Plano já aberto:** ao clicar em "Sugerir a partir dos resultados", os serviços que ninguém mexeu (ainda "a revisar") são atualizados com o texto novo; os que o avaliador já aprovou, editou ou recusou não mudam.

Código: `lib/integracao/servicos.ts` (`PROFISSOES`, `AreaFisio`, `inicioDoServico`, `rotuloServico`), `plano.ts` (mesclar), `AbaPlano.tsx`, relatório técnico e `agentes.ts` (referência nova). 31 verificações novas. POP versão 1.6.

## REVISÃO 30/10/2026 (2) — PLANO PROVISÓRIO COM POUCOS DADOS, COM A SUPERVISÃO DA NINA MOSTRANDO O QUE FALTA (pedido do profissional)

**Pedido:** o plano de intervenção deve ser gerado mesmo com poucos dados disponíveis, e a Dra. Nina deve continuar mostrando, na supervisão, o que falta.

**Situação antes:** o botão "Sugerir a partir dos resultados" nunca foi bloqueado por falta de dado, mas com ficha quase vazia o plano saía discreto (poucos itens, nenhum serviço, mensagem "precisa de dados") e sem dizer que era preliminar.

**O que foi feito:**
1. **Plano provisório explícito.** Com confiança do perfil média ou baixa e domínios sem dado, a aba Plano mostra a faixa "Plano provisório: dá para gerar e usar já", com a confiança, quantos domínios estão sem dado e **o que coletar e onde** (por exemplo, "Força: um teste de força na aba Funcional; Dor: o capítulo de dor da anamnese"). Ao gerar, a mensagem repete o aviso.
2. **Item de pendências acionável.** O item "Completar a avaliação" do plano passa a listar cada domínio sem dado com o próximo passo e diz que o plano é provisório. Ele acompanha os dados: ao sugerir de novo, se ainda está "a revisar" é atualizado ou some quando não há mais pendência; se o avaliador já decidiu, não muda.
3. **Ponto de partida nos serviços.** Se não há nenhum serviço com achado que o justifique e a confiança não é alta, entra **só a musculação, como opção de partida**, dita como provisória, com a referência da OMS (força em 2 ou mais dias por semana). Psicologia, fisioterapia e medicina chinesa **não** são sugeridas sem achado (o sistema não "enche o pacote"); a mensagem do painel explica isso.
4. **Supervisão da Nina.** Continua com a cobertura (áreas registradas e não registradas), o aviso de "domínios sem dado" e ganha o item **"Plano de intervenção"** (nível atenção): "O plano já pode ser gerado (provisório), mas há poucos dados" ou "O plano foi gerado com poucos dados e é provisório", sempre com a lista do que falta. O relatório técnico também traz a nota de plano provisório.

**Limites:** o plano provisório é ponto de partida; as doses dos itens seguem a literatura de adultos saudáveis e devem ser adaptadas pelo avaliador. Código: `perfil.ts` (`PROXIMO_PASSO_DOMINIO`, `textoDominiosSemDado`), `planoCiencia.ts`, `plano.ts` (mesclar), `servicos.ts`, `supervisao.ts`, `AbaPlano.tsx` e o relatório técnico. 22 verificações novas. POP versão 1.7.

## AJUSTE 31/10/2026 — PLANO PROVISÓRIO COM FISIOTERAPIA, MEDICINA CHINESA E MUSCULAÇÃO CONSCIENTE (decisão do profissional)

Decisão: no plano provisório (poucos dados), entram **pelo menos a fisioterapia, a medicina chinesa e a musculação consciente** como ponto de partida, porque a anamnese e a dor já dão base para começar. Antes entrava só a musculação. Agora, quando a confiança do perfil não é alta e o serviço ainda não saiu por uma regra com achado, ele entra como **opcional, "começar agora" e marcado como provisório**: a **fisioterapia** como avaliação inicial (com a área ortopédica quando há dor musculoesquelética relatada), a **medicina chinesa** como apoio opcional se o paciente quiser, e a **musculação consciente** com a referência da OMS. A fisioterapia e a medicina chinesa de partida **não trazem evidência** (o sistema não tem referência conferida para elas sem achado) e dizem isso; quando há achado, valem as regras de sempre, com prioridade "indicado" e as referências. **Psicologia e Pilates continuam só com achado.** O nome do serviço passou a ser **"Musculação consciente"**. **O Recovery não foi incluído** (ainda não faz parte dos serviços); as perguntas novas na anamnese também ficaram para depois. 6 verificações novas no teste de serviços. POP versão 1.8.

## PRÓXIMO PASSO SUGERIDO

Detalhar o **Agente 8 — Relatório e Devolutiva** (Etapas 7 e 8 do prompt-mestre): como transformar o Perfil Integrado e o Plano de Intervenção em um relatório compreensível ao paciente e tecnicamente adequado ao profissional, seguindo o roteiro de conversa RECONHECER → MOSTRAR → EXPLICAR → PRIORIZAR → PROJETAR → PLANEJAR, sem linguagem alarmista.
