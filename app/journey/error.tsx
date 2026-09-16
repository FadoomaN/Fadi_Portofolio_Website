'use client';
export default function JourneyError({ reset }: { reset: () => void }) {
  return <main className="journey-canvas"><section className="journey-frame journey-subthread-content"><h1>Temporarily unavailable</h1><p>Your content is safe. Please try loading it again.</p><button type="button" onClick={reset}>Try again</button></section></main>;
}
