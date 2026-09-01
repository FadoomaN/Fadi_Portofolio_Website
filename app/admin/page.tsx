import { redirect } from 'next/navigation';
import SiteHeader from '../site-header';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

  const [{ count: projectCount }, { count: videoCount }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="admin-canvas">
        <section className="admin-panel">
          <div className="admin-heading">
            <span>Control room / 001</span>
            <span className="admin-online"><i /> Database online</span>
          </div>
          <div className="admin-title-row">
            <div>
              <p>Private workspace</p>
              <h1>ADMIN SYSTEM</h1>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="admin-logout" type="submit">Sign out</button>
            </form>
          </div>
          <div className="admin-metrics">
            <article>
              <span>01 / Projects</span>
              <strong>{String(projectCount ?? 0).padStart(2, '0')}</strong>
              <small>Expandable content module</small>
            </article>
            <article>
              <span>02 / Videos</span>
              <strong>{String(videoCount ?? 0).padStart(2, '0')}</strong>
              <small>View tracking comes next</small>
            </article>
            <article>
              <span>03 / Access</span>
              <strong>01</strong>
              <small>Single administrator</small>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
