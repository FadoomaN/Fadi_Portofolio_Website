'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ defaultUsername }: { defaultUsername: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'Unable to sign in.');
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Connection unavailable. Try again.');
    } finally {
      setIsSubmitting(false);
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

      <p className="login-error" role="alert" aria-live="polite">
        {error}
      </p>

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? 'Authenticating' : 'Enter system'}</span>
        <span className="login-submit-arrow" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
