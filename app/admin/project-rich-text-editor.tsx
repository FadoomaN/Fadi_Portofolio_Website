'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

type RichTextDocument = Record<string, unknown>;

function initialContent(value: RichTextDocument | undefined, legacyText: string) {
  return value && value.type === 'doc'
    ? value
    : { type: 'doc', content: [{ type: 'paragraph', content: legacyText ? [{ type: 'text', text: legacyText }] : [] }] };
}

export default function ProjectRichTextEditor({ value, legacyText, onChange }: { value?: RichTextDocument; legacyText: string; onChange: (value: RichTextDocument) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' })],
    content: initialContent(value, legacyText),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getJSON() as RichTextDocument),
  });

  useEffect(() => {
    if (!editor || !value || value.type !== 'doc') return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (current !== next) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;
  const action = (label: string, active: boolean, onClick: () => void) => <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} onMouseDown={event => event.preventDefault()} onClick={onClick}>{label}</button>;
  const setLink = () => {
    const href = window.prompt('Link address');
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return <div className="project-rich-text-editor">
    <div className="project-rich-text-toolbar" aria-label="Text formatting">
      {action('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
      {action('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
      {action('Normal', editor.isActive('paragraph'), () => editor.chain().focus().setParagraph().run())}
      {[2, 3, 4].map(level => action(`H${level}`, editor.isActive('heading', { level }), () => editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run()))}
      {action('• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
      {action('1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
      {action('Link', editor.isActive('link'), setLink)}
      {action('</>', editor.isActive('code'), () => editor.chain().focus().toggleCode().run())}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
