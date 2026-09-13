-- Database-first public identity and About section content.

alter table public.site_profile
  add column if not exists portrait_media_reference text,
  add column if not exists portrait_alt text not null default '',
  add column if not exists portrait_object_position text not null default 'center'
    check (portrait_object_position in ('center', 'top', 'bottom'));

update public.site_profile
set
  first_name = coalesce(nullif(first_name, ''), 'Fadi'),
  last_name = coalesce(nullif(last_name, ''), 'Al Hazim'),
  role = coalesce(nullif(role, ''), 'Computer Engineer'),
  kicker = coalesce(nullif(kicker, ''), 'Hello, I''m'),
  portrait_media_reference = coalesce(nullif(portrait_media_reference, ''), '/fadi-gray-suit.jpg'),
  portrait_alt = coalesce(nullif(portrait_alt, ''), 'Fadi Al Hazim wearing a gray suit'),
  portrait_object_position = coalesce(nullif(portrait_object_position, ''), 'center')
where id = 1;

create table if not exists public.about_sections (
  id uuid primary key default gen_random_uuid(),
  about_id smallint not null references public.about_content (id) on delete cascade default 1,
  label text not null default '',
  heading text not null default '',
  body text not null default '',
  media_reference text,
  media_alt text not null default '',
  media_position text not null default 'right'
    check (media_position in ('left', 'right')),
  media_shape text not null default 'landscape'
    check (media_shape in ('portrait', 'landscape', 'square')),
  meta text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_sections_order_idx
  on public.about_sections (about_id, sort_order, created_at);

create trigger about_sections_set_updated_at
before update on public.about_sections
for each row execute function public.set_updated_at();

alter table public.thread_media
  add column if not exists media_alt text not null default '',
  add column if not exists media_position text not null default 'right'
    check (media_position in ('left', 'right')),
  add column if not exists media_shape text not null default 'landscape'
    check (media_shape in ('portrait', 'landscape', 'square'));

alter table public.about_sections enable row level security;
grant select on public.about_sections to anon, authenticated;
grant insert, update, delete on public.about_sections to authenticated;

create policy "Anyone can read about sections"
on public.about_sections for select to anon, authenticated
using (true);

create policy "Admins manage about sections"
on public.about_sections for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public media is readable"
on storage.objects for select
using (bucket_id = 'media');

create policy "Admins upload media"
on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (select public.is_admin()));

create policy "Admins update media"
on storage.objects for update to authenticated
using (bucket_id = 'media' and (select public.is_admin()))
with check (bucket_id = 'media' and (select public.is_admin()));

create policy "Admins delete media"
on storage.objects for delete to authenticated
using (bucket_id = 'media' and (select public.is_admin()));
