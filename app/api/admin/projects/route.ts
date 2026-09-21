import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeAdmin, sameOrigin } from '@/lib/admin-auth';
import { safeReference } from '@/lib/content';
import { validProjectBlocks } from '@/lib/projects';
import { readJsonObject } from '@/lib/http';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text=(value:unknown,max=10000)=>typeof value==='string'?value.trim().slice(0,max):'';
const json=(data:unknown,status=200)=>NextResponse.json(data,status===200?undefined:{status});

export async function GET(request:NextRequest){
  const auth=await authorizeAdmin();if('error'in auth)return json({error:auth.error},auth.status);
  const id=new URL(request.url).searchParams.get('id')??'';if(!UUID.test(id))return json({error:'Choose a valid project.'},400);
  const {data,error}=await auth.supabase.from('project_blocks').select('id,type,sort_order,data').eq('project_id',id).order('sort_order').order('created_at');
  if(error)return json({error:'Project blocks could not be loaded.'},500);return json({blocks:data??[]});
}

export async function POST(request:NextRequest){
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
  const auth=await authorizeAdmin();if('error'in auth)return json({error:auth.error},auth.status);
  let body:Record<string,unknown>;try{body=await readJsonObject(request);}catch{return json({error:'Invalid project data.'},400);}
  const id=text(body.id),title=text(body.title,160),slug=text(body.slug,120),description=text(body.description,1000),status=text(body.status),version=text(body.version,80),domain=text(body.domain,80),startedOn=text(body.startedOn,10),cover=text(body.coverMediaReference,2000),repository=text(body.repository,200),progress=body.progress===''||body.progress===null?null:Number(body.progress),coverPositionX=Number(body.coverPositionX),coverPositionY=Number(body.coverPositionY),tags=Array.isArray(body.tags)?body.tags.filter((tag):tag is string=>typeof tag==='string').map(tag=>tag.trim()).filter(Boolean).slice(0,24):[],blocks=body.blocks;
  if(id&&!UUID.test(id))return json({error:'Invalid project ID.'},400);
  if(!title)return json({error:'Title is required.'},400);
  if(!SLUG.test(slug))return json({error:'A valid URL slug is required.'},400);
  if(!['draft','published'].includes(status))return json({error:'Choose Draft or Published visibility.'},400);
  if(!Array.isArray(blocks))return json({error:'Project blocks are invalid.'},400);
  const invalidBlock=blocks.find((block)=>{const item=block as Record<string,unknown>;const data=item?.data as Record<string,unknown>|undefined;if(!item||!data)return true;if(item.type==='code')return !text(data.code,50000)||!text(data.language,30);if(item.type==='image')return !safeReference(text(data.mediaReference,2000));return false;});
  if(invalidBlock){const index=blocks.indexOf(invalidBlock);const type=(invalidBlock as Record<string,unknown>).type==='code'?'CODE':'IMAGE';return json({error:`${type} block #${index+1} is incomplete.`},400);}
  if(!validProjectBlocks(blocks))return json({error:'One or more project blocks have invalid data.'},400);
  if(cover&&!safeReference(cover))return json({error:'Cover image reference is invalid.'},400);
  if(repository&&!/^[\w.-]+\/[\w.-]+$/.test(repository))return json({error:'Repository must use owner/repository format.'},400);
  if(progress!==null&&(!Number.isInteger(progress)||progress<0||progress>100))return json({error:'Progress must be between 0 and 100.'},400);
  if(!Number.isInteger(coverPositionX)||coverPositionX<0||coverPositionX>100||!Number.isInteger(coverPositionY)||coverPositionY<0||coverPositionY>100)return json({error:'Cover focal position must be between 0 and 100.'},400);
  if(status==='published'&&(!description||!version||!domain||!startedOn||!tags.length))return json({error:'Publishing requires description, version, domain, started date and stack.'},400);
  const record={title,slug,destination:'projects',category:domain,description,cover_media_reference:cover||null,cover_position_x:coverPositionX,cover_position_y:coverPositionY,tags,status,featured:body.featured===true,sort_order:Number.isInteger(Number(body.sortOrder))?Number(body.sortOrder):0,project_version:version||null,project_started_on:startedOn||null,project_progress:progress,project_repository:repository||null,project_license:text(body.license,120)||null,project_milestone:text(body.milestone,180)||null,project_team:text(body.team,300)||null,github_url:repository?`https://github.com/${repository}`:null,live_url:text(body.liveUrl,2000)||null,...(id?{}:{created_by:auth.user.id})};
  const query=id?auth.supabase.from('threads').update(record).eq('id',id).eq('destination','projects'):auth.supabase.from('threads').insert(record);
  const {data:project,error}=await query.select('*').single();if(error||!project)return json({error:error?.code==='23505'?'That project address is already in use.':'The project could not be saved.'},400);
  const {error:deleteError}=await auth.supabase.from('project_blocks').delete().eq('project_id',project.id);if(deleteError)return json({error:'The project blocks could not be saved.'},500);
  if(blocks.length){const {error:blockError}=await auth.supabase.from('project_blocks').insert(blocks.map((block,index)=>({project_id:project.id,type:block.type,sort_order:index,data:block.data})));if(blockError)return json({error:'The project blocks could not be saved.'},500);}
  revalidatePath('/projects');revalidatePath(`/projects/${project.slug}`);revalidatePath('/admin');return json({ok:true,project});
}

export async function DELETE(request:NextRequest){
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);const auth=await authorizeAdmin();if('error'in auth)return json({error:auth.error},auth.status);
  let body:Record<string,unknown>;try{body=await readJsonObject(request);}catch{return json({error:'Invalid delete request.'},400);}const id=text(body.id),confirmTitle=text(body.confirmTitle,160);if(!UUID.test(id)||!confirmTitle)return json({error:'Choose a project and confirm its title.'},400);
  const {data:project}=await auth.supabase.from('threads').select('title,slug').eq('id',id).eq('destination','projects').maybeSingle();if(!project||project.title!==confirmTitle)return json({error:'The project changed. Refresh and try again.'},409);
  const {error}=await auth.supabase.from('threads').delete().eq('id',id).eq('destination','projects');if(error)return json({error:'The project could not be deleted.'},500);revalidatePath('/projects');revalidatePath(`/projects/${project.slug}`);revalidatePath('/admin');return json({ok:true});
}
