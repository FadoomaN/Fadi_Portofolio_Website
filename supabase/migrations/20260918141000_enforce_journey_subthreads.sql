begin;
create function public.require_journey_subthread() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.subthread_id is null and exists(
    select 1 from public.threads where id=new.thread_id and destination='journey'
  ) then raise exception 'Journey content must belong to a subthread' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger require_journey_subthread_before_write
before insert or update of thread_id,subthread_id on public.thread_entries
for each row execute function public.require_journey_subthread();
commit;
