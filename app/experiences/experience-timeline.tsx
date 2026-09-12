'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

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

type BoardTrace = {
  experienceId: string;
  path: string;
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

const circuitTypes = ['D', 'JK', 'T', 'SR'] as const;

function ExperienceDetails({
  experience,
  isDemo,
  id,
  labelledBy,
  className = 'experience-popout',
}: {
  experience: ExperienceRecord;
  isDemo: boolean;
  id: string;
  labelledBy: string;
  className?: string;
}) {
  return (
    <article className={className} id={id} role="tabpanel" aria-labelledby={labelledBy}>
      <div className="experience-output-label">
        <span>OUTPUT</span>
        <strong>Q</strong>
      </div>
      <div className="experience-popout-topline">
        <span>{formatType(experience.employment_type)}</span>
        {isDemo && <span>Test record</span>}
        {experience.is_current && <span className="is-current"><i /> Current</span>}
      </div>
      <h2>{experience.role}</h2>
      <p>{experience.summary}</p>
      <footer>
        <span>{experience.organization}</span>
        <span>{experience.location || 'Location not specified'}</span>
        <time>
          {formatMonth(experience.start_date)} / {experience.is_current
            ? 'Present'
            : experience.end_date
              ? formatMonth(experience.end_date)
              : 'Open'}
        </time>
      </footer>
    </article>
  );
}

export default function ExperienceTimeline({
  experiences,
  demoIds,
}: {
  experiences: ExperienceRecord[];
  demoIds: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [boardTrace, setBoardTrace] = useState<BoardTrace | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const activeExperience = experiences[activeIndex];

  const selectExperience = (index: number, moveFocus = false, expandOnMobile = false) => {
    const nextIndex = Math.max(0, Math.min(index, experiences.length - 1));
    setActiveIndex(nextIndex);

    if (expandOnMobile && window.matchMedia('(max-width: 48rem)').matches) {
      setExpandedId(experiences[nextIndex]?.id ?? null);
    }

    if (moveFocus) {
      window.requestAnimationFrame(() => {
        boardRef.current
          ?.querySelector<HTMLButtonElement>(`[data-experience-index="${nextIndex}"]`)
          ?.focus();
      });
    }
  };

  const toggleExperience = (index: number, experienceId: string) => {
    setActiveIndex(index);

    if (window.matchMedia('(max-width: 48rem)').matches) {
      setExpandedId((currentId) => currentId === experienceId ? null : experienceId);
    }
  };

  const previewExperience = (index: number) => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setActiveIndex(index);
    }
  };

  // Draw an orthogonal PCB trace from the selected CLK port to the output panel.
  const updateBoardTrace = useCallback(() => {
    const board = boardRef.current;
    const panel = detailRef.current;
    const activeBlock = board?.querySelector<HTMLElement>(`[data-experience-index="${activeIndex}"]`);

    if (!board || !panel || !activeBlock || !activeExperience) return;

    const boardBox = board.getBoundingClientRect();
    const blockBox = activeBlock.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const isStacked = boardBox.width <= 768;

    if (isStacked) {
      const startX = blockBox.left + blockBox.width * 0.5 - boardBox.left;
      const endX = panelBox.left + panelBox.width * 0.5 - boardBox.left;
      const startY = blockBox.top - boardBox.top;
      const endY = panelBox.bottom - boardBox.top;
      const middleY = endY + (startY - endY) * 0.5;

      setBoardTrace({
        experienceId: activeExperience.id,
        path: `M ${startX} ${startY} V ${middleY} H ${endX} V ${endY}`,
      });
      return;
    }

    const startX = blockBox.right - boardBox.left;
    const startY = blockBox.top + blockBox.height * 0.5 - boardBox.top;
    const endX = panelBox.left - boardBox.left;
    const endY = panelBox.top + panelBox.height * 0.5 - boardBox.top;
    const middleX = startX + (endX - startX) * 0.5;

    setBoardTrace({
      experienceId: activeExperience.id,
      path: `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`,
    });
  }, [activeExperience, activeIndex]);

  useLayoutEffect(() => {
    updateBoardTrace();

    const board = boardRef.current;
    const panel = detailRef.current;
    if (!board || !panel) return;

    const resizeObserver = new ResizeObserver(updateBoardTrace);
    resizeObserver.observe(board);
    resizeObserver.observe(panel);
    window.addEventListener('resize', updateBoardTrace);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBoardTrace);
    };
  }, [updateBoardTrace]);

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
          <strong>Career circuit</strong>
          <span>Select a component to route its signal</span>
        </div>
        <div className="experience-timeline-controls">
          <output aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(experiences.length).padStart(2, '0')}
          </output>
          <button
            type="button"
            aria-label="Previous experience"
            onClick={() => selectExperience(activeIndex - 1, true, true)}
            disabled={activeIndex === 0}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next experience"
            onClick={() => selectExperience(activeIndex + 1, true, true)}
            disabled={activeIndex === experiences.length - 1}
          >
            →
          </button>
        </div>
      </div>

      <div className="experience-logic-board" ref={boardRef}>
        {boardTrace?.experienceId === activeExperience.id && (
          <svg className="experience-board-trace" aria-hidden="true">
            <path className="experience-board-trace-base" d={boardTrace.path} pathLength={1} />
            <path
              className="experience-board-trace-current"
              d={boardTrace.path}
              pathLength={1}
              key={`${boardTrace.experienceId}-${boardTrace.path}`}
            />
          </svg>
        )}

        <div
          className="experience-component-grid"
          role="tablist"
          aria-label="Choose an experience"
        >
          {experiences.map((experience, index) => {
            const isActive = activeIndex === index;
            const isExpanded = isActive && expandedId === experience.id;
            const circuitType = circuitTypes[index % circuitTypes.length];

            return (
              <div className="experience-component-record" key={experience.id}>
                <button
                  className={isActive ? 'is-active' : ''}
                  type="button"
                  role="tab"
                  id={`experience-tab-${experience.id}`}
                  aria-controls={`experience-detail-panel experience-mobile-detail-${experience.id}`}
                  aria-expanded={isExpanded}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  data-experience-index={index}
                  onClick={() => toggleExperience(index, experience.id)}
                  onMouseEnter={() => previewExperience(index)}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    const previousKeys = ['ArrowLeft', 'ArrowUp'];
                    const nextKeys = ['ArrowRight', 'ArrowDown'];
                    if (!previousKeys.includes(event.key) && !nextKeys.includes(event.key)) return;
                    event.preventDefault();
                    const direction = nextKeys.includes(event.key) ? 1 : -1;
                    const nextIndex = (index + direction + experiences.length) % experiences.length;
                    selectExperience(nextIndex, true);
                  }}
                >
                  <span className="experience-block-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="experience-logic-symbol" aria-hidden="true">
                    <svg viewBox="0 0 112 72" focusable="false">
                      <path className="logic-input" d="M2 20h14M2 52h14" />
                      <path className="logic-case" d="M16 4h76v64H16z" />
                      <path className="logic-clock" d="M92 28L80 36l12 8" />
                      <path className="logic-output" d="M92 36h18" />
                      <text className="logic-type" x="27" y="28">{circuitType}</text>
                      <text className="logic-q" x="70" y="28">Q</text>
                      <text className="logic-clk" x="25" y="56">CLK</text>
                    </svg>
                  </span>

                  <span className="experience-circuit-copy">
                    <span className="experience-tab-date">
                      {experience.start_date.slice(0, 4)}
                      <i aria-hidden="true">—</i>
                      {experience.is_current ? 'Now' : experience.end_date?.slice(0, 4) ?? 'Open'}
                    </span>
                    <strong>{experience.role}</strong>
                    <small>{experience.organization}</small>
                  </span>

                  <span className="experience-mobile-toggle" aria-hidden="true">
                    <span>Details</span>
                    <i>{isExpanded ? '↑' : '↓'}</i>
                  </span>
                </button>

                {isExpanded && (
                  <ExperienceDetails
                    className="experience-mobile-details"
                    experience={experience}
                    id={`experience-mobile-detail-${experience.id}`}
                    isDemo={demoIds.includes(experience.id)}
                    labelledBy={`experience-tab-${experience.id}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="experience-popout-anchor" ref={detailRef}>
          <ExperienceDetails
            experience={activeExperience}
            id="experience-detail-panel"
            isDemo={demoIds.includes(activeExperience.id)}
            key={activeExperience.id}
            labelledBy={`experience-tab-${activeExperience.id}`}
          />
        </div>
      </div>
    </div>
  );
}
