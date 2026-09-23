import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../../site-header';
import SiteFooter from '../../../site-footer';
import CircuitDivider from '../../../circuit-divider';
import { getThread, getSubthread, getSubthreadPost, getFeedbackSnapshot } from '@/lib/public-content';
import EntryFeedback from '../../entry-feedback';
import { SubthreadMedia } from '../../subthread-content';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ threadSlug: string; subthreadSlug: string }> };
async function content(params: Props['params']) {
  const { threadSlug, subthreadSlug } = await params;
  const thread = await getThread('journey',threadSlug);
  const subthread = thread ? await getSubthread(thread.id,subthreadSlug) : null;
  return { thread, subthread };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { thread, subthread } = await content(params);
  return { title: subthread && thread ? `${subthread.title} — ${thread.title} — Journey — Fadi Al Hazim` : 'Journey — Fadi Al Hazim', description: subthread?.description };
}
export default async function SubthreadPage({ params }: Props) {
  const { thread, subthread } = await content(params);
  if (!thread || !subthread) notFound();
  const post = await getSubthreadPost(subthread.id);
  const feedback = post ? await getFeedbackSnapshot(post.id) : null;
  return <><SiteHeader revealImmediately activeHref="/journey" /><main className="journey-canvas journey-subthread-page"><section className="journey-frame" aria-labelledby="subthread-title">
    <header className="journey-subthread-intro"><nav className="journey-breadcrumb" aria-label="Journey path"><Link href="/journey">JOURNEY</Link><span aria-hidden="true">/</span><Link href={`/journey/${thread.slug}`}>{thread.title}</Link><span aria-hidden="true">/</span><span aria-current="page">{subthread.title}</span></nav><h1 id="subthread-title">{subthread.title}</h1>{subthread.description&&<p>{subthread.description}</p>}</header>
    <CircuitDivider />
    <div className={`journey-subthread-content${post?.thread_media?.length?' has-media':' is-article'}`}>
      {post?.thread_media?.map(media=><SubthreadMedia key={media.id} media={media} />)}
      {post?.content&&<article className="journey-article-body"><p>{post.content}</p></article>}
      {post&&<EntryFeedback key={post.id} entryId={post.id} initialFeedback={feedback} />}
    </div>
  </section></main><SiteFooter /></>;
}
