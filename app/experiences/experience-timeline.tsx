'use client';

import { useRef, useState } from 'react';

export type ExperienceRecord = {
  id: string;
  organization: string;
  role: string;
  employment_type: string;
  location: string;
  summary: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
};

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatType(value: string) {
  return value.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('-');
}

export default function ExperienceTimeline({
  experiences,
  demoIds,
}: {
  experiences: ExperienceRecord[];
  demoIds: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeExperience = experiences[activeIndex];

  // Keep large histories usable by moving only the timeline viewport, not the whole page.
  const selectExperience = (index: number, moveFocus = false) => {
    const nextIndex = Math.max(0, Math.min(index, experiences.length - 1));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => {
      const nextTab = scrollRef.current?.querySelector<HTMLButtonElement>(`[data-experience-index="${nextIndex}"]`);
      nextTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      if (moveFocus) nextTab?.focus();
    });
  };

  if (!activeExperience) {
    return (
      <div className="experience-index-empty">
        <strong>00</strong>
        <p>No published experiences yet.</p>
      </div>
    );
  }

  return (
    <div className="experience-timeline">
      <div className="experience-timeline-toolbar">
        <div>
          <strong>Browse timeline</strong>
          <span>Hover, click or use the controls</span>
        </div>
        <div className="experience-timeline-controls">
          <output aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(experiences.length).padStart(2, '0')}
          </output>
          <button
            type="button"
            aria-label="Previous experience"
            onClick={() => selectExperience(activeIndex - 1, true)}
            disabled={activeIndex === 0}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next experience"
            onClick={() => selectExperience(activeIndex + 1, true)}
            disabled={activeIndex === experiences.length - 1}
          >
            →
          </button>
        </div>
      </div>

      <div className="experience-timeline-scroll" ref={scrollRef}>
        <div
          className="experience-timeline-tabs"
          role="tablist"
          aria-label="Choose an experience"
          style={{ gridTemplateColumns: `repeat(${experiences.length}, minmax(14rem, 1fr))` }}
        >
          {experiences.map((experience, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                className={isActive ? 'is-active' : ''}
                type="button"
                role="tab"
                id={`experience-tab-${experience.id}`}
                aria-controls="experience-detail-panel"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                data-experience-index={index}
                onClick={() => selectExperience(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                  event.preventDefault();
                  const direction = event.key === 'ArrowRight' ? 1 : -1;
                  const nextIndex = (index + direction + experiences.length) % experiences.length;
                  selectExperience(nextIndex, true);
                }}
                key={experience.id}
              >
                <span className="experience-tab-date">
                  {experience.start_date.slice(0, 4)}
                  <i aria-hidden="true">—</i>
                  {experience.is_current ? 'Now' : experience.end_date?.slice(0, 4) ?? 'Open'}
                </span>
                <span className="experience-tab-node" aria-hidden="true" />
                <strong>{experience.role}</strong>
                <small>{experience.organization}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="experience-popout-anchor">
        <article
          className="experience-popout"
          id="experience-detail-panel"
          role="tabpanel"
          aria-labelledby={`experience-tab-${activeExperience.id}`}
          key={activeExperience.id}
        >
          <div className="experience-popout-topline">
            <span>{formatType(activeExperience.employment_type)}</span>
            {demoIds.includes(activeExperience.id) && <span>Test record</span>}
            {activeExperience.is_current && <span className="is-current"><i /> Current</span>}
          </div>
          <h2>{activeExperience.role}</h2>
          <p>{activeExperience.summary}</p>
          <footer>
            <span>{activeExperience.organization}</span>
            <span>{activeExperience.location || 'Location not specified'}</span>
            <time>
              {formatMonth(activeExperience.start_date)} / {activeExperience.is_current
                ? 'Present'
                : activeExperience.end_date
                  ? formatMonth(activeExperience.end_date)
                  : 'Open'}
            </time>
          </footer>
        </article>
      </div>
    </div>
  );
}
