import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ContactForm from './contact-form';

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
  const contactEmail = data?.email ?? 'fadi.alhazeembest2017@gmail.com';
  return (
    <>
      <SiteHeader revealImmediately activeHref="/contact" />
      <CircuitDivider />
      <main className="placeholder-canvas contact-canvas">
        <section className="placeholder-shell contact-shell" aria-labelledby="contact-title">
          <p className="placeholder-kicker">06 / Open channel</p>
          <h1 id="contact-title">CONTACT</h1>
          <p className="placeholder-copy">Have a project, technical question, or professional opportunity in mind? Send a message and I will get back to you.</p>
          <div className="placeholder-links">
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            {data?.github_url && <a href={data.github_url}>GitHub</a>}
            {data?.linkedin_url && <a href={data.linkedin_url}>LinkedIn</a>}
            {data?.cv_url && <a href={data.cv_url}>CV / Resume</a>}
          </div>
          {!data && <p className="placeholder-status">Contact links in progress.</p>}
          <ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </section>
      </main>
    </>
  );
}
