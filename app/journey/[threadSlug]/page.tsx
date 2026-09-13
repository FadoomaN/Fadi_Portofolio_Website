import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../site-header';
import CircuitDivider from '../../circuit-divider';
import { getJourneyThread } from '../thread-data';
import { cookingSubthreads } from '../subthread-data';

type ThreadPageProps = {
  params: Promise<{ threadSlug: string }>;
};

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const thread = getJourneyThread((await params).threadSlug);
  return {
    title: thread ? `${thread.title} — Journey — Fadi Al Hazim` : 'Journey — Fadi Al Hazim',
    description: thread?.description ?? 'A Journey thread.',
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const thread = getJourneyThread((await params).threadSlug);
  if (!thread) notFound();

  return (
    <>
      <SiteHeader revealImmediately activeHref="/journey" />
      <main className="journey-canvas journey-thread-page">
        <section className="journey-frame" aria-labelledby="thread-title">
          <header className="journey-thread-intro">
            <nav className="journey-breadcrumb" aria-label="Journey path">
              <Link href="/journey">JOURNEY</Link>
              <span aria-hidden="true">/</span>
              <Link href="/journey">THREADS</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{thread.title}</span>
            </nav>
            <h1 id="thread-title">{thread.title}</h1>
            <p>{thread.description}</p>
            <span>{String(thread.subthreads).padStart(2, '0')} SUBTHREADS</span>
          </header>
          <CircuitDivider />
          <section className="journey-subthreads" aria-labelledby="subthreads-title">
            <p>Thread space / {thread.number}</p>
            <h2 id="subthreads-title">SUBTHREADS</h2>
            {thread.slug === 'cooking' ? (
              <div className="journey-subthread-list">
                {cookingSubthreads.map((subthread) => (
                  <Link
                    className="journey-subthread"
                    href={`/journey/${thread.slug}/${subthread.slug}`}
                    key={subthread.slug}
                  >
                    <div className="journey-subthread-thumbnail">
                      <span>{subthread.visual}</span>
                      <i aria-hidden="true" />
                    </div>
                    <div className="journey-subthread-copy">
                      <h3>{subthread.title}</h3>
                      <p>{subthread.description}</p>
                      <small>{String(subthread.logs).padStart(2, '0')} LOGS</small>
                    </div>
                    <span className="journey-subthread-view" aria-hidden="true">OPEN SUBTHREAD ↗</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="journey-subthreads-empty">Future subthread content will appear here.</div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
