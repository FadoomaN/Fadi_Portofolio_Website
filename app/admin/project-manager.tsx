"use client";
import { ChangeEvent, DragEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DevLogEntry,
  Project,
  ProjectBlock,
  ProjectBlockType,
} from "@/lib/projects";
import { PROJECT_BLOCK_TYPES } from "@/lib/projects";
import ProjectCodeEditor from "./project-code-editor";
import ProjectRichTextEditor from "./project-rich-text-editor";
import ProjectBlockEditor, {
  DEVLOG_BLOCK_TYPES,
} from "./project-block-editor";

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
  status: "draft" | "published";
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
  status: "draft" | "published";
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
const defaults: Record<ProjectBlockType, Record<string, unknown>> = {
  title: { title: "Section title", subtitle: "", size: "large" },
  text: {
    text: "",
    richText: { type: "doc", content: [{ type: "paragraph" }] },
  },
  code: {
    language: "cpp",
    filename: "",
    code: "",
    caption: "",
    lineNumbers: false,
  },
  image: {
    mediaReference: "",
    alt: "",
    caption: "",
    positionX: 50,
    positionY: 50,
    fit: "contain",
  },
  milestone: { title: "", description: "", status: "PLANNED", targetDate: "" },
  divider: { label: "" },
  github_code: {
    repo: "",
    path: "",
    ref: "main",
    startLine: 1,
    endLine: 100,
    language: "cpp",
    lineNumbers: false,
  },
  github_activity: { repo: "" },
};
const langs = [
  "c",
  "cpp",
  "csharp",
  "java",
  "javascript",
  "typescript",
  "python",
  "sql",
  "bash",
  "json",
  "html",
  "css",
  "rust",
  "go",
  "other",
];
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
  blocks:
    x.blocks?.length
      ? x.blocks
      : x.content.trim()
        ? [
            {
              type: "text",
              sort_order: 0,
              data: { text: x.content },
            },
          ]
        : [],
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
  const uploadCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    } finally {
      e.target.value = "";
    }
  };
  const loadLogs = async (id: string) => {
    const r = await fetch(`/api/admin/project-devlogs?projectId=${id}`),
      j = await r.json();
    if (r.ok) setLogs(j.entries ?? []);
  };
  const open = async (p: Project) => {
    setSelected(p);
    setError("");
    setNotice("");
    setCollapsed(new Set());
    setEditingLog(null);
    const [r] = await Promise.all([
        fetch(`/api/admin/projects?id=${p.id}`),
        loadLogs(p.id),
      ]),
      j = await r.json(),
      next = toForm(p, r.ok ? j.blocks : []);
    if (!r.ok) setError(j.error ?? "Project blocks could not be loaded.");
    setForm(next);
    setSavedForm(next);
  };
  const create = () => {
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
        { type, sort_order: c.blocks.length, data: defaults[type] },
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
    const issues = status === "published" ? validate() : [];
    if (issues.length) {
      setError(
        `CANNOT PUBLISH — ${issues.length} REQUIRED ${issues.length === 1 ? "FIELD" : "FIELDS"} MISSING: ${issues.join(" • ")}`,
      );
      return;
    }
    setError("");
    setNotice("");
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
      j = await r.json();
    if (!r.ok) {
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
    setSavedForm({ ...form, status });
    setNotice("SAVED");
    router.refresh();
  };
  const saveLog = async () => {
    if (!selected?.id || !editingLog) return;
    setError("");
    const r = await fetch("/api/admin/project-devlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingLog, projectId: selected.id }),
      }),
      j = await r.json();
    if (!r.ok) {
      setError(j.error ?? "Dev log could not be saved.");
      return;
    }
    setLogs((x) =>
      x.some((i) => i.id === j.entry.id)
        ? x.map((i) => (i.id === j.entry.id ? j.entry : i))
        : [j.entry, ...x],
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
                {langs.map((language) => (
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
            {langs.map((x) => (
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
      <div className="project-admin">
        {!selected ? (
          <section className="project-admin-overview admin-window-view">
            <header>
              <small>PROJECT WORKSPACE</small>
              <h2>PROJECTS</h2>
              <button type="button" onClick={create}>
                + NEW PROJECT
              </button>
            </header>
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
                <span>COVER IMAGE</span>
                {form.coverMediaReference ? (
                  <img
                    src={form.coverMediaReference}
                    alt="Cover preview"
                    style={{
                      objectPosition: `${form.coverPositionX}% ${form.coverPositionY}%`,
                    }}
                  />
                ) : (
                  <div className="project-cover-picker-empty">
                    NO IMAGE SELECTED
                  </div>
                )}
                <label className="admin-upload-button">
                  {form.coverMediaReference ? "CHANGE IMAGE" : "CHOOSE IMAGE"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadCover}
                  />
                </label>
                {form.coverMediaReference && (
                  <button
                    type="button"
                    onClick={() => update("coverMediaReference", "")}
                  >
                    REMOVE IMAGE
                  </button>
                )}
                <PositionPicker
                  label="COVER FOCAL POSITION"
                  x={form.coverPositionX}
                  y={form.coverPositionY}
                  onChange={(x, y) => {
                    update("coverPositionX", x);
                    update("coverPositionY", y);
                  }}
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
            <ProjectBlockEditor
              blocks={form.blocks}
              types={PROJECT_BLOCK_TYPES}
              onChange={(blocks) => setForm((current) => ({ ...current, blocks }))}
            />
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
                  <div className="wide project-admin-log-blocks">
                    <strong>DEV LOG CONTENT</strong>
                    <ProjectBlockEditor
                      ariaLabel="Dev log content blocks"
                      blocks={editingLog.blocks}
                      types={DEVLOG_BLOCK_TYPES}
                      onChange={(blocks) =>
                        setEditingLog({ ...editingLog, blocks })
                      }
                    />
                  </div>
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
                  {savedForm.status !== "published" &&
                  form.status === "published"
                    ? "PUBLISH PROJECT"
                    : "SAVE PROJECT"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
