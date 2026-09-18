
begin;

-- Keep the existing content and feedback records. Each Journey subthread has one
-- internal content record so old reaction/comment IDs remain valid.
alter table public.threads
  add column cover_position_x smallint not null default 50 check (cover_position_x between 0 and 100),
  add column cover_position_y smallint not null default 50 check (cover_position_y between 0 and 100);
alter table public.thread_subthreads
  add column cover_position_x smallint not null default 50 check (cover_position_x between 0 and 100),
  add column cover_position_y smallint not null default 50 check (cover_position_y between 0 and 100);

create table public.journey_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
insert into public.journey_categories(name,slug,sort_order) values
  ('Cooking','cooking',10),('Technology','technology',20),('Sports','sports',30),
  ('Travel','travel',40),('Music','music',50),('Photography','photography',60),
  ('Reading','reading',70),('Creative projects','creative-projects',80),('Outdoors','outdoors',90);
insert into public.journey_categories(name,slug,sort_order)
select distinct category,
  trim(both '-' from regexp_replace(lower(category),'[^a-z0-9]+','-','g')),
  100 from public.threads where destination='journey' and category<>''
on conflict do nothing;
alter table public.journey_categories enable row level security;
grant select on public.journey_categories to anon,authenticated;
grant insert on public.journey_categories to authenticated;
create policy "Everyone sees Journey categories" on public.journey_categories for select to anon,authenticated using (true);
create policy "Admins add Journey categories" on public.journey_categories for insert to authenticated with check ((select public.is_admin()));

-- A direct Journey post becomes a subthread, preserving the post ID and feedback.
-- If a subthread held several posts, each extra post receives its own subthread.
do $$
declare old_post record; new_subthread uuid; base_slug text; unique_slug text;
begin
  for old_post in
    select e.* from public.thread_entries e join public.threads t on t.id=e.thread_id
    where t.destination='journey' and (e.subthread_id is null or
      e.id not in (select distinct on (subthread_id) id from public.thread_entries
        where subthread_id is not null order by subthread_id,created_at,id))
    order by e.created_at,e.id
  loop
    base_slug:=left(trim(both '-' from regexp_replace(lower(old_post.title),'[^a-z0-9]+','-','g')),70);
    if base_slug='' then base_slug:='post'; end if;
    unique_slug:=base_slug||'-'||left(replace(old_post.id::text,'-',''),8);
    insert into public.thread_subthreads(thread_id,title,slug,description,status,sort_order,created_at,updated_at)
      values(old_post.thread_id,old_post.title,unique_slug,'',old_post.status,old_post.sort_order,old_post.created_at,old_post.updated_at)
      returning id into new_subthread;
    update public.thread_entries set subthread_id=new_subthread where id=old_post.id;
  end loop;
end;
$$;

-- Existing subthreads without a post get a blank internal record for feedback.
insert into public.thread_entries(thread_id,subthread_id,title,published_on,content,status,sort_order,comments_enabled,created_at,updated_at)
select s.thread_id,s.id,s.title,s.created_at::date,'',s.status,0,true,s.created_at,s.updated_at
from public.thread_subthreads s join public.threads t on t.id=s.thread_id
where t.destination='journey' and not exists(select 1 from public.thread_entries e where e.subthread_id=s.id);
create unique index thread_entries_one_per_subthread on public.thread_entries(subthread_id) where subthread_id is not null;

-- A single authenticated edit saves the subthread, article/video-sized media,
-- thumbnail position and its feedback backing record atomically.
create function public.save_journey_subthread(p_record jsonb,p_content jsonb,p_media jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.thread_subthreads; post public.thread_entries; parent_destination text;
begin
  if not public.is_admin() then raise exception 'Admin verification required' using errcode='42501'; end if;
  select destination into parent_destination from public.threads where id=(p_record->>'thread_id')::uuid;
  if parent_destination is distinct from 'journey' then raise exception 'Choose a Journey thread' using errcode='22023'; end if;
  if nullif(p_record->>'id','') is null then
    insert into public.thread_subthreads(thread_id,title,slug,description,cover_media_reference,cover_position_x,cover_position_y,status,sort_order)
    values((p_record->>'thread_id')::uuid,p_record->>'title',p_record->>'slug',coalesce(p_record->>'description',''),
      nullif(p_record->>'cover_media_reference',''),(p_record->>'cover_position_x')::smallint,(p_record->>'cover_position_y')::smallint,
      p_record->>'status',(p_record->>'sort_order')::integer) returning * into saved;
  else
    update public.thread_subthreads set title=p_record->>'title',slug=p_record->>'slug',description=coalesce(p_record->>'description',''),
      cover_media_reference=nullif(p_record->>'cover_media_reference',''),cover_position_x=(p_record->>'cover_position_x')::smallint,
      cover_position_y=(p_record->>'cover_position_y')::smallint,status=p_record->>'status',sort_order=(p_record->>'sort_order')::integer
    where id=(p_record->>'id')::uuid and thread_id=(p_record->>'thread_id')::uuid returning * into saved;
    if saved.id is null then raise exception 'Subthread not found' using errcode='P0002'; end if;
  end if;
  select * into post from public.thread_entries where subthread_id=saved.id;
  post:=public.save_thread_entry(jsonb_build_object(
    'id',post.id,'thread_id',saved.thread_id,'subthread_id',saved.id,'title',saved.title,
    'published_on',p_content->>'published_on','content',coalesce(p_content->>'content',''),
    'status',saved.status,'sort_order',0,'comments_enabled',coalesce((p_content->>'comments_enabled')::boolean,true)
  ),p_media);
  return jsonb_build_object('subthread',to_jsonb(saved),'post',to_jsonb(post));
end;
$$;
revoke all on function public.save_journey_subthread(jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_journey_subthread(jsonb,jsonb,jsonb) to authenticated;

notify pgrst,'reload schema';
commit;
;
