begin;

-- One transaction keeps the intro, ordering, removals and returned IDs in sync.
-- SECURITY INVOKER retains the existing admin/MFA RLS policies.
create or replace function public.save_about(p_intro text, p_sections jsonb default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  saved public.about_content;
  section jsonb;
  saved_sections jsonb;
  ids uuid[] := array[]::uuid[];
begin
  if not public.is_admin() or coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'Admin verification required' using errcode = '42501';
  end if;
  if p_intro is null or char_length(p_intro) > 20000 then
    raise exception 'Invalid introduction' using errcode = '22023';
  end if;
  -- Serialize full saves on the singleton, including concurrent section changes.
  select * into saved from public.about_content where id = 1 for update;
  if not found then raise exception 'About content not found' using errcode = 'P0002'; end if;

  if p_sections is not null then
    if jsonb_typeof(p_sections) <> 'array' then
      raise exception 'Invalid sections' using errcode = '22023';
    end if;
    if jsonb_array_length(p_sections) > 100 then
      raise exception 'Too many sections' using errcode = '22023';
    end if;
    for section in select value from jsonb_array_elements(p_sections) loop
      if nullif(btrim(section->>'label'), '') is null
        or nullif(btrim(section->>'heading'), '') is null
        or nullif(section->>'id', '') is null then
        raise exception 'Invalid section' using errcode = '22023';
      end if;
      if (section->>'id')::uuid = any(ids) then
        raise exception 'Duplicate section' using errcode = '22023';
      end if;
      ids := array_append(ids, (section->>'id')::uuid);
      insert into public.about_sections (
        id, about_id, label, heading, body, media_reference, media_alt,
        media_position, media_shape, meta, sort_order
      ) values (
        (section->>'id')::uuid, 1, btrim(section->>'label'), btrim(section->>'heading'),
        coalesce(section->>'body', ''), nullif(section->>'media_reference', ''),
        coalesce(section->>'media_alt', ''), section->>'media_position', section->>'media_shape',
        coalesce(section->>'meta', ''), cardinality(ids) - 1
      ) on conflict (id) do update set
        label = excluded.label, heading = excluded.heading, body = excluded.body,
        media_reference = excluded.media_reference, media_alt = excluded.media_alt,
        media_position = excluded.media_position, media_shape = excluded.media_shape,
        meta = excluded.meta, sort_order = excluded.sort_order;
    end loop;
    delete from public.about_sections where about_id = 1 and not (id = any(ids));
  end if;

  update public.about_content set intro = btrim(p_intro) where id = 1 returning * into saved;
  select coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order, s.created_at, s.id), '[]'::jsonb)
    into saved_sections from public.about_sections s where s.about_id = 1;
  return jsonb_build_object('record', to_jsonb(saved), 'sections', saved_sections);
end;
$$;

revoke all on function public.save_about(text, jsonb) from public, anon;
grant execute on function public.save_about(text, jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
