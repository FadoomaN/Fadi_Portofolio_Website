-- Unified chronological content architecture.
-- Legacy Journey, Project and Video tables remain intact until migration verification is complete.

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  destination text not null check (destination in ('journey', 'projects')),
  category text not null default '',
  description text not null default '',
  technical_description text,
  cover_media_reference text,
  github_url text,
  live_url text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thread_entries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  title text not null,
  published_on date not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thread_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.thread_entries (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video', 'external-video', 'link')),
  media_reference text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists threads_destination_status_idx
  on public.threads (destination, status, featured desc, sort_order, updated_at desc);
create index if not exists thread_entries_thread_idx
  on public.thread_entries (thread_id, status, sort_order, published_on desc);
create index if not exists thread_media_entry_idx
  on public.thread_media (entry_id, sort_order);

create trigger threads_set_updated_at
before update on public.threads
for each row execute function public.set_updated_at();
create trigger thread_entries_set_updated_at
before update on public.thread_entries
for each row execute function public.set_updated_at();

insert into public.threads (
  title, slug, destination, category, description, cover_media_reference,
  status, featured, sort_order, created_by, created_at, updated_at
)
select
  title,
  slug,
  'journey',
  '',
  description,
  cover_media_reference,
  status,
  featured,
  sort_order,
  created_by,
  created_at,
  updated_at
from public.journey_threads
on conflict (slug) do nothing;

insert into public.threads (
  title, slug, destination, category, description, technical_description,
  cover_media_reference, github_url, live_url, tags, status, featured,
  sort_order, created_by, created_at, updated_at
)
select
  title,
  slug,
  'projects',
  '',
  summary,
  technical_description,
  cover_image_url,
  github_url,
  live_url,
  tags,
  status,
  featured,
  sort_order,
  created_by,
  created_at,
  updated_at
from public.projects
on conflict (slug) do nothing;

insert into public.thread_entries (
  thread_id, title, published_on, content, status, sort_order,
  created_by, created_at, updated_at
)
select
  t.id, u.title, u.published_on, u.content, u.status, u.sort_order,
  u.created_by, u.created_at, u.updated_at
from public.journey_updates u
join public.journey_threads jt on jt.id = u.thread_id
join public.threads t on t.slug = jt.slug and t.destination = 'journey'
where not exists (
  select 1 from public.thread_entries e
  where e.thread_id = t.id and e.title = u.title and e.published_on = u.published_on
);

insert into public.thread_entries (
  thread_id, title, published_on, content, status, sort_order,
  created_by, created_at, updated_at
)
select
  t.id, u.title, u.published_on, u.content, u.status, u.sort_order,
  u.created_by, u.created_at, u.updated_at
from public.project_updates u
join public.projects p on p.id = u.project_id
join public.threads t on t.slug = p.slug and t.destination = 'projects'
where not exists (
  select 1 from public.thread_entries e
  where e.thread_id = t.id and e.title = u.title and e.published_on = u.published_on
);

alter table public.threads enable row level security;
alter table public.thread_entries enable row level security;
alter table public.thread_media enable row level security;

grant select on public.threads, public.thread_entries, public.thread_media to anon, authenticated;
grant insert, update, delete on public.threads, public.thread_entries, public.thread_media to authenticated;

create policy "Anyone can read published threads"
on public.threads for select to anon, authenticated
using (status = 'published');
create policy "Admins can read all threads"
on public.threads for select to authenticated
using ((select public.is_admin()));
create policy "Admins can manage threads"
on public.threads for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Anyone can read published thread entries"
on public.thread_entries for select to anon, authenticated
using (
  status = 'published' and exists (
    select 1 from public.threads t
    where t.id = thread_id and t.status = 'published'
  )
);
create policy "Admins can read all thread entries"
on public.thread_entries for select to authenticated
using ((select public.is_admin()));
create policy "Admins can manage thread entries"
on public.thread_entries for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Anyone can read published thread media"
on public.thread_media for select to anon, authenticated
using (exists (
  select 1
  from public.thread_entries e
  join public.threads t on t.id = e.thread_id
  where e.id = entry_id and e.status = 'published' and t.status = 'published'
));
create policy "Admins can read all thread media"
on public.thread_media for select to authenticated
using ((select public.is_admin()));
create policy "Admins can manage thread media"
on public.thread_media for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
