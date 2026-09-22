import { safeReference } from './content';

export const PROJECT_BLOCK_TYPES = ['title','text','code','image','milestone','divider','github_code','github_activity'] as const;
export type ProjectBlockType = typeof PROJECT_BLOCK_TYPES[number];
export type ProjectBlock = { id?:string; project_id?:string; type:ProjectBlockType; sort_order:number; data:Record<string, unknown>; created_at?:string };
export type DevLogEntry = { id:string; project_id:string; title:string; slug:string; entry_date:string; version:string|null; tag:string|null; summary:string; content:string; github_url:string|null; media:Record<string,unknown>[]; code:Record<string,unknown>[]; blocks?:ProjectBlock[]; status:'draft'|'published'; created_at:string; updated_at:string };
export type Project = { id:string; title:string; slug:string; category:string; description:string; cover_media_reference:string|null; cover_position_x:number; cover_position_y:number; tags:string[]; status:'draft'|'published'|'archived'; featured:boolean; sort_order:number; updated_at:string; created_at?:string; project_version:string|null; project_started_on:string|null; project_progress:number|null; project_repository:string|null; project_license:string|null; project_milestone:string|null; project_team:string|null; github_url:string|null; live_url:string|null };

const text = (value:unknown, max=12000) => typeof value==='string' ? value.trim().slice(0,max) : '';
export function validProjectBlocks(value: unknown): value is ProjectBlock[] {
  return Array.isArray(value) && value.length <= 80 && value.every((block,index) => {
    if (!block || typeof block !== 'object') return false;
    const item=block as Record<string,unknown>;
    if (!PROJECT_BLOCK_TYPES.includes(item.type as ProjectBlockType) || !Number.isInteger(item.sort_order) || item.sort_order!==index || !item.data || typeof item.data!=='object' || Array.isArray(item.data)) return false;
    const data=item.data as Record<string,unknown>;
    if (item.type==='image') return Boolean(safeReference(text(data.mediaReference,2000))) && text(data.alt,300)<=300;
    if (item.type==='code') return text(data.code,50000).length>0 && text(data.language,30).length>0;
    if (item.type==='github_code') return /^[\w.-]+\/[\w.-]+$/.test(text(data.repo,200)) && text(data.path,500).length>0;
    if (item.type==='github_activity') return /^[\w.-]+\/[\w.-]+$/.test(text(data.repo,200));
    return true;
  });
}
