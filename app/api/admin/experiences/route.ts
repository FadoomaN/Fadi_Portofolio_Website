import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ExperienceInput = {
  id?: unknown;
  organization?: unknown;
  role?: unknown;
  employmentType?: unknown;
  location?: unknown;
  summary?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isCurrent?: unknown;
  status?: unknown;
  sortOrder?: unknown;
};

const ALLOWED_EMPLOYMENT_TYPES = new Set([
  'full-time',
  'part-time',
  'internship',
  'contract',
  'freelance',
  'education',
  'other',
]);
const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function getAuthorizedAdmin() {
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
  const authorization = await getAuthorizedAdmin();
  if ('error' in authorization) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  let body: ExperienceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The experience data is invalid.' }, { status: 400 });
  }

  const id = cleanText(body.id);
  const organization = cleanText(body.organization);
  const role = cleanText(body.role);
  const employmentType = cleanText(body.employmentType);
  const location = cleanText(body.location);
  const summary = cleanText(body.summary);
  const startDate = cleanText(body.startDate);
  const endDate = cleanText(body.endDate);
  const isCurrent = body.isCurrent === true;
  const status = cleanText(body.status);
  const sortOrder = Number(body.sortOrder);

  if (id && !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'The selected experience is invalid.' }, { status: 400 });
  }
  if (!organization || !role || !startDate) {
    return NextResponse.json({ error: 'Organization, role and start date are required.' }, { status: 400 });
  }
  if (organization.length > 140 || role.length > 140 || location.length > 140 || summary.length > 2000) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 });
  }
  if (!ALLOWED_EMPLOYMENT_TYPES.has(employmentType) || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Choose a valid type and status.' }, { status: 400 });
  }
  if (!isValidDate(startDate) || (endDate && !isValidDate(endDate))) {
    return NextResponse.json({ error: 'Enter valid experience dates.' }, { status: 400 });
  }
  if (!isCurrent && endDate && endDate < startDate) {
    return NextResponse.json({ error: 'The end date cannot be before the start date.' }, { status: 400 });
  }
  if (!Number.isInteger(sortOrder) || sortOrder < -9999 || sortOrder > 9999) {
    return NextResponse.json({ error: 'Sort order must be a whole number between -9999 and 9999.' }, { status: 400 });
  }

  const record = {
    organization,
    role,
    employment_type: employmentType,
    location,
    summary,
    start_date: startDate,
    end_date: isCurrent ? null : (endDate || null),
    is_current: isCurrent,
    status,
    sort_order: sortOrder,
  };

  const query = id
    ? authorization.supabase.from('experiences').update(record).eq('id', id)
    : authorization.supabase.from('experiences').insert({
      ...record,
      created_by: authorization.user.id,
    });

  const { data, error } = await query
    .select('id, organization, role, employment_type, location, summary, start_date, end_date, is_current, status, sort_order, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'The experience could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, experience: data });
}

export async function DELETE(request: NextRequest) {
  const authorization = await getAuthorizedAdmin();
  if ('error' in authorization) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The experience data is invalid.' }, { status: 400 });
  }

  const id = cleanText(body.id);
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'The selected experience is invalid.' }, { status: 400 });
  }

  const { error } = await authorization.supabase.from('experiences').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'The experience could not be deleted.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
