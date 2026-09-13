import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';

export const metadata: Metadata = {
  title: 'Projects — Fadi Al Hazim',
  description: 'Technical projects and development updates.',
};

import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title, slug, category, description, cover_media_reference, featured, sort_order')
    .eq('destination', 'projects')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });
  return (
    <>
      <SiteHeader revealImmediately activeHref="/projects" />
      <CircuitDivider />
      <main className="placeholder-canvas">
        <section className="placeholder-shell" aria-labelledby="projects-title">
          <p className="placeholder-kicker">04 / Engineering work</p>
          <h1 id="projects-title">PROJECTS</h1>
          <p className="placeholder-copy">Technical projects will be organized into development threads, from concept through testing and final result.</p>
          {threads?.length ? (
            <div className="placeholder-links">
              {threads.map((thread) => <a href={`/projects#${thread.slug}`} key={thread.id}>{thread.title}</a>)}
            </div>
          ) : <p className="placeholder-status">Projects in progress.</p>}
        </section>
      </main>
    </>
  );
}
