import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';
import { normalizeFooterLinks } from '@/lib/footer';
import { readJsonObject } from '@/lib/http';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const auth = await authorizeAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: Record<string, unknown>;
  try { body = await readJsonObject(request); } catch { return NextResponse.json({ error: 'The footer data is invalid.' }, { status: 400 }); }
  if (!Array.isArray(body.links) || body.links.length > 30) return NextResponse.json({ error: 'Add up to 30 footer links.' }, { status: 400 });
  const links = normalizeFooterLinks(body.links);
  const ids = new Set(links.map((link) => link.id));
  if (links.length !== body.links.length || ids.size !== links.length) return NextResponse.json({ error: 'Each footer link needs a unique label and HTTPS URL.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('site_footer_settings').update({ links }).eq('id', 1).select('id, links, updated_at').single();
  if (error) return NextResponse.json({ error: 'Footer links could not be saved.' }, { status: 500 });
  revalidatePath('/');
  revalidatePath('/about');
  return NextResponse.json({ ok: true, settings: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
