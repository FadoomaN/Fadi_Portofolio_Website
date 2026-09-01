import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminLoginEnv, getSupabaseEnv } from '@/lib/supabase/env';

const GENERIC_AUTH_ERROR = 'Incorrect username or password.';

export async function POST(request: NextRequest) {
  let response = NextResponse.json({ ok: true });
  const { url, publishableKey } = getSupabaseEnv();
  const admin = getAdminLoginEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let body: { username?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (
    !username ||
    !password ||
    username.toLocaleLowerCase('en-US') !== admin.username.toLocaleLowerCase('en-US')
  ) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  // The public username maps to a server-only Auth identity; the email never reaches the browser.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!membership) {
    response = NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 403 });
    await supabase.auth.signOut();
    return response;
  }

  return response;
}
