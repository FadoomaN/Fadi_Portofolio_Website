import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';
import { safeReference } from '@/lib/content';
import { readJsonObject } from '@/lib/http';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const clean = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ('error' in auth) return json({ error: auth.error }, auth.status);
  const threadId = request.nextUrl.searchParams.get('thread') ?? '';
  if (!UUID.test(threadId)) return json({ error: 'Choose a valid Journey thread.' },400);
  const {data:parent,error:parentError}=await auth.supabase.from('threads').select('destination').eq('id',threadId).maybeSingle();
  if(parentError||parent?.destination!=='journey')return json({error:'Choose a valid Journey thread.'},404);
  const {data:subthreads,error}=await auth.supabase.from('thread_subthreads').select('*,thread_entries(*,thread_media(*))')
    .eq('thread_id',threadId).order('sort_order').order('created_at');
  if(error)return json({error:'Subthreads could not be loaded.'},503);
  return json({subthreads});
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' },403);
  const auth = await authorizeAdmin();
  if ('error' in auth) return json({ error: auth.error },auth.status);
  let body;
  try { body = await readJsonObject(request); } catch { return json({ error: 'Invalid content.' },400); }
  if (!['thread','subthread'].includes(clean(body.kind))) return json({ error: 'Invalid content type.' },400);
  if (!body.record || typeof body.record !== 'object' || Array.isArray(body.record)) return json({ error: 'Invalid record.' },400);
  const record = body.record as Record<string,unknown>;
  const id = clean(record.id);
  const title = clean(record.title);
  const status = clean(record.status);
  const order = Number(record.sort_order);
  if ((id && !UUID.test(id)) || !title || title.length>160 || !['draft','published','archived'].includes(status) || !Number.isSafeInteger(order) || Math.abs(order)>100000) return json({ error: 'Check the title, status and sort order.' },400);
  const reference = clean(record.cover_media_reference);
  if (reference && !safeReference(reference)) return json({ error: 'Use an HTTPS address or a local image path.' },400);
  const coverX=Number(record.cover_position_x??50),coverY=Number(record.cover_position_y??50);
  if(!Number.isInteger(coverX)||!Number.isInteger(coverY)||coverX<0||coverX>100||coverY<0||coverY>100)return json({error:'Choose a valid thumbnail position.'},400);
  let data; let error;
  if (body.kind === 'subthread') {
    const slug = clean(record.slug);
    const publishedOn=clean(body.publishedOn);
    const content=clean(body.content);
    if (!UUID.test(clean(record.thread_id))||!SLUG.test(slug)||slug.length>100||clean(record.description).length>10000||!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn)||!Number.isFinite(Date.parse(publishedOn))||content.length>100000)return json({error:'Check the title, address, date and article text.'},400);
    if(!Array.isArray(body.media)||body.media.length>1)return json({error:'Choose No media or one image.'},400);
    const media=body.media.map((item:Record<string,unknown>)=>({
      media_type:clean(item?.media_type),media_reference:clean(item?.media_reference),caption:'',
      media_alt:clean(item?.media_alt),media_shape:'landscape',media_position:'right',sort_order:0,
    }));
    if(media.some(item=>item.media_type!=='image'||!safeReference(item.media_reference)||item.media_alt.length>300))return json({error:'Choose an image or No media. Video is not enabled yet.'},400);
    ({data,error}=await auth.supabase.rpc('save_journey_subthread',{p_record:{id:id||null,thread_id:record.thread_id,title,slug,description:clean(record.description),cover_media_reference:reference||null,cover_position_x:coverX,cover_position_y:coverY,status,sort_order:order},p_content:{published_on:publishedOn,content,comments_enabled:body.commentsEnabled!==false},p_media:media}));
    if(!error&&data?.subthread){
      const saved=data.subthread;
      const {data:full,error:readError}=await auth.supabase.from('thread_subthreads').select('*,thread_entries(*,thread_media(*))').eq('id',saved.id).single();
      if(readError)return json({error:'Saved, but the latest view could not be loaded. Refresh to continue.'},503);
      data=full;
    }
  } else {
    const slug=clean(record.slug),category=clean(record.category);
    if(!SLUG.test(slug)||slug.length>100||clean(record.description).length>10000||category.length>60)return json({error:'Check the address, category and description.'},400);
    if(category){const {data:choice,error:choiceError}=await auth.supabase.from('journey_categories').select('name').eq('name',category).maybeSingle();if(choiceError||!choice)return json({error:'Choose a category from the list.'},400);}
    if(id){const {data:existing}=await auth.supabase.from('threads').select('destination').eq('id',id).maybeSingle();if(existing?.destination!=='journey')return json({error:'Only Journey threads can be edited here.'},400);}
    const values={title,slug,description:clean(record.description),cover_media_reference:reference||null,cover_position_x:coverX,cover_position_y:coverY,
      destination:'journey',category,featured:record.featured===true,status,sort_order:order,...(id?{}:{created_by:auth.user.id})};
    ({data,error}=await (id?auth.supabase.from('threads').update(values).eq('id',id):auth.supabase.from('threads').insert(values)).select().single());
  }
  if (error) return json({ error:error.code==='23505'?'That URL slug is already used. Choose another.':error.code==='23503'?'The parent changed. Reload and choose its thread again.':'The record could not be saved. Your edits are still here.' },400);
  revalidatePath('/journey','layout'); revalidatePath('/admin');
  return json({ok:true,record:data});
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' },403);
  const auth = await authorizeAdmin();
  if ('error' in auth) return json({ error: auth.error },auth.status);
  let body;
  try { body = await readJsonObject(request); } catch { return json({ error: 'Invalid delete request.' },400); }
  const kind = clean(body.kind), id = clean(body.id), confirmTitle = clean(body.confirmTitle);
  if (!['thread','subthread'].includes(kind) || !UUID.test(id) || !confirmTitle) return json({ error: 'Choose a saved thread or subthread and confirm its title.' },400);

  if (kind === 'thread') {
    const { data: record, error: readError } = await auth.supabase.from('threads').select('id,title,slug').eq('id',id).eq('destination','journey').maybeSingle();
    if (readError) return json({ error: 'Thread could not be checked. Try again.' },503);
    if (!record) return json({ error: 'Thread no longer exists. Refresh the list.' },404);
    if (record.title !== confirmTitle) return json({ error: 'The thread title has changed. Refresh before deleting.' },409);
    const { data: deleted, error } = await auth.supabase.from('threads').delete().eq('id',id).eq('destination','journey').eq('title',record.title).select('id').maybeSingle();
    if (error) return json({ error: 'Thread could not be deleted. Nothing was removed.' },503);
    if (!deleted) return json({ error: 'Thread changed before deletion. Refresh and try again.' },409);
    revalidatePath('/journey'); revalidatePath(`/journey/${record.slug}`); revalidatePath('/admin');
    return json({ ok:true });
  }

  const { data: record, error: readError } = await auth.supabase.from('thread_subthreads').select('id,title,slug,thread_id').eq('id',id).maybeSingle();
  if (readError) return json({ error: 'Subthread could not be checked. Try again.' },503);
  if (!record) return json({ error: 'Subthread no longer exists. Refresh the thread.' },404);
  const { data: parent, error: parentError } = await auth.supabase.from('threads').select('slug,destination').eq('id',record.thread_id).maybeSingle();
  if (parentError || parent?.destination !== 'journey') return json({ error: 'Parent thread could not be verified.' },404);
  if (record.title !== confirmTitle) return json({ error: 'The subthread title has changed. Refresh before deleting.' },409);
  const { data: deleted, error } = await auth.supabase.from('thread_subthreads').delete().eq('id',id).eq('thread_id',record.thread_id).eq('title',record.title).select('id').maybeSingle();
  if (error) return json({ error: 'Subthread could not be deleted. Nothing was removed.' },503);
  if (!deleted) return json({ error: 'Subthread changed before deletion. Refresh and try again.' },409);
  revalidatePath('/journey'); revalidatePath(`/journey/${parent.slug}`); revalidatePath(`/journey/${parent.slug}/${record.slug}`); revalidatePath('/admin');
  return json({ ok:true });
}
