import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/admin';
  const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/admin';
  const response = NextResponse.redirect(new URL(safeNext, request.url));

  if (!code) {
    return NextResponse.redirect(new URL('/login?recovery=invalid', request.url));
  }

  const { url, publishableKey } = getSupabaseEnv();
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
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?recovery=invalid', request.url));
  }

  return response;
}
