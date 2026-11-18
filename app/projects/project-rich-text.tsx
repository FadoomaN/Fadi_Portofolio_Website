import RichTextRenderer from '../rich-text-renderer';

export default function ProjectRichText({ document, fallback }: { document: unknown; fallback: string }) {
  return <RichTextRenderer value={document} fallback={fallback} />;
}
