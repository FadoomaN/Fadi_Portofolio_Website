'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PanelId = 'overview' | 'experiences' | 'projects' | 'videos' | 'profile';

type ContentRecord = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

type ProfileRecord = {
  first_name: string;
  last_name: string;
  role: string;
  kicker: string;
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
  projects: ContentRecord[];
  videos: ContentRecord[];
  experienceCount: number;
  projectCount: number;
  videoCount: number;
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
  operationsEmail: string;
  phoneNumber: string;
  timezone: string;
};

const menuItems: Array<{ id: PanelId; index: string; label: string }> = [
  { id: 'overview', index: '01', label: 'Overview' },
  { id: 'experiences', index: '02', label: 'Experiences' },
  { id: 'projects', index: '03', label: 'Projects' },
  { id: 'videos', index: '04', label: 'Videos' },
  { id: 'profile', index: '05', label: 'Profile' },
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

function RecordList({ records, emptyLabel }: { records: ContentRecord[]; emptyLabel: string }) {
  if (!records.length) {
    return (
      <div className="admin-empty-state">
        <span>00</span>
        <strong>{emptyLabel}</strong>
        <p>This module is connected and ready for its editor.</p>
      </div>
    );
  }

  return (
    <div className="admin-record-list">
      <div className="admin-record-row admin-record-head">
        <span>Title</span>
        <span>Status</span>
        <span>Updated</span>
      </div>
      {records.map((record) => (
        <div className="admin-record-row" key={record.id}>
          <strong>{record.title}</strong>
          <span>{record.status}</span>
          <time dateTime={record.updated_at}>{formatDate(record.updated_at)}</time>
        </div>
      ))}
    </div>
  );
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
      setNotice(selectedId ? 'Experience updated.' : 'Experience created.');
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
              <span>{record.status}</span>
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
          <i className={`admin-experience-status is-${form.status}`}>{form.status}</i>
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
            <span>Visibility</span>
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
    operationsEmail: privateContact?.operations_email ?? '',
    phoneNumber: privateContact?.phone_number ?? '',
    timezone: privateContact?.timezone ?? 'Europe/Stockholm',
  }), [profile, privateContact]);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
      const result = (await response.json()) as { error?: string };

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

export default function AdminWorkspace({
  experiences,
  projects,
  videos,
  experienceCount,
  projectCount,
  videoCount,
  profile,
  privateContact,
}: AdminWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<PanelId>('overview');
  const activeItem = useMemo(
    () => menuItems.find((item) => item.id === activePanel) ?? menuItems[0],
    [activePanel],
  );

  return (
    <section className="admin-workspace" aria-label="Administrator workspace">
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
              onClick={() => setActivePanel(item.id)}
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
                  <span>Experiences</span>
                  <strong>{String(experienceCount).padStart(2, '0')}</strong>
                  <small>Database records</small>
                </article>
                <article>
                  <span>Projects</span>
                  <strong>{String(projectCount).padStart(2, '0')}</strong>
                  <small>Database records</small>
                </article>
                <article>
                  <span>Videos</span>
                  <strong>{String(videoCount).padStart(2, '0')}</strong>
                  <small>Database records</small>
                </article>
              </div>

              <div className="admin-system-strip">
                <span><i /> Supabase connected</span>
                <span>RLS active</span>
                <span>Session encrypted</span>
              </div>
            </div>
          )}

          {activePanel === 'experiences' && (
            <div className="admin-module-window admin-experience-window">
              <div className="admin-module-heading">
                <div><span>Career module / 02</span><h2>Experiences</h2></div>
                <strong>{String(experienceCount).padStart(2, '0')}</strong>
              </div>
              <ExperienceEditor experiences={experiences} />
            </div>
          )}

          {activePanel === 'projects' && (
            <div className="admin-module-window">
              <div className="admin-module-heading">
                <div><span>Content module / 03</span><h2>Projects</h2></div>
                <strong>{String(projectCount).padStart(2, '0')}</strong>
              </div>
              <RecordList records={projects} emptyLabel="No projects yet" />
            </div>
          )}

          {activePanel === 'videos' && (
            <div className="admin-module-window">
              <div className="admin-module-heading">
                <div><span>Media module / 04</span><h2>Videos</h2></div>
                <strong>{String(videoCount).padStart(2, '0')}</strong>
              </div>
              <RecordList records={videos} emptyLabel="No videos yet" />
            </div>
          )}

          {activePanel === 'profile' && (
            <div className="admin-module-window">
              <div className="admin-module-heading">
                <div><span>Identity module / 05</span><h2>Profile</h2></div>
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
