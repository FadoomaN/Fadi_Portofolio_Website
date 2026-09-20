'use client';
import EditorModule from 'react-simple-code-editor';
const Editor = ((EditorModule as unknown as { default?: typeof EditorModule }).default ?? EditorModule) as typeof EditorModule;
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
const grammars:Record<string,string>={c:'c',cpp:'cpp',csharp:'csharp',java:'java',javascript:'javascript',typescript:'typescript',python:'python',sql:'sql',bash:'bash',json:'json',html:'markup',css:'css',rust:'rust',go:'go'};
export default function ProjectCodeEditor({value,language,onChange}:{value:string;language:string;onChange:(value:string)=>void}){const key=grammars[language.toLowerCase()]??'none';return <Editor value={value} onValueChange={onChange} highlight={code=>key!=='none'&&Prism.languages[key]?Prism.highlight(code,Prism.languages[key],key):Prism.util.encode(code)} padding={14} textareaId="project-code-editor" className="project-code-editor" textareaClassName="project-code-editor-input" preClassName="project-code-editor-highlight" aria-label="Code"/>}
