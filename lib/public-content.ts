import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './supabase/server';
import { commentChecksReady } from './comment-moderation';
import type { Entry, Feedback, Subthread, Thread } from './content';

export const getThread = cache(async (destination: 'journey' | 'projects', slug: string) => {
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from('threads').select('*').eq('destination', destination).eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw new Error('Content is temporarily unavailable.');
  return data as Thread | null;
});
export const getSubthreads = cache(async (threadId: string) => {
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from('thread_subthreads').select('*').eq('thread_id', threadId).eq('status', 'published').order('sort_order').order('id');
  if (error) throw new Error('Subthreads are temporarily unavailable.');
  return (data ?? []) as Subthread[];
});
export const getSubthread = cache(async (threadId: string, slug: string) => {
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from('thread_subthreads').select('*').eq('thread_id', threadId).eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw new Error('Subthread is temporarily unavailable.');
  return data as Subthread | null;
});
export async function getSubthreadPost(subthreadId: string) {
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from('thread_entries').select('*, thread_media(*)')
    .eq('subthread_id', subthreadId).eq('status', 'published').maybeSingle();
  if (error) throw new Error('Subthread content is temporarily unavailable.');
  return data as Entry | null;
}
export async function getFeedbackSnapshot(postId: string): Promise<Feedback | null> {
  const db = await createServerSupabaseClient();
  const visitor = (await cookies()).get('portfolio-visitor')?.value ?? '';
  const validVisitor = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitor);
  const { data, error } = await db.rpc('get_entry_feedback', { p_entry: postId, p_visitor: validVisitor ? visitor : null });
  if (error || !data) return null;
  const ready = commentChecksReady();
  return { ...data, commentChecksReady: ready, turnstileSiteKey: ready ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined } as Feedback;
}
