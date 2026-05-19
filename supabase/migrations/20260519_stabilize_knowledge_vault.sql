-- Phase 0: Stabilize Knowledge Vault
-- Reconciles every drift between the committed migration and application code.
-- Safe to run against an existing database (all operations use IF NOT EXISTS / OR REPLACE).

-- ─────────────────────────────────────────────
-- 1. Add user_id column
--    Written by ingestDocument / ingestMultimodalAsset but never declared in schema.
-- ─────────────────────────────────────────────
alter table public.knowledge_vault
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ─────────────────────────────────────────────
-- 2. Extend content_type CHECK to include 'docx'
--    Code ingests docx; original CHECK excluded it, causing constraint violations.
-- ─────────────────────────────────────────────
alter table public.knowledge_vault
  drop constraint if exists knowledge_vault_content_type_check;

alter table public.knowledge_vault
  add constraint knowledge_vault_content_type_check
  check (content_type in ('text', 'image', 'video', 'pdf', 'docx'));

-- ─────────────────────────────────────────────
-- 3. HNSW index via halfvec cast
--    Standard vector HNSW is capped at 2000 dims. halfvec removes the limit and
--    halves storage. The query in match_knowledge must cast identically or the
--    planner ignores the index.
-- ─────────────────────────────────────────────
create index if not exists knowledge_vault_embedding_hnsw_idx
  on public.knowledge_vault
  using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

-- ─────────────────────────────────────────────
-- 4. Replace match_knowledge with corrected 5-parameter version
--    Changes vs original:
--      • Adds p_module_id (optional) for strict module-scoped retrieval
--      • Uses halfvec cast on both sides of <=> so the HNSW index is hit
-- ─────────────────────────────────────────────
create or replace function match_knowledge (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_blueprint_id uuid,
  p_module_id text default null
)
returns table (
  id uuid,
  content_type text,
  raw_content text,
  media_url text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kv.id,
    kv.content_type,
    kv.raw_content,
    kv.media_url,
    kv.metadata,
    1 - (kv.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) as similarity
  from knowledge_vault kv
  where 1 - (kv.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) > match_threshold
  and kv.blueprint_id = p_blueprint_id
  and (p_module_id is null or kv.metadata->>'module_id' = p_module_id)
  order by kv.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
end;
$$;

-- ─────────────────────────────────────────────
-- 5. visual_generations table
--    Table already existed in production (created outside migrations).
--    Real column names: image_url (not result_url), error_message (not error).
--    CREATE TABLE IF NOT EXISTS below is a no-op; kept for documentation.
-- ─────────────────────────────────────────────
create table if not exists public.visual_generations (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references public.blueprint_generator(id) on delete cascade,
  node_id text not null,
  prompt text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  image_url text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.visual_generations enable row level security;

create policy "Users can view visual generations for their blueprints"
on public.visual_generations for select
to authenticated
using (
  exists (
    select 1 from public.blueprint_generator
    where public.blueprint_generator.id = public.visual_generations.blueprint_id
    and public.blueprint_generator.user_id = auth.uid()
  )
);

-- The draft route uses the service-role (admin) client to insert and read back gen records.
create policy "Service role manages visual generations"
on public.visual_generations for all
to service_role
using (true)
with check (true);

-- Keep updated_at current so the Realtime subscription gets accurate timestamps.
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger visual_generations_updated_at
  before update on public.visual_generations
  for each row execute function update_updated_at_column();
