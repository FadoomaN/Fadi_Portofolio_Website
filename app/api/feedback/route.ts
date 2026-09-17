import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { sameOrigin } from '@/lib/admin-auth';
import { readJsonObject } from '@/lib/http';
import { checkComment,commentChecksReady,CommentCheckError,verifyHuman } from '@/lib/comment-moderation';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE='portfolio-visitor';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const settings=()=>({commentChecksReady:commentChecksReady(),turnstileSiteKey:commentChecksReady()?process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY:undefined});

export async function GET(request:NextRequest){
  const entry=request.nextUrl.searchParams.get('entry')??'';
  const before=request.nextUrl.searchParams.get('before');
  const beforeId=request.nextUrl.searchParams.get('beforeId');
  if(!UUID.test(entry)||(before&&(!Number.isFinite(Date.parse(before))||!UUID.test(beforeId??''))))return json({error:'Invalid entry or comment cursor.'},400);
  const visitor=request.cookies.get(COOKIE)?.value;
  const db=await createServerSupabaseClient();
  const {data,error}=await db.rpc('get_entry_feedback',{p_entry:entry,p_visitor:visitor&&UUID.test(visitor)?visitor:null,p_before:before,p_before_id:beforeId});
  if(error)return json({error:error.code==='P0002'?'Entry not found.':'Feedback is temporarily unavailable.'},error.code==='P0002'?404:503);
  return json({...data,...settings()});
}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return json({error:'Please submit feedback from this website.'},403);
  if(Number(request.headers.get('content-length'))>12000)return json({error:'Request is too large.'},413);
  let body;
  try{body=await readJsonObject(request);}catch{return json({error:'Invalid feedback.'},400);}
  if(typeof body.entry!=='string'||!UUID.test(body.entry)||typeof body.action!=='string'||!['reaction','comment'].includes(body.action))return json({error:'Invalid feedback.'},400);
  const name=typeof body.name==='string'?body.name.trim():'';
  const comment=typeof body.body==='string'?body.body.trim():'';
  if(body.action==='reaction'&&(typeof body.value!=='number'||![-1,0,1].includes(body.value)))return json({error:'Invalid reaction.'},400);
  if(body.action==='comment'&&(name.length<2||name.length>60||!comment||comment.length>2000||typeof body.requestId!=='string'||!UUID.test(body.requestId)))return json({error:'Enter your name (2–60 characters) and a comment (up to 2,000 characters).'},400);
  if(body.website)return json({error:'Your comment could not be submitted.'},400);
  const existing=request.cookies.get(COOKIE)?.value;
  const visitor=existing&&UUID.test(existing)?existing:crypto.randomUUID();
  const reply=(data:unknown,status=200)=>{
    const response=json(data,status);
    response.cookies.set(COOKIE,visitor,{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/',maxAge:60*60*24*365});
    return response;
  };
  try{
    if(body.action==='comment'){
      if(!commentChecksReady())return reply({error:'Comments are temporarily unavailable. Please try again later.'},503);
      await verifyHuman(body.turnstileToken,request.nextUrl.hostname);
      const service=createServiceSupabaseClient();
      const {error:limit}=await service.rpc('reserve_comment_check',{p_entry:body.entry,p_visitor:visitor});
      if(limit)return reply({error:limit.code==='P0001'?'Please wait before sending more comments.':'Comments are unavailable for this entry.'},limit.code==='P0001'?429:400);
      checkComment(name,comment);
      const {data,error}=await service.rpc('publish_checked_comment',{p_entry:body.entry,p_visitor:visitor,p_name:name,p_body:comment,p_request:body.requestId});
      if(error)return reply({error:error.code==='22023'?'This comment was already posted or comments are closed.':error.code==='P0001'?'Please wait before sending more comments.':'The comment could not be saved. Please try again.'},error.code==='P0001'?429:error.code==='22023'?400:503);
      return reply({...data,...settings()});
    }
    const db=await createServerSupabaseClient();
    const {data,error}=await db.rpc('submit_entry_feedback',{p_entry:body.entry,p_visitor:visitor,p_action:'reaction',p_value:body.value});
    if(error)return reply({error:error.code==='P0001'?'Please wait before sending more feedback.':'Feedback could not be saved. Please try again.'},error.code==='P0001'?429:error.code==='P0002'?404:503);
    return reply({...data,...settings()});
  }catch(error){
    if(error instanceof CommentCheckError)return reply({error:error.message},error.status);
    return reply({error:'Automatic checks are temporarily unavailable. Your comment was not published. Please try again.'},503);
  }
}
