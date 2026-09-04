-- Public identity and private operational contact data must never share read policies.
create table public.admin_contact_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  operations_email text check (
    operations_email is null
    or (
      char_length(operations_email) <= 254
      and operations_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  ),
  phone_number text check (
    phone_number is null
    or phone_number ~ '^\+[1-9][0-9]{7,14}$'
  ),
  timezone text not null default 'Europe/Stockholm' check (char_length(timezone) <= 64),
  updated_at timestamptz not null default now()
);

create trigger admin_contact_settings_set_updated_at
before update on public.admin_contact_settings
for each row execute function public.set_updated_at();

alter table public.admin_contact_settings enable row level security;

revoke all on table public.admin_contact_settings from anon, authenticated;
grant select, insert, update on table public.admin_contact_settings to authenticated;

create policy "Admins can read their private contact settings"
on public.admin_contact_settings
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_admin())
);

create policy "Admins can create their private contact settings"
on public.admin_contact_settings
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_admin())
);

create policy "Admins can update their private contact settings"
on public.admin_contact_settings
for update
to authenticated
using (
  user_id = (select auth.uid())
  and (select public.is_admin())
)
with check (
  user_id = (select auth.uid())
  and (select public.is_admin())
);

-- One RPC saves the public identity and private contact settings atomically.
create or replace function public.save_admin_profile(
  p_first_name text,
  p_last_name text,
  p_role text,
  p_kicker text,
  p_operations_email text,
  p_phone_number text,
  p_timezone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges';
  end if;

  update public.site_profile
  set
    first_name = p_first_name,
    last_name = p_last_name,
    role = p_role,
    kicker = p_kicker
  where id = 1;

  insert into public.admin_contact_settings (
    user_id,
    operations_email,
    phone_number,
    timezone
  )
  values (
    auth.uid(),
    nullif(p_operations_email, ''),
    nullif(p_phone_number, ''),
    p_timezone
  )
  on conflict (user_id) do update
  set
    operations_email = excluded.operations_email,
    phone_number = excluded.phone_number,
    timezone = excluded.timezone;
end;
$$;

revoke all on function public.save_admin_profile(text, text, text, text, text, text, text) from public;
grant execute on function public.save_admin_profile(text, text, text, text, text, text, text) to authenticated;
