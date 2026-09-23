import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import SiteFooter from '../site-footer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/projects';

export const metadata: Metadata = { title:'Projects — Fadi Al Hazim',description:'Engineering projects and technical journals.' };

export default async function ProjectsPage(){
  const db=await createServerSupabaseClient();const {data}=await db.from('threads').select('id,title,slug,category,description,cover_media_reference,cover_position_x,cover_position_y,tags,status,featured,sort_order,updated_at,project_version,project_started_on,project_progress,project_repository,project_license,project_milestone,project_team,github_url,live_url').eq('destination','projects').eq('status','published').order('featured',{ascending:false}).order('sort_order');
  const projects=(data??[]) as Project[];
  return <><SiteHeader revealImmediately activeHref="/projects"/><main className="projects-canvas"><header className="projects-heading"><p>Selected work</p><h1>Projects</h1><span>Engineering work, experiments, and the decisions behind them.</span></header><section className="projects-grid" aria-label="Published projects">{projects.map((project,index)=><article className="project-card" key={project.id}><div className="project-card-heading"><small>{String(index+1).padStart(2,'0')} / {project.category||'Project'}</small><h2><a href={`/projects/${project.slug}`}>{project.title}</a></h2><p>{project.description}</p></div>{project.cover_media_reference&&<img src={project.cover_media_reference} alt="" style={{objectPosition:`${project.cover_position_x}% ${project.cover_position_y}%`}}/>}<div className="project-card-foot"><span>{project.tags.join(' · ')||'Engineering project'}{project.project_version?` · v${project.project_version}`:''}</span><a href={`/projects/${project.slug}`}>Read case study <span aria-hidden="true">↗</span></a></div></article>)}{!projects.length&&<p className="projects-empty">No published projects yet.</p>}</section></main><SiteFooter/></>;
}
