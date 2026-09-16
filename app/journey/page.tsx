import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import SearchableCards from './searchable-cards';
import './feedback.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Journey — Fadi Al Hazim',
  description: 'Long-running personal threads and updates.',
};

export default async function JourneyPage() {
  const db = await createServerSupabaseClient();
  const [{ data: threads, error }, { data: childRows, error: childError }] = await Promise.all([
    db.from('threads').select('id,slug,title,category,description,cover_media_reference,cover_position_x,cover_position_y')
      .eq('destination','journey').eq('status','published').order('featured',{ascending:false}).order('sort_order').order('id'),
    db.from('thread_subthreads').select('thread_id').eq('status','published'),
  ]);
  const childCounts = new Map<string,number>();
  for (const row of childRows ?? []) childCounts.set(row.thread_id,(childCounts.get(row.thread_id)??0)+1);
  return (
    <>
      <SiteHeader revealImmediately activeHref="/journey" />
      <main className="journey-canvas">
        <section className="journey-frame" aria-labelledby="journey-title">
          <header className="journey-intro">
            <p className="journey-kicker">03 / Journey</p>
            <h1 id="journey-title">JOURNEY</h1>
            <p>Long-running personal threads for interests, experiments and experiences that continue to develop over time.</p>
          </header>
          <CircuitDivider />
          <section className="journey-threads" aria-labelledby="threads-title">
            <div className="journey-section-heading">
              <span>Personal archive / 03</span>
              <h2 id="threads-title">THREADS</h2>
            </div>
            {!error && !childError && <SearchableCards kind="threads" threads={threads ?? []} childCounts={Object.fromEntries(childCounts)} />}
            {(error || childError) && <p role="alert">Journey is temporarily unavailable. Please try again shortly.</p>}
          </section>
        </section>
      </main>
    </>
  );
}
