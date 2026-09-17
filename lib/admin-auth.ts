import { createServerSupabaseClient } from './supabase/server';

export async function authorizeAdmin() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'Your session has expired.',
      status: 401,
    } as const;
  }

  const [{ data: membership }, { data: assurance }] = await Promise.all([
    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!membership || assurance?.currentLevel !== 'aal2') {
    return {
      error: 'Authenticator verification is required.',
      status: 403,
    } as const;
  }

  return {
    supabase,
    user,
  } as const;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');

  if (!origin) {
    return false;
  }

  const forwardedHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host');

  const forwardedProto =
    request.headers.get('x-forwarded-proto') ??
    new URL(request.url).protocol.replace(':', '');

  if (!forwardedHost) {
    return false;
  }

  const expectedOrigin = `${forwardedProto}://${forwardedHost}`;

  return origin === expectedOrigin;
}