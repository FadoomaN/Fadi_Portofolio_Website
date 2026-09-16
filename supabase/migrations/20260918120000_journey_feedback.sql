-- Additive migration: retain all existing content and the existing AAL2 admin gate.
begin;

create table public.thread_subthreads (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  cover_media_reference text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(thread_id, slug), unique(id, thread_id)
);
create index thread_subthreads_feed_idx on public.thread_subthreads(thread_id, status, sort_order, id);
create trigger thread_subthreads_updated before update on public.thread_subthreads
for each row execute function public.set_updated_at();
alter table public.thread_entries add column subthread_id uuid;
alter table public.thread_entries add constraint thread_entries_subthread_parent_fk
foreign key (subthread_id, thread_id) references public.thread_subthreads(id, thread_id) on delete cascade;
alter table public.thread_entries add column comments_enabled boolean not null default true;
create index thread_entries_subthread_idx on public.thread_entries(subthread_id, status, sort_order, published_on desc, id);
alter table public.thread_subthreads enable row level security;
grant select on public.thread_subthreads to anon, authenticated;
grant insert, update, delete on public.thread_subthreads to authenticated;
create policy "Published subthreads" on public.thread_subthreads for select to anon, authenticated
using (status='published' and exists(select 1 from public.threads t where t.id=thread_id and t.status='published'));
create policy "Admins manage subthreads" on public.thread_subthreads for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy "Anyone can read published thread entries" on public.thread_entries;
create policy "Anyone can read published thread entries" on public.thread_entries for select to anon, authenticated
using (status='published'
  and exists(select 1 from public.threads t where t.id=thread_id and t.status='published')
  and (subthread_id is null or exists(select 1 from public.thread_subthreads s where s.id=subthread_id and s.status='published')));
drop policy "Anyone can read published thread media" on public.thread_media;
create policy "Anyone can read published thread media" on public.thread_media for select to anon, authenticated
using (exists(select 1 from public.thread_entries e where e.id=entry_id and e.status='published'
  and exists(select 1 from public.threads t where t.id=e.thread_id and t.status='published')
  and (e.subthread_id is null or exists(select 1 from public.thread_subthreads s where s.id=e.subthread_id and s.status='published'))));

create table public.entry_reactions (
  entry_id uuid not null references public.thread_entries(id) on delete cascade,
  visitor_hash text not null,
  value smallint not null check(value in (-1,1)),
  updated_at timestamptz not null default now(),
  primary key(entry_id, visitor_hash)
);
create table public.entry_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.thread_entries(id) on delete cascade,
  visitor_hash text not null,
  request_id uuid not null,
  author_name text not null check(char_length(btrim(author_name)) between 2 and 60),
  body text not null check(char_length(btrim(body)) between 1 and 2000),
  status text not null default 'pending' check(status in ('pending','approved','hidden','spam')),
  created_at timestamptz not null default now(),
  unique(visitor_hash, request_id)
);
create index entry_comments_public_idx on public.entry_comments(entry_id, created_at desc, id desc) where status='approved';
create index entry_comments_moderation_idx on public.entry_comments(status, created_at desc, id desc);
create table public.feedback_rate_limits (
  visitor_hash text not null,
  action text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key(visitor_hash, action)
);
alter table public.entry_reactions enable row level security;
alter table public.entry_comments enable row level security;
alter table public.feedback_rate_limits enable row level security;
revoke all on public.entry_reactions, public.entry_comments, public.feedback_rate_limits from anon, authenticated;
grant select on public.entry_reactions, public.entry_comments to authenticated;
grant update(status), delete on public.entry_comments to authenticated;
create policy "Admins read reactions" on public.entry_reactions for select to authenticated using ((select public.is_admin()));
create policy "Admins moderate comments" on public.entry_comments for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Definer functions expose only approved comments and aggregate counts, never visitor identifiers.
create function public.entry_is_public(p_entry uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.thread_entries e join public.threads t on t.id=e.thread_id
    left join public.thread_subthreads s on s.id=e.subthread_id
    where e.id=p_entry and e.status='published' and t.status='published'
      and (e.subthread_id is null or s.status='published'));
$$;
revoke all on function public.entry_is_public(uuid) from public, anon, authenticated;

create function public.get_entry_feedback(p_entry uuid, p_visitor uuid default null, p_before timestamptz default null, p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.entry_is_public(p_entry) then raise exception 'Entry not found' using errcode='P0002'; end if;
  select jsonb_build_object(
    'likes',(select count(*) from public.entry_reactions where entry_id=p_entry and value=1),
    'dislikes',(select count(*) from public.entry_reactions where entry_id=p_entry and value=-1),
    'vote',coalesce((select value from public.entry_reactions where entry_id=p_entry and visitor_hash=md5(p_visitor::text)),0),
    'commentCount',(select count(*) from public.entry_comments where entry_id=p_entry and status='approved'),
    'commentsEnabled',(select comments_enabled from public.thread_entries where id=p_entry),
    'comments',coalesce((select jsonb_agg(c order by c.created_at desc,c.id desc) from (
      select id,author_name,body,created_at from public.entry_comments where entry_id=p_entry and status='approved'
      and (p_before is null or (created_at,id)<(p_before,p_before_id))
      order by created_at desc,id desc limit 21
    )c),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_entry_feedback(uuid,uuid,timestamptz,uuid) from public;
grant execute on function public.get_entry_feedback(uuid,uuid,timestamptz,uuid) to anon, authenticated;

create function public.submit_entry_feedback(p_entry uuid,p_visitor uuid,p_action text,p_value integer default 0,p_name text default '',p_body text default '',p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_hash text; v_hits integer; v_start timestamptz; v_id uuid;
begin
  if p_visitor is null or p_action is null or p_action not in ('reaction','comment') then raise exception 'Invalid feedback' using errcode='22023'; end if;
  if not public.entry_is_public(p_entry) then raise exception 'Entry not found' using errcode='P0002'; end if;
  v_hash:=md5(p_visitor::text);
  perform pg_advisory_xact_lock(hashtextextended(v_hash,0));
  if p_action='comment' then
    if not (select comments_enabled from public.thread_entries where id=p_entry) then raise exception 'Comments are closed' using errcode='22023'; end if;
    if char_length(btrim(p_name)) not between 2 and 60 or char_length(btrim(p_body)) not between 1 and 2000 or p_request is null then
      raise exception 'Enter a name and comment within the length limits' using errcode='22023';
    end if;
    select id into v_id from public.entry_comments where visitor_hash=v_hash and request_id=p_request;
    if v_id is not null then return jsonb_build_object('ok',true,'pending',true); end if;
  elsif p_value not in (-1,0,1) then raise exception 'Invalid reaction' using errcode='22023'; end if;
  v_start:=date_trunc(case when p_action='reaction' then 'minute' else 'hour' end,now());
  insert into public.feedback_rate_limits(visitor_hash,action,window_start,hits) values(v_hash,p_action,v_start,1)
  on conflict(visitor_hash,action) do update set window_start=excluded.window_start,
    hits=case when public.feedback_rate_limits.window_start=excluded.window_start then public.feedback_rate_limits.hits+1 else 1 end
  returning hits into v_hits;
  if v_hits > (case when p_action='reaction' then 30 else 5 end) then raise exception 'Please wait before trying again' using errcode='P0001'; end if;
  if p_action='reaction' then
    if p_value=0 then delete from public.entry_reactions where entry_id=p_entry and visitor_hash=v_hash;
    else insert into public.entry_reactions(entry_id,visitor_hash,value) values(p_entry,v_hash,p_value)
      on conflict(entry_id,visitor_hash) do update set value=excluded.value,updated_at=now(); end if;
    return public.get_entry_feedback(p_entry,p_visitor);
  end if;
  insert into public.entry_comments(entry_id,visitor_hash,request_id,author_name,body)
    values(p_entry,v_hash,p_request,btrim(p_name),btrim(p_body));
  return jsonb_build_object('ok',true,'pending',true);
end;
$$;
revoke all on function public.submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) from public;
grant execute on function public.submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) to anon, authenticated;

-- Save an entry and its ordered media in one transaction. A failed attachment never leaves a partial save.
create function public.save_thread_entry(p_record jsonb,p_media jsonb) returns public.thread_entries
language plpgsql security invoker set search_path='' as $$
declare saved public.thread_entries; item jsonb; i integer:=0;
begin
  if not public.is_admin() then raise exception 'Admin verification required' using errcode='42501'; end if;
  if jsonb_typeof(p_media)<>'array' or jsonb_array_length(p_media)>20 then raise exception 'Invalid media list' using errcode='22023'; end if;
  if nullif(p_record->>'id','') is null then
    insert into public.thread_entries(thread_id,subthread_id,title,published_on,content,status,sort_order,comments_enabled,created_by)
    values((p_record->>'thread_id')::uuid,nullif(p_record->>'subthread_id','')::uuid,p_record->>'title',
      (p_record->>'published_on')::date,p_record->>'content',p_record->>'status',(p_record->>'sort_order')::integer,
      (p_record->>'comments_enabled')::boolean,auth.uid()) returning * into saved;
  else
    update public.thread_entries set thread_id=(p_record->>'thread_id')::uuid,subthread_id=nullif(p_record->>'subthread_id','')::uuid,
      title=p_record->>'title',published_on=(p_record->>'published_on')::date,content=p_record->>'content',
      status=p_record->>'status',sort_order=(p_record->>'sort_order')::integer,comments_enabled=(p_record->>'comments_enabled')::boolean
    where id=(p_record->>'id')::uuid returning * into saved;
    if saved.id is null then raise exception 'Entry not found' using errcode='P0002'; end if;
  end if;
  delete from public.thread_media where entry_id=saved.id;
  for item in select value from jsonb_array_elements(p_media) loop
    insert into public.thread_media(entry_id,media_type,media_reference,caption,media_alt,media_shape,media_position,sort_order)
      values(saved.id,item->>'media_type',item->>'media_reference',coalesce(item->>'caption',''),coalesce(item->>'media_alt',''),
        coalesce(item->>'media_shape','landscape'),coalesce(item->>'media_position','right'),i);
    i:=i+1;
  end loop;
  return saved;
end;
$$;
revoke all on function public.save_thread_entry(jsonb,jsonb) from public,anon;
grant execute on function public.save_thread_entry(jsonb,jsonb) to authenticated;

create function public.admin_entry_stats(p_entries uuid[]) returns table(entry_id uuid,likes bigint,dislikes bigint,comments bigint,pending bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Admin verification required' using errcode='42501'; end if;
  if coalesce(array_length(p_entries,1),0)>100 then raise exception 'Too many entries' using errcode='22023'; end if;
  return query select e.id,
    (select count(*) from public.entry_reactions r where r.entry_id=e.id and value=1),
    (select count(*) from public.entry_reactions r where r.entry_id=e.id and value=-1),
    (select count(*) from public.entry_comments c where c.entry_id=e.id and status='approved'),
    (select count(*) from public.entry_comments c where c.entry_id=e.id and status='pending')
    from public.thread_entries e where e.id=any(p_entries);
end;
$$;
revoke all on function public.admin_entry_stats(uuid[]) from public,anon;
grant execute on function public.admin_entry_stats(uuid[]) to authenticated;

notify pgrst,'reload schema';
commit;
