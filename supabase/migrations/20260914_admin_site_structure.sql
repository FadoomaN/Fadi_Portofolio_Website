-- Admin-managed public site structure. No seed content is inserted.

create table public.about_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'ABOUT',
  intro text not null default '',
  body text not null default '',
  sections jsonb not null default '[]'::jsonb,
  media_reference text,
  updated_at timestamptz not null default now()
);

create table public.public_contact_settings (
  id smallint primary key default 1 check (id = 1),
  email text,
  github_url text,
  linkedin_url text,
  cv_url text,
  updated_at timestamptz not null default now()
);

create table public.journey_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  cover_media_reference text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journey_updates (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.journey_threads (id) on delete cascade,
  title text not null,
  published_on date not null,
  content text not null default '',
  media_reference text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  published_on date not null,
  content text not null default '',
  media_reference text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists technical_description text not null default '',
  add column if not exists github_url text,
  add column if not exists live_url text;

create index journey_threads_public_feed_idx
  on public.journey_threads (featured desc, sort_order, created_at desc)
  where status = 'published';
create index journey_updates_public_feed_idx
  on public.journey_updates (thread_id, sort_order, published_on desc)
  where status = 'published';
create index project_updates_public_feed_idx
  on public.project_updates (project_id, sort_order, published_on desc)
  where status = 'published';

create trigger about_content_set_updated_at before update on public.about_content
for each row execute function public.set_updated_at();
create trigger public_contact_settings_set_updated_at before update on public.public_contact_settings
for each row execute function public.set_updated_at();
create trigger journey_threads_set_updated_at before update on public.journey_threads
for each row execute function public.set_updated_at();
create trigger journey_updates_set_updated_at before update on public.journey_updates
for each row execute function public.set_updated_at();
create trigger project_updates_set_updated_at before update on public.project_updates
for each row execute function public.set_updated_at();

alter table public.about_content enable row level security;
alter table public.public_contact_settings enable row level security;
alter table public.journey_threads enable row level security;
alter table public.journey_updates enable row level security;
alter table public.project_updates enable row level security;

grant select on public.about_content, public.public_contact_settings, public.journey_threads,
  public.journey_updates, public.project_updates to anon, authenticated;
grant insert, update, delete on public.about_content, public.public_contact_settings,
  public.journey_threads, public.journey_updates, public.project_updates to authenticated;

create policy "Anyone can read about content" on public.about_content for select
  to anon, authenticated using (true);
create policy "Admins manage about content" on public.about_content for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read public contact" on public.public_contact_settings for select
  to anon, authenticated using (true);
create policy "Admins manage public contact" on public.public_contact_settings for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published journey threads" on public.journey_threads for select
  to anon, authenticated using (status = 'published');
create policy "Admins read all journey threads" on public.journey_threads for select
  to authenticated using ((select public.is_admin()));
create policy "Admins manage journey threads" on public.journey_threads for insert
  to authenticated with check ((select public.is_admin()));
create policy "Admins update journey threads" on public.journey_threads for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete journey threads" on public.journey_threads for delete
  to authenticated using ((select public.is_admin()));

create policy "Anyone can read published journey updates" on public.journey_updates for select
  to anon, authenticated using (
    status = 'published' and exists (
      select 1 from public.journey_threads t
      where t.id = thread_id and t.status = 'published'
    )
  );
create policy "Admins read all journey updates" on public.journey_updates for select
  to authenticated using ((select public.is_admin()));
create policy "Admins manage journey updates" on public.journey_updates for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published project updates" on public.project_updates for select
  to anon, authenticated using (
    status = 'published' and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );
create policy "Admins read all project updates" on public.project_updates for select
  to authenticated using ((select public.is_admin()));
create policy "Admins manage project updates" on public.project_updates for all
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
