import RichTextEditor from './rich-text-editor';
import type { RichTextDocument } from '@/lib/rich-text';

export default function ProjectRichTextEditor({ value, legacyText, onChange }: { value?: RichTextDocument | Record<string, unknown>; legacyText: string; onChange: (value: RichTextDocument) => void }) {
  return <RichTextEditor value={value} legacyText={legacyText} onChange={onChange} />;
}
