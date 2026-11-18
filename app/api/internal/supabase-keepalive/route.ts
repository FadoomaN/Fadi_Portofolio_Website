import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const json = (ok: boolean, status: number) => NextResponse.json({ ok }, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});
const digest = (value: string) => createHash('sha256').update(value).digest();

export async function GET(request: Request) {
  const secret = process.env.KEEPALIVE_SECRET;
  if (!secret) return json(false, 503);
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ') || !timingSafeEqual(digest(authorization.slice(7)), digest(secret))) {
    return json(false, 401);
  }
  try {
    // Public, harmless singleton. RLS and the publishable key are sufficient.
    const db = await createServerSupabaseClient();
    const { error } = await db.from('about_content').select('id').limit(1);
    return json(!error, error ? 503 : 200);
  } catch {
    return json(false, 503);
  }
}
