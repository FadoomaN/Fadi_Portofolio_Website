import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set(['draft', 'published', 'archived']);
const DESTINATIONS = new Set(['journey', 'projects']);

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
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder)) return NextResponse.json({ error: 'Sort order must be a whole number.' }, { status: 400 });

  if (kind === 'about') {
    const record = {
      id: 1,
      intro: text(body.intro),
    };
    const { data, error } = await auth.supabase.from('about_content').update({ intro: record.intro }).eq('id', 1).select().single();
    if (error) return NextResponse.json({ error: 'About content could not be saved.' }, { status: 500 });
    if (Array.isArray(body.sections)) {
      const sections = body.sections.filter((section): section is Record<string, unknown> => Boolean(section) && typeof section === 'object').map((section, index) => {
        const position = text(section.media_position) || 'right';
        const shape = text(section.media_shape) || 'landscape';
        if (!['left', 'right'].includes(position) || !['portrait', 'landscape', 'square'].includes(shape)) return null;
        return {
          ...(UUID.test(text(section.id)) ? { id: text(section.id) } : {}),
          about_id: 1,
          label: text(section.label),
          heading: text(section.heading),
          body: text(section.body),
          media_reference: text(section.media_reference) || null,
          media_alt: text(section.media_alt),
          media_position: position,
          media_shape: shape,
          meta: text(section.meta),
          sort_order: Number.isInteger(Number(section.sort_order)) ? Number(section.sort_order) : index,
        };
      });
      if (sections.some((section) => section === null)) return NextResponse.json({ error: 'About section media settings are invalid.' }, { status: 400 });
      const validSections = sections as Record<string, unknown>[];
      const submittedIds = validSections.map((section) => section.id).filter((value): value is string => typeof value === 'string');
      const { data: existingSections, error: existingError } = await auth.supabase.from('about_sections').select('id').eq('about_id', 1);
      if (existingError) return NextResponse.json({ error: 'About sections could not be loaded.' }, { status: 500 });
      const removedIds = (existingSections ?? []).map((section) => section.id).filter((sectionId) => !submittedIds.includes(sectionId));
      const { error: deleteError } = removedIds.length
        ? await auth.supabase.from('about_sections').delete().in('id', removedIds)
        : { error: null };
      if (deleteError) return NextResponse.json({ error: 'About sections could not be removed.' }, { status: 500 });
      const { error: sectionError } = validSections.length
        ? await auth.supabase.from('about_sections').upsert(validSections)
        : await auth.supabase.from('about_sections').delete().eq('about_id', 1);
      if (sectionError) return NextResponse.json({ error: 'About sections could not be saved.' }, { status: 500 });
    }
    revalidatePath('/about');
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

  if (kind === 'about-section') {
    const shape = text(body.mediaShape) || 'landscape';
    const position = text(body.mediaPosition) || 'right';
    const sectionRecord = {
      about_id: 1,
      label: text(body.label),
      heading: text(body.heading),
      body: text(body.body),
      media_reference: text(body.mediaReference) || null,
      media_alt: text(body.mediaAlt),
      media_position: position,
      media_shape: shape,
      meta: text(body.meta),
      sort_order: sortOrder,
    };
    if (!['portrait', 'landscape', 'square'].includes(shape) || !['left', 'right'].includes(position)) {
      return NextResponse.json({ error: 'Choose a valid image format and position.' }, { status: 400 });
    }
    const query = id
      ? auth.supabase.from('about_sections').update(sectionRecord).eq('id', id)
      : auth.supabase.from('about_sections').insert(sectionRecord);
    const { data, error } = await query.select().single();
    if (error) return NextResponse.json({ error: 'The About section could not be saved.' }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (!['thread', 'thread-entry', 'journey-thread', 'journey-update', 'project', 'project-update'].includes(kind)) {
    return NextResponse.json({ error: 'The content type is invalid.' }, { status: 400 });
  }

  const title = text(body.title);
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  let table: string;
  let record: Record<string, unknown>;
  if (kind === 'thread') {
    const slug = text(body.slug);
    const destination = text(body.destination);
    if (!SLUG.test(slug)) return NextResponse.json({ error: 'Use a lowercase URL slug.' }, { status: 400 });
    if (!DESTINATIONS.has(destination)) return NextResponse.json({ error: 'Choose Journey or Projects as the destination.' }, { status: 400 });
    table = 'threads';
    record = {
      title,
      slug,
      destination,
      category: text(body.category),
      description: text(body.description) || text(body.summary),
      technical_description: destination === 'projects' ? text(body.technicalDescription) || null : null,
      cover_media_reference: text(body.coverMediaReference) || null,
      github_url: destination === 'projects' ? text(body.githubUrl) || null : null,
      live_url: destination === 'projects' ? text(body.liveUrl) || null : null,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      status,
      featured: body.featured === true,
      sort_order: sortOrder,
      ...(id ? {} : { created_by: auth.user.id }),
    };
  } else if (kind === 'thread-entry') {
    const parentId = text(body.parentId);
    const date = text(body.date);
    if (!UUID.test(parentId) || !DATE.test(date)) return NextResponse.json({ error: 'A valid thread and date are required.' }, { status: 400 });
    table = 'thread_entries';
    record = {
      thread_id: parentId,
      title,
      published_on: date,
      content: text(body.content),
      status,
      sort_order: sortOrder,
      ...(id ? {} : { created_by: auth.user.id }),
    };
  } else if (kind === 'journey-thread') {
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
  const table = { thread: 'threads', 'thread-entry': 'thread_entries', 'about-section': 'about_sections', 'journey-thread': 'journey_threads', 'journey-update': 'journey_updates', project: 'projects', 'project-update': 'project_updates' }[kind as string];
  if (!table || !UUID.test(id)) return NextResponse.json({ error: 'The selected record is invalid.' }, { status: 400 });
  const { error } = await auth.supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'The content could not be deleted.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
