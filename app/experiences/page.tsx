import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import ExperienceTimeline, { type ExperienceRecord } from './experience-timeline';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Experiences — Fadi Al Hazim',
  description: 'The engineering experience and working history of Fadi Al Hazim.',
};

export default async function ExperiencesPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('experiences')
    .select('id, organization, role, employment_type, location, summary, start_date, end_date, is_current')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('start_date', { ascending: false });
  if (error) throw new Error('The published experiences could not be loaded.');
  const experiences: ExperienceRecord[] = data ?? [];

  return (
    <>
      <SiteHeader revealImmediately activeHref="/experiences" />
      <CircuitDivider />

      <main className="experience-index-canvas">
        <section className="experience-index-shell" aria-labelledby="experiences-title">
          <header className="experience-index-heading">
            <p>
              <span>04 / Career timeline</span>
              <i aria-hidden="true" />
              <span>{String(experiences.length).padStart(2, '0')} records</span>
            </p>
            <h1 id="experiences-title">EXPERIENCES</h1>
          </header>

          <ExperienceTimeline experiences={experiences} />
        </section>
      </main>
    </>
  );
}
