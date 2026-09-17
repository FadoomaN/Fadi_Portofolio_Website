'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContentManager from './content-manager';
import type { Thread } from '@/lib/content';

type PanelId = 'overview' | 'profile' | 'about' | 'threads' | 'career' | 'contact' | 'security';

type AboutRecord = {
  id: number;
  title: string;
  intro: string;
  body: string;
  sections: unknown[];
  media_reference: string | null;
  updated_at: string;
};

type AboutSectionRecord = {
  id: string;
  about_id: number;
  label: string;
  heading: string;
  body: string;
  media_reference: string | null;
  media_alt: string;
  media_position: 'left' | 'right';
  media_shape: 'portrait' | 'landscape' | 'square';
  meta: string;
  sort_order: number;
  updated_at: string;
};

type PublicContactRecord = {
  id: number;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  cv_url: string | null;
  updated_at: string;
};

type ProfileRecord = {
  first_name: string;
  last_name: string;
  role: string;
  kicker: string;
  portrait_media_reference: string | null;
  portrait_alt: string;
  portrait_object_position: 'center' | 'top' | 'bottom';
  updated_at: string;
};

type PrivateContactRecord = {
  operations_email: string | null;
  phone_number: string | null;
  timezone: string;
  updated_at: string;
};

type ExperienceRecord = {
  id: string;
  organization: string;
  role: string;
  employment_type: string;
  location: string;
  summary: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  status: string;
  sort_order: number;
  updated_at: string;
};

type AdminWorkspaceProps = {
  experiences: ExperienceRecord[];
  threads: Thread[];
  categories: {id:string;name:string}[];
  threadCount: number;
  loadError?: string;
  about: AboutRecord | null;
  aboutSections: AboutSectionRecord[];
  publicContact: PublicContactRecord | null;
  experienceCount: number;
  profile: ProfileRecord | null;
  privateContact: PrivateContactRecord | null;
};

type ExperienceFormState = {
  organization: string;
  role: string;
  employmentType: string;
  location: string;
  summary: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: string;
  sortOrder: string;
};

type ProfileFormState = {
  firstName: string;
  lastName: string;
  role: string;
  kicker: string;
  portraitMediaReference: string;
  portraitAlt: string;
  portraitObjectPosition: 'center' | 'top' | 'bottom';
  operationsEmail: string;
  phoneNumber: string;
  timezone: string;
};

const DEFAULT_PORTRAIT_REFERENCE = '/fadi-gray-suit.jpg';
const DEFAULT_PORTRAIT_ALT = 'Fadi Al Hazim wearing a gray suit';

const menuItems: Array<{ id: PanelId; index: string; label: string }> = [
  { id: 'overview', index: '01', label: 'Overview' },
  { id: 'profile', index: '02', label: 'Profile' },
  { id: 'about', index: '03', label: 'About' },
  { id: 'threads', index: '04', label: 'Threads' },
  { id: 'career', index: '05', label: 'Career' },
  { id: 'contact', index: '06', label: 'Contact' },
  { id: 'security', index: '07', label: 'Security' },
];

const EMPTY_EXPERIENCE: ExperienceFormState = {
  organization: '',
  role: '',
  employmentType: 'full-time',
  location: '',
  summary: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  status: 'draft',
  sortOrder: '0',
};

const employmentTypes = [
  ['full-time', 'Full-time'],
  ['part-time', 'Part-time'],
  ['internship', 'Internship'],
  ['contract', 'Contract'],
  ['freelance', 'Freelance'],
  ['education', 'Education'],
  ['other', 'Other'],
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

async function uploadMedia(file: File) {
  const payload = new FormData();
  payload.set('file', file);
  const response = await fetch('/api/admin/media', { method: 'POST', body: payload });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error ?? 'The image could not be uploaded.');
  return result.url;
}


function experienceToForm(record: ExperienceRecord): ExperienceFormState {
  return {
    organization: record.organization,
    role: record.role,
    employmentType: record.employment_type,
    location: record.location,
    summary: record.summary,
    startDate: record.start_date,
    endDate: record.end_date ?? '',
    isCurrent: record.is_current,
    status: record.status,
    sortOrder: String(record.sort_order),
  };
}

function experiencePeriod(record: ExperienceRecord) {
  const start = record.start_date.slice(0, 4);
  const end = record.is_current ? 'Present' : record.end_date?.slice(0, 4) ?? '—';
  return `${start} / ${end}`;
}

function ExperienceEditor({ experiences }: { experiences: ExperienceRecord[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(experiences);
  const [selectedId, setSelectedId] = useState<string | null>(experiences[0]?.id ?? null);
  const firstForm = experiences[0] ? experienceToForm(experiences[0]) : EMPTY_EXPERIENCE;
  const [savedForm, setSavedForm] = useState<ExperienceFormState>(firstForm);
  const [form, setForm] = useState<ExperienceFormState>(firstForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const hasChanges = (Object.keys(form) as Array<keyof ExperienceFormState>)
    .some((key) => form[key] !== savedForm[key]);

  const clearFeedback = () => {
    setError('');
    setNotice('');
    setDeleteArmed(false);
  };

  const selectRecord = (record: ExperienceRecord) => {
    const nextForm = experienceToForm(record);
    setSelectedId(record.id);
    setSavedForm(nextForm);
    setForm(nextForm);
    clearFeedback();
  };

  const startNewRecord = () => {
    setSelectedId(null);
    setSavedForm(EMPTY_EXPERIENCE);
    setForm(EMPTY_EXPERIENCE);
    clearFeedback();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const key = event.target.name as keyof ExperienceFormState;
    setForm((current) => ({ ...current, [key]: event.target.value }));
    clearFeedback();
  };

  const handleCurrentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isCurrent = event.target.checked;
    setForm((current) => ({ ...current, isCurrent, endDate: isCurrent ? '' : current.endDate }));
    clearFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setDeleteArmed(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: selectedId }),
      });
      const result = (await response.json()) as { error?: string; experience?: ExperienceRecord };

      if (!response.ok || !result.experience) {
        setError(result.error ?? 'The experience could not be saved.');
        return;
      }

      const savedRecord = result.experience;
      const nextRecords = selectedId
        ? records.map((record) => record.id === savedRecord.id ? savedRecord : record)
        : [savedRecord, ...records];
      const nextForm = experienceToForm(savedRecord);

      setRecords(nextRecords);
      setSelectedId(savedRecord.id);
      setSavedForm(nextForm);
      setForm(nextForm);
      const statusNotice = savedRecord.status === 'published'
        ? 'Experience published and visible on the Experience page.'
        : savedRecord.status === 'archived'
          ? 'Experience archived and hidden from the public site.'
          : 'Experience saved as draft. It is not visible publicly.';
      setNotice(statusNotice);
      router.refresh();
    } catch {
      setError('Connection unavailable. Your changes were not saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setNotice('Press delete again to confirm.');
      return;
    }

    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/experiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'The experience could not be deleted.');
        return;
      }

      const nextRecords = records.filter((record) => record.id !== selectedId);
      setRecords(nextRecords);
      if (nextRecords[0]) selectRecord(nextRecords[0]);
      else startNewRecord();
      setNotice('Experience deleted.');
      router.refresh();
    } catch {
      setError('Connection unavailable. The experience was not deleted.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-experience-manager">
      <aside className="admin-experience-browser" aria-label="Saved experiences">
        <div className="admin-experience-toolbar">
          <span>{String(records.length).padStart(2, '0')} records</span>
          <button type="button" onClick={startNewRecord}>+ New</button>
        </div>
        <div className="admin-experience-list">
          {records.length ? records.map((record) => (
            <button
              className={selectedId === record.id ? 'is-active' : ''}
              type="button"
              onClick={() => selectRecord(record)}
              key={record.id}
            >
              <span>{record.status.toUpperCase()}</span>
              <strong>{record.role}</strong>
              <small>{record.organization}</small>
              <time>{experiencePeriod(record)}</time>
            </button>
          )) : (
            <p className="admin-experience-list-empty">No experience records yet.</p>
          )}
        </div>
      </aside>

      <form className="admin-experience-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-experience-form-heading">
          <div>
            <span>{selectedId ? 'Editing record' : 'New record'}</span>
            <h3>{form.role || 'Untitled experience'}</h3>
          </div>
          <div className="admin-experience-publication-state">
            <span>Publication status</span>
            <i className={`admin-experience-status is-${form.status}`}>{form.status.toUpperCase()}</i>
            <small>{form.status === 'published' ? 'Visible on /experiences.' : form.status === 'archived' ? 'Archived and hidden from the public site.' : 'Draft — admin only, not visible publicly.'}</small>
          </div>
        </div>

        <div className="admin-experience-fields">
          <label className="admin-experience-field">
            <span>Role</span>
            <input name="role" value={form.role} onChange={handleChange} maxLength={140} required />
          </label>
          <label className="admin-experience-field">
            <span>Organization</span>
            <input name="organization" value={form.organization} onChange={handleChange} maxLength={140} required />
          </label>
          <label className="admin-experience-field">
            <span>Type</span>
            <select name="employmentType" value={form.employmentType} onChange={handleChange}>
              {employmentTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="admin-experience-field">
            <span>Location</span>
            <input name="location" value={form.location} onChange={handleChange} maxLength={140} placeholder="Malmö, Sweden / Remote" />
          </label>
          <label className="admin-experience-field">
            <span>Start date</span>
            <input name="startDate" value={form.startDate} onChange={handleChange} type="date" required />
          </label>
          <label className="admin-experience-field">
            <span>End date</span>
            <input name="endDate" value={form.endDate} onChange={handleChange} type="date" disabled={form.isCurrent} />
          </label>
          <label className="admin-experience-current">
            <input type="checkbox" checked={form.isCurrent} onChange={handleCurrentChange} />
            <span>Current position</span>
          </label>
          <label className="admin-experience-field">
            <span>Publication status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="admin-experience-field">
            <span>Sort order</span>
            <input name="sortOrder" value={form.sortOrder} onChange={handleChange} type="number" min="-9999" max="9999" step="1" />
          </label>
          <label className="admin-experience-field admin-experience-summary">
            <span>Summary</span>
            <textarea name="summary" value={form.summary} onChange={handleChange} maxLength={2000} rows={5} placeholder="What you built, learned or contributed." />
            <small>{form.summary.length} / 2000</small>
          </label>
        </div>

        <div className="admin-experience-actions">
          <div>
            <p className="admin-profile-error" role="alert" aria-live="polite">{error}</p>
            <p className="admin-profile-notice" role="status" aria-live="polite">{notice}</p>
          </div>
          {selectedId && (
            <button
              className={`admin-experience-delete${deleteArmed ? ' is-armed' : ''}`}
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {deleteArmed ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <button
            className="admin-profile-reset"
            type="button"
            onClick={() => setForm(savedForm)}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </button>
          <button className="admin-profile-save" type="submit" disabled={!hasChanges || isSaving}>
            <span>{isSaving ? 'Saving…' : selectedId ? 'Save changes' : 'Create record'}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileEditor({
  profile,
  privateContact,
}: {
  profile: ProfileRecord | null;
  privateContact: PrivateContactRecord | null;
}) {
  const router = useRouter();
  const initialForm = useMemo<ProfileFormState>(() => ({
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    role: profile?.role ?? '',
    kicker: profile?.kicker ?? '',
    portraitMediaReference: profile?.portrait_media_reference || DEFAULT_PORTRAIT_REFERENCE,
    portraitAlt: profile?.portrait_alt || DEFAULT_PORTRAIT_ALT,
    portraitObjectPosition: profile?.portrait_object_position ?? 'center',
    operationsEmail: privateContact?.operations_email ?? '',
    phoneNumber: privateContact?.phone_number ?? '',
    timezone: privateContact?.timezone ?? 'Europe/Stockholm',
  }), [profile, privateContact]);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const hasChanges = (Object.keys(form) as Array<keyof ProfileFormState>)
    .some((key) => form[key] !== savedForm[key]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const key = event.target.name as keyof ProfileFormState;
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
    setNotice('');
  };

  const handleReset = () => {
    setForm(savedForm);
    setError('');
    setNotice('');
  };

  const handlePortraitUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadMedia(file);
      setForm((current) => ({ ...current, portraitMediaReference: url }));
      setNotice('Portrait uploaded. Save profile to persist it.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The portrait could not be uploaded.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string; profile?: ProfileRecord };

      if (!response.ok) {
        setError(result.error ?? 'The profile could not be saved.');
        return;
      }

      setSavedForm(form);
      setNotice('Profile saved. Public changes are now live.');
      router.refresh();
    } catch {
      setError('Connection unavailable. Your changes were not saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const lastUpdated = privateContact?.updated_at ?? profile?.updated_at;

  return (
    <form className="admin-profile-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="admin-profile-section">
        <legend>
          <span>01</span>
          <strong>Public identity</strong>
          <small>Visible on the website</small>
        </legend>

        <div className="admin-profile-fields">
          <label className="admin-profile-field">
            <span>First name</span>
            <input name="firstName" value={form.firstName} onChange={handleChange} maxLength={80} autoComplete="given-name" required />
          </label>
          <label className="admin-profile-field">
            <span>Last name</span>
            <input name="lastName" value={form.lastName} onChange={handleChange} maxLength={80} autoComplete="family-name" required />
          </label>
          <label className="admin-profile-field">
            <span>Professional title</span>
            <input name="role" value={form.role} onChange={handleChange} maxLength={120} autoComplete="organization-title" required />
          </label>
          <label className="admin-profile-field">
            <span>Introduction label</span>
            <input name="kicker" value={form.kicker} onChange={handleChange} maxLength={80} required />
          </label>
          <label className="admin-profile-field">
            <span>Portrait</span>
            <div className="admin-profile-upload">
              <div className="admin-media-preview is-portrait">
                {form.portraitMediaReference ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.portraitMediaReference} alt={form.portraitAlt} style={{ objectPosition: form.portraitObjectPosition }} />
                ) : <span>No portrait selected.</span>}
              </div>
              <label className="admin-upload-button">
                {isUploading ? 'Uploading…' : 'Choose image'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePortraitUpload} disabled={isUploading} />
              </label>
              <button type="button" className="admin-profile-reset" onClick={() => setForm((current) => ({ ...current, portraitMediaReference: '' }))}>
                Remove image
              </button>
              <input name="portraitMediaReference" value={form.portraitMediaReference} onChange={handleChange} aria-label="Portrait media reference" />
            </div>
          </label>
          <label className="admin-profile-field">
            <span>Portrait alt text</span>
            <input name="portraitAlt" value={form.portraitAlt} onChange={handleChange} maxLength={180} />
          </label>
          <label className="admin-profile-field">
            <span>Portrait crop</span>
            <select name="portraitObjectPosition" value={form.portraitObjectPosition} onChange={handleChange}>
              <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-profile-section admin-profile-private">
        <legend>
          <span>02</span>
          <strong>Private operations</strong>
          <small>Admin and database only</small>
        </legend>

        <div className="admin-profile-fields">
          <label className="admin-profile-field">
            <span>Operations email</span>
            <input
              name="operationsEmail"
              value={form.operationsEmail}
              onChange={handleChange}
              type="email"
              maxLength={254}
              autoComplete="email"
              placeholder="name@gmail.com"
            />
            <small>For internal requests and future notifications.</small>
          </label>
          <label className="admin-profile-field">
            <span>Phone number</span>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              type="tel"
              autoComplete="tel"
              placeholder="+46701234567"
            />
            <small>Use international format beginning with +.</small>
          </label>
          <label className="admin-profile-field admin-profile-field-timezone">
            <span>Timezone</span>
            <select name="timezone" value={form.timezone} onChange={handleChange}>
              <option value="Europe/Stockholm">Europe / Stockholm</option>
              <option value="UTC">UTC</option>
            </select>
            <small>Used when requests and content receive timestamps.</small>
          </label>
          <div className="admin-profile-privacy">
            <span aria-hidden="true">LOCK / RLS</span>
            <strong>Private fields are isolated</strong>
            <p>Email and phone are never selected or rendered by public pages.</p>
          </div>
        </div>
      </fieldset>

      <div className="admin-profile-actions">
        <div>
          <p className="admin-profile-error" role="alert" aria-live="polite">{error}</p>
          <p className="admin-profile-notice" role="status" aria-live="polite">{notice}</p>
          {!error && !notice && (
            <small>{lastUpdated ? `Last saved ${formatDate(lastUpdated)}` : 'Not saved yet'}</small>
          )}
        </div>
        <button className="admin-profile-reset" type="button" onClick={handleReset} disabled={!hasChanges || isSaving}>
          Reset changes
        </button>
        <button className="admin-profile-save" type="submit" disabled={!hasChanges || isSaving}>
          <span>{isSaving ? 'Saving profile…' : 'Save profile'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function AboutEditor({ about, sections }: { about: AboutRecord | null; sections: AboutSectionRecord[] }) {
  const [settings, setSettings] = useState({ title: about?.title ?? 'ABOUT', intro: about?.intro ?? '' });
  const [savedSettings, setSavedSettings] = useState(settings);
  const [records, setRecords] = useState(sections);
  const [selectedId, setSelectedId] = useState<string | null>(sections[0]?.id ?? null);
  const [draft, setDraft] = useState<AboutSectionRecord | null>(sections[0] ?? null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectSection = (section: AboutSectionRecord) => {
    setSelectedId(section.id);
    setDraft(section);
    setError('');
    setNotice('');
  };
  const updateDraft = (key: keyof AboutSectionRecord, value: string | number) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };
  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'about', title: settings.title, intro: settings.intro, body: about?.body ?? '' }) });
    const result = await response.json() as { error?: string; record?: AboutRecord };
    if (!response.ok) setError(result.error ?? 'Page settings could not be saved.');
    else { setSavedSettings(settings); setNotice('Page settings saved.'); }
  };
  const saveSection = async () => {
    if (!draft) return;
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'about-section', id: draft.id, label: draft.label, heading: draft.heading, body: draft.body, mediaReference: draft.media_reference, mediaAlt: draft.media_alt, mediaPosition: draft.media_position, mediaShape: draft.media_shape, meta: draft.meta, sortOrder: draft.sort_order }) });
    const result = await response.json() as { error?: string; record?: AboutSectionRecord };
    if (!response.ok || !result.record) setError(result.error ?? 'Section could not be saved.');
    else { setRecords((current) => current.map((item) => item.id === result.record?.id ? result.record as AboutSectionRecord : item)); setDraft(result.record); setNotice('Section saved.'); }
  };
  const createSection = async () => {
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'about-section', title: 'New section', label: 'New section', heading: '', body: '', mediaPosition: 'right', mediaShape: 'landscape', sortOrder: records.length }) });
    const result = await response.json() as { record?: AboutSectionRecord; error?: string };
    if (!response.ok || !result.record) setError(result.error ?? 'Section could not be created.');
    else { setRecords((current) => [...current, result.record as AboutSectionRecord]); selectSection(result.record as AboutSectionRecord); setNotice('New section created.'); }
  };
  const deleteSection = async () => {
    if (!draft?.id) return;
    const response = await fetch('/api/admin/content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'about-section', id: draft.id }) });
    if (!response.ok) setError('Section could not be deleted.');
    else { const next = records.filter((item) => item.id !== draft.id); setRecords(next); setDraft(next[0] ?? null); setSelectedId(next[0]?.id ?? null); setNotice('Section deleted.'); }
  };
  const uploadSectionImage = async (file: File) => {
    if (!draft) return;
    try { updateDraft('media_reference', await uploadMedia(file)); setNotice('Image uploaded. Save section to persist it.'); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'The image could not be uploaded.'); }
  };

  return <div className="about-admin-editor">
    <header className="about-admin-header"><div><span>Content management / 03</span><h2>About editor</h2><p>Manage the About page and its editorial sections.</p></div><a href="/about" target="_blank" rel="noreferrer">Preview page ↗</a></header>
    <form className="about-admin-settings" onSubmit={saveSettings}><div><span>Page settings</span><p>These fields control the public About introduction.</p></div><label><span>Page title</span><input value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} /></label><label><span>Intro paragraph</span><textarea rows={3} value={settings.intro} onChange={(event) => setSettings({ ...settings, intro: event.target.value })} /></label><button className="admin-profile-save" type="submit" disabled={settings.title === savedSettings.title && settings.intro === savedSettings.intro}>Save settings</button></form>
    <div className="about-admin-sections"><aside className="about-admin-browser"><div className="about-admin-browser-heading"><div><span>Repeatable content</span><h3>About sections</h3></div><button type="button" onClick={createSection}>+ New section</button></div>{records.map((section, index) => <button type="button" className={selectedId === section.id ? 'is-active' : ''} key={section.id} onClick={() => selectSection(section)}><strong>{String(index + 1).padStart(2, '0')}</strong><span>{section.heading || 'Untitled section'}</span><small>{section.media_shape} · {section.media_position}{section.media_reference ? ' · image' : ''}</small></button>)}{!records.length && <p className="admin-empty-state">No sections yet. Create the first one.</p>}</aside>
      <section className="about-admin-section-editor"><div className="about-admin-editor-heading"><div><span>Selected record</span><h3>Edit section</h3></div>{draft && <strong>{String((records.findIndex((item) => item.id === draft.id) + 1)).padStart(2, '0')}</strong>}</div>{draft ? <div className="about-admin-fields"><label><span>Section label</span><input value={draft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label><label><span>Heading</span><input value={draft.heading} onChange={(event) => updateDraft('heading', event.target.value)} /></label><label className="about-admin-body"><span>Body / paragraph</span><textarea rows={10} value={draft.body} onChange={(event) => updateDraft('body', event.target.value)} /></label><div className="about-admin-media"><div><span>Media</span><strong>{draft.media_reference ? 'Image attached' : 'No image attached'}</strong></div>{draft.media_reference && <div className={`admin-media-preview is-${draft.media_shape}`}><img src={draft.media_reference} alt={draft.media_alt} /></div>}<label className="admin-upload-button">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadSectionImage(file); }} /></label><label><span>Image alt text</span><input value={draft.media_alt} onChange={(event) => updateDraft('media_alt', event.target.value)} /></label><label><span>Image position</span><select value={draft.media_position} onChange={(event) => updateDraft('media_position', event.target.value)}><option value="left">Left</option><option value="right">Right</option></select></label><label><span>Image format</span><select value={draft.media_shape} onChange={(event) => updateDraft('media_shape', event.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="square">Square</option></select></label><label><span>Sort order</span><input type="number" value={draft.sort_order} onChange={(event) => updateDraft('sort_order', Number(event.target.value))} /></label></div><div className="about-admin-actions"><button type="button" className="admin-experience-delete" onClick={deleteSection}>Delete section</button><span className="admin-profile-notice">{notice}</span><button type="button" className="admin-profile-save" onClick={saveSection}>Save section</button></div></div> : <p className="admin-empty-state">Select a section or create a new one.</p>}</section>
    </div><p className="admin-profile-error" role="alert">{error}</p>
  </div>;
}

function AboutBasicsEditor({ about, sections }: { about: AboutRecord | null; sections: AboutSectionRecord[] }) {
  const [intro, setIntro] = useState(about?.intro ?? '');
  const [savedIntro, setSavedIntro] = useState(intro);
  const [records, setRecords] = useState(sections);
  const [savedRecords, setSavedRecords] = useState(sections);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const dirty = intro !== savedIntro || JSON.stringify(records) !== JSON.stringify(savedRecords);

  const updateSection = (id: string, key: keyof AboutSectionRecord, value: string | number) => {
    setRecords((current) => current.map((section) => section.id === id ? { ...section, [key]: value } : section));
  };

  const saveAbout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (records.some((section) => !section.label.trim() || !section.heading.trim())) {
      setError('Every section needs a label and heading.');
      return;
    }
    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'about', intro, sections: records }),
    });
    const result = await response.json() as { error?: string; record?: AboutRecord };
    if (!response.ok) setError(result.error ?? 'About introduction could not be saved.');
    else { setSavedIntro(intro); setSavedRecords(records); setNotice('About saved. Public page updated.'); setError(''); }
  };

  const createSection = async () => {
    const section: AboutSectionRecord = {
      id: `new-${crypto.randomUUID()}`, about_id: 1, label: '', heading: '', body: '',
      media_reference: null, media_alt: '', media_position: 'left', media_shape: 'portrait',
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
    try {
      const reference = await uploadMedia(file);
      updateSection(id, 'media_reference', reference);
      setNotice('Image uploaded. Save About to publish it.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The image could not be uploaded.');
    }
  };

  return (
    <div className="about-basics-editor">
      <header className="about-admin-header">
        <div><span>Content management / 03</span><h2>About editor</h2><p>Manage the About Me page and its introduction.</p></div>
        <a href="/about" target="_blank" rel="noreferrer">Preview page ↗</a>
      </header>

      <form id="about-settings-form" className="about-settings-panel" onSubmit={saveAbout}>
        <div className="about-settings-copy"><span>Page settings</span><p>Public introduction shown at the top of About Me.</p></div>
        <label><span>Intro paragraph</span><textarea rows={4} value={intro} onChange={(event) => setIntro(event.target.value)} /></label>
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
                <label className="about-admin-body"><span>Body</span><textarea rows={8} value={section.body} onChange={(event) => updateSection(section.id, 'body', event.target.value)} /></label>
                <label><span>Meta label</span><input value={section.meta} onChange={(event) => updateSection(section.id, 'meta', event.target.value)} /></label>
                <div className="about-admin-media">
                  {section.media_reference && <div className={`admin-media-preview is-${section.media_shape}`}><img src={section.media_reference} alt={section.media_alt} /></div>}
                  <label className="admin-upload-button">Upload / replace image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadSectionImage(section.id, file); }} /></label>
                  {section.media_reference && <button type="button" className="admin-profile-reset" onClick={() => updateSection(section.id, 'media_reference', '')}>Remove image</button>}
                  <label><span>Image alt text</span><input value={section.media_alt} onChange={(event) => updateSection(section.id, 'media_alt', event.target.value)} /></label>
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
        <div><p className="admin-profile-error" role="alert">{error}</p><p className="admin-profile-notice" role="status">{notice}</p>{!error && !notice && <small>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</small>}</div>
        <button className="admin-profile-reset" type="button" onClick={() => { setIntro(savedIntro); setRecords(savedRecords); setExpandedId(null); setError(''); setNotice(''); }} disabled={!dirty}>Reset changes</button>
        <button className="admin-profile-save" form="about-settings-form" type="submit" disabled={!dirty}><span>Save About</span><span aria-hidden="true">→</span></button>
      </div>
    </div>
  );
}

function ContactEditor({ contact }: { contact: PublicContactRecord | null }) {
  const [form, setForm] = useState({ email: contact?.email ?? '', githubUrl: contact?.github_url ?? '', linkedinUrl: contact?.linkedin_url ?? '', cvUrl: contact?.cv_url ?? '' });
  const [notice, setNotice] = useState('');
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'contact', ...form }) });
    setNotice(response.ok ? 'Public contact settings saved.' : 'Contact settings could not be saved.');
  };
  return <form className="admin-profile-form" onSubmit={save}><fieldset className="admin-profile-section"><legend><span>Public contact only</span><strong>RLS</strong></legend><div className="admin-profile-fields"><label className="admin-profile-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="admin-profile-field"><span>GitHub</span><input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} /></label><label className="admin-profile-field"><span>LinkedIn</span><input value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} /></label><label className="admin-profile-field"><span>CV / resume</span><input value={form.cvUrl} onChange={(event) => setForm({ ...form, cvUrl: event.target.value })} /></label></div></fieldset><div className="admin-profile-actions"><p className="admin-profile-notice" role="status">{notice}</p><button className="admin-profile-save" type="submit">Save Contact</button></div></form>;
}

export default function AdminWorkspace({
  experiences,
  threads,
  categories,
  threadCount,
  loadError,
  about,
  aboutSections,
  publicContact,
  experienceCount,
  profile,
  privateContact,
}: AdminWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<PanelId>('overview');
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const compactToggleRef = useRef<HTMLButtonElement>(null);
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);
  useEffect(() => {
    const listener = (event: Event) => setHasUnsavedContent(Boolean((event as CustomEvent).detail));
    window.addEventListener('admin-dirty', listener);
    return () => window.removeEventListener('admin-dirty', listener);
  }, []);
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === activePanel) ?? menuItems[0],
    [activePanel],
  );
  const choosePanel = (id: PanelId) => {
    if (id !== activePanel && hasUnsavedContent && !window.confirm('Discard unsaved content changes?')) return;
    setActivePanel(id);
    setCompactMenuOpen(false);
  };

  return (
    <section className="admin-workspace" aria-label="Administrator workspace">
      <div className="admin-compact-navigation" onKeyDown={event => { if (event.key === 'Escape' && compactMenuOpen) { setCompactMenuOpen(false); compactToggleRef.current?.focus(); } }}>
        <button ref={compactToggleRef} type="button" className="admin-compact-toggle" aria-expanded={compactMenuOpen} aria-controls="admin-compact-menu" onClick={() => setCompactMenuOpen(open => !open)}>
          ADMIN / {activeItem.label} <span aria-hidden="true">{compactMenuOpen ? '▴' : '▾'}</span>
        </button>
        <nav id="admin-compact-menu" className="admin-compact-menu" aria-label="Admin modules" hidden={!compactMenuOpen}>
          {menuItems.map(item => <button type="button" key={item.id} aria-current={activePanel === item.id ? 'page' : undefined} onClick={() => choosePanel(item.id)}>{item.label}</button>)}
          <form action="/api/auth/logout" method="post"><button type="submit">Sign out</button></form>
        </nav>
      </div>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-brand-mark" aria-hidden="true" />
          <div>
            <strong>CONTROL</strong>
            <small>NODE / 001</small>
          </div>
        </div>

        <nav className="admin-sidebar-menu" aria-label="Admin modules">
          {menuItems.map((item) => (
            <button
              className={activePanel === item.id ? 'is-active' : ''}
              type="button"
              aria-current={activePanel === item.id ? 'page' : undefined}
              aria-label={`Open ${item.label} window`}
              onClick={() => choosePanel(item.id)}
              key={item.id}
            >
              <span>{item.index}</span>
              <strong>{item.label}</strong>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-online"><i /> Online</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="admin-window">
        <header className="admin-window-bar">
          <span>{activeItem.index} / {activeItem.label}</span>
          <div className="admin-window-controls" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </header>

        <div className="admin-window-view" key={activePanel}>
          {loadError && <p role="alert" className="admin-profile-error">{loadError}</p>}
          {activePanel === 'overview' && (
            <div className="admin-overview-window">
              <div className="admin-overview-heading">
                <div>
                  <span>Private workspace</span>
                  <h1>ADMIN<br />SYSTEM</h1>
                </div>
                <p>One control surface.<br />Every module opens here.</p>
              </div>

              <div className="admin-quick-metrics">
                <article>
                  <span>Career</span>
                  <strong>{String(experienceCount).padStart(2, '0')}</strong>
                  <small>Database records</small>
                </article>
                <article>
                  <span>Threads</span>
                  <strong>{String(threadCount).padStart(2, '0')}</strong>
                  <small>Journey threads</small>
                </article>
                <article>
                  <span>Published</span>
                  <strong>{String(threads.filter((thread) => thread.status === 'published').length).padStart(2, '0')}</strong>
                  <small>Visible Journey threads</small>
                </article>
                <article>
                  <span>Drafts</span>
                  <strong>{String(threads.filter((thread) => thread.status === 'draft').length).padStart(2, '0')}</strong>
                  <small>Journey threads in progress</small>
                </article>
              </div>

              <div className="admin-system-strip">
                <span><i /> {loadError ? 'Connection needs attention' : 'Supabase connected'}</span>
                <span>RLS active</span>
                <span>Session encrypted</span>
              </div>
            </div>
          )}

          {activePanel === 'profile' && (
            <div className="admin-module-window"><div className="admin-module-heading"><div><span>Public identity / 02</span><h2>Profile</h2></div><strong>01</strong></div><ProfileEditor profile={profile} privateContact={privateContact} /></div>
          )}

          {activePanel === 'about' && (
            <div className="admin-module-window admin-about-window"><AboutBasicsEditor about={about} sections={aboutSections} /></div>
          )}

          {activePanel === 'threads' && (
            <div className="admin-module-window admin-journey-window"><ContentManager initialThreads={threads} initialCategories={categories} /></div>
          )}

          {activePanel === 'career' && (
            <div className="admin-module-window admin-experience-window">
              <div className="admin-module-heading">
                <div><span>Career module / 05</span><h2>Career</h2></div>
                <strong>{String(experienceCount).padStart(2, '0')}</strong>
              </div>
              <ExperienceEditor experiences={experiences} />
            </div>
          )}

          {activePanel === 'contact' && (
            <div className="admin-module-window"><div className="admin-module-heading"><div><span>Public channel / 07</span><h2>Contact</h2></div><strong>01</strong></div><ContactEditor contact={publicContact} /></div>
          )}

          {activePanel === 'security' && (
            <div className="admin-module-window">
              <div className="admin-module-heading">
                <div><span>Security module / 07</span><h2>Security</h2></div>
                <strong>01</strong>
              </div>
              <ProfileEditor profile={profile} privateContact={privateContact} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
