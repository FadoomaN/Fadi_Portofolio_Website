import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/admin-auth';

const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });
  const [{ data: membership }, { data: assurance }] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!membership || assurance?.currentLevel !== 'aal2') return NextResponse.json({ error: 'Authenticator verification is required.' }, { status: 403 });

  if (Number(request.headers.get('content-length')) > 9 * 1024 * 1024) return NextResponse.json({ error: 'Upload is too large.' }, { status: 413 });
  let form;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 }); }
  const file = form.get('file');
  if (!(file instanceof File) || !IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: 'Upload a JPEG, PNG, WebP or GIF image. Video is not enabled yet.' }, { status: 400 });
  if (!file.size || file.size > MAX_BYTES) return NextResponse.json({ error: 'Images must be 8 MB or smaller.' }, { status: 400 });

  const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `admin/${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: 'The media could not be uploaded. Check the file size and try again.' }, { status: 500 });
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return NextResponse.json({ ok: true, path, url: data.publicUrl });
}
