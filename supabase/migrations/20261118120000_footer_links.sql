create table if not exists public.site_footer_settings (
  id integer primary key default 1 check (id = 1),
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  updated_at timestamptz not null default now()
);

insert into public.site_footer_settings (id) values (1) on conflict (id) do nothing;

create trigger site_footer_settings_set_updated_at
before update on public.site_footer_settings
for each row execute function public.set_updated_at();

alter table public.site_footer_settings enable row level security;
revoke all on public.site_footer_settings from anon, authenticated;
grant select on public.site_footer_settings to anon, authenticated;
grant update on public.site_footer_settings to authenticated;

create policy "Anyone can read the public footer links"
on public.site_footer_settings for select
to anon, authenticated
using (true);

create policy "Admins can update the public footer links"
on public.site_footer_settings for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
