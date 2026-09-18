import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';
import { safeReference } from '@/lib/content';
import { readJsonObject } from '@/lib/http';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const clean=(value:unknown)=>typeof value==='string'?value.trim():'';
const json=(data:unknown,status=200)=>NextResponse.json(data,status===200?undefined:{status});

export async function POST(request:NextRequest){
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
  const auth=await authorizeAdmin(); if('error'in auth)return json({error:auth.error},auth.status);
  let body; try{body=await readJsonObject(request);}catch{return json({error:'Invalid news post.'},400);}
  const id=clean(body.id),title=clean(body.title),slug=clean(body.slug),text=clean(body.body),mediaReference=clean(body.mediaReference),mediaAlt=clean(body.mediaAlt);
  if((id&&!UUID.test(id))||!SLUG.test(slug)||slug.length>120||title.length<2||title.length>180||text.length>12000||mediaAlt.length>300||mediaReference&&!safeReference(mediaReference))return json({error:'Check the title, address, text and image.'},400);
  const record={title,slug,body:text,media_reference:mediaReference||null,media_alt:mediaReference?mediaAlt||null:null};
  const {data,error}=await (id?auth.supabase.from('manual_news').update(record).eq('id',id):auth.supabase.from('manual_news').insert(record)).select('id,slug,title,body,media_reference,media_alt,published_at,created_at,updated_at').single();
  if(error)return json({error:error.code==='23505'?'That URL slug is already in use.':'The news post could not be saved.'},400);
  revalidatePath('/');revalidatePath('/news');revalidatePath(`/news/${data.slug}`);revalidatePath('/admin');
  return json({ok:true,post:data});
}

export async function DELETE(request:NextRequest){
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
  const auth=await authorizeAdmin(); if('error'in auth)return json({error:auth.error},auth.status);
  let body;try{body=await readJsonObject(request);}catch{return json({error:'Invalid delete request.'},400);}
  const id=clean(body.id),confirmTitle=clean(body.confirmTitle);if(!UUID.test(id)||!confirmTitle)return json({error:'Choose a saved post and confirm its title.'},400);
  const {data:post}=await auth.supabase.from('manual_news').select('slug,title').eq('id',id).maybeSingle();
  if(!post||post.title!==confirmTitle)return json({error:'The post changed. Refresh and try again.'},409);
  const {error}=await auth.supabase.from('manual_news').delete().eq('id',id).eq('title',post.title);if(error)return json({error:'The news post could not be deleted.'},503);
  revalidatePath('/');revalidatePath(`/news/${post.slug}`);revalidatePath('/admin');return json({ok:true});
}
