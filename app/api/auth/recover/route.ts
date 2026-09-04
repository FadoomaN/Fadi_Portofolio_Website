import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminLoginEnv, getSupabaseEnv } from '@/lib/supabase/env';

const GENERIC_RESPONSE = { ok: true };

export async function POST(request: NextRequest) {
  let body: { username?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const admin = getAdminLoginEnv();

  // Always return the same result so this endpoint cannot confirm the admin username.
  if (username.toLocaleLowerCase('en-US') !== admin.username.toLocaleLowerCase('en-US')) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => undefined,
    },
  });
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteOrigin = configuredSiteUrl
    ? new URL(configuredSiteUrl).origin
    : request.nextUrl.origin;

  await supabase.auth.resetPasswordForEmail(admin.email, {
    redirectTo: `${siteOrigin}/api/auth/callback?next=/reset-password`,
  });

  return NextResponse.json(GENERIC_RESPONSE);
}
