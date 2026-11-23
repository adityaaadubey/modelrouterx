begin;

create table if not exists public.arena_leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'lmarena-ai/leaderboard-dataset',
  source_url text not null,
  published_at date,
  status text not null default 'running' check (status in ('running', 'complete', 'failed')),
  row_count integer not null default 0 check (row_count >= 0),
  config_count integer not null default 0 check (config_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create index if not exists arena_leaderboard_snapshots_completed_idx
  on public.arena_leaderboard_snapshots (completed_at desc)
  where status = 'complete';

create table if not exists public.arena_leaderboard_rows (
  snapshot_id uuid not null references public.arena_leaderboard_snapshots(id) on delete cascade,
  source_key text not null,
  model_name text not null,
  organization text,
  license text,
  source_config text not null,
  category text not null,
  rank integer not null check (rank > 0),
  rating numeric(12, 4),
  rating_lower numeric(12, 4),
  rating_upper numeric(12, 4),
  variance numeric(12, 4),
  vote_count bigint check (vote_count is null or vote_count >= 0),
  published_at date,
  source_url text not null,
  raw jsonb not null default '{}'::jsonb,
  primary key (snapshot_id, source_key)
);

create index if not exists arena_leaderboard_rows_category_idx
  on public.arena_leaderboard_rows (snapshot_id, source_config, category, rank);
create index if not exists arena_leaderboard_rows_organization_idx
  on public.arena_leaderboard_rows (snapshot_id, organization);

alter table public.arena_leaderboard_snapshots enable row level security;
alter table public.arena_leaderboard_rows enable row level security;

revoke all on public.arena_leaderboard_snapshots, public.arena_leaderboard_rows from anon, authenticated;
grant select, insert, update, delete on public.arena_leaderboard_snapshots, public.arena_leaderboard_rows to service_role;

commit;
