'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ContentManager from './content-manager';
import ProjectManager from './project-manager';
import ContactInbox from './contact-inbox';
import SecurityCenter from './security-center';
import AboutBasicsEditor from './about-editor';
import FooterEditor from './footer-editor';
import RichTextEditor from './rich-text-editor';
import { serializeRichText } from '@/lib/rich-text';
import type { AboutRecord, AboutSectionRecord } from '@/lib/about';
import type { FooterSettings } from '@/lib/footer';
import type { Thread } from '@/lib/content';
import type { Project } from '@/lib/projects';

type PanelId = 'overview' | 'news' | 'profile' | 'about' | 'threads' | 'career' | 'contact' | 'security';
type NewsRecord = { id:string; slug:string; title:string; body:string; media_reference:string|null; media_alt:string|null; published_at:string; created_at:string; updated_at:string };

type PublicContactRecord = {
  id: number;
  email: string | null;
  phone_number: string | null;
  show_email: boolean;
  show_phone: boolean;
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
  news: NewsRecord[];
  projects: Project[];
  footer: FooterSettings | null;
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
};

type NewsFormState = { title:string; slug:string; body:string; mediaMode:'none'|'image'; mediaReference:string; mediaAlt:string };

const DEFAULT_PORTRAIT_REFERENCE = '/fadi-gray-suit.jpg';
const DEFAULT_PORTRAIT_ALT = 'Fadi Al Hazim wearing a gray suit';

const menuItems: Array<{ id: PanelId; index: string; label: string }> = [
  { id: 'overview', index: '01', label: 'Overview' },
  { id: 'news', index: '02', label: 'Post News' },
  { id: 'profile', index: '03', label: 'Profile' },
  { id: 'about', index: '04', label: 'About' },
  { id: 'threads', index: '05', label: 'Threads' },
  { id: 'career', index: '06', label: 'Career' },
  { id: 'contact', index: '07', label: 'Contact' },
  { id: 'security', index: '08', label: 'Security' },
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

const EMPTY_NEWS: NewsFormState = { title:'', slug:'', body:'', mediaMode:'none', mediaReference:'', mediaAlt:'' };

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
            <RichTextEditor value={form.summary} onChange={(value) => setForm((current) => ({ ...current, summary: serializeRichText(value) }))} />
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

function ProfileEditor({ profile }: { profile: ProfileRecord | null }) {
  const router = useRouter();
  const initialForm = useMemo<ProfileFormState>(() => ({
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    role: profile?.role ?? '',
    kicker: profile?.kicker ?? '',
    portraitMediaReference: profile?.portrait_media_reference || DEFAULT_PORTRAIT_REFERENCE,
    portraitAlt: profile?.portrait_alt || DEFAULT_PORTRAIT_ALT,
    portraitObjectPosition: profile?.portrait_object_position ?? 'center',
  }), [profile]);
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

  const lastUpdated = profile?.updated_at;

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

function ContactEditor({ contact }: { contact: PublicContactRecord | null }) {
  const [form, setForm] = useState({ email: contact?.email ?? '', phoneNumber: contact?.phone_number ?? '', showEmail: contact?.show_email ?? false, showPhone: contact?.show_phone ?? false, githubUrl: contact?.github_url ?? '', linkedinUrl: contact?.linkedin_url ?? '', cvUrl: contact?.cv_url ?? '' });
  const [notice, setNotice] = useState('');
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'contact', ...form }) });
    setNotice(response.ok ? 'Public contact settings saved.' : 'Contact settings could not be saved.');
  };
  return (
    <form className="admin-profile-form admin-contact-settings" onSubmit={save}>
      <fieldset className="admin-profile-section">
        <legend><span>01</span><strong>Contact settings</strong><small>Public information</small></legend>
        <div className="admin-profile-fields">
          <label className="admin-profile-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="admin-profile-field"><span>Phone number</span><input type="tel" placeholder="+46701234567" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} /></label>
          <fieldset className="admin-profile-field admin-contact-visibility">
            <legend>Public visibility</legend>
            <label className="admin-toggle-control"><input type="checkbox" checked={form.showEmail} onChange={(event) => setForm({ ...form, showEmail: event.target.checked })} /><span aria-hidden="true" /><strong>Show email publicly</strong></label>
            <label className="admin-toggle-control"><input type="checkbox" checked={form.showPhone} onChange={(event) => setForm({ ...form, showPhone: event.target.checked })} /><span aria-hidden="true" /><strong>Show phone publicly</strong></label>
          </fieldset>
          <label className="admin-profile-field"><span>GitHub</span><input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} /></label>
          <label className="admin-profile-field"><span>LinkedIn</span><input value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} /></label>
          <label className="admin-profile-field"><span>CV / resume</span><input value={form.cvUrl} onChange={(event) => setForm({ ...form, cvUrl: event.target.value })} /></label>
        </div>
      </fieldset>
      <div className="admin-profile-actions"><p className="admin-profile-notice" role="status">{notice}</p><button className="admin-profile-save" type="submit">Save Contact</button></div>
    </form>
  );
}

function newsToForm(record: NewsRecord): NewsFormState {
  return { title:record.title, slug:record.slug, body:record.body, mediaMode:record.media_reference?'image':'none', mediaReference:record.media_reference ?? '', mediaAlt:record.media_alt ?? '' };
}

function NewsManager({ news }: { news: NewsRecord[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(news);
  const [selectedId, setSelectedId] = useState<string | null>(news[0]?.id ?? null);
  const [form, setForm] = useState<NewsFormState>(news[0] ? newsToForm(news[0]) : EMPTY_NEWS);
  const [savedForm, setSavedForm] = useState<NewsFormState>(news[0] ? newsToForm(news[0]) : EMPTY_NEWS);
  const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [deleteArmed, setDeleteArmed] = useState(false);
  const dirty = (Object.keys(form) as Array<keyof NewsFormState>).some(key => form[key] !== savedForm[key]);
  const resetFeedback = () => { setNotice(''); setError(''); setDeleteArmed(false); };
  const choose = (record: NewsRecord) => { const next = newsToForm(record); setSelectedId(record.id); setForm(next); setSavedForm(next); resetFeedback(); };
  const create = () => { setSelectedId(null); setForm(EMPTY_NEWS); setSavedForm(EMPTY_NEWS); resetFeedback(); };
  const update = <K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) => { setForm(current => ({ ...current, [key]: value })); resetFeedback(); };
  const setMediaMode = (mediaMode: NewsFormState['mediaMode']) => setForm(current => mediaMode==='none'?{...current,mediaMode,mediaReference:'',mediaAlt:''}:{...current,mediaMode});
  const upload = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { update('mediaReference', await uploadMedia(file)); setNotice('Image uploaded. Save the post to keep it.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'The image could not be uploaded.'); } finally { event.target.value=''; } };
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); resetFeedback(); try { const response = await fetch('/api/admin/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selectedId,...form})}); const result = await response.json() as {post?:NewsRecord;error?:string}; if(!response.ok||!result.post) throw new Error(result.error ?? 'The news post could not be saved.'); const post=result.post; setRecords(current => { const existing=current.findIndex(item=>item.id===post.id); return existing<0?[post,...current]:current.map(item=>item.id===post.id?post:item); }); const next=newsToForm(post); setSelectedId(post.id);setForm(next);setSavedForm(next);setNotice('News post saved.');router.refresh(); } catch(reason) { setError(reason instanceof Error ? reason.message : 'The news post could not be saved.'); } finally { setSaving(false); } };
  const remove = async () => { if(!selectedId) return; if(!deleteArmed){setDeleteArmed(true);setNotice('Select Delete again to confirm.');return;} setSaving(true);resetFeedback();try{const response=await fetch('/api/admin/news',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selectedId,confirmTitle:form.title})});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error??'The news post could not be deleted.');const next=records.filter(record=>record.id!==selectedId);setRecords(next);if(next[0])choose(next[0]);else create();setNotice('News post deleted.');router.refresh();}catch(reason){setError(reason instanceof Error?reason.message:'The news post could not be deleted.');}finally{setSaving(false);}};
  return <div className="admin-module-window admin-news-window"><div className="admin-module-heading"><div><span>News module / 02</span><h2>Post News</h2></div><strong>{String(records.length).padStart(2,'0')}</strong></div><div className="admin-news-manager"><aside><button type="button" className="admin-news-new" onClick={create}>+ New post</button>{records.map(record=><button type="button" className={selectedId===record.id?'is-active':''} onClick={()=>choose(record)} key={record.id}><strong>{record.title}</strong><span>{formatDate(record.published_at)}</span></button>)}</aside><form onSubmit={save}><div className="admin-news-form-heading"><span>{selectedId?'Edit post':'New post'}</span><a href={selectedId?`/news/${form.slug}`:'#'} target="_blank" rel="noreferrer" aria-disabled={!selectedId}>Preview ↗</a></div><label><span>Title</span><input required maxLength={180} value={form.title} onChange={event=>update('title',event.target.value)} /></label><label><span>URL slug</span><input required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={event=>update('slug',event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').replace(/--+/g,'-'))} /></label><label><span>Body</span><textarea rows={8} maxLength={12000} value={form.body} onChange={event=>update('body',event.target.value)} /></label><fieldset className="admin-news-media"><legend>Media</legend><div className="admin-news-media-choice"><button type="button" className={form.mediaMode==='none'?'is-active':''} onClick={()=>setMediaMode('none')}>No media</button><button type="button" className={form.mediaMode==='image'?'is-active':''} onClick={()=>setMediaMode('image')}>Image</button></div>{form.mediaMode==='image'&&<>{form.mediaReference&&<img src={form.mediaReference} alt={form.mediaAlt} />}<label className="admin-upload-button">{form.mediaReference?'Replace image':'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} /></label>{form.mediaReference&&<button type="button" className="admin-profile-reset" onClick={()=>setMediaMode('none')}>Remove image</button>}<label><span>Image alt text</span><input maxLength={300} value={form.mediaAlt} onChange={event=>update('mediaAlt',event.target.value)} /></label></>}</fieldset><div className="admin-profile-actions"><div><p className="admin-profile-error" role="alert">{error}</p><p className="admin-profile-notice" role="status">{notice}</p>{!error&&!notice&&<small>{dirty?'Unsaved changes':'Ready to post'}</small>}</div><button type="button" className="admin-profile-reset" onClick={()=>{setForm(savedForm);resetFeedback();}} disabled={!dirty||saving}>Reset</button>{selectedId&&<button type="button" className="admin-experience-delete" onClick={remove} disabled={saving}>{deleteArmed?'Confirm delete':'Delete'}</button>}<button className="admin-profile-save" type="submit" disabled={saving||!dirty}>{saving?'Saving…':selectedId?'Save changes':'Post News'}</button></div></form></div></div>;
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
  news,
  projects,
  footer,
}: AdminWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  const requestedPanel = (pathSegments[0] || 'overview') as PanelId;
  const activePanel = menuItems.some((item) => item.id === requestedPanel)
    ? requestedPanel
    : 'overview';
  const threadsView = pathSegments[1] === 'projects' ? 'projects' : 'journey';
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const compactToggleRef = useRef<HTMLButtonElement>(null);
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);
  useEffect(() => {
    const listener = (event: Event) => setHasUnsavedContent(Boolean((event as CustomEvent).detail));
    window.addEventListener('admin-dirty', listener);
    return () => window.removeEventListener('admin-dirty', listener);
  }, []);
  useEffect(() => {
    const openProjects = () => { router.push('/threads/projects'); setCompactMenuOpen(false); };
    window.addEventListener('open-projects', openProjects);
    const openJourney = () => { router.push('/threads/journey'); setCompactMenuOpen(false); };
    window.addEventListener('open-journey', openJourney);
    return () => { window.removeEventListener('open-projects', openProjects); window.removeEventListener('open-journey', openJourney); };
  }, [router]);
  const activeItem = menuItems.find((item) => item.id === activePanel) ?? menuItems[0];
  const choosePanel = (id: PanelId) => {
    if (id !== activePanel && hasUnsavedContent && !window.confirm('Discard unsaved content changes?')) return;
    router.push(id === 'overview' ? '/' : `/${id}`);
    setCompactMenuOpen(false);
  };

  return (
    <section className="admin-workspace" aria-label="Administrator workspace">
      <div className="admin-compact-navigation" onKeyDown={event => { if (event.key === 'Escape' && compactMenuOpen) { setCompactMenuOpen(false); compactToggleRef.current?.focus(); } }}>
        <button ref={compactToggleRef} type="button" className="admin-compact-toggle" aria-expanded={compactMenuOpen} aria-controls="admin-compact-menu" onClick={() => setCompactMenuOpen(open => !open)}>
          ADMIN / {activeItem.label} <span className="admin-compact-caret" aria-hidden="true">▾</span>
        </button>
        <nav id="admin-compact-menu" className={`admin-compact-menu${compactMenuOpen ? ' is-open' : ''}`} aria-label="Admin modules" aria-hidden={!compactMenuOpen} inert={!compactMenuOpen}>
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
          <span className="admin-session-label">Admin session</span>
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

        <div className="admin-window-view" key={`${activePanel}-${threadsView}`}>
          {loadError && <p role="alert" className="admin-profile-error">{loadError}</p>}
          {activePanel === 'overview' && (
            <div className="admin-overview-window">
              <div className="admin-overview-heading">
                <div>
                  <span>Private workspace</span>
                  <h1>ADMIN<br />SYSTEM</h1>
                </div>
                <p>Manage portfolio content,<br />publishing and private messages.</p>
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

          {activePanel === 'news' && <NewsManager news={news} />}

          {activePanel === 'profile' && (
            <div className="admin-module-window admin-profile-window"><div className="admin-module-heading"><div><span>Public identity / 03</span><h2>Profile</h2></div><strong>03</strong></div><ProfileEditor profile={profile} /><FooterEditor settings={footer} /></div>
          )}

          {activePanel === 'about' && (
            <div className="admin-module-window admin-about-window"><AboutBasicsEditor about={about} sections={aboutSections} /></div>
          )}

          {activePanel === 'threads' && (
            <div className="admin-module-window admin-journey-window">{threadsView === 'journey' ? <ContentManager initialThreads={threads} initialCategories={categories} /> : <ProjectManager initialProjects={projects} />}</div>
          )}

          {activePanel === 'career' && (
            <div className="admin-module-window admin-experience-window">
              <div className="admin-module-heading">
                <div><span>Career module / 06</span><h2>Career</h2></div>
                <strong>{String(experienceCount).padStart(2, '0')}</strong>
              </div>
              <ExperienceEditor experiences={experiences} />
            </div>
          )}

          {activePanel === 'contact' && (
            <div className="admin-module-window admin-contact-window"><div className="admin-module-heading"><div><span>Public channel / 07</span><h2>Contact</h2></div><strong>07</strong></div><ContactEditor contact={publicContact} /><ContactInbox /></div>
          )}

          {activePanel === 'security' && (
            <div className="admin-module-window admin-security-window"><div className="admin-module-heading"><div><span>Security module / 08</span><h2>Security</h2></div><strong>08</strong></div><SecurityCenter /></div>
          )}
        </div>
      </div>
    </section>
  );
}
