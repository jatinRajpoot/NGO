'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle } from 'lucide-react';
import '../member.css';

export default function MemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/member/me/')
      .then((res) => {
        if (active && res.ok) {
          router.push('/member/dashboard');
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/member/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Invalid email/mobile or password. Please try again.');
        return;
      }
      router.push('/member/dashboard');
    } catch {
      setError('Network error signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickLogin(email, pwd) {
    setIdentifier(email);
    setPassword(pwd);
    setError('');
  }

  return (
    <div className="member-auth-page">
      <div className="member-auth-card">
        <div className="auth-logo-header">
          <span className="auth-badge">Member Portal</span>
          <h1>Member Login</h1>
          <p>Access your GSDD Foundation membership dashboard, activities, ID card, and certificates.</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="member-form-group" style={{ marginBottom: '14px' }}>
            <label>Registered Email or Mobile Number</label>
            <input
              type="text"
              required
              placeholder="e.g. ramesh.sharma@example.com or 9835012345"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="member-form-group" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <Link href="/contact" style={{ fontSize: '11px', color: 'var(--gsdd-blue-primary)' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="button button-blue" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            <LogIn size={18} /> {loading ? 'Logging in...' : 'Sign In to Member Portal'}
          </button>
        </form>

        <div className="quick-login-chips">
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gsdd-navy-dark)', display: 'block', marginBottom: '4px' }}>
            Demo Member Accounts:
          </span>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleQuickLogin('ramesh.sharma@example.com', 'password123')}
          >
            Dr. Ramesh Sharma (Patron)
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleQuickLogin('sunita.devi@example.com', 'password123')}
          >
            Sunita Devi (Vice President)
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gsdd-text-muted)', paddingTop: '14px', borderTop: '1px solid #EFECE6' }}>
          <div style={{ marginBottom: '8px' }}>
            <Link href="/forgot-password" style={{ color: 'var(--gsdd-blue-primary)', fontSize: '12px', fontWeight: '600' }}>
              Forgot your Member Password? Reset via Email &amp; Mobile &rarr;
            </Link>
          </div>
          Not registered yet?{' '}
          <Link href="/member/register" style={{ color: 'var(--gsdd-blue-primary)', fontWeight: '700' }}>
            Register as a New Member
          </Link>
        </div>
      </div>
    </div>
  );
}
