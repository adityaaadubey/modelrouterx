begin;

create table if not exists public.model_catalog (
  id text primary key,
  name text not null,
  provider text not null,
  description text,
  model_created_at timestamptz,
  context_length integer check (context_length is null or context_length > 0),
  prompt_price_per_million numeric(18, 8) check (prompt_price_per_million is null or prompt_price_per_million >= 0),
  completion_price_per_million numeric(18, 8) check (completion_price_per_million is null or completion_price_per_million >= 0),
  input_modalities text[] not null default '{}',
  output_modalities text[] not null default '{}',
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists model_catalog_provider_idx on public.model_catalog (provider);
create index if not exists model_catalog_synced_at_idx on public.model_catalog (synced_at desc);
create index if not exists model_catalog_context_length_idx on public.model_catalog (context_length desc nulls last);

create table if not exists public.model_snapshots (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.model_catalog(id) on delete cascade,
  captured_at timestamptz not null default now(),
  prompt_price_per_million numeric(18, 8),
  completion_price_per_million numeric(18, 8),
  context_length integer,
  metadata jsonb not null default '{}'::jsonb,
  constraint model_snapshots_model_capture_unique unique (model_id, captured_at)
);

create index if not exists model_snapshots_model_capture_idx on public.model_snapshots (model_id, captured_at desc);
create index if not exists model_snapshots_captured_at_idx on public.model_snapshots (captured_at desc);

create table if not exists public.data_sources (
  source_name text primary key,
  source_url text not null,
  status text not null default 'unknown' check (status in ('unknown', 'online', 'delayed', 'offline')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  records_updated integer not null default 0 check (records_updated >= 0),
  error_message text,
  updated_at timestamptz not null default now()
);

alter table public.model_catalog enable row level security;
alter table public.model_snapshots enable row level security;
alter table public.data_sources enable row level security;

revoke all on public.model_catalog, public.model_snapshots, public.data_sources from anon, authenticated;
grant select, insert, update, delete on public.model_catalog, public.model_snapshots, public.data_sources to service_role;

commit;
