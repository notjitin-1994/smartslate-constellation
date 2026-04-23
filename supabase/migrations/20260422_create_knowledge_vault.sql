-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the Knowledge Vault table for multi-modal assets
create table if not exists public.knowledge_vault (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references public.blueprint_generator(id) on delete cascade,
  content_type text not null check (content_type in ('text', 'image', 'video', 'pdf')),
  raw_content text, -- Text or AI-generated description of the media
  contextual_header text, -- Anthropic Contextual Retrieval pattern
  media_url text, -- Link to Supabase Storage
  embedding vector(3072), -- Unified vector for all modalities (optimized for gemini-embedding-001)
  metadata jsonb default '{}'::jsonb, -- {source, timestamp_start, timestamp_end, page_number}
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.knowledge_vault enable row level security;

-- Policies
create policy "Users can view knowledge for their own blueprints"
on public.knowledge_vault for select
to authenticated
using (
  exists (
    select 1 from public.blueprint_generator
    where public.blueprint_generator.id = public.knowledge_vault.blueprint_id
    and public.blueprint_generator.user_id = auth.uid()
  )
);

create policy "Users can insert knowledge for their own blueprints"
on public.knowledge_vault for insert
to authenticated
with check (
  exists (
    select 1 from public.blueprint_generator
    where public.blueprint_generator.id = public.knowledge_vault.blueprint_id
    and public.blueprint_generator.user_id = auth.uid()
  )
);

create policy "Users can delete knowledge for their own blueprints"
on public.knowledge_vault for delete
to authenticated
using (
  exists (
    select 1 from public.blueprint_generator
    where public.blueprint_generator.id = public.knowledge_vault.blueprint_id
    and public.blueprint_generator.user_id = auth.uid()
  )
);

-- Semantic Retrieval Index
-- Note: HNSW currently limited to 2000 dimensions in some PG versions
-- We use standard similarity for now.

-- Function for Semantic Search
create or replace function match_knowledge (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_blueprint_id uuid
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
    knowledge_vault.id,
    knowledge_vault.content_type,
    knowledge_vault.raw_content,
    knowledge_vault.media_url,
    knowledge_vault.metadata,
    1 - (knowledge_vault.embedding <=> query_embedding) as similarity
  from knowledge_vault
  where 1 - (knowledge_vault.embedding <=> query_embedding) > match_threshold
  and knowledge_vault.blueprint_id = p_blueprint_id
  order by knowledge_vault.embedding <=> query_embedding
  limit match_count;
end;
$$;
