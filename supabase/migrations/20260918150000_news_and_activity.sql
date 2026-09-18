begin;

create table public.manual_news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 2 and 180),
  body text not null default '' check (char_length(body) <= 12000),
  media_reference text,
  media_alt text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index manual_news_public_feed_idx on public.manual_news (published_at desc, id);
create trigger manual_news_updated before update on public.manual_news for each row execute function public.set_updated_at();
alter table public.manual_news enable row level security;
grant select on public.manual_news to anon, authenticated;
grant insert, update, delete on public.manual_news to authenticated;
create policy "Anyone can read news" on public.manual_news for select to anon, authenticated using (true);
create policy "Admins manage news" on public.manual_news for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create table public.journey_activity (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('thread_updated','subthread_updated','subthread_published')),
  thread_id uuid not null references public.threads(id) on delete cascade,
  subthread_id uuid references public.thread_subthreads(id) on delete cascade,
  thread_title text not null,
  thread_slug text not null,
  subthread_title text,
  subthread_slug text,
  media_reference text,
  media_position_x smallint not null default 50 check (media_position_x between 0 and 100),
  media_position_y smallint not null default 50 check (media_position_y between 0 and 100),
  created_at timestamptz not null default now()
);
create index journey_activity_public_feed_idx on public.journey_activity (created_at desc, id);
alter table public.journey_activity enable row level security;
grant select on public.journey_activity to anon, authenticated;
create policy "Anyone can read Journey activity" on public.journey_activity for select to anon, authenticated using (true);

create function public.log_journey_thread_update() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.destination='journey' and old.status='published' and new.status='published'
    and (new.title,new.slug,new.description,new.cover_media_reference,new.cover_position_x,new.cover_position_y)
      is distinct from (old.title,old.slug,old.description,old.cover_media_reference,old.cover_position_x,old.cover_position_y)
    and not exists (select 1 from public.journey_activity where event_type='thread_updated' and thread_id=new.id and created_at>now()-interval '2 minutes') then
    insert into public.journey_activity(event_type,thread_id,thread_title,thread_slug,media_reference,media_position_x,media_position_y)
      values('thread_updated',new.id,new.title,new.slug,new.cover_media_reference,new.cover_position_x,new.cover_position_y);
  end if;
  return new;
end;
$$;
create trigger journey_thread_activity after update on public.threads for each row execute function public.log_journey_thread_update();

create function public.log_journey_subthread_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare parent public.threads;
begin
  select * into parent from public.threads where id=new.thread_id;
  if parent.destination<>'journey' or parent.status<>'published' or new.status<>'published' then return new; end if;
  if tg_op='INSERT' or (tg_op='UPDATE' and old.status is distinct from 'published') then
    insert into public.journey_activity(event_type,thread_id,subthread_id,thread_title,thread_slug,subthread_title,subthread_slug,media_reference,media_position_x,media_position_y)
      values('subthread_published',parent.id,new.id,parent.title,parent.slug,new.title,new.slug,coalesce(new.cover_media_reference,parent.cover_media_reference),coalesce(new.cover_position_x,parent.cover_position_x),coalesce(new.cover_position_y,parent.cover_position_y));
  elsif (new.title,new.slug,new.description,new.cover_media_reference,new.cover_position_x,new.cover_position_y)
      is distinct from (old.title,old.slug,old.description,old.cover_media_reference,old.cover_position_x,old.cover_position_y)
    and not exists (select 1 from public.journey_activity where event_type='subthread_updated' and subthread_id=new.id and created_at>now()-interval '2 minutes') then
    insert into public.journey_activity(event_type,thread_id,subthread_id,thread_title,thread_slug,subthread_title,subthread_slug,media_reference,media_position_x,media_position_y)
      values('subthread_updated',parent.id,new.id,parent.title,parent.slug,new.title,new.slug,coalesce(new.cover_media_reference,parent.cover_media_reference),coalesce(new.cover_position_x,parent.cover_position_x),coalesce(new.cover_position_y,parent.cover_position_y));
  end if;
  return new;
end;
$$;
create trigger journey_subthread_activity after insert or update on public.thread_subthreads for each row execute function public.log_journey_subthread_activity();

notify pgrst,'reload schema';
commit;
