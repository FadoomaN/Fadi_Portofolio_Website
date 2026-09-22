begin;

create table public.project_devlog_blocks (
  id uuid primary key default gen_random_uuid(),
  devlog_id uuid not null references public.project_dev_logs(id) on delete cascade,
  type text not null check (type in ('title','text','code','image','milestone','divider','github_code','github_activity')),
  sort_order integer not null check (sort_order >= 0),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (devlog_id, sort_order)
);

create index project_devlog_blocks_order_idx on public.project_devlog_blocks(devlog_id, sort_order);
create trigger project_devlog_blocks_set_updated_at before update on public.project_devlog_blocks for each row execute function public.set_updated_at();
alter table public.project_devlog_blocks enable row level security;
grant select on public.project_devlog_blocks to anon, authenticated;
grant insert, update, delete on public.project_devlog_blocks to authenticated;

create policy "Published project dev log blocks are public"
on public.project_devlog_blocks for select to anon, authenticated
using (exists (
  select 1 from public.project_dev_logs log
  join public.threads project on project.id = log.project_id
  where log.id = devlog_id and log.status = 'published'
    and project.destination = 'projects' and project.status = 'published'
));

create policy "Admins manage project dev log blocks"
on public.project_devlog_blocks for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

notify pgrst, 'reload schema';
commit;
