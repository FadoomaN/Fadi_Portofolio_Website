-- Moves the remaining experience timeline records from the UI fixture into Supabase.
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
  ('10000000-0000-4000-8000-000000000009', 'Demo Signal Studio', 'Electronics Lab Assistant', 'contract', 'Malmö, Sweden', 'Assembled sensor boards and documented measurements from repeatable bench tests.', '2017-09-01', '2017-11-28', false, 'published', 9),
  ('10000000-0000-4000-8000-000000000010', 'Demo Motion Works', 'Automation Developer', 'part-time', 'Lund, Sweden', 'Built a small controller that coordinated motors, inputs and a monitoring dashboard.', '2017-05-01', '2017-07-28', false, 'published', 10),
  ('10000000-0000-4000-8000-000000000011', 'Demo Interface Lab', 'Frontend Developer', 'internship', 'Remote', 'Created responsive interfaces for device status, settings and live measurements.', '2017-01-01', '2017-03-28', false, 'published', 11),
  ('10000000-0000-4000-8000-000000000012', 'Demo Robotics Studio', 'Robotics Intern', 'contract', 'Malmö, Sweden', 'Prototyped movement sequences and tested feedback from distance and position sensors.', '2016-09-01', '2016-11-28', false, 'published', 12),
  ('10000000-0000-4000-8000-000000000013', 'Demo Boardworks', 'Hardware Verification Engineer', 'part-time', 'Lund, Sweden', 'Checked power rails, communication buses and timing against prototype requirements.', '2016-05-01', '2016-07-28', false, 'published', 13),
  ('10000000-0000-4000-8000-000000000014', 'Demo Data Systems', 'Backend Developer', 'internship', 'Remote', 'Implemented request handling, validation and storage for connected-device applications.', '2016-01-01', '2016-03-28', false, 'published', 14),
  ('10000000-0000-4000-8000-000000000015', 'Demo Copper Lab', 'PCB Design Assistant', 'contract', 'Malmö, Sweden', 'Prepared schematic revisions and reviewed component placement for a compact sensor board.', '2015-09-01', '2015-11-28', false, 'published', 15),
  ('10000000-0000-4000-8000-000000000016', 'Demo Feedback Works', 'Control Systems Trainee', 'part-time', 'Lund, Sweden', 'Compared controller responses and recorded the effect of changing system parameters.', '2015-05-01', '2015-07-28', false, 'published', 16),
  ('10000000-0000-4000-8000-000000000017', 'Demo Packet Studio', 'Network Support Technician', 'internship', 'Remote', 'Investigated connectivity issues and prepared clear setup guides for a small test network.', '2015-01-01', '2015-03-28', false, 'published', 17),
  ('10000000-0000-4000-8000-000000000018', 'Demo App Workshop', 'Application Developer', 'contract', 'Malmö, Sweden', 'Built a desktop utility for configuring prototypes and exporting measurement sessions.', '2014-09-01', '2014-11-28', false, 'published', 18),
  ('10000000-0000-4000-8000-000000000019', 'Demo Sensing Lab', 'Sensor Integration Engineer', 'part-time', 'Lund, Sweden', 'Connected different sensor modules and compared their readings under controlled conditions.', '2014-05-01', '2014-07-28', false, 'published', 19),
  ('10000000-0000-4000-8000-000000000020', 'Demo Quality Works', 'QA Automation Intern', 'internship', 'Remote', 'Created repeatable checks for device setup, communication and error recovery.', '2014-01-01', '2014-03-28', false, 'published', 20),
  ('10000000-0000-4000-8000-000000000021', 'Demo Kernel Studio', 'Embedded Linux Developer', 'contract', 'Malmö, Sweden', 'Configured a small Linux device and integrated services for collecting hardware data.', '2013-09-01', '2013-11-28', false, 'published', 21),
  ('10000000-0000-4000-8000-000000000022', 'Demo Logic Workshop', 'Digital Logic Designer', 'part-time', 'Lund, Sweden', 'Designed and simulated counters, registers and finite-state machines for a prototype.', '2013-05-01', '2013-07-28', false, 'published', 22),
  ('10000000-0000-4000-8000-000000000023', 'Demo Reference Lab', 'Technical Documentation Assistant', 'internship', 'Remote', 'Turned engineering notes into assembly instructions and troubleshooting references.', '2013-01-01', '2013-03-28', false, 'published', 23),
  ('10000000-0000-4000-8000-000000000024', 'Demo Discovery Works', 'Research Assistant', 'contract', 'Malmö, Sweden', 'Compared technical approaches and summarized findings from a series of prototype experiments.', '2012-09-01', '2012-11-28', false, 'published', 24),
  ('10000000-0000-4000-8000-000000000025', 'Demo Power Studio', 'Power Electronics Trainee', 'part-time', 'Lund, Sweden', 'Measured converter behaviour and documented efficiency across different test loads.', '2012-05-01', '2012-07-28', false, 'published', 25),
  ('10000000-0000-4000-8000-000000000026', 'Demo Measurement Lab', 'Test Bench Developer', 'internship', 'Remote', 'Automated instrument readings and presented repeatable results in a simple test report.', '2012-01-01', '2012-03-28', false, 'published', 26),
  ('10000000-0000-4000-8000-000000000027', 'Demo Connected Works', 'Device Integration Specialist', 'contract', 'Malmö, Sweden', 'Connected a prototype device to an application and verified the complete data flow.', '2011-09-01', '2011-11-28', false, 'published', 27),
  ('10000000-0000-4000-8000-000000000028', 'Demo Form Studio', 'Product Prototyping Intern', 'part-time', 'Lund, Sweden', 'Combined hardware and software ideas into an early demonstrator for usability testing.', '2011-05-01', '2011-07-28', false, 'published', 28),
  ('10000000-0000-4000-8000-000000000029', 'Demo Systems Workshop', 'Systems Engineering Assistant', 'internship', 'Remote', 'Mapped component interfaces and tracked how individual changes affected the whole prototype.', '2011-01-01', '2011-03-28', false, 'published', 29),
  ('10000000-0000-4000-8000-000000000030', 'Demo Maker Lab', 'Engineering Workshop Volunteer', 'contract', 'Malmö, Sweden', 'Helped assemble beginner electronics projects and explain their circuits and test results.', '2010-09-01', '2010-11-28', false, 'published', 30)
on conflict (id) do nothing;
