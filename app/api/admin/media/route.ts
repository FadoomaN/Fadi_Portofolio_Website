import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });
  const [{ data: membership }, { data: assurance }] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!membership || assurance?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Authenticator verification is required.' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: 'Upload a JPEG, PNG, WebP or GIF image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Images must be 8 MB or smaller.' }, { status: 400 });

  const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `admin/${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: 'The image could not be uploaded.' }, { status: 500 });
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return NextResponse.json({ ok: true, path, url: data.publicUrl });
}
