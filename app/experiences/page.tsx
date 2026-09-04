import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import ExperienceTimeline, { type ExperienceRecord } from './experience-timeline';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Experiences — Fadi Al Hazim',
  description: 'The engineering experience and working history of Fadi Al Hazim.',
};

const demoExperiences: ExperienceRecord[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    organization: 'Demo Systems Lab',
    role: 'Embedded Systems Engineer',
    employment_type: 'full-time',
    location: 'Malmö, Sweden',
    summary: 'Built and tested connected prototypes where firmware, sensors and physical hardware worked as one system.',
    start_date: '2025-01-01',
    end_date: null,
    is_current: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    organization: 'Prototype Works',
    role: 'Software Engineering Intern',
    employment_type: 'internship',
    location: 'Lund, Sweden',
    summary: 'Developed internal tools, explored device communication and turned early technical ideas into working demonstrations.',
    start_date: '2024-02-01',
    end_date: '2024-08-31',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    organization: 'Test Bench Studio',
    role: 'Technical Project Assistant',
    employment_type: 'part-time',
    location: 'Remote',
    summary: 'Supported prototyping, documentation and verification across small software and electronics projects.',
    start_date: '2023-03-01',
    end_date: '2023-12-31',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    organization: 'Demo Edgeworks',
    role: 'IoT Prototype Developer',
    employment_type: 'contract',
    location: 'Helsingborg, Sweden',
    summary: 'Created a temporary connected-device concept, from sensor input and local processing to a simple monitoring interface.',
    start_date: '2022-01-01',
    end_date: '2022-10-31',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    organization: 'Circuit North Demo',
    role: 'Firmware Test Assistant',
    employment_type: 'part-time',
    location: 'Malmö, Sweden',
    summary: 'Tested firmware behaviour, documented repeatable faults and helped verify small embedded hardware revisions.',
    start_date: '2021-02-01',
    end_date: '2021-11-30',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    organization: 'Portable Logic Lab',
    role: 'Mobile Systems Trainee',
    employment_type: 'internship',
    location: 'Copenhagen, Denmark',
    summary: 'Explored portable software systems and built small demonstrations that exchanged data between devices.',
    start_date: '2020-03-01',
    end_date: '2020-08-31',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    organization: 'Interface Demo Co.',
    role: 'Technical Support Engineer',
    employment_type: 'full-time',
    location: 'Remote',
    summary: 'Investigated technical issues, translated findings into clear solutions and improved internal troubleshooting notes.',
    start_date: '2019-01-01',
    end_date: '2019-12-31',
    is_current: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    organization: 'Malmö Test Lab',
    role: 'Student Engineering Project',
    employment_type: 'education',
    location: 'Malmö, Sweden',
    summary: 'Planned, assembled and presented an early engineering prototype while learning structured testing and iteration.',
    start_date: '2018-02-01',
    end_date: '2018-06-30',
    is_current: false,
  },
];

const demoIds = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008',
];

export default async function ExperiencesPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('experiences')
    .select('id, organization, role, employment_type, location, summary, start_date, end_date, is_current')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('start_date', { ascending: false });
  // The same three demo records render until the new database migration is active.
  const experiences = error ? demoExperiences : (data ?? []);

  return (
    <main className="experience-index-canvas">
      <SiteHeader revealImmediately activeHref="/experiences" />

      <section className="experience-index-shell" aria-labelledby="experiences-title">
        <header className="experience-index-heading">
          <p>
            <span>04 / Career timeline</span>
            <i aria-hidden="true" />
            <span>{String(experiences.length).padStart(2, '0')} records</span>
          </p>
          <h1 id="experiences-title">EXPERIENCES</h1>
        </header>

        <ExperienceTimeline experiences={experiences} demoIds={demoIds} />
      </section>
    </main>
  );
}
