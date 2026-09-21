'use client';

import PrismModule from 'prismjs';
import loadLanguagesModule from 'prismjs/components/index';

type PrismInstance = typeof PrismModule;
const Prism = ((PrismModule as unknown as { default?: PrismInstance }).default ?? PrismModule) as PrismInstance;
const globalPrism = globalThis as typeof globalThis & { Prism?: PrismInstance };
globalPrism.Prism = Prism;
const loadLanguages = ((loadLanguagesModule as unknown as { default?: (languages:string[])=>void }).default ?? loadLanguagesModule) as (languages:string[])=>void;

try { loadLanguages(['c','cpp','csharp','java','javascript','typescript','python','sql','bash','json','markup','css','rust','go']); } catch { /* Plain escaped text remains safe. */ }

export const prismGrammar: Record<string,string> = { c:'c', cpp:'cpp', 'c++':'cpp', csharp:'csharp', 'c#':'csharp', java:'java', javascript:'javascript', js:'javascript', typescript:'typescript', ts:'typescript', python:'python', sql:'sql', bash:'bash', json:'json', html:'markup', markup:'markup', css:'css', rust:'rust', go:'go' };
export function highlightCode(code:string, language:string) { const key=prismGrammar[language.toLowerCase()]??'none'; return key!=='none'&&Prism.languages[key] ? Prism.highlight(code,Prism.languages[key],key) : Prism.util.encode(code); }
export default Prism;
