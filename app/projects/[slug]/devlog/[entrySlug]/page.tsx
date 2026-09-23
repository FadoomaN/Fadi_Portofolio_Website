import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../../../site-header";
import ProjectBlocks from "../../../project-blocks";
import type { ProjectBlock } from "@/lib/projects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DevLogEntry({ params }: { params: Promise<{ slug: string; entrySlug: string }> }) {
  const { slug, entrySlug } = await params;
  const db = await createServerSupabaseClient();
  const { data: project } = await db.from("threads").select("id,title,slug,project_repository").eq("destination", "projects").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!project) notFound();
  const { data: log } = await db.from("project_dev_logs").select("*").eq("project_id", project.id).eq("slug", entrySlug).eq("status", "published").maybeSingle();
  if (!log) notFound();
  const { data: blocks } = await db.from("project_devlog_blocks").select("*").eq("devlog_id", log.id).order("sort_order").order("created_at");
  const hasBlocks = Boolean(blocks?.length);
  return <><SiteHeader revealImmediately activeHref="/projects"/><main className="project-page"><Link className="project-back" href={`/projects/${slug}/devlog`}>← DEV LOG</Link><article className="devlog-detail"><small>{log.entry_date}{log.version ? ` / ${log.version}` : ""}{log.tag ? ` / ${log.tag}` : ""}</small><h1>{log.title}</h1>{log.github_url && <a href={log.github_url} target="_blank" rel="noreferrer">GITHUB REFERENCE ↗</a>}<p>{log.summary}</p>{hasBlocks ? <ProjectBlocks blocks={blocks as ProjectBlock[]} repository={project.project_repository} /> : String(log.content).split(/\r?\n+/).filter(Boolean).map((paragraph: string,index: number) => <p key={index}>{paragraph}</p>)}</article></main></>;
}
