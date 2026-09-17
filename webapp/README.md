# Avaliação Integrada — site da clínica

> Publicado automaticamente via GitHub + Vercel a partir deste repositório (pasta `webapp/`).

Site com dois papéis, um único domínio:

- **`/paciente`** — link público. O paciente se identifica (nome + data de
  nascimento) e responde a anamnese. Pode fechar e continuar depois.
- **`/avaliador`** — área restrita (login por e-mail/senha via Supabase Auth).
  Mostra a anamnese de cada paciente e permite registrar a avaliação física,
  postural e funcional.

Stack: Next.js (App Router) + Supabase (banco de dados + autenticação) +
Vercel (hospedagem) + GitHub (código).

## 1. Configurar o Supabase

1. No painel do Supabase do seu projeto, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Vá em **Authentication → Users → Add user** e crie um login (e-mail + senha)
   para cada avaliador/profissional da clínica. Não existe cadastro público
   nesta área — só quem for criado aqui consegue entrar em `/avaliador`.
4. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key** (a chave "anon", **nunca** a "service_role")

## 2. Configurar o projeto localmente

```bash
cd webapp
npm install
copy .env.local.example .env.local
```

Abra `.env.local` e preencha com os valores do passo 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Rodar localmente:

```bash
npm run dev
```

Abra http://localhost:3000

## 3. Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versão do site de avaliação"
```

Crie um repositório vazio em github.com/new (sem README, sem .gitignore -
já temos os nossos) e depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git branch -M main
git push -u origin main
```

## 4. Publicar na Vercel

1. Em vercel.com, **Add New → Project** e importe o repositório do GitHub.
2. Em **Environment Variables**, adicione as duas mesmas variáveis do
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Clique em **Deploy**.

Depois do primeiro deploy, toda vez que você (ou eu) enviar um novo commit
para o `main` no GitHub, a Vercel publica a atualização automaticamente.

## Estrutura de dados (Supabase)

Uma única tabela, `pacientes` — o "Registro Integrado do Paciente" (RIP) da
nossa arquitetura (ver `../00-Arquitetura-Geral-dos-Agentes.md`):

| Coluna | Conteúdo |
|---|---|
| `anamnese` | tudo o que o paciente respondeu (JSON) |
| `alertas` | alertas de segurança calculados automaticamente (Nível 1-4) |
| `fisica` | preenchido pelo avaliador: sinais vitais, antropometria |
| `postural` | preenchido pelo avaliador: observações posturais |
| `funcional` | preenchido pelo avaliador: resultados dos testes funcionais |
| `plano` | plano de intervenção (30/90/180/365 dias), encaminhamentos e metas |

Mais a tabela `avaliacoes_historico` — uma linha por vez que Física ou
Funcional são salvas, para permitir comparar ANTES → ATUAL → META ao longo
do tempo (a coluna em `pacientes` sempre guarda só o valor mais recente).

Segurança: pacientes anônimos nunca leem a tabela diretamente - só através de
duas funções (`get_or_create_paciente`, `save_anamnese`) que reconfirmam
nome + data de nascimento a cada chamada. Só avaliadores autenticados
enxergam a lista completa de pacientes.

## Abas da ficha do paciente (avaliador)

1. **Perfil Integrado** (Agente 6) — 10 domínios classificados automaticamente
   (adequado/atenção/prioridade/investigar), com potencialidades, riscos e
   prioridades.
2. **Plano de Intervenção** (Agente 7) — horizontes 30/90/180/365 dias,
   sugeridos a partir do Perfil Integrado.
3. **Reavaliação** (Etapa 11) — evolução dos indicadores objetivos ao longo
   do tempo, com meta editável por indicador.
4. **Anamnese, Física, Postural, Funcional** — coleta e leitura dos dados
   brutos.
5. **Relatório técnico** (Agente 8), acessível pelo link no topo da ficha —
   documento único para imprimir ou salvar em PDF.

## O que ainda falta (próximos passos possíveis)

- Recuperação de senha para avaliadores (hoje é só e-mail/senha simples).
- Ativar a proteção de senhas vazadas no Supabase Auth (Authentication →
  Policies → Password Security → "Leaked password protection") — recomendação
  do próprio linter de segurança do Supabase, ainda não ativada.
- Conectar a "conexão fina" entre Prioridades e o objetivo declarado pelo
  paciente na hora de montar o Plano (hoje é uma leitura manual do
  avaliador, por design do Agente 7).
- Upload de fotos posturais (a avaliação postural hoje é só texto).
