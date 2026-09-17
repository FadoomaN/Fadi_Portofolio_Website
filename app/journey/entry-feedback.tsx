'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import type { Feedback } from '@/lib/content';
import './feedback.css';
import TurnstileCheck from './turnstile-check';

export default function EntryFeedback({ entryId, initialFeedback }: { entryId: string; initialFeedback?: Feedback | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback ?? null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [turnstileToken,setTurnstileToken]=useState('');
  const [checkRevision,setCheckRevision]=useState(0);
  const requestId = useRef('');
  const inFlight = useRef(false);
  const accept = (data: Feedback, append = false) => {
    setHasMore(data.comments.length > 20);
    setFeedback(previous => ({ ...data, comments: append ? [...(previous?.comments ?? []), ...data.comments.slice(0,20)] : data.comments.slice(0,20) }));
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/feedback?entry=${entryId}`, { signal: controller.signal }).then(async response => {
      const data = await response.json() as Feedback & {error?:string};
      if (!response.ok) throw new Error(data.error);
      accept(data);
    }).catch(error => { if (error.name !== 'AbortError') setError('Feedback is temporarily unavailable. Reload to try again.'); });
    return () => controller.abort();
  }, [entryId]);
  async function send(payload: Record<string, unknown>) {
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry: entryId, ...payload }) });
    const data = await response.json() as Feedback & {error?:string};
    if (!response.ok) throw new Error(data.error ?? 'Could not save. Please try again.');
    return data;
  }
  async function vote(value: number) {
    if (!feedback || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const data = await send({ action: 'reaction', value: feedback.vote === value ? 0 : value });
      setFeedback(current => current ? { ...current, likes: data.likes, dislikes: data.dislikes, vote: data.vote } : current);
    } catch (error) { setError((error as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    requestId.current ||= crypto.randomUUID();
    const website = new FormData(event.currentTarget).get('website');
    try {
      const data=await send({ action: 'comment', name, body, requestId: requestId.current, website,turnstileToken });
      accept(data);setBody(''); requestId.current = ''; setNotice('Your comment has been published. Thank you!');
    } catch (error) { setError((error as Error).message); }
    finally { inFlight.current = false; setBusy(false); setTurnstileToken(''); setCheckRevision(value=>value+1); }
  }
  async function more() {
    const last = feedback?.comments.at(-1);
    if (!last || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/feedback?${new URLSearchParams({ entry: entryId, before: last.created_at, beforeId: last.id })}`);
      const data = await response.json() as Feedback & {error?:string};
      if (!response.ok) throw new Error(data.error);
      accept(data, true);
    } catch { setError('More comments could not be loaded. Please try again.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="journey-feedback">
    <div className="journey-reaction-bar" aria-label="Post reactions">
      <button type="button" aria-pressed={feedback?.vote === 1} disabled={busy || !feedback} onClick={() => vote(1)}>LIKE <span>{feedback?.likes ?? '—'}</span></button>
      <button type="button" aria-pressed={feedback?.vote === -1} disabled={busy || !feedback} onClick={() => vote(-1)}>DISLIKE <span>{feedback?.dislikes ?? '—'}</span></button>
    </div>
    <section className="journey-comments" aria-labelledby={`comments-${entryId}`}>
      <div className="journey-content-label"><span>COMMENTS / {feedback?.commentCount ?? '—'}</span><h3 id={`comments-${entryId}`}>COMMENTS</h3></div>
      {feedback?.commentsEnabled && feedback.commentChecksReady && <form className="journey-comment-form" onSubmit={comment}>
        <label htmlFor={`name-${entryId}`}>YOUR NAME <span>(required)</span></label>
        <input id={`name-${entryId}`} name="name" value={name} autoComplete="name" minLength={2} maxLength={60} required placeholder="Your name" onChange={event => { setName(event.target.value); requestId.current = ''; }} />
        <label htmlFor={`comment-${entryId}`}>ADD A COMMENT</label>
        <textarea id={`comment-${entryId}`} name="comment" rows={3} required maxLength={2000} value={body} placeholder="Write something…" onChange={event => { setBody(event.target.value); requestId.current = ''; }} />
        <div className="feedback-honeypot" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        {feedback.turnstileSiteKey&&<TurnstileCheck siteKey={feedback.turnstileSiteKey} onToken={setTurnstileToken} revision={checkRevision} />}
        <div className="journey-comment-actions"><small>Criticism is welcome. Your name is public. Cloudflare checks for bots, and basic spam checks protect comments.</small><button type="submit" disabled={busy||!turnstileToken}>{busy ? 'CHECKING…' : 'POST ↗'}</button></div>
      </form>}
      {feedback?.commentsEnabled&&!feedback.commentChecksReady&&<p>Comments are temporarily unavailable. Please try again later.</p>}
      {feedback && !feedback.commentsEnabled && <p>Comments are closed for this entry.</p>}
      {error && <p role="alert" className="admin-profile-error">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className="journey-comment-list">{feedback?.comments.map(item => <article className="journey-comment" key={item.id}><header><strong>{item.author_name}</strong><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</time></header><p>{item.body}</p></article>)}</div>
      {feedback && !feedback.comments.length && <p className="journey-comments-empty">No comments yet.</p>}
      {hasMore && <button type="button" className="feedback-load-more" onClick={more} disabled={busy}>Load more comments</button>}
    </section>
  </div>;
}
