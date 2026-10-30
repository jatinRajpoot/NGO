'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const REQUEST_TIMEOUT_MS = 15000;

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const errorRef = useRef(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Track component mount status and cleanup in-flight network requests
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Move focus to the error message whenever a new sign-in failure appears,
  // so screen-reader and keyboard users notice the failure without hunting.
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (pending) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (trimmedUsername.length > 128) {
      setError('Username cannot exceed 128 characters.');
      return;
    }

    if (password.length > 1024) {
      setError('Password cannot exceed 1024 characters.');
      return;
    }

    setError(null);
    setPending(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/admin/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!isMountedRef.current) return;

      if (response.ok && data?.ok) {
        router.replace('/admin/');
        router.refresh();
        return;
      }

      if (response.status === 401 || data?.error === 'invalid_credentials') {
        setError('Invalid username or password.');
      } else if (response.status === 429 || data?.error === 'too_many_attempts') {
        // Honor the server's Retry-After hint when it provides one.
        const retryAfterRaw = response.headers.get('Retry-After');
        const retryAfterSeconds = Number.parseInt(retryAfterRaw ?? '', 10);
        if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
          setError(
            retryAfterSeconds >= 60
              ? `Too many failed attempts. Please try again in about ${Math.ceil(retryAfterSeconds / 60)} minutes.`
              : `Too many failed attempts. Please try again in about ${retryAfterSeconds} seconds.`,
          );
        } else {
          setError('Too many failed attempts. Please wait a few minutes before trying again.');
        }
      } else if (response.status === 503 || data?.error === 'not_configured') {
        setError('Admin access is not configured on this server.');
      } else if (response.status === 403 || data?.error === 'forbidden_origin') {
        setError('Cross-origin request blocked. Please refresh the page and retry.');
      } else if (response.status === 400 || data?.error === 'invalid_request') {
        setError('Invalid request. Please verify your credentials and try again.');
      } else if (response.status >= 500) {
        setError('The server could not process the sign-in. Please try again shortly.');
      } else {
        setError('Sign in failed. Please check your credentials and try again.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      if (err.name === 'AbortError') {
        setError('Sign-in request timed out. Please check your connection and try again.');
      } else {
        setError('Network error. Unable to reach the server. Please check your connection.');
      }
    } finally {
      if (isMountedRef.current) {
        setPending(false);
      }
    }
  }, [pending, username, password, router]);

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <header className="admin-login-header">
          <div className="admin-login-brand">
            <span className="admin-login-logo-mark" aria-hidden="true">
              G
            </span>
            <div className="admin-login-brand-text">
              <span className="admin-login-org-name">GSDD FOUNDATION</span>
              <span className="admin-login-org-sub">Operations Workspace</span>
            </div>
          </div>
          <h1 className="admin-login-title">Admin Sign In</h1>
          <p className="admin-login-subtitle">
            Enter your administrative credentials to continue
          </p>
        </header>

        {error ? (
          <div
            id="admin-login-error"
            ref={errorRef}
            tabIndex={-1}
            className="admin-login-alert"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <svg
              className="admin-login-alert-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
          aria-busy={pending}
        >
          <div className="admin-login-field">
            <label htmlFor="admin-username" className="admin-login-label">
              Username
            </label>
            <div className="admin-login-input-wrap">
              <input
                id="admin-username"
                name="username"
                type="text"
                className="admin-login-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                required
                maxLength={128}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={pending}
                placeholder="Enter username"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'admin-login-error' : undefined}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">
              Password
            </label>
            <div className="admin-login-input-wrap">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="admin-login-input admin-login-input-with-button"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                autoComplete="current-password"
                maxLength={1024}
                disabled={pending}
                placeholder="Enter password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'admin-login-error' : undefined}
              />
              <button
                type="button"
                className="admin-login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={pending}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                aria-controls="admin-password"
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-submit"
            disabled={pending}
            aria-disabled={pending}
          >
            {pending ? (
              <>
                <span className="admin-login-spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {pending ? 'Signing in, please wait...' : ''}
          </span>
        </form>

        <footer className="admin-login-footer">
          <Link href="/" className="admin-login-back-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to public website</span>
          </Link>
        </footer>
      </div>

      <p className="admin-login-bottom-note">
        Authorized administrative personnel only.
      </p>
    </div>
  );
}
