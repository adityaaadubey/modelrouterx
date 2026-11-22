begin;

create table if not exists public.intelligence_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  category text not null check (category in ('new_model', 'pricing_change', 'context_increase', 'benchmark_update', 'leaderboard_movement')),
  importance text not null check (importance in ('low', 'medium', 'high')),
  title text not null,
  description text not null,
  provider text not null,
  model_id text not null,
  source_name text not null,
  source_url text not null,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists intelligence_events_occurred_at_idx on public.intelligence_events (occurred_at desc);
create index if not exists intelligence_events_category_occurred_at_idx on public.intelligence_events (category, occurred_at desc);
create index if not exists intelligence_events_importance_occurred_at_idx on public.intelligence_events (importance, occurred_at desc);

alter table public.intelligence_events enable row level security;
revoke all on public.intelligence_events from anon, authenticated;
grant select, insert, update on public.intelligence_events to service_role;

commit;
