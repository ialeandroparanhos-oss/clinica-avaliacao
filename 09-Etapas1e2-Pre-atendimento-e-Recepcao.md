# ETAPAS 1 E 2 — PRÉ-ATENDIMENTO/AGENDAMENTO E RECEPÇÃO/ACOLHIMENTO

> Primeiras etapas da experiência do paciente (Seção 4 do prompt-mestre). Não são conduzidas por um agente especialista próprio — são responsabilidade operacional da recepção/profissional, com apoio leve do Agente 1 (Coordenador), que já começa a preparar o RIP. Grava no RIP na macroseção `identificacao_e_contexto` (dados iniciais) e cria o registro de consentimento.

---

## 1. FINALIDADE

Estas duas etapas não geram dado clínico relevante para interpretação — geram **condições para que a avaliação aconteça bem**. Uma anamnese ou um teste funcional mal-sucedido, muitas vezes, não falha por causa do protocolo clínico, e sim porque o paciente chegou sem preparo (comeu antes de um exame que pedia jejum, foi de sapato social a um teste de marcha, não trouxe um documento necessário). O objetivo aqui é eliminar essas falhas evitáveis antes que aconteçam.

---

## 2. ETAPA 1 — PRÉ-ATENDIMENTO E AGENDAMENTO

### 2.1 Protocolo geral

1. Contato inicial (telefone, WhatsApp, formulário do site) — captura de dados básicos de identificação e motivo inicial de procura (versão resumida do que será aprofundado na Anamnese).
2. Apresentação breve da metodologia — o paciente deve saber, desde o agendamento, que passará por uma avaliação completa (não apenas "uma primeira sessão de treino"), para chegar com a expectativa correta.
3. Agendamento, com duração de tempo compatível com a extensão da avaliação (essa etapa costuma ser subestimada — uma avaliação integrada como esta demanda tempo real, e o paciente precisa saber disso ao agendar).
4. Envio de orientações pré-avaliação, condicionadas ao que está previsto no protocolo daquele paciente.

### 2.2 Orientações condicionais — o que informar, e quando

O Agente 1 (ou a rotina administrativa da clínica) decide quais orientações enviar com base no que **já se sabe** sobre o paciente no pré-cadastro (idade, motivo da procura) e no que a clínica planeja avaliar. Nunca enviar uma lista genérica de orientações que não se aplicam ao caso.

| Se o protocolo previsto incluir... | Orientar o paciente a... |
|---|---|
| Testes funcionais/marcha (Agente 5) | Vestir roupas confortáveis e calçado fechado adequado para atividade física |
| Avaliação postural fotográfica (Agente 4) | Trazer roupa que permita visualizar os pontos anatômicos de referência (Seção 4.2 do documento do Agente 4), respeitando o conforto do paciente |
| Composição corporal por bioimpedância (Agente 3) | Jejum de 2-4h, evitar exercício nas 12h anteriores, evitar álcool/cafeína no dia, urinar antes do exame (replica as condições da Seção 7.2 do documento do Agente 3) |
| Avaliação de pressão arterial de forma mais criteriosa | Evitar cafeína, exercício e tabaco nos 30 minutos antes do horário agendado |
| Uso contínuo de medicação | Trazer lista de medicamentos em uso (nome, dose, horário), sem orientar suspensão de nenhum |
| Documentação exigida pela clínica | Trazer documento de identificação, encaminhamento médico (se houver) e exames anteriores relevantes |

**Regra fixa:** o Agente 1 nunca deve gerar uma orientação de preparo (ex.: jejum) sem que o protocolo correspondente realmente vá ser aplicado — orientação desnecessária gera desconforto e desconfiança gratuitos.

### 2.3 Instrumentos/materiais desta etapa

| Categoria | Item |
|---|---|
| Essencial | Canal de agendamento (telefone, sistema, WhatsApp) |
| Essencial | Formulário de pré-cadastro (identificação básica + motivo inicial) |
| Recomendado | Mensagem/roteiro padronizado de orientações pré-avaliação, com os blocos condicionais da Seção 2.2 |

### 2.4 Limitações

- A adesão às orientações de preparo depende do paciente — quando não seguidas (ex.: paciente não estava em jejum para bioimpedância), o profissional deve adaptar o protocolo no dia (ex.: usar dobras cutâneas em vez de BIA, ou adiar a medida), nunca insistir na medida em condição inadequada e apresentá-la como se fosse confiável.

---

## 3. ETAPA 2 — RECEPÇÃO E ACOLHIMENTO

### 3.1 Objetivo

Receber o paciente presencialmente e alinhar expectativas antes de qualquer coleta de dado clínico começar.

### 3.2 O que o profissional deve comunicar (roteiro de apoio)

1. **O que será realizado** — visão geral das etapas que o paciente vai atravessar naquele dia (não necessariamente todos os agentes em uma única sessão, dependendo de como a clínica organiza o tempo).
2. **Por que a avaliação é importante** — conectar com a finalidade do projeto (Seção 1 do prompt-mestre): "vamos entender como você está hoje, o que já é ponto forte, o que precisa de atenção, e como construir uma evolução a partir disso."
3. **Que os testes serão individualizados** — nem todo paciente faz a mesma bateria; isso é intencional e baseado no perfil dele, não uma avaliação "incompleta".
4. **Que alguns testes podem ser modificados ou não realizados** — se surgir contraindicação/precaução durante a anamnese ou a checagem de prontidão (Agente 2), isso é esperado e faz parte do cuidado, não um problema no processo.

### 3.3 Consentimento e privacidade de dados

Esta etapa é o momento formal de obter o **consentimento do paciente** para a coleta e o registro de dados de saúde — que são dados pessoais sensíveis sob a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018) no contexto brasileiro. O termo de consentimento deve deixar claro:

- que dados serão coletados (identificação, saúde, imagem — no caso das fotos posturais do Agente 4);
- a finalidade do uso (avaliação clínica e acompanhamento na própria clínica);
- que o paciente pode retirar o consentimento e solicitar acesso/exclusão de seus dados, conforme a LGPD;
- consentimento específico e destacado para o registro fotográfico (Agente 4) e para eventual gravação de áudio da anamnese (Agente 2), que são usos mais sensíveis do que o restante do prontuário.

**Regra fixa:** a IA nunca deve presumir consentimento implícito para registro de imagem ou áudio — isso deve ser um campo explícito, registrado no RIP com data e forma de obtenção.

### 3.4 Instrumentos/materiais desta etapa

| Categoria | Item |
|---|---|
| Essencial | Computador/tablet para registro |
| Essencial | Ficha cadastral |
| Essencial | Termo de consentimento (LGPD, incluindo cláusulas específicas para imagem/áudio quando aplicável) |
| Recomendado | Documentos institucionais da clínica (ex.: política de cancelamento, valores, uma breve apresentação da metodologia em material impresso ou digital) |

### 3.5 Sinal de alerta possível nesta etapa

Se o paciente relatar, já na recepção, um sintoma agudo preocupante (ex.: dor torácica no momento, mal-estar importante) — isso é escalonado imediatamente como alerta de Nível 4 (Seção 7 da Etapa 0), mesmo antes de qualquer questionário formal ser aplicado. A avaliação de rotina não deve prosseguir sobre um quadro agudo não esclarecido.

### 3.6 Limitações

- A qualidade do acolhimento depende inteiramente da postura humana do profissional — nenhum roteiro substitui isso; ele apenas organiza os pontos que não podem faltar.

---

## 4. CONEXÃO COM AS DEMAIS ETAPAS

- **Esta etapa → Agente 1 (Coordenador):** primeira oportunidade de o Agente 1 começar a montar o RIP e, com os dados mínimos de pré-cadastro, esboçar tags de perfil preliminares que serão confirmadas/expandidas na Anamnese (Agente 2).
- **Esta etapa → Agente 2 (Anamnese):** as orientações condicionais (Seção 2.2) evitam retrabalho — um paciente que já chegou em jejum para bioimpedância não precisa ser reagendado.
- **Esta etapa → Agente 4 (Postural):** o consentimento específico para imagem (Seção 3.3) é pré-requisito para o protocolo fotográfico daquele agente.
- **Esta etapa → toda a experiência do paciente (Seção 26 do prompt-mestre):** é aqui que a primeira impressão de "processo sério e organizado, não uma bateria de testes aleatória" começa a ser construída.

---

## PRÓXIMO PASSO SUGERIDO

Com o ciclo completo de etapas documentado (Pré-atendimento → Recepção → Anamnese → Física → Postural → Funcional → Integração → Plano → Devolutiva), os próximos passos de maior valor são:

1. **Templates concretos de ficha/formulário** para cada capítulo da anamnese (Agente 2), prontos para uso em papel ou tela — hoje cada capítulo tem o *conteúdo* definido, mas não um formulário pronto para aplicar.
2. **Revisão cruzada de nomenclatura do RIP** entre os nove documentos já escritos, garantindo que todo campo citado (ex.: `dor.localizacao`, `funcional.tug_segundos`) esteja de fato nomeado de forma consistente em todos os lugares onde é referenciado.

Seguirei pelos templates de ficha, por serem o artefato mais imediatamente utilizável pela clínica, a menos que você prefira redirecionar.
