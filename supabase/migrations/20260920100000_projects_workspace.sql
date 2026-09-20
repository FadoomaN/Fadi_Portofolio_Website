begin;

alter table public.threads
  add column if not exists project_version text,
  add column if not exists project_started_on date,
  add column if not exists project_progress smallint check (project_progress between 0 and 100),
  add column if not exists project_repository text,
  add column if not exists project_license text,
  add column if not exists project_milestone text,
  add column if not exists project_team text;

create table public.project_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.threads(id) on delete cascade,
  type text not null check (type in ('title','text','code','image','milestone','divider','github_code','github_activity')),
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_blocks_project_order_idx on public.project_blocks(project_id,sort_order,created_at);
create trigger project_blocks_set_updated_at before update on public.project_blocks for each row execute function public.set_updated_at();
alter table public.project_blocks enable row level security;
grant select on public.project_blocks to anon,authenticated;
grant insert,update,delete on public.project_blocks to authenticated;
create policy "Published project blocks are public" on public.project_blocks for select to anon,authenticated using (exists(select 1 from public.threads p where p.id=project_id and p.destination='projects' and p.status='published'));
create policy "Admins manage project blocks" on public.project_blocks for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

notify pgrst,'reload schema';
commit;
