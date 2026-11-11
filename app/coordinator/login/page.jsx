'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, LogIn } from 'lucide-react';

export default function CoordinatorLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/coordinator/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Invalid credentials.');
        return;
      }
      router.push('/coordinator/portal');
      router.refresh();
    } catch {
      setError('Network error signing in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '64px auto', padding: '0 20px' }}>
      <div
        style={{
          padding: 28,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          boxShadow: '0 10px 30px rgba(9,21,47,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ShieldCheck size={24} color="#2563eb" />
          <h1 style={{ margin: 0, fontSize: 22 }}>Coordinator Login</h1>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
          Sign in with your Coordinator Email or Code and password issued by the Admin Panel.
        </p>

        {error && (
          <div role="alert" style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Coordinator Email or Code
            </label>
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="coord@gsddfoundation.org or COORD-AR-01"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
          </div>
          <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center', marginTop: 6 }}>
            {busy ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />} Sign In to Coordinator Portal
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
          <Link href="/" style={{ color: '#2563eb', fontWeight: 600 }}>&larr; Back to Main Website</Link>
        </div>
      </div>
    </div>
  );
}
