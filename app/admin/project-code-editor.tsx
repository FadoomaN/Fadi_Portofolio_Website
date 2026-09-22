'use client';
import EditorModule from 'react-simple-code-editor';
const Editor = ((EditorModule as unknown as { default?: typeof EditorModule }).default ?? EditorModule) as typeof EditorModule;
import { highlightCode } from '@/lib/prism';
export default function ProjectCodeEditor({value,language,onChange}:{value:string;language:string;onChange:(value:string)=>void}){return <Editor value={value} onValueChange={onChange} highlight={code=>highlightCode(code,language)} padding={14} textareaId="project-code-editor" className="project-code-editor" textareaClassName="project-code-editor-input" preClassName="project-code-editor-highlight" aria-label="Code"/>}
