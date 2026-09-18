-- Adapt the existing entry_comments table. Preserve rows and their entry/reaction history.
begin;
alter table public.entry_comments add column parent_comment_id uuid
  references public.entry_comments(id) on delete cascade;
alter table public.entry_comments add column moderation_reason text;
alter table public.entry_comments add column updated_at timestamptz not null default now();
create trigger entry_comments_set_updated_at before update on public.entry_comments
  for each row execute function public.set_updated_at();
alter table public.entry_comments drop constraint entry_comments_status_check;
update public.entry_comments set status = case status
  when 'approved' then 'published'
  when 'hidden' then 'rejected'
  when 'spam' then 'rejected'
  else status end
where status in ('approved','hidden','spam');
alter table public.entry_comments add constraint entry_comments_status_check
  check (status in ('pending','published','rejected'));
-- One index covers entry lookup, visibility and chronological paging; avoid a
-- second, overlapping index on entry_id. Keep the existing moderation index.
drop index public.entry_comments_public_idx;
create index entry_comments_entry_status_created_idx
  on public.entry_comments(entry_id,status,created_at desc,id desc);
create index entry_comments_parent_comment_idx
  on public.entry_comments(parent_comment_id) where parent_comment_id is not null;
alter table public.entry_comments enable row level security;
-- Public read access is column-limited: visitor_hash and request_id never leak.
revoke select on public.entry_comments from anon, authenticated;
grant select (id,entry_id,parent_comment_id,author_name,body,status,created_at,updated_at)
  on public.entry_comments to anon, authenticated;
create policy "Published comments on visible entries" on public.entry_comments
  for select to anon, authenticated
  using (status='published' and exists (
    select 1 from public.thread_entries e where e.id=entry_id
  ));
-- No public INSERT grant/policy. Existing admin UPDATE/DELETE policy remains.
grant update (status, moderation_reason) on public.entry_comments to authenticated;
-- Restore the AAL2 rule already specified by the repository migration and
-- enforced in application routes; live is_admin had drifted to membership-only.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce((select auth.jwt()->>'aal')='aal2',false)
    and exists(select 1 from public.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
create or replace function public.get_entry_feedback(
  p_entry uuid,p_visitor uuid default null,p_before timestamptz default null,p_before_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.entry_is_public(p_entry) then raise exception 'Entry not found' using errcode='P0002'; end if;
  select jsonb_build_object(
    'likes',(select count(*) from public.entry_reactions where entry_id=p_entry and value=1),
    'dislikes',(select count(*) from public.entry_reactions where entry_id=p_entry and value=-1),
    'vote',coalesce((select value from public.entry_reactions where entry_id=p_entry and visitor_hash=md5(p_visitor::text)),0),
    'commentCount',(select count(*) from public.entry_comments where entry_id=p_entry and status='published'),
    'commentsEnabled',(select comments_enabled from public.thread_entries where id=p_entry),
    'comments',coalesce((select jsonb_agg(c order by c.created_at desc,c.id desc) from (
      select id,parent_comment_id,author_name,body,created_at from public.entry_comments
      where entry_id=p_entry and status='published'
      and (p_before is null or (created_at,id)<(p_before,p_before_id))
      order by created_at desc,id desc limit 21
    )c),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
create or replace function public.publish_checked_comment(
  p_entry uuid,p_visitor uuid,p_name text,p_body text,p_request uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server only' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(md5(p_visitor::text),0));
  if exists(select 1 from public.entry_comments where visitor_hash=md5(p_visitor::text) and request_id=p_request and entry_id=p_entry) then
    return public.get_entry_feedback(p_entry,p_visitor);
  end if;
  if exists(select 1 from public.entry_comments where visitor_hash=md5(p_visitor::text)
    and lower(btrim(body))=lower(btrim(p_body)) and created_at>now()-interval '1 day') then
    raise exception 'This comment was already posted' using errcode='22023';
  end if;
  perform public.internal_submit_entry_feedback(p_entry,p_visitor,'comment',0,p_name,p_body,p_request);
  update public.entry_comments set status='published' where entry_id=p_entry
    and visitor_hash=md5(p_visitor::text) and request_id=p_request;
  return public.get_entry_feedback(p_entry,p_visitor);
end;
$$;
create or replace function public.admin_entry_stats(p_entries uuid[])
returns table(entry_id uuid,likes bigint,dislikes bigint,comments bigint,pending bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin verification required' using errcode='42501'; end if;
  if coalesce(array_length(p_entries,1),0)>100 then raise exception 'Too many entries' using errcode='22023'; end if;
  return query select e.id,
    (select count(*) from public.entry_reactions r where r.entry_id=e.id and value=1),
    (select count(*) from public.entry_reactions r where r.entry_id=e.id and value=-1),
    (select count(*) from public.entry_comments c where c.entry_id=e.id and status='published'),
    (select count(*) from public.entry_comments c where c.entry_id=e.id and status='pending')
    from public.thread_entries e where e.id=any(p_entries);
end;
$$;
notify pgrst,'reload schema';
commit;
