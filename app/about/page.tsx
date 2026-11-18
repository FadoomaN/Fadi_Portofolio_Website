import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import AdminScreen from '../admin/admin-screen';
import RichTextRenderer from '../rich-text-renderer';

export const metadata: Metadata = {
  title: 'About — Fadi Al Hazim',
  description: 'About Fadi Al Hazim and his engineering mindset.',
};

export default async function AboutPage() {
  const host = (await headers()).get('host')?.split(':')[0];
  if (host === 'admin.fadialhazim.com') return <AdminScreen />;
  const supabase = await createServerSupabaseClient();
  const [{ data }, sectionResult] = await Promise.all([
    supabase.from('about_content').select('intro').eq('id', 1).maybeSingle(),
    supabase.from('about_sections').select('id, label, heading, body, media_reference, media_alt, media_position, media_shape, media_position_x, media_position_y, meta, sort_order').eq('about_id', 1).order('sort_order').order('created_at'),
  ]);
  const { data: storedSections } = sectionResult.error
    ? await supabase.from('about_sections').select('id, label, heading, body, media_reference, media_alt, media_position, media_shape, meta, sort_order').eq('about_id', 1).order('sort_order').order('created_at').then((result) => ({ data: result.data?.map((section) => ({ ...section, media_position_x: 50, media_position_y: 50 })) ?? null }))
    : sectionResult;
  const intro = data?.intro || 'A temporary introduction will live here while the personal story is being shaped.';
  const sections = storedSections ?? [];

  return (
    <>
      <SiteHeader revealImmediately activeHref="/about" />

      <main className="about-canvas">
        <div className="about-frame">
          <header className="about-intro" aria-labelledby="about-title">
            <p className="about-kicker"><span>02 / Personal profile</span><i aria-hidden="true" /><span>Computer engineer</span></p>
            <h1 id="about-title">ABOUT ME</h1>
            <div className="about-intro-copy"><RichTextRenderer value={intro} fallback={intro} /></div>
          </header>
          <CircuitDivider />

          <div className="about-story">
            {sections.map((section, index) => (
              <section className={`about-story-section ${section.media_position === 'right' ? 'about-story-section-reverse' : ''}`} aria-labelledby={`about-section-${section.id}`} key={section.id}>
                <div className={`about-visual about-visual-${section.media_shape}`} aria-label={section.media_alt || `${section.media_shape} visual`}>
                  {section.media_reference ? <img src={section.media_reference} alt={section.media_alt} style={{ objectPosition: `${section.media_position_x}% ${section.media_position_y}%` }} /> : <><span>VISUAL / {String(index + 1).padStart(2, '0')}</span><i aria-hidden="true" /><strong>{section.media_shape.toUpperCase()}<br />PLACEHOLDER</strong></>}
                </div>
                <div className="about-story-copy">
                  <div className="about-story-heading">
                    <span className="about-section-index">SECTION / {String(index + 1).padStart(2, '0')}</span>
                    <p className="about-section-label">{section.label}</p>
                    <h2 id={`about-section-${section.id}`}>{section.heading}</h2>
                  </div>
                  <div className="about-story-body">
                    <RichTextRenderer value={section.body} fallback={section.body} />
                  </div>
                  <span className="about-meta">{section.meta}</span>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
