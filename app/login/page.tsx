import SiteHeader from '../site-header';
import LoginForm from './login-form';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAdminLoginEnv } from '@/lib/supabase/env';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership) redirect('/admin');
  }

  const { username } = getAdminLoginEnv();

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="login-canvas" aria-label="Administrator login">
        <section className="login-panel">
          <div className="login-panel-copy">
            <div className="login-kicker">
              <span>Private node</span>
              <span className="login-status"><i /> Encrypted</span>
            </div>

            <div className="login-title-lockup" aria-hidden="true">
              <span className="login-gate login-gate-left" />
              <strong>AUTH</strong>
              <span className="login-gate login-gate-right" />
            </div>

            <div className="login-copy-bottom">
              <p>Administrator access</p>
              <div className="login-protocols" aria-label="Security features">
                <span>HASH</span>
                <span>COOKIE</span>
                <span>RLS</span>
              </div>
            </div>
          </div>

          <div className="login-form-panel">
            <div className="login-form-heading">
              <span>Identity check</span>
              <span>001</span>
            </div>
            <h1>Welcome back.</h1>
            <LoginForm defaultUsername={username} />
            <p className="login-footnote">No public registration. Authorized access only.</p>
          </div>
        </section>
      </main>
    </>
  );
}
