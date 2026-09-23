import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../site-header';
import SiteFooter from '../../site-footer';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function NewsPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const db=await createServerSupabaseClient();
  const {data:post}=await db.from('manual_news').select('title,body,media_reference,media_alt,published_at').eq('slug',slug).maybeSingle();
  if(!post)notFound();
  const date = new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Stockholm'}).format(new Date(post.published_at));
  const paragraphs = post.body.split(/\r?\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
  return <><SiteHeader /><main className="news-detail"><article><Link href="/" className="news-back">← Back to home</Link><header className="news-detail-header"><p>News / {date} CET</p><h1>{post.title}</h1><span className="news-detail-divider" aria-hidden="true" /></header>{post.media_reference&&<figure><img src={post.media_reference} alt={post.media_alt??''} /></figure>}<div className="news-detail-body">{paragraphs.map((paragraph,index)=><p key={`${index}-${paragraph.slice(0,24)}`}>{paragraph}</p>)}</div></article></main><SiteFooter /></>;
}
