'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = (await response.json()) as { error?: string; next?: string };

      if (!response.ok) {
        setError(result.error ?? 'Unable to sign in.');
        return;
      }

      router.replace(result.next ?? '/admin');
      router.refresh();
    } catch {
      setError('Connection unavailable. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecovery = async () => {
    setError('');
    setNotice('');

    if (!username.trim()) {
      setError('Enter your username first.');
      return;
    }

    setIsRecovering(true);

    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error('Recovery request failed');
      setNotice('If the username is valid, a secure reset link has been sent.');
    } catch {
      setError('Unable to start password recovery. Try again later.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-field">
        <label htmlFor="admin-username">Username</label>
        <div className="login-input-shell">
          <span aria-hidden="true">01</span>
          <input
            id="admin-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            spellCheck={false}
            required
            autoFocus
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="admin-password">Password</label>
        <div className="login-input-shell">
          <span aria-hidden="true">02</span>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <button
        className="login-recovery"
        type="button"
        disabled={isSubmitting || isRecovering}
        onClick={handleRecovery}
      >
        {isRecovering ? 'Sending secure link…' : 'Forgot password?'}
      </button>

      <p className="login-error" role="alert" aria-live="polite">
        {error}
      </p>

      <p className="login-notice" role="status" aria-live="polite">
        {notice}
      </p>

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? 'Authenticating' : 'Enter system'}</span>
        <span className="login-submit-arrow" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
