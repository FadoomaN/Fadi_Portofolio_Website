'use client';
import { useState } from 'react';
import { highlightCode } from '@/lib/prism';
export default function ProjectCode({code,language,filename,lineNumbers}:{code:string;language:string;filename?:string;lineNumbers?:boolean}){const [copied,setCopied]=useState(false);const highlighted=highlightCode(code,language);return <section className="project-code"><header><span>{filename||'CODE'}</span><small>{language||'Other'}</small><button type="button" onClick={()=>{void navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{copied?'COPIED':'COPY'}</button></header><pre className={lineNumbers?'has-line-numbers':''}><code dangerouslySetInnerHTML={{__html:highlighted}} /></pre></section>}
