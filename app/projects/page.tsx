import type { Metadata } from 'next';
import SiteHeader from '../site-header';

export const metadata: Metadata = {
  title: 'Projects — Fadi Al Hazim',
  description: 'Technical projects and development updates.',
};

export default function ProjectsPage() {
  return (
    <main className="placeholder-canvas">
      <SiteHeader revealImmediately activeHref="/projects" />
      <section className="placeholder-shell" aria-labelledby="projects-title">
        <p className="placeholder-kicker">04 / Engineering work</p>
        <h1 id="projects-title">PROJECTS</h1>
        <p className="placeholder-copy">Technical projects will be organized into development threads, from concept through testing and final result.</p>
        <p className="placeholder-status">Projects in progress.</p>
      </section>
    </main>
  );
}
