import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '../../../site-header';
import { getJourneyThread } from '../../thread-data';
import { cookingSubthreads } from '../../subthread-data';
import { RamenContent } from '../../subthread-content';

type SubthreadPageProps = {
  params: Promise<{ threadSlug: string; subthreadSlug: string }>;
};

export async function generateMetadata({ params }: SubthreadPageProps): Promise<Metadata> {
  const { threadSlug, subthreadSlug } = await params;
  const thread = getJourneyThread(threadSlug);
  const subthread = threadSlug === 'cooking'
    ? cookingSubthreads.find((item) => item.slug === subthreadSlug)
    : undefined;

  return {
    title: subthread && thread ? `${subthread.title} — ${thread.title} — Journey — Fadi Al Hazim` : 'Journey — Fadi Al Hazim',
    description: subthread?.description ?? 'A Journey subthread.',
  };
}

export default async function SubthreadPage({ params }: SubthreadPageProps) {
  const { threadSlug, subthreadSlug } = await params;
  const isRamen = threadSlug === 'cooking' && subthreadSlug === 'ramen';

  if (!isRamen) notFound();

  return (
    <>
      <SiteHeader revealImmediately activeHref="/journey" />
      <main className="journey-canvas journey-subthread-page">
        <section className="journey-frame" aria-labelledby="subthread-title">
          <RamenContent />
        </section>
      </main>
    </>
  );
}
