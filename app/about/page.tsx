import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'About — Fadi Al Hazim',
  description: 'About Fadi Al Hazim and his engineering mindset.',
};

export default async function AboutPage() {
  const { data } = await (await createServerSupabaseClient())
    .from('about_content')
    .select('title, intro, body, media_reference')
    .eq('id', 1)
    .maybeSingle();
  const intro = data?.intro || 'A temporary introduction will live here while the personal story is being shaped.';
  const body = data?.body || 'Temporary editorial copy is used to establish the rhythm, scale and reading experience of this page.';

  return (
    <>
      <SiteHeader revealImmediately activeHref="/about" />

      <main className="about-canvas">
        <div className="about-frame">
          <header className="about-intro" aria-labelledby="about-title">
            <p className="about-kicker"><span>02 / Personal profile</span><i aria-hidden="true" /><span>Editorial draft</span></p>
            <h1 id="about-title">{data?.title ?? 'ABOUT'}</h1>
            <p>{intro}</p>
          </header>
          <CircuitDivider />

          <div className="about-story">
            <section className="about-story-section" aria-labelledby="about-origin-title">
              <div className="about-visual about-visual-portrait" aria-label="Temporary portrait placeholder">
                <span>VISUAL / 01</span><i aria-hidden="true" /><strong>PORTRAIT<br />PLACEHOLDER</strong>
              </div>
              <div className="about-story-copy">
                <p className="about-section-label">01 / Origin</p>
                <h2 id="about-origin-title">A LITTLE ABOUT ME</h2>
                <p>{body}</p>
                <span className="about-meta">PROFILE / 001</span>
              </div>
            </section>

            <section className="about-story-section about-story-section-reverse" aria-labelledby="about-thinking-title">
              <div className="about-story-copy">
                <p className="about-section-label">02 / Method</p>
                <h2 id="about-thinking-title">HOW I THINK</h2>
                <p>Temporary copy for the way ideas become clear: observe, question, build, test and refine.</p>
                <span className="about-meta">PROCESS / ITERATION</span>
              </div>
              <div className="about-visual about-visual-landscape" aria-label="Temporary landscape placeholder">
                <span>FRAME / 02</span><i aria-hidden="true" /><strong>LANDSCAPE<br />PLACEHOLDER</strong>
              </div>
            </section>

            <section className="about-story-section" aria-labelledby="about-beyond-title">
              <div className="about-visual about-visual-square" aria-label="Temporary square visual placeholder">
                <span>FIELD / 03</span><i aria-hidden="true" /><strong>IMAGE<br />PLACEHOLDER</strong>
              </div>
              <div className="about-story-copy">
                <p className="about-section-label">03 / Outside the interface</p>
                <h2 id="about-beyond-title">BEYOND THE SCREEN</h2>
                <p>Temporary copy for the human details, interests and questions that give the work its wider context.</p>
                <span className="about-meta">OPEN THREAD / 003</span>
              </div>
            </section>
          </div>
          <p className="about-footer-note">ABOUT / CONTENT IN PROGRESS</p>
        </div>
      </main>
    </>
  );
}
