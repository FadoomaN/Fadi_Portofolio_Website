'use client';

import { useState } from 'react';
import type { Subthread, Thread } from '@/lib/content';
import { filterContent } from '@/lib/filter-content';
import JourneyThumbnail from './journey-thumbnail';

type ThreadCard = Pick<
  Thread,
  | 'id'
  | 'slug'
  | 'title'
  | 'category'
  | 'description'
  | 'cover_media_reference'
  | 'cover_position_x'
  | 'cover_position_y'
>;

type Props =
  | {
      kind: 'threads';
      threads: ThreadCard[];
      childCounts: Record<string, number>;
    }
  | {
      kind: 'subthreads';
      subthreads: Subthread[];
      threadSlug: string;
    };

export default function SearchableCards(props: Props) {
  const [query, setQuery] = useState('');

  const isThreads = props.kind === 'threads';

  const threadMatches =
    props.kind === 'threads'
      ? filterContent(props.threads, query, item => [
          item.title,
          item.description,
        ])
      : [];

  const subthreadMatches =
    props.kind === 'subthreads'
      ? filterContent(props.subthreads, query, item => [
          item.title,
          item.description,
        ])
      : [];

  const count =
    props.kind === 'threads'
      ? props.threads.length
      : props.subthreads.length;

  return (
    <>
      {count > 0 && (
        <label className="journey-search">
          <span>
            {isThreads ? 'FIND A THREAD' : 'FIND A SUBTHREAD'}
          </span>

          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={
              isThreads
                ? 'Search threads…'
                : 'Search subthreads…'
            }
          />
        </label>
      )}

      {threadMatches.length + subthreadMatches.length > 0 ? (
        <div
          className={
            isThreads
              ? 'journey-thread-list'
              : 'journey-subthread-list'
          }
        >
          {props.kind === 'threads'
            ? threadMatches.map((thread, index) => (
                <a
                  className="journey-thread"
                  href={`/journey/${thread.slug}`}
                  key={thread.id}
                >
                  <JourneyThumbnail
                    kind="thread"
                    reference={thread.cover_media_reference}
                    x={thread.cover_position_x}
                    y={thread.cover_position_y}
                  />

                  <div className="journey-thread-copy">
                    <span className="journey-thread-label">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {thread.category || 'THREAD'}
                    </span>

                    <h3>{thread.title}</h3>
                    <p>{thread.description}</p>

                    <small>
                      {String(
                        props.childCounts[thread.id] ?? 0
                      ).padStart(2, '0')}{' '}
                      SUBTHREADS
                    </small>
                  </div>

                  <span
                    className="journey-thread-view"
                    aria-hidden="true"
                  >
                    VIEW THREAD ↗
                  </span>
                </a>
              ))
            : subthreadMatches.map(subthread => (
                <a
                  className="journey-subthread"
                  href={`/journey/${props.threadSlug}/${subthread.slug}`}
                  key={subthread.id}
                >
                  <JourneyThumbnail
                    kind="subthread"
                    reference={subthread.cover_media_reference}
                    x={subthread.cover_position_x}
                    y={subthread.cover_position_y}
                  />

                  <div className="journey-subthread-copy">
                    <h3>{subthread.title}</h3>
                    <p>{subthread.description}</p>
                  </div>

                  <span
                    className="journey-subthread-view"
                    aria-hidden="true"
                  >
                    OPEN STORY ↗
                  </span>
                </a>
              ))}
        </div>
      ) : (
        <div
          className="journey-subthreads-empty"
          role="status"
        >
          {count
            ? isThreads
              ? 'NO THREADS FOUND'
              : 'NO SUBTHREADS FOUND'
            : isThreads
              ? 'No published threads yet.'
              : 'No published subthreads yet.'}
        </div>
      )}
    </>
  );
}