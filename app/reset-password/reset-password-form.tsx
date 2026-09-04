'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Use at least 12 characters.');
      return;
    }

    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setIsWorking(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('The password could not be changed. Request a new reset link.');
      setIsWorking(false);
      return;
    }

    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login?password=updated');
    router.refresh();
  };

  return (
    <section className="security-panel security-panel-reset" aria-labelledby="reset-title">
      <div className="security-index" aria-hidden="true">
        <span>SEC / 01</span>
        <strong>RESET</strong>
        <i />
      </div>
      <div className="security-content">
        <div className="security-heading"><span>Recovery verified</span><span>PASSWORD</span></div>
        <h1 id="reset-title">Create a new key.</h1>
        <p className="security-description">Use a unique password with at least 12 characters.</p>

        <form className="security-code-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <div className="security-code-shell security-password-shell">
            <span aria-hidden="true">01</span>
            <input
              id="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={12}
              autoFocus
              required
            />
          </div>

          <label htmlFor="confirm-password">Confirm password</label>
          <div className="security-code-shell security-password-shell">
            <span aria-hidden="true">02</span>
            <input
              id="confirm-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>

          <button className="security-primary" type="submit" disabled={isWorking}>
            <span>{isWorking ? 'Updating…' : 'Replace password'}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="security-error" role="alert" aria-live="polite">{error}</p>
      </div>
    </section>
  );
}
