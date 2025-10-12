-- Enable UUID generation helpers
create extension if not exists "pgcrypto";

-- Base table storing each generation request
create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  input_image_path text,
  thumb_image_path text,
  status text not null default 'pending',
  completed_images integer not null default 0,
  error_message text,
  last_progress_message text
);

-- Output table storing each postcard generated per decade
create table public.generation_outputs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null references public.generation_runs(id) on delete cascade,
  decade text not null,
  image_path text,
  status text not null default 'pending',
  error_message text
);

create index generation_outputs_run_id_idx on public.generation_outputs (run_id);

-- Activate RLS
alter table public.generation_runs enable row level security;
alter table public.generation_outputs enable row level security;

-- Allow anyone (anon) to read generated results
create policy "Allow read generation runs"
  on public.generation_runs
  for select
  using (true);

create policy "Allow read generation outputs"
  on public.generation_outputs
  for select
  using (true);

-- Restrict write access to the service role
create policy "Service role insert generation runs"
  on public.generation_runs
  for insert
  with check (auth.role() = 'service_role');

create policy "Service role update generation runs"
  on public.generation_runs
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role delete generation runs"
  on public.generation_runs
  for delete
  using (auth.role() = 'service_role');

create policy "Service role insert generation outputs"
  on public.generation_outputs
  for insert
  with check (auth.role() = 'service_role');

create policy "Service role update generation outputs"
  on public.generation_outputs
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role delete generation outputs"
  on public.generation_outputs
  for delete
  using (auth.role() = 'service_role');

