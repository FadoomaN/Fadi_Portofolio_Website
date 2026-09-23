import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../site-header';
import SiteFooter from '../../site-footer';
import CircuitDivider from '../../circuit-divider';
import { getThread, getSubthreads } from '@/lib/public-content';
import SearchableCards from '../searchable-cards';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ threadSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const thread = await getThread('journey',(await params).threadSlug);
  return { title: thread ? `${thread.title} — Journey — Fadi Al Hazim` : 'Journey — Fadi Al Hazim', description: thread?.description };
}
export default async function ThreadPage({ params }: Props) {
  const thread = await getThread('journey',(await params).threadSlug);
  if (!thread) notFound();
  const subthreads = await getSubthreads(thread.id);
  return <><SiteHeader revealImmediately activeHref="/journey" /><main className="journey-canvas journey-thread-page"><section className="journey-frame" aria-labelledby="thread-title">
    <header className="journey-thread-intro">
      <nav className="journey-breadcrumb" aria-label="Journey path"><Link href="/journey">JOURNEY</Link><span aria-hidden="true">/</span><span aria-current="page">{thread.title}</span></nav>
      <h1 id="thread-title">{thread.title}</h1><p>{thread.description}</p><span>{String(subthreads.length).padStart(2,'0')} SUBTHREADS</span>
    </header>
    <CircuitDivider />
    <section className="journey-subthreads" aria-labelledby="subthreads-title"><p>Thread space</p><h2 id="subthreads-title">SUBTHREADS</h2>
      <SearchableCards kind="subthreads" subthreads={subthreads} threadSlug={thread.slug} />
    </section>
  </section></main><SiteFooter /></>;
}
