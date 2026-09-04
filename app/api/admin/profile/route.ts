import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ProfileInput = {
  firstName?: unknown;
  lastName?: unknown;
  role?: unknown;
  kicker?: unknown;
  operationsEmail?: unknown;
  phoneNumber?: unknown;
  timezone?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const ALLOWED_TIMEZONES = new Set(['Europe/Stockholm', 'UTC']);

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });
  }

  const [{ data: membership }, { data: assurance }] = await Promise.all([
    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!membership || assurance?.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Authenticator verification is required.' }, { status: 403 });
  }

  let body: ProfileInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The profile data is invalid.' }, { status: 400 });
  }

  const firstName = cleanText(body.firstName);
  const lastName = cleanText(body.lastName);
  const role = cleanText(body.role);
  const kicker = cleanText(body.kicker);
  const operationsEmail = cleanText(body.operationsEmail).toLocaleLowerCase('en-US');
  const phoneNumber = cleanText(body.phoneNumber).replace(/[\s()-]/g, '');
  const timezone = cleanText(body.timezone);

  if (!firstName || !lastName || !role || !kicker) {
    return NextResponse.json({ error: 'Complete every public profile field.' }, { status: 400 });
  }

  if ([firstName, lastName].some((value) => value.length > 80) || role.length > 120 || kicker.length > 80) {
    return NextResponse.json({ error: 'One or more profile fields are too long.' }, { status: 400 });
  }

  if (operationsEmail && (operationsEmail.length > 254 || !EMAIL_PATTERN.test(operationsEmail))) {
    return NextResponse.json({ error: 'Enter a valid operations email.' }, { status: 400 });
  }

  if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    return NextResponse.json({ error: 'Use international phone format, for example +46701234567.' }, { status: 400 });
  }

  if (!ALLOWED_TIMEZONES.has(timezone)) {
    return NextResponse.json({ error: 'Select a supported timezone.' }, { status: 400 });
  }

  const { error } = await supabase.rpc('save_admin_profile', {
    p_first_name: firstName,
    p_last_name: lastName,
    p_role: role,
    p_kicker: kicker,
    p_operations_email: operationsEmail,
    p_phone_number: phoneNumber,
    p_timezone: timezone,
  });

  if (error) {
    return NextResponse.json({ error: 'The profile could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profile: { firstName, lastName, role, kicker },
    privateContact: { operationsEmail, phoneNumber, timezone },
  });
}
