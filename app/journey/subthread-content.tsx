import type { EntryMedia } from '@/lib/content';
import { safeReference } from '@/lib/content';

export function SubthreadMedia({ media }: { media: EntryMedia }) {
  // Preserve stored video data for a later release, but keep video unavailable publicly for now.
  if (media.media_type === 'video' || media.media_type === 'external-video') return null;
  const source = safeReference(media.media_reference);
  if (!source) return null;
  return <figure className={`journey-entry-media is-${media.media_shape}`}>
    {media.media_type === 'image' ? <img src={source} alt={media.media_alt || media.caption} loading="lazy" />
      : media.media_type === 'video' ? <video src={source} controls preload="metadata" playsInline aria-label={media.media_alt || media.caption || 'Subthread video'} />
      : <a href={source} target="_blank" rel="noopener noreferrer">{media.caption || (media.media_type === 'external-video' ? 'Watch video ↗' : 'Open link ↗')}</a>}
    {media.caption && ['image','video'].includes(media.media_type) && <figcaption>{media.caption}</figcaption>}
  </figure>;
}
