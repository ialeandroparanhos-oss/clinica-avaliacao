# LISTA MESTRE DE INSTRUMENTOS E EQUIPAMENTOS

> Consolida os instrumentos citados de forma dispersa em [02-Agente3-Fisica-e-Antropometrica.md](02-Agente3-Fisica-e-Antropometrica.md), [03-Agente4-Postural-e-Biomecanica.md](03-Agente4-Postural-e-Biomecanica.md) e [04-Agente5-Avaliacao-Funcional.md](04-Agente5-Avaliacao-Funcional.md), conforme a Seção 23 do prompt-mestre. Serve para a clínica planejar aquisições e para o Agente 1 saber, antes de cada avaliação, o que pode ou não ser oferecido a um paciente específico.

**Regra fixa:** a IA nunca deve presumir que um instrumento está disponível. Antes de sugerir um protocolo que dependa de um item `recomendado` ou `opcional`, o Agente responsável deve confirmar com o profissional se o item existe na clínica — e, na ausência dele, sugerir a alternativa mais próxima já prevista nos documentos anteriores (ex.: estadiômetro ausente → fita métrica fixada em parede, já previsto no Agente 3).

---

## 1. ESSENCIAL
*(sem isso, etapas inteiras do protocolo não podem ser executadas com o mínimo de padronização)*

| Item | Etapa(s) que dependem dele |
|---|---|
| Computador ou tablet | Todas — registro no RIP |
| Balança calibrada | Agente 3 |
| Estadiômetro (ou fita métrica fixada em parede) | Agente 3 |
| Fita antropométrica inextensível | Agente 3 |
| Esfigmomanômetro (aneroide ou digital validado) | Agente 2 (prontidão) e Agente 3 |
| Estetoscópio (se esfigmomanômetro aneroide) | Agente 3 |
| Frequencímetro (ou cronômetro para palpação manual) | Agente 3 |
| Câmera (celular com boa resolução é suficiente) | Agente 4 |
| Tripé | Agente 4 |
| Cadeira sem apoio de braço (altura padronizada) | Agente 5 |
| Cadeira com apoio de braço (altura padrão) | Agente 5 (TUG) |
| Cronômetro | Agentes 3, 4 e 5 |
| Cones/marcadores de percurso | Agente 5 |
| Fita métrica para marcação de percurso | Agente 5 |
| Termo de consentimento / documentos da clínica | Etapa 2 (Recepção) |

---

## 2. RECOMENDADO
*(eleva a qualidade e a precisão da avaliação; a ausência não impede a avaliação, mas limita algumas medidas)*

| Item | Etapa(s) que dependem dele |
|---|---|
| Oxímetro de pulso | Agente 3 e Agente 5 (monitoramento durante testes de esforço) |
| Adipômetro (compasso de dobras cutâneas) | Agente 3 |
| Simetrógrafo (grade de fundo) | Agente 4 |
| Prumo (fio de prumo) | Agente 4 |
| Marcadores anatômicos adesivos | Agente 4 |
| Goniômetro | Agente 4 e Agente 5 (mobilidade específica) |
| Inclinômetro | Agente 4 |
| Dinamômetro manual (handgrip) | Agente 5 |
| Escala de percepção subjetiva de esforço (Borg) | Agente 5 |
| Corredor de 20-30 m disponível | Agente 5 (TC6) |
| Fita métrica adicional (braço/panturrilha) | Agente 3 (rastreio de sarcopenia) |

---

## 3. OPCIONAL
*(agrega valor em contextos específicos ou clínicas com maior estrutura; nunca pressupor disponibilidade)*

| Item | Etapa(s) que dependem dele |
|---|---|
| Balança de bioimpedância (BIA) | Agente 3 — alternativa/complemento às dobras cutâneas |
| Bastão | Agente 4 (observação de mobilidade de ombro) |
| Plataforma de força / sistemas de análise de movimento | Agente 4 — fora do escopo do protocolo de base |
| Banco/degrau padronizado | Agente 5 (testes específicos de subida) |
| Banco de Wells (ou equivalente) para sit-and-reach | Agente 5 (flexibilidade) |
| Gravação de áudio da anamnese (mediante consentimento) | Agente 2 |

---

## 4. INSTRUMENTOS DE PAPEL/DIGITAIS (questionários validados)

Não são "equipamento físico", mas compõem a mesma lógica de disponibilidade — a clínica precisa ter acesso às versões validadas em português e aos manuais oficiais antes de aplicá-los clinicamente (regra reforçada em todo o Agente 2):

IPAQ, PSQI, PSS-10, GAD-7, PHQ-9, WHOQOL-bref, TSK, PSEQ, PAR-Q+, EVA/NRS, mapa corporal — todos detalhados em [01-Agente2-Anamnese-e-Questionarios.md](01-Agente2-Anamnese-e-Questionarios.md).

---

## 5. COMO O AGENTE 1 USA ESTA LISTA

Antes de liberar cada etapa (Agentes 3, 4 e 5), o Agente 1 deve confirmar com o profissional, uma única vez por clínica (não a cada paciente), qual o inventário real disponível — e manter esse inventário como configuração da clínica, não como pergunta repetida em toda avaliação. Isso permite que os Agentes 3-5 já cheguem sabendo, por exemplo, se devem sugerir dobras cutâneas, bioimpedância, ou apenas antropometria básica para composição corporal.

---

## PRÓXIMO PASSO SUGERIDO

Detalhar as **Etapas 1 e 2** (Pré-atendimento/Agendamento e Recepção/Acolhimento) do prompt-mestre — as etapas mais simples da experiência do paciente, ainda não documentadas, que fecham o ciclo completo desde o primeiro contato até a devolutiva.
