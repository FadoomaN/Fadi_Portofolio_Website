'use client';
import { useState } from 'react';
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
const grammar:{[key:string]:string}={c:'c',cpp:'cpp','c++':'cpp',csharp:'csharp','c#':'csharp',java:'java',javascript:'javascript',js:'javascript',typescript:'typescript',ts:'typescript',python:'python',sql:'sql',bash:'bash',json:'json',html:'markup',css:'css',rust:'rust',go:'go'};
export default function ProjectCode({code,language,filename,lineNumbers}:{code:string;language:string;filename?:string;lineNumbers?:boolean}){const [copied,setCopied]=useState(false);const key=grammar[language.toLowerCase()]??'none';const highlighted=key!=='none'&&Prism.languages[key]?Prism.highlight(code,Prism.languages[key],key):Prism.util.encode(code);return <section className="project-code"><header><span>{filename||'CODE'}</span><small>{language||'Other'}</small><button type="button" onClick={()=>{void navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{copied?'COPIED':'COPY'}</button></header><pre className={lineNumbers?'has-line-numbers':''}><code dangerouslySetInnerHTML={{__html:highlighted}} /></pre></section>}
