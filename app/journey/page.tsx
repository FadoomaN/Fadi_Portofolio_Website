import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Journey — Fadi Al Hazim',
  description: 'Long-running personal threads and updates.',
};

export default async function JourneyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title, slug, category, description, cover_media_reference, featured, sort_order')
    .eq('destination', 'journey')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });
  return (
    <>
      <SiteHeader revealImmediately activeHref="/journey" />
      <CircuitDivider />
      <main className="placeholder-canvas">
        <section className="placeholder-shell" aria-labelledby="journey-title">
          <p className="placeholder-kicker">03 / Personal threads</p>
          <h1 id="journey-title">Join Me in the Journey</h1>
          <p className="placeholder-copy">Cooking, martial arts, fitness, travel and vlogs will appear here as chronological threads.</p>
          {threads?.length ? (
            <div className="placeholder-links">
              {threads.map((thread) => <a href={`/journey#${thread.slug}`} key={thread.id}>{thread.title}</a>)}
            </div>
          ) : <p className="placeholder-status">Threads in progress.</p>}
        </section>
      </main>
    </>
  );
}
