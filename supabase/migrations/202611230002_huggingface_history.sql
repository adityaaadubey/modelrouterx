begin;

create table if not exists public.huggingface_models (
  id text primary key,
  model_id text not null,
  downloads bigint not null default 0 check (downloads >= 0),
  likes integer not null default 0 check (likes >= 0),
  pipeline_tag text,
  library_name text,
  tags text[] not null default '{}',
  created_at_source timestamptz,
  last_modified timestamptz,
  source_url text not null,
  synced_at timestamptz not null default now()
);

create index if not exists huggingface_models_downloads_idx on public.huggingface_models (downloads desc);
create index if not exists huggingface_models_synced_at_idx on public.huggingface_models (synced_at desc);

create table if not exists public.huggingface_model_snapshots (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.huggingface_models(id) on delete cascade,
  captured_at timestamptz not null default now(),
  downloads bigint not null default 0 check (downloads >= 0),
  likes integer not null default 0 check (likes >= 0),
  constraint huggingface_model_snapshots_model_capture_unique unique (model_id, captured_at)
);

create index if not exists huggingface_model_snapshots_model_capture_idx on public.huggingface_model_snapshots (model_id, captured_at desc);
create index if not exists huggingface_model_snapshots_captured_at_idx on public.huggingface_model_snapshots (captured_at desc);

alter table public.huggingface_models enable row level security;
alter table public.huggingface_model_snapshots enable row level security;

revoke all on public.huggingface_models, public.huggingface_model_snapshots from anon, authenticated;
grant select, insert, update, delete on public.huggingface_models, public.huggingface_model_snapshots to service_role;

commit;
