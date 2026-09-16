export type ContentStatus = 'draft' | 'published' | 'archived';
export type Thread = {
  id: string; title: string; slug: string; destination: 'journey' | 'projects';
  category: string; description: string; technical_description: string | null;
  cover_media_reference: string | null; cover_position_x: number; cover_position_y: number; github_url: string | null; live_url: string | null;
  tags: string[]; status: ContentStatus; featured: boolean; sort_order: number; updated_at: string;
};
export type Subthread = {
  id: string; thread_id: string; title: string; slug: string; description: string;
  cover_media_reference: string | null; cover_position_x: number; cover_position_y: number; status: ContentStatus; sort_order: number;
  thread_entries?: Entry[];
};
export type EntryMedia = {
  id?: string; entry_id?: string; media_type: 'image' | 'video' | 'external-video' | 'link';
  media_reference: string; caption: string; media_alt: string;
  media_shape: 'portrait' | 'landscape' | 'square'; media_position: 'left' | 'right'; sort_order: number;
};
export type Entry = {
  id: string; thread_id: string; subthread_id: string | null; title: string; published_on: string;
  content: string; status: ContentStatus; sort_order: number; comments_enabled: boolean;
  updated_at: string; thread_media: EntryMedia[];
  stats?: {likes:number;dislikes:number;comments:number;pending:number};
};
export type PublicComment = { id: string; author_name: string; body: string; created_at: string };
export type Feedback = { likes: number; dislikes: number; vote: number; commentCount: number; commentsEnabled: boolean; comments: PublicComment[]; commentChecksReady: boolean; turnstileSiteKey?: string };

export function safeReference(value: string | null | undefined): string | undefined {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { return new URL(value).protocol === 'https:' ? value : undefined; } catch { return undefined; }
}
export function threadPath(thread: Pick<Thread, 'destination' | 'slug'>, subthread?: Pick<Subthread, 'slug'>) {
  return `/${thread.destination}/${thread.slug}${subthread ? `/${subthread.slug}` : ''}`;
}
