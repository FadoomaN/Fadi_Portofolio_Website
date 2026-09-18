-- Public clients can vote, but only the trusted server may publish comments after external checks.
alter function public.submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) rename to internal_submit_entry_feedback;
revoke all on function public.internal_submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) from public,anon,authenticated;
create function public.submit_entry_feedback(p_entry uuid,p_visitor uuid,p_action text,p_value integer default 0,p_name text default '',p_body text default '',p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if p_action is distinct from 'reaction' then raise exception 'Automatic server checks required' using errcode='42501'; end if;
  return public.internal_submit_entry_feedback(p_entry,p_visitor,p_action,p_value,p_name,p_body,p_request);
end;
$$;
revoke all on function public.submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) from public;
grant execute on function public.submit_entry_feedback(uuid,uuid,text,integer,text,text,uuid) to anon,authenticated;

create function public.reserve_comment_check(p_entry uuid,p_visitor uuid) returns void
language plpgsql security definer set search_path='' as $$
declare hits_now integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server only' using errcode='42501'; end if;
  if p_visitor is null or not public.entry_is_public(p_entry) or not (select comments_enabled from public.thread_entries where id=p_entry) then raise exception 'Comments unavailable' using errcode='22023'; end if;
  insert into public.feedback_rate_limits(visitor_hash,action,window_start,hits) values(md5(p_visitor::text),'moderation',date_trunc('hour',now()),1)
  on conflict(visitor_hash,action) do update set window_start=excluded.window_start,
    hits=case when public.feedback_rate_limits.window_start=excluded.window_start then public.feedback_rate_limits.hits+1 else 1 end
  returning hits into hits_now;
  if hits_now>10 then raise exception 'Please wait before trying again' using errcode='P0001'; end if;
end;
$$;
create function public.publish_checked_comment(p_entry uuid,p_visitor uuid,p_name text,p_body text,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server only' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(md5(p_visitor::text),0));
  if exists(select 1 from public.entry_comments where visitor_hash=md5(p_visitor::text) and request_id=p_request and entry_id=p_entry) then
    return public.get_entry_feedback(p_entry,p_visitor);
  end if;
  if exists(select 1 from public.entry_comments where visitor_hash=md5(p_visitor::text) and lower(btrim(body))=lower(btrim(p_body)) and created_at>now()-interval '1 day') then raise exception 'This comment was already posted' using errcode='22023'; end if;
  perform public.internal_submit_entry_feedback(p_entry,p_visitor,'comment',0,p_name,p_body,p_request);
  update public.entry_comments set status='approved' where entry_id=p_entry and visitor_hash=md5(p_visitor::text) and request_id=p_request;
  return public.get_entry_feedback(p_entry,p_visitor);
end;
$$;
revoke all on function public.reserve_comment_check(uuid,uuid), public.publish_checked_comment(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_comment_check(uuid,uuid), public.publish_checked_comment(uuid,uuid,text,text,uuid) to service_role;
notify pgrst,'reload schema';
;
