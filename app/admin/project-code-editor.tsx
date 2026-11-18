'use client';
import dynamic from 'next/dynamic';

const CodeMirrorEditor = dynamic(() => import('./code-editor-codemirror'), {
	ssr: false,
	loading: () => <div className="project-code-editor-loading">Loading code editor…</div>,
});

export default function ProjectCodeEditor({ value, language, onChange }: { value: string; language: string; onChange: (value: string) => void }) {
	return <CodeMirrorEditor value={value} language={language} onChange={onChange} />;
}
