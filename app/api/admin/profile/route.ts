import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';

type ProfileInput = { firstName?: unknown; lastName?: unknown; role?: unknown; kicker?: unknown; portraitMediaReference?: unknown; portraitAlt?: unknown; portraitObjectPosition?: unknown };
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const auth = await authorizeAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: ProfileInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'The profile data is invalid.' }, { status: 400 }); }
  const firstName = clean(body.firstName), lastName = clean(body.lastName), role = clean(body.role), kicker = clean(body.kicker), portraitMediaReference = clean(body.portraitMediaReference), portraitAlt = clean(body.portraitAlt), portraitObjectPosition = clean(body.portraitObjectPosition) || 'center';
  if (!firstName || !lastName || !role || !kicker) return NextResponse.json({ error: 'Complete every public profile field.' }, { status: 400 });
  if ([firstName, lastName].some(value => value.length > 80) || role.length > 120 || kicker.length > 80 || portraitAlt.length > 180 || !['center', 'top', 'bottom'].includes(portraitObjectPosition)) return NextResponse.json({ error: 'One or more profile fields are invalid.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('site_profile').update({ first_name: firstName, last_name: lastName, role, kicker, portrait_media_reference: portraitMediaReference || null, portrait_alt: portraitAlt, portrait_object_position: portraitObjectPosition }).eq('id', 1).select('first_name, last_name, role, kicker, portrait_media_reference, portrait_alt, portrait_object_position, updated_at').single();
  if (error) return NextResponse.json({ error: 'The profile could not be saved.' }, { status: 500 });
  revalidatePath('/');
  return NextResponse.json({ ok: true, profile: data });
}
