import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import ProjectsView from './projects-view';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/projects';

export const metadata: Metadata = { title:'Projects — Fadi Al Hazim',description:'Engineering projects and technical journals.' };

export default async function ProjectsPage(){
  const db=await createServerSupabaseClient();const {data,error}=await db.from('threads').select('id,title,slug,category,description,cover_media_reference,cover_position_x,cover_position_y,tags,status,featured,sort_order,updated_at,project_version,project_started_on,project_progress,project_repository,project_license,project_milestone,project_team,github_url,live_url').eq('destination','projects').eq('status','published').order('featured',{ascending:false}).order('sort_order');
  const projects=(data??[]) as Project[];
  return <><SiteHeader revealImmediately activeHref="/projects"/><ProjectsView projects={projects} unavailable={Boolean(error)} /></>;
}
