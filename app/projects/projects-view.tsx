import CircuitDivider from '../circuit-divider';
import type { Project } from '@/lib/projects';
import Link from 'next/link';

export default function ProjectsView({ projects, unavailable = false }: { projects: Project[]; unavailable?: boolean }) {
  return <main className="projects-canvas">
    <div className="projects-frame">
      <header className="projects-heading">
        <p>04 / ENGINEERING WORK</p>
        <h1>PROJECTS</h1>
        <span>Selected systems, experiments and technical journals.</span>
      </header>
      <CircuitDivider />
      <section className="projects-grid" aria-label="Published projects">
        {projects.map((project, index) => <article className="project-card" key={project.id}>
          <small>PROJECT / {String(index + 1).padStart(3, '0')}</small>
          <h2>{project.title}</h2>
          <dl>
            <div><dt>STATUS</dt><dd>{project.status.toUpperCase()}</dd></div>
            <div><dt>VERSION</dt><dd>{project.project_version ?? '—'}</dd></div>
            <div><dt>DOMAIN</dt><dd>{project.category || '—'}</dd></div>
            <div><dt>STACK</dt><dd>{project.tags.join(' / ') || '—'}</dd></div>
            {project.project_progress !== null && <div><dt>PROGRESS</dt><dd>{project.project_progress}%</dd></div>}
          </dl>
          {project.cover_media_reference && <img src={project.cover_media_reference} alt="" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }} />}
          <p>{project.description}</p>
          <a href={`/projects/${project.slug}`}>OPEN PROJECT <span>↗</span></a>
        </article>)}
        {!projects.length && <div className="projects-empty" role={unavailable ? 'alert' : undefined}>
          <span className="projects-empty-index">PROJECT ARCHIVE / {unavailable ? 'UNAVAILABLE' : '00'}</span>
          <h2>{unavailable ? 'Projects are temporarily unavailable.' : 'No published projects yet.'}</h2>
          <p>{unavailable ? 'Please try again shortly.' : 'Engineering projects and their development logs will appear here as they are published.'}</p>
          <Link href="/journey">EXPLORE THE JOURNEY <span aria-hidden="true">↗</span></Link>
        </div>}
      </section>
    </div>
  </main>;
}
