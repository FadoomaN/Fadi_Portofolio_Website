alter table public.about_sections
  add column if not exists media_position_x smallint not null default 50 check (media_position_x between 0 and 100),
  add column if not exists media_position_y smallint not null default 50 check (media_position_y between 0 and 100);

create or replace function public.save_about(p_intro text, p_sections jsonb default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  saved public.about_content;
  section jsonb;
  saved_sections jsonb;
  ids uuid[] := array[]::uuid[];
begin
  if not public.is_admin() or coalesce(auth.jwt()->>'aal', '') <> 'aal2' then raise exception 'Admin verification required' using errcode = '42501'; end if;
  if p_intro is null or char_length(p_intro) > 20000 then raise exception 'Invalid introduction' using errcode = '22023'; end if;
  select * into saved from public.about_content where id = 1 for update;
  if not found then raise exception 'About content not found' using errcode = 'P0002'; end if;
  if p_sections is not null then
    if jsonb_typeof(p_sections) <> 'array' or jsonb_array_length(p_sections) > 100 then raise exception 'Invalid sections' using errcode = '22023'; end if;
    for section in select value from jsonb_array_elements(p_sections) loop
      if nullif(btrim(section->>'label'), '') is null or nullif(btrim(section->>'heading'), '') is null or nullif(section->>'id', '') is null then raise exception 'Invalid section' using errcode = '22023'; end if;
      if (section->>'id')::uuid = any(ids) then raise exception 'Duplicate section' using errcode = '22023'; end if;
      ids := array_append(ids, (section->>'id')::uuid);
      insert into public.about_sections (id, about_id, label, heading, body, media_reference, media_alt, media_position, media_shape, media_position_x, media_position_y, meta, sort_order)
      values ((section->>'id')::uuid, 1, btrim(section->>'label'), btrim(section->>'heading'), coalesce(section->>'body', ''), nullif(section->>'media_reference', ''), coalesce(section->>'media_alt', ''), section->>'media_position', section->>'media_shape', greatest(0, least(100, coalesce((section->>'media_position_x')::integer, 50))), greatest(0, least(100, coalesce((section->>'media_position_y')::integer, 50))), coalesce(section->>'meta', ''), cardinality(ids) - 1)
      on conflict (id) do update set label = excluded.label, heading = excluded.heading, body = excluded.body, media_reference = excluded.media_reference, media_alt = excluded.media_alt, media_position = excluded.media_position, media_shape = excluded.media_shape, media_position_x = excluded.media_position_x, media_position_y = excluded.media_position_y, meta = excluded.meta, sort_order = excluded.sort_order;
    end loop;
    delete from public.about_sections where about_id = 1 and not (id = any(ids));
  end if;
  update public.about_content set intro = btrim(p_intro) where id = 1 returning * into saved;
  select coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order, s.created_at, s.id), '[]'::jsonb) into saved_sections from public.about_sections s where s.about_id = 1;
  return jsonb_build_object('record', to_jsonb(saved), 'sections', saved_sections);
end;
$$;

notify pgrst, 'reload schema';
