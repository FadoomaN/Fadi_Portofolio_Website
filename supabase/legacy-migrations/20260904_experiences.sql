-- Career history is editable in the private control surface and ready for a future public page.
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  role text not null,
  employment_type text not null default 'full-time' check (
    employment_type in ('full-time', 'part-time', 'internship', 'contract', 'freelance', 'education', 'other')
  ),
  location text not null default '',
  summary text not null default '',
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_current or end_date is null),
  check (end_date is null or end_date >= start_date)
);

create index experiences_public_feed_idx
  on public.experiences (sort_order, start_date desc)
  where status = 'published';

create trigger experiences_set_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

alter table public.experiences enable row level security;

revoke all on table public.experiences from anon, authenticated;
grant select on table public.experiences to anon, authenticated;
grant insert, update, delete on table public.experiences to authenticated;

create policy "Anyone can read published experiences"
on public.experiences
for select
to anon, authenticated
using (status = 'published');

create policy "Admins can read every experience"
on public.experiences
for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can create experiences"
on public.experiences
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update experiences"
on public.experiences
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete experiences"
on public.experiences
for delete
to authenticated
using ((select public.is_admin()));

-- Temporary public records make the first Experience page useful before real history is entered.
-- Their fixed ids let the interface label them as test data; delete or replace them from Admin.
insert into public.experiences (
  id,
  organization,
  role,
  employment_type,
  location,
  summary,
  start_date,
  end_date,
  is_current,
  status,
  sort_order
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Demo Systems Lab',
    'Embedded Systems Engineer',
    'full-time',
    'Malmö, Sweden',
    'Built and tested connected prototypes where firmware, sensors and physical hardware worked as one system.',
    '2025-01-01',
    null,
    true,
    'published',
    1
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Prototype Works',
    'Software Engineering Intern',
    'internship',
    'Lund, Sweden',
    'Developed internal tools, explored device communication and turned early technical ideas into working demonstrations.',
    '2024-02-01',
    '2024-08-31',
    false,
    'published',
    2
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Test Bench Studio',
    'Technical Project Assistant',
    'part-time',
    'Remote',
    'Supported prototyping, documentation and verification across small software and electronics projects.',
    '2023-03-01',
    '2023-12-31',
    false,
    'published',
    3
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Demo Edgeworks',
    'IoT Prototype Developer',
    'contract',
    'Helsingborg, Sweden',
    'Created a temporary connected-device concept, from sensor input and local processing to a simple monitoring interface.',
    '2022-01-01',
    '2022-10-31',
    false,
    'published',
    4
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'Circuit North Demo',
    'Firmware Test Assistant',
    'part-time',
    'Malmö, Sweden',
    'Tested firmware behaviour, documented repeatable faults and helped verify small embedded hardware revisions.',
    '2021-02-01',
    '2021-11-30',
    false,
    'published',
    5
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'Portable Logic Lab',
    'Mobile Systems Trainee',
    'internship',
    'Copenhagen, Denmark',
    'Explored portable software systems and built small demonstrations that exchanged data between devices.',
    '2020-03-01',
    '2020-08-31',
    false,
    'published',
    6
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'Interface Demo Co.',
    'Technical Support Engineer',
    'full-time',
    'Remote',
    'Investigated technical issues, translated findings into clear solutions and improved internal troubleshooting notes.',
    '2019-01-01',
    '2019-12-31',
    false,
    'published',
    7
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'Malmö Test Lab',
    'Student Engineering Project',
    'education',
    'Malmö, Sweden',
    'Planned, assembled and presented an early engineering prototype while learning structured testing and iteration.',
    '2018-02-01',
    '2018-06-30',
    false,
    'published',
    8
  );
