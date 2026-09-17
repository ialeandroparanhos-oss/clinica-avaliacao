-- ============================================================================
-- SCHEMA: Avaliação Integrada de Saúde, Física e Funcional
-- Rode este arquivo inteiro no SQL Editor do Supabase (painel -> SQL Editor
-- -> New query -> colar tudo -> Run). Pode rodar de novo com segurança
-- (usa "if not exists" / "or replace" em tudo).
-- ============================================================================

create extension if not exists pgcrypto;

-- A extensão fica fora do schema "public" por boa prática de segurança
-- (recomendação do linter do Supabase).
create schema if not exists extensions;
create extension if not exists unaccent schema extensions;

-- unaccent() é STABLE, não IMMUTABLE, então não pode ser usada direto numa
-- coluna gerada. Este wrapper marca como IMMUTABLE (comportamento
-- determinístico de fato, com dicionário fixo) - padrão recomendado -
-- e fixa o search_path (outra recomendação do linter).
create or replace function immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, pg_temp
as $$
  select extensions.unaccent('unaccent', $1)
$$;

-- ----------------------------------------------------------------------------
-- Tabela principal: um registro por paciente (o "RIP" da nossa arquitetura)
-- ----------------------------------------------------------------------------
create table if not exists pacientes (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  nome_normalizado text generated always as (
    lower(regexp_replace(immutable_unaccent(nome), '[^a-zA-Z0-9]+', '', 'g'))
  ) stored,
  data_nascimento date not null,
  sexo text,
  telefone text,

  anamnese jsonb not null default '{}'::jsonb,
  anamnese_status text not null default 'nao_iniciada'
    check (anamnese_status in ('nao_iniciada', 'em_andamento', 'concluida')),

  alertas jsonb not null default '[]'::jsonb,

  fisica jsonb not null default '{}'::jsonb,
  postural jsonb not null default '{}'::jsonb,
  funcional jsonb not null default '{}'::jsonb,
  plano jsonb not null default '{}'::jsonb,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists pacientes_nome_dob_idx
  on pacientes (nome_normalizado, data_nascimento);

create index if not exists pacientes_atualizado_em_idx
  on pacientes (atualizado_em desc);

alter table pacientes enable row level security;

-- ----------------------------------------------------------------------------
-- Acesso direto à tabela: reservado a avaliadores autenticados (login da
-- clínica via Supabase Auth). Pacientes anônimos NUNCA leem/escrevem a
-- tabela diretamente - só através das funções abaixo (que verificam a
-- identidade nome+data de nascimento a cada chamada).
-- ----------------------------------------------------------------------------
drop policy if exists "avaliadores_select" on pacientes;
create policy "avaliadores_select" on pacientes
  for select using (auth.role() = 'authenticated');

drop policy if exists "avaliadores_update" on pacientes;
create policy "avaliadores_update" on pacientes
  for update using (auth.role() = 'authenticated');

drop policy if exists "avaliadores_insert" on pacientes;
create policy "avaliadores_insert" on pacientes
  for insert with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- RPC: paciente se identifica (nome + data de nascimento). Cria o registro
-- se for a primeira vez, ou devolve o que já existe (para continuar de onde
-- parou). SECURITY DEFINER = roda com privilégio elevado, ignorando RLS,
-- mas SÓ faz exatamente o que está escrito aqui - nunca expõe outras linhas.
-- ----------------------------------------------------------------------------
create or replace function get_or_create_paciente(
  p_nome text,
  p_data_nascimento date,
  p_telefone text default null,
  p_sexo text default null
)
returns table (id uuid, anamnese jsonb, anamnese_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_norm text := lower(regexp_replace(immutable_unaccent(p_nome), '[^a-zA-Z0-9]+', '', 'g'));
begin
  if p_nome is null or length(trim(p_nome)) < 3 then
    raise exception 'Nome inválido.';
  end if;
  if p_data_nascimento is null then
    raise exception 'Data de nascimento inválida.';
  end if;

  select p.id into v_id
  from pacientes p
  where p.nome_normalizado = v_norm
    and p.data_nascimento = p_data_nascimento;

  if v_id is null then
    insert into pacientes (nome, data_nascimento, telefone, sexo)
    values (p_nome, p_data_nascimento, p_telefone, p_sexo)
    returning pacientes.id into v_id;
  end if;

  return query
    select p.id, p.anamnese, p.anamnese_status
    from pacientes p
    where p.id = v_id;
end;
$$;

grant execute on function get_or_create_paciente(text, date, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RPC: paciente salva/atualiza suas respostas da anamnese. Reconfirma
-- nome + data de nascimento antes de gravar, para que ninguém consiga
-- adivinhar um id e sobrescrever a ficha de outra pessoa.
-- ----------------------------------------------------------------------------
create or replace function save_anamnese(
  p_id uuid,
  p_nome text,
  p_data_nascimento date,
  p_anamnese jsonb,
  p_status text,
  p_alertas jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text := lower(regexp_replace(immutable_unaccent(p_nome), '[^a-zA-Z0-9]+', '', 'g'));
  v_match boolean;
begin
  select (nome_normalizado = v_norm and data_nascimento = p_data_nascimento)
    into v_match
  from pacientes
  where id = p_id;

  if v_match is not true then
    raise exception 'Identificação não confere para este registro.';
  end if;

  if p_status not in ('nao_iniciada', 'em_andamento', 'concluida') then
    raise exception 'Status inválido.';
  end if;

  update pacientes
  set anamnese = p_anamnese,
      anamnese_status = p_status,
      alertas = p_alertas,
      atualizado_em = now()
  where id = p_id;
end;
$$;

grant execute on function save_anamnese(uuid, text, date, jsonb, text, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Histórico de avaliações: um registro por vez que o avaliador salva
-- física/postural/funcional, permitindo comparar ANTES -> ATUAL -> META
-- ao longo do tempo (Etapa 11 - Reavaliação). A coluna correspondente em
-- "pacientes" continua guardando só o valor mais recente (usado pelo
-- Perfil Integrado); esta tabela guarda a série temporal completa.
-- ----------------------------------------------------------------------------
create table if not exists avaliacoes_historico (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  tipo text not null check (tipo in ('fisica', 'postural', 'funcional')),
  dados jsonb not null,
  avaliador text,
  criado_em timestamptz not null default now()
);

create index if not exists avaliacoes_historico_paciente_tipo_idx
  on avaliacoes_historico (paciente_id, tipo, criado_em);

alter table avaliacoes_historico enable row level security;

drop policy if exists "avaliadores_select_historico" on avaliacoes_historico;
create policy "avaliadores_select_historico" on avaliacoes_historico
  for select using (auth.role() = 'authenticated');

drop policy if exists "avaliadores_insert_historico" on avaliacoes_historico;
create policy "avaliadores_insert_historico" on avaliacoes_historico
  for insert with check (auth.role() = 'authenticated');

-- ============================================================================
-- PRÓXIMO PASSO NO PAINEL DO SUPABASE (fora deste script):
-- Authentication -> Users -> Add user -> crie um login (e-mail + senha)
-- para cada avaliador/profissional da clínica. Não existe cadastro público
-- de avaliador no site - só quem a clínica cadastrar aqui consegue entrar
-- na área de avaliação.
-- ============================================================================
