# 11 — Revisão semanal dos agentes

**Pedido do profissional (19/10/2026):** todos os agentes fazem uma revisão semanal, coordenada pela Dra. Nina, e, se houver necessidade, **sugerem mudanças**.

**Regra central:** o agente **sugere**, o profissional **decide**. Nenhuma rodada altera regra de cálculo, texto clínico ou classificação. A rodada só atualiza o registro da revisão (este documento e `webapp/src/lib/revisaoSemanal.ts`), que a página **Estudos** (`/avaliador/estudos`) mostra.

---

## 1. Protocolo (o que cada rodada faz)

Cada rodada é feita por quem a executa em nome da Dra. Nina (assistente de IA), com os mesmos passos:

1. **Verificações técnicas:** rodar os testes de lógica, conferir se o repositório está sem pendências e se o último envio foi publicado; conferir se há dados de teste no banco; checar a data da revisão da literatura (`REVISAO_LITERATURA`).
2. **Uso do sistema (só números agregados):** consultar o banco **somente para leitura** e só com contagens (pacientes, anamneses concluídas, avaliações iniciadas, métodos de %G usados, uso da análise de movimento e do vídeo). **Nunca registrar nome, data de nascimento, telefone nem qualquer dado individual de paciente** no registro da revisão.
3. **Literatura por agente:** uma busca no PubMed por tema de cada agente, só de publicações novas (do ano anterior em diante, ordenadas pela data). Só entra como "candidato" o estudo cuja existência foi conferida e cujo resumo foi lido; o texto completo só se foi lido de fato. Nada entra na base dos agentes sem aprovação do profissional.
4. **Pendências abertas:** conferir a lista da página Estudos e dos documentos 00 a 10; registrar o que continua aberto e há quanto tempo.
5. **Por agente:** cada um dos 9 agentes (Nina, Sofia, Marco, Paula, Rita, Íris, Theo, Clara e Caio) registra: situação (sem mudança ou pontos de atenção), o que foi visto e, se houver necessidade, propostas.
6. **Proposta de mudança** (uma por item), sempre com: **o que**, **por quê**, **risco**, **base** (dado de uso, pendência ou estudo), **a opinião do agente** (recomenda aprovar, recusar ou adiar, e por quê; se houver mais de um caminho, qual recomenda) e **status** (aguardando decisão, aprovada, recusada, adiada ou feita).
   **Lembretes:** pendências que dependem do profissional (hoje, P2) ficam em `lembretes` e são repetidas pelos agentes a cada conversa até serem cumpridas. Um id estável (letra do agente + número) acompanha a proposta nas semanas seguintes.
7. **Registro:** atualizar este documento (seção da rodada) e `revisaoSemanal.ts`, rodar `tsc` e o build, e enviar ao GitHub **somente esses arquivos**.

**O que a revisão não faz:** não muda regra clínica, não aprova proposta sozinha, não apaga nem corrige dado de paciente, não cria nem altera logins e não envia nada a terceiros.

**Agendamento:** a revisão se repete toda **segunda-feira, por volta das 8h14**, como tarefa agendada (`revisao-semanal-agentes`, na seção "Agendadas" do aplicativo Claude). Ela roda **neste computador, enquanto o aplicativo Claude está aberto**; se estiver fechado na hora, roda na próxima abertura. Cada execução começa do zero e segue este protocolo. Como a tarefa roda no modo de permissão padrão, ela pode **pausar pedindo aprovação** de ferramentas (banco, PubMed, Vercel, git): clicar em "Executar agora" uma vez aprova essas ferramentas para as próximas semanas. A página Estudos avisa quando a última rodada passa de 8 dias, o que também serve de alarme caso a tarefa não tenha rodado. Para mudar o dia ou a hora, ou desligar, editar a tarefa na seção "Agendadas".

---

## 2. Rodada de 19/10/2026 (primeira)

**Resumo:** sem erro técnico (12 conjuntos de testes de lógica passaram; repositório sem pendências; revisão da literatura em 18 de 180 dias). Uso: metade dos pacientes com anamnese concluída ainda sem avaliação; todo %G registrado veio de dobras. Literatura: 3 estudos úteis, nenhum que obrigue a mudar regra. **10 propostas aguardando decisão.**

**Uso agregado (sem dados individuais):** 4 pacientes na base (eram 6 em 15/10); 4 anamneses concluídas; 3 com alertas; 2 com avaliação completa; %G de referência em 2, ambos por dobras; nenhuma bioimpedância; análise de movimento em 1 paciente; nenhum vídeo enviado; última atividade em 15/10/2026.

**Candidatos a referência (existência conferida no PubMed e resumo lido; texto completo não lido; não adotados):**

| PMID | Estudo | Agente | O que o resumo diz | Limite |
|---|---|---|---|---|
| 42490640 | Rode D, et al. PLoS One 2026;21:e0353801. Validação de estimativa de pose sem marcadores para amplitude de cotovelo | Paula | 46 pacientes; pose monocular com concordância de 0,92 na flexão (erro mínimo detectável de 6,74°), melhor que a avaliação visual; na extensão a avaliação visual foi melhor | Cotovelo, não tronco; não valida o motor do sistema |
| 42574013 | Wu MC, et al. JAMA Netw Open 2026;9:e2628227. Aptidão física e mortalidade em idosos | Rita, Caio | 13.423 idosos de 65 anos ou mais; melhores quintis de 8-foot up-and-go, apoio unipodal, cadeira em 30 s e degrau de 2 min com menor mortalidade; índice composto HR ajustado 0,39 | Observacional, Taiwan; sem cortes para adotar |
| 42362716 | Özsaydı SZ, et al. Int J Obes 2026;50:1988-1994. Cortes de IMC para obesidade em adultos turcos | Marco | Melhor corte de IMC de cerca de 28,8 kg/m² com %G por bioimpedância | População turca; reforça que o IMC varia por população |

**Propostas (todas aguardando decisão do profissional):**

| Id | Agente | Proposta | Risco |
|---|---|---|---|
| N1 | Nina | Mostrar na lista de pacientes quem concluiu a anamnese e ainda não tem avaliação | Baixo |
| S1 | Sofia | Versão das perguntas em terceira pessoa para a anamnese feita na clínica | Baixo (decisão de redação) |
| M1 | Marco | Registrar 3 leituras por dobra e usar a mediana (oferecida em 09/10; reapresentada porque o uso só tem dobras) | Baixo |
| M2 | Marco | Conferir as tabelas Pollock & Wilmore e de massa magra no livro e confirmar a correspondência dos níveis com as classes do perfil | Médio |
| P1 | Paula | Aviso de margem de erro nos ângulos medidos por vídeo (diferenças pequenas, da ordem de 7° ou menos, não devem ser interpretadas; estudo em outra articulação) | Baixo |
| P2 | Paula | Calibrar os limites de adequação do vídeo com os primeiros vídeos reais | Baixo |
| R1 | Rita | Incluir o estudo de Taiwan (2026) como referência de apoio aos testes funcionais em idosos | Baixo |
| I1 | Íris | Decidir se a triagem de sarcopenia passa a usar a tabela de massa magra | Médio |
| I2 | Íris | Revisão clínica do conteúdo das condições, começando pelas 10 sem fonte | Médio |
| C1 | Clara | Trocar o tom de "Ruim" e "Muito ruim" nos slides por linguagem mais acolhedora | Baixo (decisão de redação) |

**Sem mudança sugerida:** Dr. Theo (planos mantêm força em 2 ou mais dias por semana) e Dr. Caio (nenhuma tabela nova de VO2máx).

**Próxima rodada:** 26/10/2026.

---

### 2.1 Decisões do profissional sobre a rodada de 19/10/2026 (mesmo dia)

| Id | Decisão | Situação |
|---|---|---|
| S1 | Aprovada | **Feita**: anamnese na clínica em terceira pessoa |
| M1 | **Recusada** (pela experiência dele, mesmo sendo sugerida cientificamente) | Encerrada; não volta sem fato novo |
| M2 | **Adiada** (ele ainda não tem o livro) | Opinião da Nina e do Dr. Marco: manter as tabelas com o aviso de fonte não conferida; busca na web não achou a tabela reproduzida |
| P1 | Aprovada | **Feita**: aviso de margem de erro nos ângulos de vídeo |
| P2 | Aprovada, **em andamento** (24/10/2026): dois defeitos corrigidos com os 2 primeiros vídeos reais; limites de tolerância mantidos | Lembrete ativo: veredito do vídeo de frente confirmado pelo profissional; faltam vídeos de outros movimentos (guia de desenhos no POP, etapa 9) |
| N1, R1, I1, I2, C1 | Perguntas respondidas com a opinião do agente | **Aguardando decisão** |

**Decisões seguintes, ainda em 19/10/2026:** o profissional aprovou **N1, R1, C1 e I1**, todas **feitas no mesmo dia** (N1: coluna "Avaliação" na lista; R1: Wu 2026 na base da Dra. Rita; C1: palavras acolhedoras nos slides; I1: sarcopenia pelo índice de massa magra, com comparação antes e depois: 1 de 2 avaliações existentes deixou de ser sinalizada). **Só a I2 seguia aguardando** (revisão clínica do conteúdo das condições). **Em 24/10/2026 o profissional aprovou a I2:** a etiqueta "Texto escrito por IA, ainda não revisado" foi colocada nas 30 condições (item da lista, painel, contagem no topo da aba e na página Estudos); a revisão em lotes de 5 é do profissional, que informa quais condições revisou, e a etiqueta sai com autor e data (campo `revisao` em `lib/condicoes/catalogo.ts`). Primeiro lote: hipertensão, diabetes, obesidade, dor lombar e artrose. Todas as propostas da primeira rodada estão decididas.

**Novo pedido (19/10/2026): toda proposta traz a opinião do agente** (recomenda aprovar, recusar ou adiar, e por quê), e o profissional pode perguntar e receber a recomendação. Já valem no protocolo e na tarefa agendada.

## 3. Como registrar a decisão sobre uma proposta

O profissional responde, por exemplo, "aprovo N1 e P1, recuso M1". A rodada seguinte (ou a sessão em que a resposta chegar) muda o **status** da proposta em `revisaoSemanal.ts` para aprovada ou recusada, implementa as aprovadas, atualiza os documentos afetados e marca como feita. Propostas recusadas não voltam a ser sugeridas sem fato novo.
