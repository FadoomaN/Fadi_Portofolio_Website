import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../site-header';
import RichTextRenderer from '../../rich-text-renderer';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function NewsPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const db=await createServerSupabaseClient();
  const {data:post}=await db.from('manual_news').select('title,body,media_reference,media_alt,published_at').eq('slug',slug).maybeSingle();
  if(!post)notFound();
  const date = new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Stockholm'}).format(new Date(post.published_at));
  return <><SiteHeader /><div className="engineering-surface"><main className="news-detail"><article><Link href="/" className="news-back">← BACK TO HOME</Link><header className="news-detail-header"><p>NEWS / {date} CET</p><h1>{post.title}</h1><span className="news-detail-divider" aria-hidden="true" /></header>{post.media_reference&&<figure><img src={post.media_reference} alt={post.media_alt??''} /></figure>}<div className="news-detail-body"><RichTextRenderer value={post.body} fallback={post.body} /></div></article></main></div></>;
}
