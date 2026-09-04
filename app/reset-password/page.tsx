import { redirect } from 'next/navigation';
import SiteHeader from '../site-header';
import ResetPasswordForm from './reset-password-form';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) redirect('/login');

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="security-canvas">
        <ResetPasswordForm />
      </main>
    </>
  );
}
