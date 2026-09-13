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

  const [experienceResult, projectResult, videoResult, profileResult, privateContactResult, aboutResult, contactResult, journeyResult, journeyUpdateResult, projectUpdateResult] = await Promise.all([
    supabase
      .from('experiences')
      .select('id, organization, role, employment_type, location, summary, start_date, end_date, is_current, status, sort_order, updated_at', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('start_date', { ascending: false }),
    supabase
      .from('projects')
      .select('id, title, slug, summary, technical_description, cover_image_url, github_url, live_url, tags, status, featured, sort_order, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('videos')
      .select('id, title, status, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('site_profile')
      .select('first_name, last_name, role, kicker, updated_at')
      .eq('id', 1)
      .maybeSingle(),
    supabase.from('about_content').select('id, title, intro, body, sections, media_reference, updated_at').eq('id', 1).maybeSingle(),
    supabase.from('public_contact_settings').select('id, email, github_url, linkedin_url, cv_url, updated_at').eq('id', 1).maybeSingle(),
    supabase.from('journey_threads').select('id, title, slug, description, cover_media_reference, status, featured, sort_order, updated_at', { count: 'exact' }).order('sort_order'),
    supabase.from('journey_updates').select('id, thread_id, title, published_on, content, media_reference, status, sort_order, updated_at', { count: 'exact' }).order('sort_order'),
    supabase.from('project_updates').select('id, project_id, title, published_on, content, media_reference, status, sort_order, updated_at', { count: 'exact' }).order('sort_order'),
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
          projects={projectResult.data ?? []}
          videos={videoResult.data ?? []}
          experienceCount={experienceResult.count ?? 0}
          projectCount={projectResult.count ?? 0}
          videoCount={videoResult.count ?? 0}
          journeyThreads={journeyResult.data ?? []}
          journeyUpdates={journeyUpdateResult.data ?? []}
          journeyCount={journeyResult.count ?? 0}
          projectUpdates={projectUpdateResult.data ?? []}
          about={aboutResult.data}
          publicContact={contactResult.data}
          profile={profileResult.data}
          privateContact={privateContactResult.data}
        />
      </main>
    </>
  );
}
