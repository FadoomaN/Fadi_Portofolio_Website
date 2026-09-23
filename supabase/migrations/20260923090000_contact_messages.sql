begin;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 2 and 180),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index contact_messages_inbox_idx on public.contact_messages(status, created_at desc);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
create policy "Admins read contact messages" on public.contact_messages for select to authenticated using ((select public.is_admin()));
create policy "Admins update contact messages" on public.contact_messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete contact messages" on public.contact_messages for delete to authenticated using ((select public.is_admin()));

create table public.contact_submission_limits (
  visitor_id uuid primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts between 1 and 5)
);
alter table public.contact_submission_limits enable row level security;
revoke all on public.contact_submission_limits from public, anon, authenticated;

create or replace function public.reserve_contact_submission(p_visitor uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare current_row public.contact_submission_limits%rowtype;
begin
  select * into current_row from public.contact_submission_limits where visitor_id=p_visitor for update;
  if not found then insert into public.contact_submission_limits(visitor_id) values(p_visitor); return; end if;
  if current_row.window_started_at < now()-interval '1 hour' then
    update public.contact_submission_limits set window_started_at=now(),attempts=1 where visitor_id=p_visitor; return;
  end if;
  if current_row.attempts >= 5 then raise exception using errcode='P0001',message='Rate limit exceeded'; end if;
  update public.contact_submission_limits set attempts=attempts+1 where visitor_id=p_visitor;
end; $$;
revoke all on function public.reserve_contact_submission(uuid) from public;
grant execute on function public.reserve_contact_submission(uuid) to service_role;

notify pgrst,'reload schema';
commit;
