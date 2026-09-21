import type { ReactNode } from 'react';

type Node = { type?: unknown; text?: unknown; attrs?: Record<string, unknown>; content?: Node[]; marks?: { type?: unknown; attrs?: Record<string, unknown> }[] };

function inline(nodes: Node[] = []): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'hardBreak') return <br key={index} />;
    let output: ReactNode = String(node.text ?? '');
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') output = <strong key={`b-${index}`}>{output}</strong>;
      if (mark.type === 'italic') output = <em key={`i-${index}`}>{output}</em>;
      if (mark.type === 'code') output = <code key={`c-${index}`}>{output}</code>;
      if (mark.type === 'link') {
        const href = String(mark.attrs?.href ?? '');
        if (/^(https?:|mailto:)/i.test(href)) output = <a key={`a-${index}`} href={href} rel="noreferrer">{output}</a>;
      }
    }
    return <span key={index}>{output}</span>;
  });
}

function block(node: Node, index: number): ReactNode {
  const children = node.content ?? [];
  if (node.type === 'paragraph') return <p key={index}>{inline(children)}</p>;
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level);
    if (level === 2) return <h2 key={index}>{inline(children)}</h2>;
    if (level === 3) return <h3 key={index}>{inline(children)}</h3>;
    return <h4 key={index}>{inline(children)}</h4>;
  }
  if (node.type === 'bulletList') return <ul key={index}>{children.map(block)}</ul>;
  if (node.type === 'orderedList') return <ol key={index}>{children.map(block)}</ol>;
  if (node.type === 'listItem') return <li key={index}>{children.map(block)}</li>;
  if (node.type === 'blockquote') return <blockquote key={index}>{children.map(block)}</blockquote>;
  return null;
}

export default function ProjectRichText({ document, fallback }: { document: unknown; fallback: string }) {
  const value = document && typeof document === 'object' && !Array.isArray(document) ? document as Node : null;
  if (!value || value.type !== 'doc' || !Array.isArray(value.content)) return <>{fallback.split(/\r?\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
  return <>{value.content.map(block)}</>;
}
