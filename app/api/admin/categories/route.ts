import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';
import { readJsonObject } from '@/lib/http';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const auth = await authorizeAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: Record<string, unknown>;
  try { body = await readJsonObject(request); } catch { return NextResponse.json({ error: 'Enter a category name.' }, { status: 400 }); }
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (name.length < 2 || name.length > 60 || !slug) return NextResponse.json({ error: 'Use a short category name (2–60 characters).' }, { status: 400 });
  const { data, error } = await auth.supabase.from('journey_categories').insert({ name, slug, sort_order: 100 }).select('id,name').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'That category is already in the list.' : 'Category could not be added.' }, { status: 400 });
  return NextResponse.json({ category: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
