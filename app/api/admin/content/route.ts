import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set(['draft', 'published', 'archived']);

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function authorized() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session has expired.', status: 401 } as const;
  const [{ data: membership }, { data: assurance }] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!membership || assurance?.currentLevel !== 'aal2') {
    return { error: 'Authenticator verification is required.', status: 403 } as const;
  }
  return { supabase, user } as const;
}

export async function POST(request: NextRequest) {
  const auth = await authorized();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The content data is invalid.' }, { status: 400 });
  }

  const kind = text(body.kind);
  const id = text(body.id);
  if (id && !UUID.test(id)) return NextResponse.json({ error: 'The selected record is invalid.' }, { status: 400 });
  const status = text(body.status) || 'draft';
  if (!STATUSES.has(status)) return NextResponse.json({ error: 'Choose a valid status.' }, { status: 400 });

  if (kind === 'about') {
    const record = {
      id: 1,
      title: text(body.title) || 'ABOUT',
      intro: text(body.intro),
      body: text(body.body),
      sections: Array.isArray(body.sections) ? body.sections : [],
      media_reference: text(body.mediaReference) || null,
    };
    const { data, error } = await auth.supabase.from('about_content').upsert(record).select().single();
    if (error) return NextResponse.json({ error: 'About content could not be saved.' }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (kind === 'contact') {
    const record = {
      id: 1,
      email: text(body.email) || null,
      github_url: text(body.githubUrl) || null,
      linkedin_url: text(body.linkedinUrl) || null,
      cv_url: text(body.cvUrl) || null,
    };
    const { data, error } = await auth.supabase.from('public_contact_settings').upsert(record).select().single();
    if (error) return NextResponse.json({ error: 'Public contact settings could not be saved.' }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (!['journey-thread', 'journey-update', 'project', 'project-update'].includes(kind)) {
    return NextResponse.json({ error: 'The content type is invalid.' }, { status: 400 });
  }

  const title = text(body.title);
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder)) return NextResponse.json({ error: 'Sort order must be a whole number.' }, { status: 400 });

  let table: string;
  let record: Record<string, unknown>;
  if (kind === 'journey-thread') {
    const slug = text(body.slug);
    if (!SLUG.test(slug)) return NextResponse.json({ error: 'Use a lowercase URL slug.' }, { status: 400 });
    table = 'journey_threads';
    record = {
      title, slug, description: text(body.description), cover_media_reference: text(body.coverMediaReference) || null,
      status, featured: body.featured === true, sort_order: sortOrder, ...(id ? {} : { created_by: auth.user.id }),
    };
  } else if (kind === 'project') {
    const slug = text(body.slug);
    if (!SLUG.test(slug)) return NextResponse.json({ error: 'Use a lowercase URL slug.' }, { status: 400 });
    table = 'projects';
    record = {
      title, slug, summary: text(body.summary), technical_description: text(body.technicalDescription),
      content: {}, cover_image_url: text(body.coverImage) || null, tags: Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      github_url: text(body.githubUrl) || null, live_url: text(body.liveUrl) || null,
      status, featured: body.featured === true, sort_order: sortOrder, ...(id ? {} : { created_by: auth.user.id }),
    };
  } else {
    const parentId = text(body.parentId);
    const date = text(body.date);
    if (!UUID.test(parentId) || !DATE.test(date)) return NextResponse.json({ error: 'A valid parent and date are required.' }, { status: 400 });
    table = kind === 'journey-update' ? 'journey_updates' : 'project_updates';
    record = {
      title, published_on: date, content: text(body.content), media_reference: text(body.mediaReference) || null,
      status, sort_order: sortOrder, [kind === 'journey-update' ? 'thread_id' : 'project_id']: parentId,
      ...(id ? {} : { created_by: auth.user.id }),
    };
  }

  const query = id
    ? auth.supabase.from(table).update(record).eq('id', id)
    : auth.supabase.from(table).insert(record);
  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: 'The content could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true, record: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorized();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: { kind?: unknown; id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'The delete request is invalid.' }, { status: 400 }); }
  const kind = text(body.kind);
  const id = text(body.id);
  const table = { 'journey-thread': 'journey_threads', 'journey-update': 'journey_updates', project: 'projects', 'project-update': 'project_updates' }[kind as string];
  if (!table || !UUID.test(id)) return NextResponse.json({ error: 'The selected record is invalid.' }, { status: 400 });
  const { error } = await auth.supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'The content could not be deleted.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
