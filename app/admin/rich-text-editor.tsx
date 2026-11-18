'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import type { RichTextDocument } from '@/lib/rich-text';
import { parseRichText } from '@/lib/rich-text';

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: Record<string, unknown>) => attributes.fontSize ? { style: `font-size: ${String(attributes.fontSize)}` } : {},
      },
    };
  },
});

const EMPTY_DOCUMENT: RichTextDocument = { type: 'doc', content: [{ type: 'paragraph' }] };

function initialContent(value: unknown, legacyText = ''): JSONContent {
  return (parseRichText(value) ?? (legacyText ? {
    type: 'doc',
    content: legacyText.split(/\r?\n\s*\r?\n|\r?\n/).filter(Boolean).map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
  } : EMPTY_DOCUMENT)) as unknown as JSONContent;
}

export default function RichTextEditor({ value, legacyText, onChange, compact = false }: { value?: unknown; legacyText?: string; onChange: (value: RichTextDocument) => void; compact?: boolean }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
      FontSize,
    ],
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
  const action = (label: string, active: boolean, onClick: () => void) => <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{label}</button>;
  const setLink = () => {
    const href = window.prompt('Link address');
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else if (/^(https?:|mailto:)/i.test(href.trim())) editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  };
  const setFontSize = (fontSize: string) => editor.chain().focus().setMark('textStyle', { fontSize }).run();
  const setFontFamily = (fontFamily: string) => editor.chain().focus().setFontFamily(fontFamily).run();

  return <div className={`rich-text-editor${compact ? ' is-compact' : ''}`}>
    <div className="rich-text-toolbar" aria-label="Text formatting">
      {action('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
      {action('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
      {action('U', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run())}
      {action('S', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run())}
      {action('P', editor.isActive('paragraph'), () => editor.chain().focus().setParagraph().run())}
      {[2, 3, 4].map((level) => action(`H${level}`, editor.isActive('heading', { level }), () => editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run()))}
      {action('•', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
      {action('1.', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
      {action('L', editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run())}
      {action('C', editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run())}
      {action('R', editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run())}
      <select aria-label="Font family" defaultValue="Arial" onChange={(event) => setFontFamily(event.target.value)}><option value="Arial">Arial</option><option value="Cambria">Cambria</option><option value="Consolas">Consolas</option><option value="Georgia">Georgia</option></select>
      <select aria-label="Font size" defaultValue="1rem" onChange={(event) => setFontSize(event.target.value)}><option value="0.9rem">Small</option><option value="1rem">Normal</option><option value="1.1rem">Large</option><option value="1.25rem">XL</option><option value="1.5rem">Display</option></select>
      {action('Link', editor.isActive('link'), setLink)}
      {action('Clear', false, () => editor.chain().focus().clearNodes().unsetAllMarks().run())}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
