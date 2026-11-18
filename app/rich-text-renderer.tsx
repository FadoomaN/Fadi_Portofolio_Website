import type { ReactNode } from 'react';
import { legacyParagraphs, parseRichText, type RichTextMark, type RichTextNode } from '@/lib/rich-text';

function inline(nodes: RichTextNode[] = []): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'hardBreak') return <br key={index} />;
    let output: ReactNode = node.text ?? '';
    for (const mark of node.marks ?? []) {
      output = applyMark(output, mark, `${index}`);
    }
    return <span key={index}>{output}</span>;
  });
}

function applyMark(content: ReactNode, mark: RichTextMark, key: string): ReactNode {
  if (mark.type === 'bold') return <strong key={`bold-${key}`}>{content}</strong>;
  if (mark.type === 'italic') return <em key={`italic-${key}`}>{content}</em>;
  if (mark.type === 'underline') return <u key={`underline-${key}`}>{content}</u>;
  if (mark.type === 'strike') return <s key={`strike-${key}`}>{content}</s>;
  if (mark.type === 'code') return <code key={`code-${key}`}>{content}</code>;
  if (mark.type === 'link' && typeof mark.attrs?.href === 'string') return <a key={`link-${key}`} href={mark.attrs.href} rel="noreferrer">{content}</a>;
  if (mark.type === 'textStyle') {
    const style: { fontFamily?: string; fontSize?: string } = {};
    if (typeof mark.attrs?.fontFamily === 'string') style.fontFamily = mark.attrs.fontFamily;
    if (typeof mark.attrs?.fontSize === 'string') style.fontSize = mark.attrs.fontSize;
    return <span key={`style-${key}`} style={style}>{content}</span>;
  }
  return content;
}

function block(node: RichTextNode, index: number): ReactNode {
  const children = node.content ?? [];
  const style = node.attrs?.textAlign ? { textAlign: String(node.attrs.textAlign) as 'left' | 'center' | 'right' | 'justify' } : undefined;
  if (node.type === 'paragraph') return <p key={index} style={style}>{inline(children)}</p>;
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level);
    if (level === 2) return <h2 key={index} style={style}>{inline(children)}</h2>;
    if (level === 3) return <h3 key={index} style={style}>{inline(children)}</h3>;
    return <h4 key={index} style={style}>{inline(children)}</h4>;
  }
  if (node.type === 'bulletList') return <ul key={index}>{children.map(block)}</ul>;
  if (node.type === 'orderedList') return <ol key={index}>{children.map(block)}</ol>;
  if (node.type === 'listItem') return <li key={index}>{children.map(block)}</li>;
  if (node.type === 'blockquote') return <blockquote key={index}>{children.map(block)}</blockquote>;
  if (node.type === 'horizontalRule') return <hr key={index} />;
  return null;
}

export default function RichTextRenderer({ value, fallback }: { value: unknown; fallback?: string }) {
  const document = parseRichText(value);
  if (!document) return <>{legacyParagraphs(fallback ?? String(value ?? '')).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
  return <>{document.content.map(block)}</>;
}
