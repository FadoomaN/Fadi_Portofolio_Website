import { redirect } from 'next/navigation';
import SiteHeader from '../site-header';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminWorkspace from './admin-workspace';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) redirect('/login');

  const [{ data: factors }, { data: assurance }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const hasVerifiedAuthenticator = factors?.totp.some((factor) => factor.status === 'verified');

  // A password-only session never reaches the private control surface.
  if (!hasVerifiedAuthenticator || assurance?.currentLevel !== 'aal2') {
    redirect('/authenticator');
  }

  const [
    experienceResult,
    profileResult,
    aboutResult,
    aboutSectionResult,
    contactResult,
    threadResult,
    threadEntryResult,
    privateContactResult,
  ] = await Promise.all([
    supabase
      .from('experiences')
      .select('id, organization, role, employment_type, location, summary, start_date, end_date, is_current, status, sort_order, updated_at', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('start_date', { ascending: false }),
    supabase
      .from('site_profile')
      .select('first_name, last_name, role, kicker, portrait_media_reference, portrait_alt, portrait_object_position, updated_at')
      .eq('id', 1)
      .maybeSingle(),
    supabase.from('about_content').select('id, title, intro, body, sections, media_reference, updated_at').eq('id', 1).maybeSingle(),
    supabase.from('about_sections').select('id, about_id, label, heading, body, media_reference, media_alt, media_position, media_shape, meta, sort_order, updated_at').eq('about_id', 1).order('sort_order').order('created_at'),
    supabase.from('public_contact_settings').select('id, email, github_url, linkedin_url, cv_url, updated_at').eq('id', 1).maybeSingle(),
    supabase.from('threads').select('id, title, slug, destination, category, description, technical_description, cover_media_reference, github_url, live_url, tags, status, featured, sort_order, updated_at', { count: 'exact' }).order('updated_at', { ascending: false }),
    supabase.from('thread_entries').select('id, thread_id, title, published_on, content, status, sort_order, updated_at', { count: 'exact' }).order('sort_order'),
    supabase
      .from('admin_contact_settings')
      .select('operations_email, phone_number, timezone, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="admin-canvas">
        <AdminWorkspace
          experiences={experienceResult.data ?? []}
          experienceCount={experienceResult.count ?? 0}
          threads={threadResult.data ?? []}
          threadEntries={threadEntryResult.data ?? []}
          threadCount={threadResult.count ?? 0}
          about={aboutResult.data}
          aboutSections={aboutSectionResult.data ?? []}
          publicContact={contactResult.data}
          profile={profileResult.data}
          privateContact={privateContactResult.data}
        />
      </main>
    </>
  );
}
