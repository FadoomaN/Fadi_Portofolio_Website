import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { journeyThreads } from './thread-data';

export const metadata: Metadata = {
  title: 'Journey — Fadi Al Hazim',
  description: 'Long-running personal threads and updates.',
};

export default async function JourneyPage() {
  return (
    <>
      <SiteHeader revealImmediately activeHref="/journey" />
      <main className="journey-canvas">
        <section className="journey-frame" aria-labelledby="journey-title">
          <header className="journey-intro">
            <p className="journey-kicker">03 / Journey</p>
            <h1 id="journey-title">JOURNEY</h1>
            <p>Long-running personal threads for interests, experiments and experiences that continue to develop over time.</p>
          </header>
          <CircuitDivider />
          <section className="journey-threads" aria-labelledby="threads-title">
            <div className="journey-section-heading">
              <span>Personal archive / 03</span>
              <h2 id="threads-title">THREADS</h2>
            </div>
            <div className="journey-thread-list">
              {journeyThreads.map((thread) => (
                <Link className="journey-thread" href={`/journey/${thread.slug}`} key={thread.slug}>
                  <div className="journey-thread-thumbnail" aria-hidden="true">
                    <span>{thread.visual}</span>
                    <strong>{thread.title}</strong>
                    <i />
                  </div>
                  <div className="journey-thread-copy">
                    <span className="journey-thread-label">{thread.number} / THREAD</span>
                    <h3>{thread.title}</h3>
                    <p>{thread.description}</p>
                    <small>{String(thread.subthreads).padStart(2, '0')} SUBTHREADS</small>
                  </div>
                  <span className="journey-thread-view" aria-hidden="true">VIEW THREAD ↗</span>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
