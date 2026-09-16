'use client';
import { useState } from 'react';
import { safeReference } from '@/lib/content';

export default function JourneyThumbnail({ reference, x = 50, y = 50, kind }: {
  reference: string | null | undefined; x?: number; y?: number; kind: 'thread' | 'subthread';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = safeReference(reference);
  const image = source && source !== failedSource ? source : null;
  return <div className={kind === 'thread' ? 'journey-thread-thumbnail' : 'journey-subthread-thumbnail'} aria-hidden="true">
    {image
      ? <img className="journey-cover-image" src={image} style={{ objectPosition: `${x}% ${y}%` }} alt="" loading="lazy" onError={() => setFailedSource(image)} />
      : <div className="journey-media-placeholder"><span>VISUAL / NONE</span><strong>NO MEDIA</strong></div>}
  </div>;
}
