-- Seed the three existing public About examples into the normalized section table once.
do $$
declare
  origin_body text;
begin
  if not exists (select 1 from public.about_sections where about_id = 1) then
    select coalesce(nullif(body, ''), 'I am a computer engineer who enjoys turning ideas into thoughtful, working systems.')
      into origin_body
      from public.about_content
      where id = 1;

    insert into public.about_sections (
      id, about_id, label, heading, body, media_reference, media_alt,
      media_position, media_shape, meta, sort_order
    )
    values
      (
        '20000000-0000-4000-8000-000000000001', 1, '01 / Origin',
        'A LITTLE ABOUT ME', origin_body, null, '',
        'left', 'portrait', 'PROFILE / 001', 0
      ),
      (
        '20000000-0000-4000-8000-000000000002', 1, '02 / Method',
        'HOW I THINK',
        'Temporary copy for the way ideas become clear: observe, question, build, test and refine.',
        null, '', 'right', 'landscape', 'PROCESS / ITERATION', 1
      ),
      (
        '20000000-0000-4000-8000-000000000003', 1, '03 / Outside the interface',
        'BEYOND THE SCREEN',
        'Temporary copy for the human details, interests and questions that give the work its wider context.',
        null, '', 'left', 'square', 'OPEN THREAD / 003', 2
      );
  end if;
end
$$;
