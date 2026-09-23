begin;

alter table public.public_contact_settings
  add column if not exists phone_number text,
  add column if not exists show_email boolean not null default false,
  add column if not exists show_phone boolean not null default false;

alter table public.public_contact_settings
  add constraint public_contact_settings_phone_number_check
  check (phone_number is null or phone_number ~ '^\+[1-9][0-9]{7,14}$');

notify pgrst, 'reload schema';
commit;
