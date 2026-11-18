'use client';

import { useState } from 'react';
import type { FooterLink, FooterSettings } from '@/lib/footer';
import { footerIconOptions } from '@/lib/footer';

const emptyLink = (): FooterLink => ({ id: crypto.randomUUID(), label: '', url: 'https://', icon: 'link', newTab: true });

export default function FooterEditor({ settings }: { settings: FooterSettings | null }) {
  const [links, setLinks] = useState<FooterLink[]>(settings?.links ?? []);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (id: string, patch: Partial<FooterLink>) => setLinks((current) => current.map((link) => link.id === id ? { ...link, ...patch } : link));
  const move = (index: number, direction: -1 | 1) => setLinks((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice(''); setError('');
    try {
      const response = await fetch('/api/admin/footer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ links }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Footer links could not be saved.');
      setNotice('Footer links saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Footer links could not be saved.'); }
    finally { setSaving(false); }
  };
  return <form className="admin-footer-editor" onSubmit={save}>
    <header><div><span>Public identity / footer</span><h3>Footer links</h3><p>Only saved links appear on the public footer.</p></div><button type="button" onClick={() => setLinks((current) => [...current, emptyLink()])}>+ Add link</button></header>
    {!links.length && <p className="admin-footer-empty">No public links configured.</p>}
    <div className="admin-footer-list">{links.map((link, index) => <fieldset key={link.id}>
      <legend>{String(index + 1).padStart(2, '0')}</legend>
      <label><span>Label</span><input value={link.label} maxLength={80} onChange={(event) => update(link.id, { label: event.target.value })} /></label>
      <label><span>URL</span><input type="url" value={link.url} maxLength={500} onChange={(event) => update(link.id, { url: event.target.value })} /></label>
      <label><span>Icon</span><select value={link.icon} onChange={(event) => update(link.id, { icon: event.target.value })}>{footerIconOptions.map((icon) => <option value={icon} key={icon}>{icon}</option>)}</select></label>
      <label className="admin-footer-checkbox"><input type="checkbox" checked={link.newTab} onChange={(event) => update(link.id, { newTab: event.target.checked })} /><span>Open in new tab</span></label>
      <div><button type="button" disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === links.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" className="is-danger" onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}>Remove</button></div>
    </fieldset>)}</div>
    <footer><p className="admin-profile-error" role="alert">{error}</p><p className="admin-profile-notice" role="status">{notice}</p><button className="admin-profile-save" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save footer'}</button></footer>
  </form>;
}
