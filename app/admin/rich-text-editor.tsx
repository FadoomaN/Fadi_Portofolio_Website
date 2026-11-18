'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef, useState } from 'react';
import type { RichTextDocument } from '@/lib/rich-text';
import { parseRichText } from '@/lib/rich-text';

const FONT_FAMILIES = ['Arial', 'Helvetica', 'Inter', 'Roboto', 'Open Sans', 'Source Sans 3', 'Georgia', 'Times New Roman', 'Merriweather', 'IBM Plex Sans', 'IBM Plex Mono', 'JetBrains Mono', 'Courier New'];
const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64];
const EMPTY_DOCUMENT: RichTextDocument = { type: 'doc', content: [{ type: 'paragraph' }] };

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      fontFamily: { default: null, parseHTML: (element: HTMLElement) => element.style.fontFamily || null, renderHTML: (attributes: Record<string, unknown>) => attributes.fontFamily ? { style: `font-family: ${String(attributes.fontFamily)}` } : {} },
      fontSize: { default: null, parseHTML: (element: HTMLElement) => element.style.fontSize || null, renderHTML: (attributes: Record<string, unknown>) => attributes.fontSize ? { style: `font-size: ${String(attributes.fontSize)}` } : {} },
      color: { default: null, parseHTML: (element: HTMLElement) => element.style.color || null, renderHTML: (attributes: Record<string, unknown>) => attributes.color ? { style: `color: ${String(attributes.color)}` } : {} },
    };
  },
});

const FormattingShortcuts = Extension.create({
  name: 'formattingShortcuts',
  addKeyboardShortcuts() {
    const changeSize = (delta: number) => {
      const current = Number.parseInt(String(this.editor.getAttributes('textStyle').fontSize ?? '16'), 10);
      const next = Math.max(8, Math.min(96, (Number.isFinite(current) ? current : 16) + delta));
      return this.editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run();
    };
    return {
      'Mod-Shift-.': () => changeSize(2),
      'Mod-Shift-,': () => changeSize(-2),
      'Mod-Shift-l': () => this.editor.chain().focus().setTextAlign('left').run(),
      'Mod-Shift-e': () => this.editor.chain().focus().setTextAlign('center').run(),
      'Mod-Shift-r': () => this.editor.chain().focus().setTextAlign('right').run(),
      'Mod-Shift-7': () => this.editor.chain().focus().toggleOrderedList().run(),
      'Mod-Shift-8': () => this.editor.chain().focus().toggleBulletList().run(),
    };
  },
});

function initialContent(value: unknown, legacyText = ''): JSONContent {
  const legacy = legacyText || (typeof value === 'string' ? value : '');
  return (parseRichText(value) ?? (legacy ? { type: 'doc', content: legacy.split(/\r?\n\s*\r?\n|\r?\n/).filter(Boolean).map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })) } : EMPTY_DOCUMENT)) as unknown as JSONContent;
}

function stopSelectionLoss(event: React.MouseEvent) { event.preventDefault(); }

export default function RichTextEditor({ value, legacyText, onChange, compact = false }: { value?: unknown; legacyText?: string; onChange: (value: RichTextDocument) => void; compact?: boolean }) {
  const [openMenu, setOpenMenu] = useState<'font' | 'size' | 'align' | 'list' | null>(null);
  const sizeInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }), TextAlign.configure({ types: ['heading', 'paragraph'] }), FontSize, FormattingShortcuts],
    content: initialContent(value, legacyText),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getJSON() as RichTextDocument),
  });

  useEffect(() => {
    if (!editor) return;
    const next = initialContent(value, legacyText);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) editor.commands.setContent(next as JSONContent, { emitUpdate: false });
  }, [editor, value, legacyText]);

  if (!editor) return null;
  const action = (label: string, active: boolean, onClick: () => void, title: string) => <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} title={title} onMouseDown={stopSelectionLoss} onClick={onClick}>{label}</button>;
  const setLink = () => { const href = window.prompt('Link address', editor.getAttributes('link').href ?? 'https://'); if (href === null) return; if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run(); else if (/^(https?:|mailto:)/i.test(href.trim())) editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run(); };
  const setSize = (valueToSet: string) => { const size = Math.max(8, Math.min(96, Number.parseInt(valueToSet, 10))); if (Number.isFinite(size)) editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run(); setOpenMenu(null); };
  const currentSize = String(editor.getAttributes('textStyle').fontSize ?? '16px').replace('px', '');
  return <div className={`rich-text-editor${compact ? ' is-compact' : ''}`}>
    <div className="rich-text-toolbar" aria-label="Text formatting">
      {action('↶', false, () => editor.chain().focus().undo().run(), 'Undo (Ctrl+Z)')}
      {action('↷', false, () => editor.chain().focus().redo().run(), 'Redo (Ctrl+Y)')}
      <div className="rich-text-popover"><button type="button" className="rich-text-menu-button" aria-expanded={openMenu === 'font'} onMouseDown={stopSelectionLoss} onClick={() => setOpenMenu(openMenu === 'font' ? null : 'font')}>Font ▾</button>{openMenu === 'font' && <div className="rich-text-menu">{FONT_FAMILIES.map((font) => <button type="button" key={font} style={{ fontFamily: font }} onMouseDown={stopSelectionLoss} onClick={() => { editor.chain().focus().setMark('textStyle', { fontFamily: font }).run(); setOpenMenu(null); }}>{font}</button>)}</div>}</div>
      <div className="rich-text-popover"><button type="button" className="rich-text-menu-button" aria-expanded={openMenu === 'size'} onMouseDown={stopSelectionLoss} onClick={() => setOpenMenu(openMenu === 'size' ? null : 'size')}>{currentSize}px ▾</button>{openMenu === 'size' && <div className="rich-text-menu rich-text-size-menu"><div><input ref={sizeInput} type="number" min="8" max="96" defaultValue={currentSize} aria-label="Custom font size" onKeyDown={(event) => { if (event.key === 'Enter') setSize(event.currentTarget.value); }} /><button type="button" onMouseDown={stopSelectionLoss} onClick={() => setSize(sizeInput.current?.value ?? currentSize)}>Apply</button></div>{FONT_SIZES.map((size) => <button type="button" key={size} onMouseDown={stopSelectionLoss} onClick={() => setSize(String(size))}>{size}px</button>)}</div>}</div>
      {action('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold (Ctrl+B)')}
      {action('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic (Ctrl+I)')}
      {action('U', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline (Ctrl+U)')}
      {action('S', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough (Ctrl+Shift+X)')}
      <label className="rich-text-color" title="Text color"><span>A</span><input type="color" defaultValue="#111820" aria-label="Text color" onChange={(event) => editor.chain().focus().setMark('textStyle', { color: event.target.value }).run()} /></label>
      <div className="rich-text-popover"><button type="button" className="rich-text-menu-button" aria-expanded={openMenu === 'align'} onMouseDown={stopSelectionLoss} onClick={() => setOpenMenu(openMenu === 'align' ? null : 'align')}>Align ▾</button>{openMenu === 'align' && <div className="rich-text-menu">{[['left', 'Left'], ['center', 'Center'], ['right', 'Right'], ['justify', 'Justify']].map(([valueToSet, label]) => <button type="button" key={valueToSet} onMouseDown={stopSelectionLoss} onClick={() => { editor.chain().focus().setTextAlign(valueToSet).run(); setOpenMenu(null); }}>{label}</button>)}</div>}</div>
      <div className="rich-text-popover"><button type="button" className="rich-text-menu-button" aria-expanded={openMenu === 'list'} onMouseDown={stopSelectionLoss} onClick={() => setOpenMenu(openMenu === 'list' ? null : 'list')}>List ▾</button>{openMenu === 'list' && <div className="rich-text-menu"><button type="button" onMouseDown={stopSelectionLoss} onClick={() => { editor.chain().focus().toggleBulletList().run(); setOpenMenu(null); }}>Bulleted</button><button type="button" onMouseDown={stopSelectionLoss} onClick={() => { editor.chain().focus().toggleOrderedList().run(); setOpenMenu(null); }}>Numbered</button></div>}</div>
      {action('Link', editor.isActive('link'), setLink, 'Add link')}
      {action('Clear', false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Clear formatting')}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
