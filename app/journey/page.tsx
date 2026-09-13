import type { Metadata } from 'next';
import SiteHeader from '../site-header';

export const metadata: Metadata = {
  title: 'Journey — Fadi Al Hazim',
  description: 'Long-running personal threads and updates.',
};

export default function JourneyPage() {
  return (
    <main className="placeholder-canvas">
      <SiteHeader revealImmediately activeHref="/journey" />
      <section className="placeholder-shell" aria-labelledby="journey-title">
        <p className="placeholder-kicker">03 / Personal threads</p>
        <h1 id="journey-title">Join Me in the Journey</h1>
        <p className="placeholder-copy">Cooking, martial arts, fitness, travel and vlogs will appear here as chronological threads.</p>
        <p className="placeholder-status">Threads in progress.</p>
      </section>
    </main>
  );
}
