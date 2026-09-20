import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import CircuitDivider from '../circuit-divider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/projects';

export const metadata: Metadata = { title:'Projects — Fadi Al Hazim',description:'Engineering projects and technical journals.' };

export default async function ProjectsPage(){
  const db=await createServerSupabaseClient();const {data}=await db.from('threads').select('id,title,slug,category,description,cover_media_reference,cover_position_x,cover_position_y,tags,status,featured,sort_order,updated_at,project_version,project_started_on,project_progress,project_repository,project_license,project_milestone,project_team,github_url,live_url').eq('destination','projects').eq('status','published').order('featured',{ascending:false}).order('sort_order');
  const projects=(data??[]) as Project[];
  return <><SiteHeader revealImmediately activeHref="/projects"/><CircuitDivider/><main className="projects-canvas"><header className="projects-heading"><p>04 / ENGINEERING WORK</p><h1>PROJECTS</h1><span>Selected systems, experiments and technical journals.</span></header><section className="projects-grid" aria-label="Published projects">{projects.map((project,index)=><article className="project-card" key={project.id}><small>PROJECT / {String(index+1).padStart(3,'0')}</small><h2>{project.title}</h2><dl><div><dt>STATUS</dt><dd>{project.status.toUpperCase()}</dd></div><div><dt>VERSION</dt><dd>{project.project_version??'—'}</dd></div><div><dt>DOMAIN</dt><dd>{project.category||'—'}</dd></div><div><dt>STACK</dt><dd>{project.tags.join(' / ')||'—'}</dd></div>{project.project_progress!==null&&<div><dt>PROGRESS</dt><dd>{project.project_progress}%</dd></div>}</dl>{project.cover_media_reference&&<img src={project.cover_media_reference} alt="" style={{objectPosition:`${project.cover_position_x}% ${project.cover_position_y}%`}}/>}<p>{project.description}</p><a href={`/projects/${project.slug}`}>OPEN PROJECT <span>↗</span></a></article>)}{!projects.length&&<p className="projects-empty">No published projects yet.</p>}</section></main></>;
}
