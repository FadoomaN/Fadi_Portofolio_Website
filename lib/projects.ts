import { safeReference } from './content';

export const PROJECT_BLOCK_TYPES = [
  'title',
  'text',
  'code',
  'image',
  'milestone',
  'divider',
  'github_code',
  'github_activity',
] as const;

export const PROJECT_CODE_LANGUAGES = [
  'c',
  'cpp',
  'csharp',
  'java',
  'javascript',
  'typescript',
  'python',
  'sql',
  'bash',
  'json',
  'html',
  'css',
  'rust',
  'go',
  'other',
] as const;

export type ProjectBlockType = (typeof PROJECT_BLOCK_TYPES)[number];
export type ProjectStatus = 'draft' | 'published' | 'archived';
export type ProjectVisibility = Exclude<ProjectStatus, 'archived'>;
export type ImageFit = 'contain' | 'cover';

export const PROJECT_BLOCK_DEFAULTS: Record<ProjectBlockType, Record<string, unknown>> = {
  title: { title: 'Section title', subtitle: '', size: 'large' },
  text: {
    text: '',
    richText: { type: 'doc', content: [{ type: 'paragraph' }] },
  },
  code: {
    language: 'cpp',
    filename: '',
    code: '',
    caption: '',
    lineNumbers: false,
  },
  image: {
    mediaReference: '',
    alt: '',
    caption: '',
    positionX: 50,
    positionY: 50,
    fit: 'contain' satisfies ImageFit,
  },
  milestone: { title: '', description: '', status: 'PLANNED', targetDate: '' },
  divider: { label: '' },
  github_code: {
    repo: '',
    path: '',
    ref: 'main',
    startLine: 1,
    endLine: 100,
    language: 'cpp',
    lineNumbers: false,
  },
  github_activity: { repo: '' },
};

export type ProjectBlock = {
  id?: string;
  project_id?: string;
  type: ProjectBlockType;
  sort_order: number;
  data: Record<string, unknown>;
  created_at?: string;
};

export type DevLogEntry = {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  entry_date: string;
  version: string | null;
  tag: string | null;
  summary: string;
  content: string;
  github_url: string | null;
  media: Record<string, unknown>[];
  code: Record<string, unknown>[];
  blocks?: ProjectBlock[];
  status: ProjectVisibility;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  cover_media_reference: string | null;
  cover_position_x: number;
  cover_position_y: number;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
  sort_order: number;
  updated_at: string;
  created_at?: string;
  project_version: string | null;
  project_started_on: string | null;
  project_progress: number | null;
  project_repository: string | null;
  project_license: string | null;
  project_milestone: string | null;
  project_team: string | null;
  github_url: string | null;
  live_url: string | null;
};

function readText(value: unknown, maxLength = 12_000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function validProjectBlocks(value: unknown): value is ProjectBlock[] {
  return Array.isArray(value) && value.length <= 80 && value.every((block, index) => {
    if (!block || typeof block !== 'object') return false;

    const candidate = block as Record<string, unknown>;
    if (
      !PROJECT_BLOCK_TYPES.includes(candidate.type as ProjectBlockType)
      || !Number.isInteger(candidate.sort_order)
      || candidate.sort_order !== index
      || !candidate.data
      || typeof candidate.data !== 'object'
      || Array.isArray(candidate.data)
    ) {
      return false;
    }

    const blockData = candidate.data as Record<string, unknown>;
    switch (candidate.type) {
      case 'image':
        return Boolean(safeReference(readText(blockData.mediaReference, 2_000)))
          && Number(readText(blockData.alt, 300)) <= 300;
      case 'code':
        return readText(blockData.code, 50_000).length > 0
          && readText(blockData.language, 30).length > 0;
      case 'github_code':
        return /^[\w.-]+\/[\w.-]+$/.test(readText(blockData.repo, 200))
          && readText(blockData.path, 500).length > 0;
      case 'github_activity':
        return /^[\w.-]+\/[\w.-]+$/.test(readText(blockData.repo, 200));
      default:
        return true;
    }
  });
}
