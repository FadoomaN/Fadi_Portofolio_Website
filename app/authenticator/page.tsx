import { redirect } from 'next/navigation';
import SiteHeader from '../site-header';
import AuthenticatorGate from './authenticator-gate';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AuthenticatorPage() {
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
  const verifiedFactor = factors?.totp.find((factor) => factor.status === 'verified');

  if (verifiedFactor && assurance?.currentLevel === 'aal2') redirect('/admin');

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="security-canvas">
        <AuthenticatorGate factorId={verifiedFactor?.id ?? null} />
      </main>
    </>
  );
}
