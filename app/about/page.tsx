import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'About — Fadi Al Hazim',
  description: 'About Fadi Al Hazim and his engineering mindset.',
};

export default async function AboutPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data }, { data: storedSections }] = await Promise.all([
    supabase.from('about_content').select('intro').eq('id', 1).maybeSingle(),
    supabase.from('about_sections').select('id, label, heading, body, media_reference, media_alt, media_position, media_shape, meta, sort_order').eq('about_id', 1).order('sort_order').order('created_at'),
  ]);
  const intro = data?.intro || 'A temporary introduction will live here while the personal story is being shaped.';
  const sections = storedSections ?? [];

  return (
    <>
      <SiteHeader revealImmediately activeHref="/about" />

      <main className="about-canvas">
        <div className="about-frame">
          <header className="about-intro" aria-labelledby="about-title">
            <p className="about-kicker"><span>02 / Personal profile</span><i aria-hidden="true" /><span>Editorial draft</span></p>
            <h1 id="about-title">ABOUT ME</h1>
            <p>{intro}</p>
          </header>
          <CircuitDivider />

          <div className="about-story">
            {sections.map((section, index) => (
              <section className={`about-story-section ${section.media_position === 'right' ? 'about-story-section-reverse' : ''}`} aria-labelledby={`about-section-${section.id}`} key={section.id}>
                <div className={`about-visual about-visual-${section.media_shape}`} aria-label={section.media_alt || `${section.media_shape} visual`}>
                  {section.media_reference ? <img src={section.media_reference} alt={section.media_alt} /> : <><span>VISUAL / {String(index + 1).padStart(2, '0')}</span><i aria-hidden="true" /><strong>{section.media_shape.toUpperCase()}<br />PLACEHOLDER</strong></>}
                </div>
                <div className="about-story-copy">
                  <p className="about-section-label">{section.label}</p>
                  <h2 id={`about-section-${section.id}`}>{section.heading}</h2>
                  <p>{section.body}</p>
                  <span className="about-meta">{section.meta}</span>
                </div>
              </section>
            ))}
          </div>
          <p className="about-footer-note">ABOUT / CONTENT IN PROGRESS</p>
        </div>
      </main>
    </>
  );
}
