'use client';

import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { aboutEditorReducer, aboutIsDirty, type AboutRecord, type AboutSectionRecord } from '@/lib/about';
import RichTextEditor from './rich-text-editor';
import { serializeRichText } from '@/lib/rich-text';
import MediaPositionEditor from './media-position-editor';

async function uploadMedia(file: File) {
  const payload = new FormData();
  payload.set('file', file);
  const response = await fetch('/api/admin/media', { method: 'POST', body: payload });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error ?? 'The image could not be uploaded.');
  return result.url;
}

export default function AboutBasicsEditor({ about, sections }: { about: AboutRecord | null; sections: AboutSectionRecord[] }) {
  const router = useRouter();
  const initial = { intro: about?.intro ?? '', sections, updatedAt: about?.updated_at ?? '' };
  const [state, dispatch] = useReducer(aboutEditorReducer, { current: initial, saved: initial });
  const { intro, sections: records } = state.current;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const dirty = aboutIsDirty(state);

  useEffect(() => {
    dispatch({ type: 'received', snapshot: { intro: about?.intro ?? '', sections, updatedAt: about?.updated_at ?? '' } });
  }, [about, sections]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-dirty', { detail: dirty }));
    const prevent = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', prevent);
    return () => {
      window.removeEventListener('beforeunload', prevent);
      window.dispatchEvent(new CustomEvent('admin-dirty', { detail: false }));
    };
  }, [dirty]);

  const edit = (current: typeof state.current) => {
    if (lock.current) return;
    dispatch({ type: 'edit', current });
    setNotice('');
    setError('');
  };
  const setRecords = (change: (current: AboutSectionRecord[]) => AboutSectionRecord[]) => {
    edit({ ...state.current, sections: change(records) });
  };
  const updateSection = (id: string, key: keyof AboutSectionRecord, value: string | number) => {
    setRecords((current) => current.map((section) => section.id === id ? { ...section, [key]: value } : section));
  };

  const saveAbout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current || !dirty) return;
    if (records.some((section) => !section.label.trim() || !section.heading.trim())) {
      setError('Every section needs a label and heading.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'about', intro, sections: records }),
      });
      const result = await response.json() as { error?: string; record?: AboutRecord; sections?: AboutSectionRecord[] };
      if (!response.ok || !result.record || !Array.isArray(result.sections)) {
        throw new Error(result.error ?? 'About could not be saved. Your edits are still here.');
      }
      dispatch({ type: 'saved', snapshot: { intro: result.record.intro, sections: result.sections, updatedAt: result.record.updated_at } });
      setExpandedId((current) => current?.startsWith('new-') ? current.slice(4) : current);
      setNotice('About saved. Public page updated.');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'About could not be saved. Your edits are still here.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const createSection = async () => {
    const section: AboutSectionRecord = {
      id: `new-${crypto.randomUUID()}`, about_id: 1, label: '', heading: '', body: '',
      media_reference: null, media_alt: '', media_position: 'left', media_shape: 'portrait',
      media_position_x: 50, media_position_y: 50,
      meta: '', sort_order: records.length, updated_at: '',
    };
    setRecords((current) => [...current, section]);
    setExpandedId(section.id);
    setError('');
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    setRecords((current) => {
      const index = current.findIndex((section) => section.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((section, order) => ({ ...section, sort_order: order }));
    });
  };

  const removeSection = (id: string) => {
    const section = records.find((item) => item.id === id);
    if (section && !section.id.startsWith('new-') && !window.confirm('Delete this About section permanently?')) return;
    setRecords((current) => current.filter((item) => item.id !== id).map((item, order) => ({ ...item, sort_order: order })));
    setExpandedId(null);
  };

  const uploadSectionImage = async (id: string, file: File) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const reference = await uploadMedia(file);
      dispatch({ type: 'edit', current: { ...state.current, sections: records.map(section => section.id === id ? { ...section, media_reference: reference } : section) } });
      setNotice('Image uploaded. Save About to publish it.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The image could not be uploaded.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <fieldset className="about-basics-editor admin-editor-fieldset" disabled={busy} aria-busy={busy}>
      <header className="about-admin-header">
        <div><span>Content management / 03</span><h2>About editor</h2><p>Manage the About Me page and its introduction.</p></div>
        <a href="/about" target="_blank" rel="noreferrer">Preview page ↗</a>
      </header>

      <form id="about-settings-form" className="about-settings-panel" onSubmit={saveAbout}>
        <div className="about-settings-copy"><span>Page settings</span><p>Public introduction shown at the top of About Me.</p></div>
        <label><span>Introduction</span><RichTextEditor value={intro} onChange={(value) => edit({ ...state.current, intro: serializeRichText(value) })} /></label>
      </form>

      <div className="about-basic-sections">
        <section className="about-basic-list">
          <div className="about-basic-list-heading"><span>Content workspace</span><h3>About sections</h3></div>
          {records.length ? records.map((section, index) => <article className="about-basic-accordion" key={section.id}>
            <button type="button" className="about-basic-row" onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}>
              <strong>{String(index + 1).padStart(2, '0')}</strong><span>{section.heading || 'Untitled section'}</span><small>{section.media_shape} · {section.media_position}</small>
            </button>
            {expandedId === section.id && <div className="about-basic-expanded">
              <div className="about-admin-fields">
                <label><span>Section label</span><input value={section.label} onChange={(event) => updateSection(section.id, 'label', event.target.value)} /></label>
                <label><span>Heading</span><input value={section.heading} onChange={(event) => updateSection(section.id, 'heading', event.target.value)} /></label>
                <div className="about-admin-body"><span>Body</span><RichTextEditor value={section.body} onChange={(value) => updateSection(section.id, 'body', serializeRichText(value))} /></div>
                <label><span>Meta label</span><input value={section.meta} onChange={(event) => updateSection(section.id, 'meta', event.target.value)} /></label>
                <div className="about-admin-media">
                  <MediaPositionEditor src={section.media_reference ?? ''} x={section.media_position_x ?? 50} y={section.media_position_y ?? 50} alt={section.media_alt} label="ABOUT IMAGE FOCAL POSITION" aspectRatio={section.media_shape === 'portrait' ? '4 / 5' : section.media_shape === 'square' ? '1' : '16 / 10'} onChange={(x, y) => { updateSection(section.id, 'media_position_x', x); updateSection(section.id, 'media_position_y', y); }} onUpload={(file) => uploadSectionImage(section.id, file)} onRemove={() => updateSection(section.id, 'media_reference', '')} onAltChange={(alt) => updateSection(section.id, 'media_alt', alt)} />
                  <label><span>Image position</span><select value={section.media_position} onChange={(event) => updateSection(section.id, 'media_position', event.target.value)}><option value="left">Left</option><option value="right">Right</option></select></label>
                  <label><span>Image format</span><select value={section.media_shape} onChange={(event) => updateSection(section.id, 'media_shape', event.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="square">Square</option></select></label>
                </div>
              </div>
              <div className="about-basic-expanded-actions">
                <button type="button" onClick={() => moveSection(section.id, -1)} disabled={index === 0}>↑ Move up</button>
                <button type="button" onClick={() => moveSection(section.id, 1)} disabled={index === records.length - 1}>↓ Move down</button>
                <button type="button" className="admin-experience-delete" onClick={() => removeSection(section.id)}>Delete section</button>
              </div>
            </div>}
          </article>) : <div className="about-basic-empty"><strong>No About sections yet</strong><p>Create sections to build the public About page.</p></div>}
          <button className="about-basic-add" type="button" onClick={createSection}>+ Add new section</button>
        </section>
      </div>
      <div className="admin-profile-actions about-settings-actions">
        <div><p className="admin-profile-error" role="alert">{error}</p><p className="admin-profile-notice" role="status">{notice}</p><small>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</small></div>
        <button className="admin-profile-reset" type="button" onClick={() => { dispatch({ type: 'reset' }); setExpandedId(null); setError(''); setNotice(''); }} disabled={!dirty}>Reset changes</button>
        <button className="admin-profile-save" form="about-settings-form" type="submit" disabled={!dirty}><span>{busy ? 'Saving…' : 'Save About'}</span><span aria-hidden="true">→</span></button>
      </div>
    </fieldset>
  );
}

