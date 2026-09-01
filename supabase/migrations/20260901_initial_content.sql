-- Initial content and administration schema for Fadi's website.
-- Public visitors may only read published content. Mutations are admin-only.

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.site_profile (
  id smallint primary key default 1 check (id = 1),
  first_name text not null,
  last_name text not null,
  role text not null,
  kicker text not null,
  portrait_path text,
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null default '',
  content jsonb not null default '{}'::jsonb,
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  video_url text,
  thumbnail_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  view_count bigint not null default 0 check (view_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_public_feed_idx
  on public.projects (featured desc, sort_order, published_at desc)
  where status = 'published';

create index videos_public_feed_idx
  on public.videos (featured desc, published_at desc)
  where status = 'published';

-- Centralized admin check keeps every content policy consistent.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger site_profile_set_updated_at
before update on public.site_profile
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger videos_set_updated_at
before update on public.videos
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.site_profile enable row level security;
alter table public.projects enable row level security;
alter table public.videos enable row level security;

revoke all on table public.admin_users, public.site_profile, public.projects, public.videos
from anon, authenticated;

grant select on table public.site_profile, public.projects, public.videos
to anon, authenticated;

grant select on table public.admin_users to authenticated;
grant insert, update, delete on table public.site_profile, public.projects, public.videos
to authenticated;

create policy "Admins can read their membership"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Anyone can read the site profile"
on public.site_profile
for select
to anon, authenticated
using (true);

create policy "Admins can manage the site profile"
on public.site_profile
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Anyone can read published projects"
on public.projects
for select
to anon, authenticated
using (status = 'published');

create policy "Admins can read every project"
on public.projects
for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can create projects"
on public.projects
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update projects"
on public.projects
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete projects"
on public.projects
for delete
to authenticated
using ((select public.is_admin()));

create policy "Anyone can read published videos"
on public.videos
for select
to anon, authenticated
using (status = 'published');

create policy "Admins can read every video"
on public.videos
for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can create videos"
on public.videos
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update videos"
on public.videos
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete videos"
on public.videos
for delete
to authenticated
using ((select public.is_admin()));

insert into public.site_profile (
  id,
  first_name,
  last_name,
  role,
  kicker,
  portrait_path
)
values (
  1,
  'Fadi',
  'Al Hazim',
  'Computer Engineer',
  'Hello, I''m',
  '/fadi-gray-suit.jpg'
);
