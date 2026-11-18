export type RichTextMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

export type RichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
};

export type RichTextDocument = {
  type: 'doc';
  content: RichTextNode[];
};

const RICH_TEXT_TYPES = new Set([
  'doc', 'paragraph', 'heading', 'hardBreak', 'text', 'bulletList', 'orderedList',
  'listItem', 'blockquote', 'horizontalRule',
]);
const RICH_TEXT_MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'link', 'textStyle']);
const SAFE_FONTS = new Set(['Arial', 'Helvetica', 'Inter', 'Roboto', 'Open Sans', 'Source Sans 3', 'Georgia', 'Times New Roman', 'Merriweather', 'IBM Plex Sans', 'IBM Plex Mono', 'JetBrains Mono', 'Courier New', 'Cambria', 'Consolas', 'monospace', 'serif', 'sans-serif']);
const SAFE_SIZES = /^(?:[8-9]|[1-8][0-9]|96)px$/;
const SAFE_COLORS = /^#[0-9a-f]{6}$/i;
const SAFE_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

function cleanNode(value: unknown): RichTextNode | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const node = value as Record<string, unknown>;
  const type = typeof node.type === 'string' && RICH_TEXT_TYPES.has(node.type) ? node.type : null;
  if (!type) return null;
  const result: RichTextNode = { type };
  if (typeof node.text === 'string' && type === 'text') result.text = node.text;
  if (Array.isArray(node.content)) result.content = node.content.map(cleanNode).filter((item): item is RichTextNode => Boolean(item));
  if (node.attrs && typeof node.attrs === 'object' && !Array.isArray(node.attrs)) {
    const attrs = node.attrs as Record<string, unknown>;
    const safeAttrs: Record<string, unknown> = {};
    if (type === 'heading' && [2, 3, 4].includes(Number(attrs.level))) safeAttrs.level = Number(attrs.level);
    if (['paragraph', 'heading'].includes(type) && typeof attrs.textAlign === 'string' && SAFE_ALIGNMENTS.has(attrs.textAlign)) safeAttrs.textAlign = attrs.textAlign;
    if (type === 'textStyle') {
      if (typeof attrs.fontFamily === 'string' && SAFE_FONTS.has(attrs.fontFamily)) safeAttrs.fontFamily = attrs.fontFamily;
      if (typeof attrs.fontSize === 'string' && SAFE_SIZES.test(attrs.fontSize)) safeAttrs.fontSize = attrs.fontSize;
      if (typeof attrs.color === 'string' && SAFE_COLORS.test(attrs.color)) safeAttrs.color = attrs.color;
    }
    if (type === 'link' && typeof attrs.href === 'string' && /^(https?:|mailto:)/i.test(attrs.href)) safeAttrs.href = attrs.href;
    if (Object.keys(safeAttrs).length) result.attrs = safeAttrs;
  }
  if (Array.isArray(node.marks)) result.marks = node.marks.flatMap((mark) => {
    if (!mark || typeof mark !== 'object' || typeof (mark as RichTextMark).type !== 'string') return [];
    const type = (mark as RichTextMark).type!;
    if (!RICH_TEXT_MARKS.has(type)) return [];
    const attrs = (mark as RichTextMark).attrs ?? {};
    if (type === 'link') return typeof attrs.href === 'string' && /^(https?:|mailto:)/i.test(attrs.href) ? [{ type, attrs: { href: attrs.href } }] : [];
    if (type === 'textStyle') {
      const safe: Record<string, string> = {};
      if (typeof attrs.fontFamily === 'string' && SAFE_FONTS.has(attrs.fontFamily)) safe.fontFamily = attrs.fontFamily;
      if (typeof attrs.fontSize === 'string' && SAFE_SIZES.test(attrs.fontSize)) safe.fontSize = attrs.fontSize;
      if (typeof attrs.color === 'string' && SAFE_COLORS.test(attrs.color)) safe.color = attrs.color;
      return [{ type, attrs: safe }];
    }
    return [{ type }];
  });
  return result;
}

export function parseRichText(value: unknown): RichTextDocument | null {
  let candidate = value;
  if (typeof value === 'string') {
    try { candidate = JSON.parse(value); } catch { return null; }
  }
  const cleaned = cleanNode(candidate);
  return cleaned?.type === 'doc' ? { type: 'doc', content: cleaned.content ?? [] } : null;
}

export function serializeRichText(document: RichTextDocument) {
  return JSON.stringify(document);
}

export function legacyParagraphs(value: string) {
  return value.split(/\r?\n\s*\r?\n|\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function safeFontFamily(value: unknown) {
  return typeof value === 'string' && SAFE_FONTS.has(value) ? value : null;
}

export function safeFontSize(value: unknown) {
  return typeof value === 'string' && SAFE_SIZES.test(value) ? value : null;
}
