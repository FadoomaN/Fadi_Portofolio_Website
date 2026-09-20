import { redirect } from 'next/navigation';
import SiteHeader from '../site-header';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminWorkspace from './admin-workspace';

export const dynamic = 'force-dynamic';

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
    categoryResult,
    privateContactResult,
    newsResult,
    projectsResult,
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
    supabase.from('threads').select('id, title, slug, destination, category, description, technical_description, cover_media_reference, cover_position_x, cover_position_y, github_url, live_url, tags, status, featured, sort_order, updated_at', { count: 'exact' }).eq('destination','journey').order('sort_order').order('created_at'),
    supabase.from('journey_categories').select('id,name').order('sort_order').order('name'),
    supabase
      .from('admin_contact_settings')
      .select('operations_email, phone_number, timezone, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('manual_news').select('id,slug,title,body,media_reference,media_alt,published_at,created_at,updated_at').order('updated_at',{ascending:false}),
    supabase.from('threads').select('id,title,slug,category,description,cover_media_reference,cover_position_x,cover_position_y,tags,status,featured,sort_order,updated_at,created_at,project_version,project_started_on,project_progress,project_repository,project_license,project_milestone,project_team,github_url,live_url').eq('destination','projects').order('updated_at',{ascending:false}),
  ]);

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="admin-canvas">
        <AdminWorkspace
          experiences={experienceResult.data ?? []}
          experienceCount={experienceResult.count ?? 0}
          threads={threadResult.data ?? []}
          categories={categoryResult.data ?? []}
          threadCount={threadResult.count ?? 0}
          loadError={[experienceResult,profileResult,aboutResult,aboutSectionResult,contactResult,threadResult,categoryResult,privateContactResult,newsResult,projectsResult].some(result => result.error) ? 'Some admin content could not be loaded. Refresh before editing missing records.' : undefined}
          about={aboutResult.data}
          aboutSections={aboutSectionResult.data ?? []}
          publicContact={contactResult.data}
          profile={profileResult.data}
          privateContact={privateContactResult.data}
          news={newsResult.data ?? []}
          projects={projectsResult.data ?? []}
        />
      </main>
    </>
  );
}
