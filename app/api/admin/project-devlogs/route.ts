import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin, sameOrigin } from "@/lib/admin-auth";
import { readJsonObject } from "@/lib/http";
import { validProjectBlocks } from "@/lib/projects";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value: unknown, max = 30000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const json = (data: unknown, status = 200) => NextResponse.json(data, status === 200 ? undefined : { status });

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ("error" in auth) return json({ error: auth.error }, auth.status);
  const projectId = request.nextUrl.searchParams.get("projectId") ?? "";
  if (!UUID.test(projectId)) return json({ error: "Invalid project." }, 400);
  const { data, error } = await auth.supabase.from("project_dev_logs").select("*").eq("project_id", projectId).order("entry_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) return json({ error: "Dev logs could not be loaded." }, 400);
  const ids = (data ?? []).map((entry) => entry.id);
  const result = ids.length ? await auth.supabase.from("project_devlog_blocks").select("*").in("devlog_id", ids).order("sort_order") : { data: [], error: null };
  if (result.error) return json({ error: "Dev log blocks could not be loaded. Apply the latest database migration." }, 400);
  return json({ entries: (data ?? []).map((entry) => ({ ...entry, blocks: (result.data ?? []).filter((block) => block.devlog_id === entry.id) })) });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const auth = await authorizeAdmin();
  if ("error" in auth) return json({ error: auth.error }, auth.status);
  let body: Record<string, unknown>;
  try { body = await readJsonObject(request); } catch { return json({ error: "Invalid dev log." }, 400); }
  const id = text(body.id), projectId = text(body.projectId), slug = text(body.slug, 120), title = text(body.title, 180), entryDate = text(body.entryDate, 10), status = text(body.status), githubUrl = text(body.githubUrl, 2000);
  if ((id && !UUID.test(id)) || !UUID.test(projectId) || !SLUG.test(slug) || !title || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) || !["draft", "published"].includes(status) || (githubUrl && !/^https:\/\//.test(githubUrl)) || !validProjectBlocks(body.blocks)) return json({ error: "Check the dev log details and content blocks." }, 400);
  const record = { project_id: projectId, slug, title, entry_date: entryDate, version: text(body.version, 80) || null, tag: text(body.tag, 80) || null, summary: text(body.summary, 1000), content: text(body.content), github_url: githubUrl || null, media: [], code: [], status };
  const query = id ? auth.supabase.from("project_dev_logs").update(record).eq("id", id) : auth.supabase.from("project_dev_logs").insert(record);
  const { data, error } = await query.select().single();
  if (error) return json({ error: error.code === "23505" ? "That log slug is already in use." : "The dev log could not be saved." }, 400);
  const { error: deleteError } = await auth.supabase.from("project_devlog_blocks").delete().eq("devlog_id", data.id);
  if (deleteError) return json({ error: "The dev log was saved, but its content blocks could not be updated." }, 400);
  const blocks = body.blocks as { type: string; sort_order: number; data: Record<string, unknown> }[];
  if (blocks.length) { const { error: insertError } = await auth.supabase.from("project_devlog_blocks").insert(blocks.map((block) => ({ devlog_id: data.id, type: block.type, sort_order: block.sort_order, data: block.data }))); if (insertError) return json({ error: "The dev log was saved, but its content blocks could not be updated." }, 400); }
  const { data: project } = await auth.supabase.from("threads").select("slug").eq("id", projectId).maybeSingle();
  if (project) { revalidatePath(`/projects/${project.slug}`); revalidatePath(`/projects/${project.slug}/devlog`); revalidatePath(`/projects/${project.slug}/devlog/${slug}`); }
  return json({ ok: true, entry: { ...data, blocks } });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const auth = await authorizeAdmin();
  if ("error" in auth) return json({ error: auth.error }, auth.status);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return json({ error: "Invalid dev log." }, 400);
  const { data: entry } = await auth.supabase.from("project_dev_logs").select("project_id,slug").eq("id", id).maybeSingle();
  const { error } = await auth.supabase.from("project_dev_logs").delete().eq("id", id);
  if (error) return json({ error: "The dev log could not be deleted." }, 400);
  if (entry) { const { data: project } = await auth.supabase.from("threads").select("slug").eq("id", entry.project_id).maybeSingle(); if (project) { revalidatePath(`/projects/${project.slug}`); revalidatePath(`/projects/${project.slug}/devlog`); revalidatePath(`/projects/${project.slug}/devlog/${entry.slug}`); } }
  return json({ ok: true });
}
