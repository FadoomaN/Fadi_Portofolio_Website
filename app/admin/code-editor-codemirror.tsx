'use client';

import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { go } from '@codemirror/lang-go';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEffect, useMemo, useState } from 'react';

function languageExtension(language: string) {
  const key = language.toLowerCase();
  if (key === 'javascript' || key === 'js') return javascript({ jsx: true });
  if (key === 'typescript' || key === 'ts') return javascript({ typescript: true, jsx: true });
  if (key === 'c' || key === 'cpp' || key === 'c++' || key === 'csharp' || key === 'c#') return cpp();
  if (key === 'java') return java();
  if (key === 'python') return python();
  if (key === 'sql') return sql();
  if (key === 'json') return json();
  if (key === 'html' || key === 'markup') return html();
  if (key === 'css') return css();
  if (key === 'rust') return rust();
  if (key === 'go') return go();
  return [];
}

export default function CodeEditorCodeMirror({ value, language, onChange }: { value: string; language: string; onChange: (value: string) => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const extensions = useMemo(() => [languageExtension(language)], [language]);
  return <CodeMirror
    value={value}
    height="28rem"
    theme={theme === 'dark' ? oneDark : undefined}
    extensions={extensions}
    onChange={onChange}
    basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, highlightSelectionMatches: true, bracketMatching: true, closeBrackets: true, autocompletion: false, syntaxHighlighting: true }}
    className="codemirror-code-editor"
  />;
}
