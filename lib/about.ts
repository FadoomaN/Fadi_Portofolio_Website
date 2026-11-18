import { safeReference } from './content';

export type AboutRecord = {
  id: number;
  title: string;
  intro: string;
  body: string;
  sections: unknown[];
  media_reference: string | null;
  updated_at: string;
};

export type AboutSectionRecord = {
  id: string;
  about_id: number;
  label: string;
  heading: string;
  body: string;
  media_reference: string | null;
  media_alt: string;
  media_position: 'left' | 'right';
  media_shape: 'portrait' | 'landscape' | 'square';
  media_position_x: number;
  media_position_y: number;
  meta: string;
  sort_order: number;
  updated_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

// Validate the whole submission before the database transaction changes anything.
export function prepareAboutSections(value: unknown) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Choose up to 100 About sections.');
  const ids = new Set<string>();
  return value.map((item: unknown, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid About section.');
    const section = item as Record<string, unknown>;
    const submittedId = text(section.id);
    const id = submittedId.startsWith('new-') ? submittedId.slice(4) : submittedId;
    if (!UUID.test(id) || ids.has(id)) throw new Error('Invalid or duplicate About section ID.');
    ids.add(id);
    const position = text(section.media_position);
    const shape = text(section.media_shape);
    const reference = text(section.media_reference);
    if (!['left', 'right'].includes(position) || !['portrait', 'landscape', 'square'].includes(shape)) {
      throw new Error('Choose a valid image format and position.');
    }
    if (reference && !safeReference(reference)) throw new Error('Use an HTTPS address or a local image path.');
    const label = text(section.label), heading = text(section.heading), body = text(section.body);
    if (!label || !heading || label.length > 300 || heading.length > 500 || body.length > 100000) {
      throw new Error('Every section needs a label and heading within the allowed length.');
    }
    return {
      id, about_id: 1, label, heading, body,
      media_reference: reference || null, media_alt: text(section.media_alt),
      media_position: position, media_shape: shape,
      media_position_x: Math.max(0, Math.min(100, Number(section.media_position_x) || 50)),
      media_position_y: Math.max(0, Math.min(100, Number(section.media_position_y) || 50)),
      meta: text(section.meta), sort_order: index,
    };
  });
}

export type AboutSnapshot = { intro: string; sections: AboutSectionRecord[]; updatedAt: string };
export type AboutEditorState = { current: AboutSnapshot; saved: AboutSnapshot };
export type AboutEditorAction =
  | { type: 'edit'; current: AboutSnapshot }
  | { type: 'saved' | 'received'; snapshot: AboutSnapshot }
  | { type: 'reset' };

export function aboutIsDirty(state: AboutEditorState) {
  return state.current.intro !== state.saved.intro || JSON.stringify(state.current.sections) !== JSON.stringify(state.saved.sections);
}

export function aboutEditorReducer(state: AboutEditorState, action: AboutEditorAction): AboutEditorState {
  if (action.type === 'edit') return { ...state, current: action.current };
  if (action.type === 'reset') return { ...state, current: state.saved };
  if (action.type === 'received') {
    // Refreshes must neither overwrite a draft nor roll back a newer save response.
    if (aboutIsDirty(state) || action.snapshot.updatedAt <= state.saved.updatedAt) return state;
  }
  return { current: action.snapshot, saved: action.snapshot };
}
