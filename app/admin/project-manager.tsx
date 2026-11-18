"use client";
import { DragEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DevLogEntry,
  Project,
  ProjectBlock,
  ProjectBlockType,
  ProjectVisibility,
} from "@/lib/projects";
import {
  PROJECT_BLOCK_DEFAULTS,
  PROJECT_BLOCK_TYPES,
  PROJECT_CODE_LANGUAGES,
} from "@/lib/projects";
import ProjectCodeEditor from "./project-code-editor";
import ProjectRichTextEditor from "./project-rich-text-editor";
import MediaPositionEditor from "./media-position-editor";
import ProjectBlockEditor, { DEVLOG_BLOCK_TYPES, normalizeProjectBlocks } from "./project-block-editor";

type Form = {
  title: string;
  slug: string;
  description: string;
  version: string;
  domain: string;
  startedOn: string;
  tags: string;
  coverMediaReference: string;
  coverPositionX: number;
  coverPositionY: number;
  repository: string;
  progress: string | number;
  status: ProjectVisibility;
  blocks: ProjectBlock[];
};
type LogForm = {
  id?: string;
  title: string;
  slug: string;
  entryDate: string;
  version: string;
  tag: string;
  summary: string;
  content: string;
  blocks: ProjectBlock[];
  githubUrl: string;
  status: ProjectVisibility;
};
const clamp = (value: unknown) =>
  Math.max(0, Math.min(100, Number(value) || 0));
const blank = (): Form => ({
  title: "",
  slug: "",
  description: "",
  version: "",
  domain: "",
  startedOn: "",
  tags: "",
  coverMediaReference: "",
  coverPositionX: 50,
  coverPositionY: 50,
  repository: "",
  progress: "",
  status: "draft",
  blocks: [],
});
const blankLog = (): LogForm => ({
  title: "",
  slug: "",
  entryDate: new Date().toISOString().slice(0, 10),
  version: "",
  tag: "",
  summary: "",
  content: "",
  blocks: [],
  githubUrl: "",
  status: "draft",
});
const toForm = (p: Project, blocks: ProjectBlock[] = []): Form => ({
  title: p.title,
  slug: p.slug,
  description: p.description,
  version: p.project_version ?? "",
  domain: p.category ?? "",
  startedOn: p.project_started_on ?? "",
  tags: p.tags.join(", "),
  coverMediaReference: p.cover_media_reference ?? "",
  coverPositionX: clamp(p.cover_position_x ?? 50),
  coverPositionY: clamp(p.cover_position_y ?? 50),
  repository: p.project_repository ?? "",
  progress: p.project_progress ?? "",
  status: p.status === "published" ? "published" : "draft",
  blocks,
});
const logForm = (x: DevLogEntry): LogForm => ({
  id: x.id,
  title: x.title,
  slug: x.slug,
  entryDate: x.entry_date,
  version: x.version ?? "",
  tag: x.tag ?? "",
  summary: x.summary,
  content: x.content,
  blocks: x.blocks?.length ? x.blocks : x.content.trim() ? [{ type: "text", sort_order: 0, data: { text: x.content } }] : [],
  githubUrl: x.github_url ?? "",
  status: x.status,
});
const summary = (b: ProjectBlock) =>
  String(
    b.type === "title"
      ? b.data.title
      : b.type === "text"
        ? b.data.text
        : b.type === "code"
          ? b.data.filename || b.data.language
          : b.type === "image"
            ? b.data.alt || b.data.mediaReference
            : b.type === "milestone"
              ? b.data.title
              : b.type === "divider"
                ? b.data.label
                : b.data.repo || "GitHub source" || "Empty block",
  ).slice(0, 70);
function PositionPicker({
  x,
  y,
  onChange,
  label = "FOCAL POSITION",
}: {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  label?: string;
}) {
  const points = [
    ["TOP LEFT", 0, 0],
    ["TOP", 50, 0],
    ["TOP RIGHT", 100, 0],
    ["LEFT", 0, 50],
    ["CENTER", 50, 50],
    ["RIGHT", 100, 50],
    ["BOTTOM LEFT", 0, 100],
    ["BOTTOM", 50, 100],
    ["BOTTOM RIGHT", 100, 100],
  ] as const;
  return (
    <div className="project-position-picker">
      <span>{label}</span>
      <div role="group" aria-label={label}>
        {points.map(([name, nx, ny]) => (
          <button
            type="button"
            key={name}
            className={x === nx && y === ny ? "is-selected" : ""}
            aria-label={name}
            aria-pressed={x === nx && y === ny}
            onClick={() => onChange(nx, ny)}
          />
        ))}
      </div>
      <small>
        {x}% / {y}%
      </small>
    </div>
  );
}
export default function ProjectManager({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects),
    [selected, setSelected] = useState<Project | null>(null),
    [form, setForm] = useState<Form>(blank()),
    [savedForm, setSavedForm] = useState<Form>(blank()),
    [logs, setLogs] = useState<DevLogEntry[]>([]),
    [editingLog, setEditingLog] = useState<LogForm | null>(null),
    [collapsed, setCollapsed] = useState<Set<number>>(new Set()),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [drag, setDrag] = useState<number | null>(null),
    [drop, setDrop] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const lock = useRef(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const normalize = (blocks: ProjectBlock[]) =>
    blocks.map((block, index) => ({ ...block, sort_order: index }));
  const update = (key: keyof Form, value: Form[keyof Form]) =>
    setForm((c) => ({ ...c, [key]: value }));
  const updateData = (index: number, key: string, value: unknown) =>
    setForm((c) => ({
      ...c,
      blocks: c.blocks.map((b, i) =>
        i === index ? { ...b, data: { ...b.data, [key]: value } } : b,
      ),
    }));
  const uploadCover = async (file: File) => {
    setError("");
    const payload = new FormData();
    payload.set("file", file);
    try {
      const r = await fetch("/api/admin/media", {
          method: "POST",
          body: payload,
        }),
        j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url)
        throw new Error(j.error ?? "Cover image could not be uploaded.");
      update("coverMediaReference", j.url);
      setNotice("Cover image uploaded. Save the project to persist it.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Cover image could not be uploaded.",
      );
    }
  };
  const loadProject = async (p: Project) => {
    setSelected(p);
    setForm(toForm(p));
    setSavedForm(toForm(p));
    setLogs([]);
    setError("");
    setNotice("");
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setCollapsed(new Set());
    setEditingLog(null);
    const [response, logResponse] = await Promise.all([
      fetch(`/api/admin/projects?id=${p.id}`),
      fetch(`/api/admin/project-devlogs?projectId=${p.id}`),
    ]);
    const result = await response.json() as { blocks?: ProjectBlock[]; error?: string };
    const logResult = await logResponse.json() as { entries?: DevLogEntry[]; error?: string };
    if (!response.ok || !logResponse.ok || !Array.isArray(result.blocks)) throw new Error(result.error ?? logResult.error ?? "Project could not be loaded. Reopen it before editing.");
    const next = toForm(p, result.blocks);
    setForm(next);
    setSavedForm(next);
    setLogs(logResult.entries ?? []);
  };
  const open = async (p: Project) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try { await loadProject(p); }
    catch (reason) {
      setSelected(null);
      setError(reason instanceof Error ? reason.message : "Project could not be loaded.");
    } finally { lock.current = false; setBusy(false); }
  };
  const create = () => {
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setSelected({ id: "", title: "New project" } as Project);
    setForm(blank());
    setSavedForm(blank());
    setLogs([]);
    setEditingLog(null);
    setCollapsed(new Set());
    setError("");
    setNotice("");
  };
  const add = (type: ProjectBlockType) =>
    setForm((c) => ({
      ...c,
      blocks: normalize([
        ...c.blocks,
        { type, sort_order: c.blocks.length, data: PROJECT_BLOCK_DEFAULTS[type] },
      ]),
    }));
  const reorder = (from: number, to: number) =>
    setForm((c) => {
      if (to < 0 || to >= c.blocks.length) return c;
      const blocks = [...c.blocks],
        [item] = blocks.splice(from, 1);
      blocks.splice(to, 0, item);
      return { ...c, blocks: normalize(blocks) };
    });
  const validate = () => {
    const issues: string[] = [];
    if (!form.title) issues.push("Title");
    if (!form.slug) issues.push("URL slug");
    if (!form.description) issues.push("Description");
    if (!form.version) issues.push("Version");
    if (!form.domain) issues.push("Domain");
    if (!form.startedOn) issues.push("Started date");
    if (!form.tags.trim()) issues.push("Tech stack");
    form.blocks.forEach((b, i) => {
      if (b.type === "code" && !String(b.data.code || "").trim())
        issues.push(`CODE block #${i + 1} has no source code`);
      if (b.type === "image" && !String(b.data.mediaReference || "").trim())
        issues.push(`IMAGE block #${i + 1} has no image`);
    });
    return issues;
  };
  const save = async (status: Form["status"]) => {
    if (lock.current) return;
    const issues = status === "published" ? validate() : [];
    if (issues.length) {
      setError(
        `CANNOT PUBLISH — ${issues.length} REQUIRED ${issues.length === 1 ? "FIELD" : "FIELDS"} MISSING: ${issues.join(" • ")}`,
      );
      return;
    }
    setError("");
    setNotice("");
    lock.current = true;
    setBusy(true);
    try {
    const r = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status,
          id: selected?.id,
          tags: form.tags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          blocks: normalize(form.blocks),
        }),
      }),
      j = await r.json() as { project?: Project; error?: string };
    if (!r.ok || !j.project) {
      setError(j.error ?? "Project could not be saved.");
      return;
    }
    const saved = j.project as Project;
    setSelected(saved);
    setProjects((x) =>
      x.some((i) => i.id === saved.id)
        ? x.map((i) => (i.id === saved.id ? saved : i))
        : [saved, ...x],
    );
    const next = toForm(saved, normalize(form.blocks));
    setForm(next);
    setSavedForm(next);
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setNotice("SAVED");
    router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Project could not be saved.");
    } finally { lock.current = false; setBusy(false); }
  };
  const deleteProject = async () => {
    if (lock.current || !selected?.id || !deleteOpen || deleteConfirmation !== selected.title) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, confirmTitle: deleteConfirmation }),
      });
      const result = await response.json() as { error?: string; id?: string };
      if (!response.ok || result.id !== selected.id) throw new Error(result.error ?? 'Project could not be deleted.');
      const remaining = projects.filter(project => project.id !== selected.id);
      setProjects(remaining);
      create();
      if (remaining[0]) {
        try { await loadProject(remaining[0]); }
        catch { create(); setError('The next project could not be loaded. Reopen it from Projects.'); }
      }
      setNotice('Project deleted, including its development logs.');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Project could not be deleted.');
    } finally { lock.current = false; setBusy(false); }
  };
  const saveLog = async () => {
    if (!selected?.id || !editingLog) return;
    setError("");
    const r = await fetch("/api/admin/project-devlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingLog, blocks: normalizeProjectBlocks(editingLog.blocks), projectId: selected.id }),
      }),
      j = await r.json() as { entry?: DevLogEntry; error?: string };
    if (!r.ok || !j.entry) {
      setError(j.error ?? "Dev log could not be saved.");
      return;
    }
    const entry = j.entry;
    setLogs((x) =>
      x.some((i) => i.id === entry.id)
        ? x.map((i) => (i.id === entry.id ? entry : i))
        : [entry, ...x],
    );
    setEditingLog(null);
    setNotice("Dev log saved successfully.");
    router.refresh();
  };
  const removeLog = async (id: string) => {
    if (!confirm("Delete this dev log?")) return;
    const r = await fetch(`/api/admin/project-devlogs?id=${id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      setError("Dev log could not be deleted.");
      return;
    }
    setLogs((x) => x.filter((i) => i.id !== id));
    setNotice("Dev log deleted.");
    router.refresh();
  };
  const fields = (b: ProjectBlock, i: number) => {
    if (b.type === "text")
      return (
        <ProjectRichTextEditor
          value={b.data.richText as Record<string, unknown> | undefined}
          legacyText={String(b.data.text ?? "")}
          onChange={(richText) => updateData(i, "richText", richText)}
        />
      );
    if (b.type === "image") {
      const x = clamp(b.data.positionX ?? 50),
        y = clamp(b.data.positionY ?? 50);
      return (
        <>
          <label className="project-block-long-field">
            Media reference
            <textarea
              rows={2}
              value={String(b.data.mediaReference ?? "")}
              onChange={(e) => updateData(i, "mediaReference", e.target.value)}
            />
          </label>
          <label className="project-block-long-field">
            Alt text
            <textarea
              rows={2}
              value={String(b.data.alt ?? "")}
              onChange={(e) => updateData(i, "alt", e.target.value)}
            />
          </label>
          <label className="project-block-long-field">
            Caption
            <textarea
              rows={3}
              value={String(b.data.caption ?? "")}
              onChange={(e) => updateData(i, "caption", e.target.value)}
            />
          </label>
          <label>
            Image fit
            <select
              value={String(b.data.fit ?? "contain")}
              onChange={(e) => updateData(i, "fit", e.target.value)}
            >
              <option value="contain">Original / auto</option>
              <option value="cover">Cover</option>
            </select>
          </label>
          <PositionPicker
            x={x}
            y={y}
            onChange={(nx, ny) => {
              updateData(i, "positionX", nx);
              updateData(i, "positionY", ny);
            }}
          />
        </>
      );
    }
    if (b.type === "code") {
      return (
        <div className="project-code-fields">
          <div className="project-code-metadata">
            <label>
              Language
              <select
                value={String(b.data.language ?? "other")}
                onChange={(e) => updateData(i, "language", e.target.value)}
              >
                {PROJECT_CODE_LANGUAGES.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
            <label>
              Filename
              <input
                value={String(b.data.filename ?? "")}
                onChange={(e) => updateData(i, "filename", e.target.value)}
              />
            </label>
          </div>
          <label className="project-admin-code">
            Code
            <ProjectCodeEditor
              value={String(b.data.code ?? "")}
              language={String(b.data.language ?? "other")}
              onChange={(next) => updateData(i, "code", next)}
            />
          </label>
          <label className="project-block-long-field">
            Caption
            <textarea
              rows={3}
              value={String(b.data.caption ?? "")}
              onChange={(e) => updateData(i, "caption", e.target.value)}
            />
          </label>
          <label className="project-admin-toggle">
            <input
              type="checkbox"
              checked={b.data.lineNumbers === true}
              onChange={(e) => updateData(i, "lineNumbers", e.target.checked)}
            />{" "}
            Line numbers
          </label>
        </div>
      );
    }
    return Object.entries(b.data).map(([key, value]) =>
      key === "language" ? (
        <label key={key}>
          Language
          <select
            value={String(value)}
            onChange={(e) => updateData(i, key, e.target.value)}
          >
            {PROJECT_CODE_LANGUAGES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      ) : key === "size" ? (
        <label key={key}>
          Title size
          <select
            value={String(value)}
            onChange={(e) => updateData(i, key, e.target.value)}
          >
            <option value="large">Large / H2</option>
            <option value="medium">Medium / H3</option>
            <option value="small">Small / H4</option>
          </select>
        </label>
      ) : key === "lineNumbers" ? (
        <label className="project-admin-toggle" key={key}>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => updateData(i, key, e.target.checked)}
          />{" "}
          Line numbers
        </label>
      ) : (
        <label
          className={
            ["text", "content", "description", "caption", "path"].includes(
              key,
            )
              ? "project-block-long-field"
              : "project-block-metadata-field"
          }
          key={key}
        >
          {key}
          <textarea
            rows={key === "content" ? 8 : 1}
            value={String(value)}
            onChange={(e) => updateData(i, key, e.target.value)}
          />
        </label>
      ),
    );
  };
  return (
    <div className="project-admin-shell">
      <nav
        className="journey-admin-toolbar project-admin-switcher"
        aria-label="Threads sections"
      >
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-journey"))}
        >
          Journey
        </button>
        <button type="button" aria-current="page">
          Projects
        </button>
      </nav>
      <fieldset className="project-admin admin-editor-fieldset" disabled={busy} aria-busy={busy}>
        {!selected ? (
          <section className="project-admin-overview admin-window-view">
            <header>
              <small>PROJECT WORKSPACE</small>
              <h2>PROJECTS</h2>
              <button type="button" onClick={create}>
                + NEW PROJECT
              </button>
            </header>
            <p role="alert">{error}</p>
            <div className="project-admin-projects">
              {projects.map((p) => (
                <button
                  type="button"
                  className="project-admin-card"
                  key={p.id}
                  onClick={() => void open(p)}
                >
                  <small className="project-admin-card-status">
                    {p.status.toUpperCase()} / {p.project_version ?? "NO VERSION"}
                  </small>
                  {p.cover_media_reference ? (
                    <img
                      className="project-admin-card-media"
                      src={p.cover_media_reference}
                      alt=""
                      style={{
                        objectPosition: `${clamp(p.cover_position_x ?? 50)}% ${clamp(p.cover_position_y ?? 50)}%`,
                      }}
                    />
                  ) : (
                    <span className="project-admin-fallback project-admin-card-media">
                      PROJECT / {p.category || "OTHER"}
                    </span>
                  )}
                  <span className="project-admin-card-copy">
                    <strong>{p.title}</strong>
                    <span className="project-admin-card-domain">
                      {p.category || "OTHER"}
                    </span>
                    <span className="project-admin-card-description">
                      {p.description || "No project description yet."}
                    </span>
                    <span className="project-admin-card-action">OPEN / EDIT ↗</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="project-admin-editor admin-window-view">
            <header>
              <small>PROJECT / {selected.title}</small>
              <h2>PROJECT BUILDER</h2>
              <button type="button" onClick={() => setSelected(null)}>
                ← PROJECTS
              </button>
            </header>
            <fieldset className="project-admin-essentials">
              <legend>PROJECT ESSENTIALS</legend>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </label>
              <label>
                Version
                <input
                  value={form.version}
                  onChange={(e) => update("version", e.target.value)}
                />
              </label>
              <label>
                Domain
                <input
                  value={form.domain}
                  onChange={(e) => update("domain", e.target.value)}
                />
              </label>
              <label>
                Started
                <input
                  type="date"
                  value={form.startedOn}
                  onChange={(e) => update("startedOn", e.target.value)}
                />
              </label>
              <label>
                Stack
                <input
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                />
              </label>
              <section className="project-cover-picker">
                <MediaPositionEditor
                  src={form.coverMediaReference}
                  x={form.coverPositionX}
                  y={form.coverPositionY}
                  label="COVER FOCAL POSITION"
                  onChange={(x, y) => { update("coverPositionX", x); update("coverPositionY", y); }}
                  onUpload={uploadCover}
                  onRemove={() => update("coverMediaReference", "")}
                />
              </section>
              <label>
                Repository
                <input
                  value={form.repository}
                  onChange={(e) => update("repository", e.target.value)}
                />
              </label>
              <label>
                Progress
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) => update("progress", e.target.value)}
                />
              </label>
              <label>
                Visibility
                <select
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as Form["status"])
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </fieldset>
            <div className="project-admin-toolbar">
              {PROJECT_BLOCK_TYPES.map((type) => (
                <button type="button" key={type} onClick={() => add(type)}>
                  + {type.replace("_", " ").toUpperCase()}
                </button>
              ))}
              <button type="button" disabled>
                VIDEO — COMING SOON
              </button>
            </div>
            <section
              className="project-admin-blocks"
              aria-label="Article blocks"
            >
              {form.blocks.map((block, index) => {
                const closed = collapsed.has(index);
                return (
                  <article
                    key={`${block.id ?? block.type}-${index}`}
                    onDragOver={(e: DragEvent) => {
                      e.preventDefault();
                      setDrop(index);
                    }}
                    onDrop={() => {
                      if (drag !== null) reorder(drag, index);
                      setDrag(null);
                      setDrop(null);
                    }}
                    className={`${drop === index && drag !== index ? "is-drop-target " : ""}${closed ? "is-collapsed" : ""}`}
                  >
                    <header>
                      <span
                        draggable
                        onDragStart={() => setDrag(index)}
                        aria-label="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <small>
                        BLOCK / {block.type.replace("_", " ").toUpperCase()}
                      </small>
                      <strong>{summary(block)}</strong>
                      <button
                        className="project-block-collapse"
                        type="button"
                        aria-expanded={!closed}
                        onClick={() =>
                          setCollapsed((c) => {
                            const n = new Set(c);
                            if (n.has(index)) n.delete(index);
                            else n.add(index);
                            return n;
                          })
                        }
                      >
                        {closed ? "+" : "−"}
                      </button>
                    </header>
                    <div className="project-block-body">
                      <div>{fields(block, index)}</div>
                    </div>
                    <footer>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            blocks: normalize([
                              ...c.blocks.slice(0, index + 1),
                              {
                                ...block,
                                id: undefined,
                                data: { ...block.data },
                              },
                              ...c.blocks.slice(index + 1),
                            ]),
                          }))
                        }
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(index, index - 1)}
                      >
                        ↑ Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(index, index + 1)}
                      >
                        ↓ Move down
                      </button>
                      <button
                        className="project-delete"
                        type="button"
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            blocks: normalize(
                              c.blocks.filter((_, i) => i !== index),
                            ),
                          }))
                        }
                      >
                        Delete
                      </button>
                    </footer>
                  </article>
                );
              })}
            </section>
            <section className="project-admin-devlogs">
              <header>
                <small>DEVELOPMENT LOG</small>
                <h3>Chronological project notes</h3>
                <button
                  type="button"
                  disabled={!selected.id}
                  onClick={() => setEditingLog(blankLog())}
                >
                  + NEW DEV LOG
                </button>
              </header>
              {!selected.id && (
                <p>Save the project before adding development logs.</p>
              )}
              {logs.map((log) => (
                <article key={log.id}>
                  <small>
                    {log.entry_date}
                    {log.version ? ` / ${log.version}` : ""}
                    {log.tag ? ` / ${log.tag}` : ""}
                  </small>
                  <div>
                    <h4>{log.title}</h4>
                    <p>{log.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLog(logForm(log))}
                  >
                    EDIT
                  </button>
                  <button
                    className="project-delete"
                    type="button"
                    onClick={() => void removeLog(log.id)}
                  >
                    DELETE
                  </button>
                </article>
              ))}
              {editingLog && (
                <div className="project-admin-log-form">
                  <label>
                    Title
                    <input
                      value={editingLog.title}
                      onChange={(e) =>
                        setEditingLog({ ...editingLog, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Slug
                    <input
                      value={editingLog.slug}
                      onChange={(e) =>
                        setEditingLog({ ...editingLog, slug: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={editingLog.entryDate}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          entryDate: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Version
                    <input
                      value={editingLog.version}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          version: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Status / tag
                    <input
                      value={editingLog.tag}
                      onChange={(e) =>
                        setEditingLog({ ...editingLog, tag: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Visibility
                    <select
                      value={editingLog.status}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          status: e.target.value as LogForm["status"],
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className="wide">
                    Summary
                    <textarea
                      value={editingLog.summary}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          summary: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="wide">
                    GitHub reference URL
                    <input
                      value={editingLog.githubUrl}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          githubUrl: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="wide project-admin-log-blocks"><strong>DEV LOG CONTENT</strong><ProjectBlockEditor ariaLabel="Dev log content blocks" blocks={editingLog.blocks} types={DEVLOG_BLOCK_TYPES} onChange={(blocks)=>setEditingLog({...editingLog,blocks})}/></div>
                  <div>
                    <button type="button" onClick={() => void saveLog()}>
                      SAVE DEV LOG
                    </button>
                    <button type="button" onClick={() => setEditingLog(null)}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </section>
            {selected.id && <section className="project-admin-danger" aria-labelledby="project-delete-title">
              <h3 id="project-delete-title">Delete Project</h3>
              {!deleteOpen ? <button type="button" className="project-delete" onClick={() => { setDeleteOpen(true); setDeleteConfirmation(''); }}>Delete Project</button> : <>
                <p id="project-delete-description">Permanently delete <strong>{selected.title}</strong>, its content blocks and all development logs. This cannot be undone.{dirty ? ' Unsaved edits will also be discarded.' : ''}</p>
                <label>Type the saved project title to confirm
                  <input autoFocus autoComplete="off" aria-describedby="project-delete-description" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} />
                </label>
                <div className="project-admin-danger-actions">
                  <button type="button" onClick={() => { setDeleteOpen(false); setDeleteConfirmation(''); }}>Cancel</button>
                  <button type="button" className="project-delete" disabled={deleteConfirmation !== selected.title} onClick={() => void deleteProject()}>Permanently delete project</button>
                </div>
              </>}
            </section>}
            <div className="project-admin-save">
              <div>
                <p role="alert">{error}</p>
                <p role="status">{notice}</p>
              </div>
              <div className="project-admin-save-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      JSON.stringify(form) !== JSON.stringify(savedForm) &&
                      confirm("Discard unsaved changes?")
                    )
                      setForm(savedForm);
                  }}
                >
                  RESET CHANGES
                </button>
                <button type="button" onClick={() => void save(form.status)}>
                  {savedForm.status !== "published" && form.status === "published"
                    ? "PUBLISH PROJECT"
                    : "SAVE PROJECT"}
                </button>
              </div>
            </div>
          </section>
        )}
      </fieldset>
    </div>
  );
}
