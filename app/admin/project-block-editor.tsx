"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import type { ProjectBlock, ProjectBlockType } from "@/lib/projects";
import ProjectCodeEditor from "./project-code-editor";
import ProjectRichTextEditor from "./project-rich-text-editor";

export const DEVLOG_BLOCK_TYPES: readonly ProjectBlockType[] = [
  "title", "text", "code", "image", "divider", "github_code", "github_activity",
];

const defaults: Record<ProjectBlockType, Record<string, unknown>> = {
  title: { title: "Section title", subtitle: "", size: "large" },
  text: { text: "", richText: { type: "doc", content: [{ type: "paragraph" }] } },
  code: { language: "cpp", filename: "", code: "", caption: "", lineNumbers: false },
  image: { mediaReference: "", alt: "", caption: "", positionX: 50, positionY: 50, fit: "contain" },
  milestone: { title: "", description: "", status: "PLANNED", targetDate: "" },
  divider: { label: "" },
  github_code: { repo: "", path: "", ref: "main", startLine: 1, endLine: 100, language: "cpp", lineNumbers: false },
  github_activity: { repo: "" },
};
const langs = ["c", "cpp", "csharp", "java", "javascript", "typescript", "python", "sql", "bash", "json", "html", "css", "rust", "go", "other"];
const clamp = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));
export const normalizeProjectBlocks = (blocks: ProjectBlock[]) => blocks.map((block, index) => ({ ...block, sort_order: index }));
const blockSummary = (b: ProjectBlock) => String(b.type === "title" ? b.data.title : b.type === "text" ? b.data.text : b.type === "code" ? b.data.filename || b.data.language : b.type === "image" ? b.data.alt || b.data.mediaReference : b.type === "milestone" ? b.data.title : b.type === "divider" ? b.data.label : b.data.repo || "Empty block").slice(0, 70);

export function ProjectPositionPicker({ x, y, onChange, label = "FOCAL POSITION" }: { x: number; y: number; onChange: (x: number, y: number) => void; label?: string }) {
  const points = [["TOP LEFT",0,0],["TOP",50,0],["TOP RIGHT",100,0],["LEFT",0,50],["CENTER",50,50],["RIGHT",100,50],["BOTTOM LEFT",0,100],["BOTTOM",50,100],["BOTTOM RIGHT",100,100]] as const;
  return <div className="project-position-picker"><span>{label}</span><div role="group" aria-label={label}>{points.map(([name,nx,ny]) => <button type="button" key={name} className={x === nx && y === ny ? "is-selected" : ""} aria-label={name} aria-pressed={x === nx && y === ny} onClick={() => onChange(nx,ny)} />)}</div><small>{x}% / {y}%</small></div>;
}

export default function ProjectBlockEditor({ blocks, onChange, types, ariaLabel = "Article blocks" }: { blocks: ProjectBlock[]; onChange: (blocks: ProjectBlock[]) => void; types: readonly ProjectBlockType[]; ariaLabel?: string }) {
  const [collapsed,setCollapsed] = useState<Set<number>>(new Set());
  const [drag,setDrag] = useState<number|null>(null);
  const [drop,setDrop] = useState<number|null>(null);
  const updateData = (i:number,key:string,value:unknown) => onChange(blocks.map((b,index) => index === i ? {...b,data:{...b.data,[key]:value}} : b));
  const reorder = (from:number,to:number) => { if(to<0 || to>=blocks.length)return; const next=[...blocks]; const [item]=next.splice(from,1); next.splice(to,0,item); onChange(normalizeProjectBlocks(next)); };
  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, index:number) => { const file=event.target.files?.[0]; if(!file)return; const payload=new FormData(); payload.set("file",file); const response=await fetch("/api/admin/media",{method:"POST",body:payload}); const result=await response.json(); if(response.ok && result.url) updateData(index,"mediaReference",result.url); event.target.value=""; };
  const fields = (b:ProjectBlock,i:number) => {
    if(b.type === "text") return <ProjectRichTextEditor value={b.data.richText as Record<string,unknown>|undefined} legacyText={String(b.data.text??"")} onChange={(value)=>updateData(i,"richText",value)} />;
    if(b.type === "image") { const x=clamp(b.data.positionX??50),y=clamp(b.data.positionY??50); return <><label className="admin-upload-button">UPLOAD IMAGE<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>void uploadImage(e,i)} /></label><label className="project-block-long-field">Media reference<textarea rows={2} value={String(b.data.mediaReference??"")} onChange={(e)=>updateData(i,"mediaReference",e.target.value)} /></label><label className="project-block-long-field">Alt text<textarea rows={2} value={String(b.data.alt??"")} onChange={(e)=>updateData(i,"alt",e.target.value)} /></label><label className="project-block-long-field">Caption<textarea rows={3} value={String(b.data.caption??"")} onChange={(e)=>updateData(i,"caption",e.target.value)} /></label><label>Image fit<select value={String(b.data.fit??"contain")} onChange={(e)=>updateData(i,"fit",e.target.value)}><option value="contain">Original / auto</option><option value="cover">Cover</option></select></label><ProjectPositionPicker x={x} y={y} onChange={(nx,ny)=>{updateData(i,"positionX",nx);updateData(i,"positionY",ny);}} /></> }
    if(b.type === "code") return <div className="project-code-fields"><div className="project-code-metadata"><label>Language<select value={String(b.data.language??"other")} onChange={(e)=>updateData(i,"language",e.target.value)}>{langs.map(x=><option key={x}>{x}</option>)}</select></label><label>Filename<input value={String(b.data.filename??"")} onChange={(e)=>updateData(i,"filename",e.target.value)} /></label></div><label className="project-admin-code">Code<ProjectCodeEditor value={String(b.data.code??"")} language={String(b.data.language??"other")} onChange={(value)=>updateData(i,"code",value)} /></label><label className="project-block-long-field">Caption<textarea rows={3} value={String(b.data.caption??"")} onChange={(e)=>updateData(i,"caption",e.target.value)} /></label><label className="project-admin-toggle"><input type="checkbox" checked={b.data.lineNumbers===true} onChange={(e)=>updateData(i,"lineNumbers",e.target.checked)} /> Line numbers</label></div>;
    return Object.entries(b.data).map(([key,value]) => key === "language" ? <label key={key}>Language<select value={String(value)} onChange={(e)=>updateData(i,key,e.target.value)}>{langs.map(x=><option key={x}>{x}</option>)}</select></label> : key === "size" ? <label key={key}>Title size<select value={String(value)} onChange={(e)=>updateData(i,key,e.target.value)}><option value="large">Large / H2</option><option value="medium">Medium / H3</option><option value="small">Small / H4</option></select></label> : key === "lineNumbers" ? <label className="project-admin-toggle" key={key}><input type="checkbox" checked={value===true} onChange={(e)=>updateData(i,key,e.target.checked)} /> Line numbers</label> : <label className={["text","content","description","caption","path"].includes(key)?"project-block-long-field":"project-block-metadata-field"} key={key}>{key}<textarea rows={key==="content"?8:1} value={String(value)} onChange={(e)=>updateData(i,key,e.target.value)} /></label>);
  };
  return <><div className="project-admin-toolbar">{types.map(type=><button type="button" key={type} onClick={()=>onChange(normalizeProjectBlocks([...blocks,{type,sort_order:blocks.length,data:{...defaults[type]}}]))}>+ {type.replace("_"," ").toUpperCase()}</button>)}<button type="button" disabled>VIDEO — COMING SOON</button></div><section className="project-admin-blocks" aria-label={ariaLabel}>{blocks.map((block,index)=>{const closed=collapsed.has(index);return <article key={`${block.id??block.type}-${index}`} onDragOver={(e:DragEvent)=>{e.preventDefault();setDrop(index)}} onDrop={()=>{if(drag!==null)reorder(drag,index);setDrag(null);setDrop(null)}} className={`${drop===index&&drag!==index?"is-drop-target ":""}${closed?"is-collapsed":""}`}><header><span draggable onDragStart={()=>setDrag(index)} aria-label="Drag to reorder">⋮⋮</span><small>BLOCK / {block.type.replace("_"," ").toUpperCase()}</small><strong>{blockSummary(block)}</strong><button className="project-block-collapse" type="button" aria-expanded={!closed} onClick={()=>setCollapsed(current=>{const next=new Set(current);next.has(index)?next.delete(index):next.add(index);return next})}>{closed?"+":"−"}</button></header><div className="project-block-body"><div>{fields(block,index)}</div></div><footer><button type="button" onClick={()=>onChange(normalizeProjectBlocks([...blocks.slice(0,index+1),{...block,id:undefined,data:{...block.data}},...blocks.slice(index+1)]))}>Duplicate</button><button type="button" onClick={()=>reorder(index,index-1)}>↑ Move up</button><button type="button" onClick={()=>reorder(index,index+1)}>↓ Move down</button><button className="project-delete" type="button" onClick={()=>onChange(normalizeProjectBlocks(blocks.filter((_,i)=>i!==index)))}>Delete</button></footer></article>})}</section></>;
}
