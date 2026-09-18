-- Adds the wider eight-record timeline when the original Experiences migration was already applied.
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
  )
on conflict (id) do nothing;
