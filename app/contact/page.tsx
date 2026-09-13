import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Contact — Fadi Al Hazim',
  description: 'Contact Fadi Al Hazim.',
};

export default async function ContactPage() {
  const { data } = await (await createServerSupabaseClient())
    .from('public_contact_settings')
    .select('email, github_url, linkedin_url, cv_url')
    .eq('id', 1)
    .maybeSingle();
  return (
    <main className="placeholder-canvas">
      <SiteHeader revealImmediately activeHref="/contact" />
      <section className="placeholder-shell" aria-labelledby="contact-title">
        <p className="placeholder-kicker">06 / Open channel</p>
        <h1 id="contact-title">CONTACT</h1>
        <p className="placeholder-copy">Public contact channels.</p>
        <div className="placeholder-links">
          {data?.email && <a href={`mailto:${data.email}`}>Email</a>}
          {data?.github_url && <a href={data.github_url}>GitHub</a>}
          {data?.linkedin_url && <a href={data.linkedin_url}>LinkedIn</a>}
          {data?.cv_url && <a href={data.cv_url}>CV / Resume</a>}
        </div>
        {!data && <p className="placeholder-status">Contact links in progress.</p>}
      </section>
    </main>
  );
}
