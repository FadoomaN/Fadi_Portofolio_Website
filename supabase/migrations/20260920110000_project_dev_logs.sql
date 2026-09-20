begin;

create table public.project_dev_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.threads(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 2 and 180),
  entry_date date not null default current_date,
  version text,
  tag text,
  summary text not null default '' check (char_length(summary) <= 1000),
  content text not null default '' check (char_length(content) <= 30000),
  github_url text,
  media jsonb not null default '[]'::jsonb,
  code jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,slug)
);
create index project_dev_logs_public_idx on public.project_dev_logs(project_id,entry_date desc,created_at desc) where status='published';
create trigger project_dev_logs_set_updated_at before update on public.project_dev_logs for each row execute function public.set_updated_at();
alter table public.project_dev_logs enable row level security;
grant select on public.project_dev_logs to anon,authenticated;
grant insert,update,delete on public.project_dev_logs to authenticated;
create policy "Published project dev logs are public" on public.project_dev_logs for select to anon,authenticated using (status='published' and exists(select 1 from public.threads p where p.id=project_id and p.destination='projects' and p.status='published'));
create policy "Admins manage project dev logs" on public.project_dev_logs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
notify pgrst,'reload schema';
commit;
