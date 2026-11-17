'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/public/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'request', email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data?.error || 'Could not initiate reset.');
        return;
      }
      setInfoMsg(data.message);
      setStep('verify');
    } catch {
      setErr('Network error initiating password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/public/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'confirm', token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data?.error || 'Could not reset password.');
        return;
      }
      setInfoMsg(data.message);
      setStep('done');
    } catch {
      setErr('Network error resetting password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Account Recovery"
        title="Forgot password recovery."
        description="Request a code at your account email address to reset your Member Portal password."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 480 }}>
          <div style={{ padding: 26, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            {err && (
              <div role="alert" style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
                {err}
              </div>
            )}

            {step === 'done' ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={42} color="#059669" style={{ marginBottom: 10 }} />
                <h2 style={{ margin: '0 0 8px' }}>Password Updated!</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>{infoMsg}</p>
                <Link href="/member/login" className="button button-blue">Go to Member Login</Link>
              </div>
            ) : step === 'email' ? (
              <form onSubmit={handleRequest} style={{ display: 'grid', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Account Email Address *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.org"
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
                  {busy ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />} Continue Password Reset
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset} style={{ display: 'grid', gap: 12 }}>
                {infoMsg && <p style={{ fontSize: 13, color: '#1e3a8a', margin: 0 }}>{infoMsg}</p>}
                <input required placeholder="Reset code from your email *" autoComplete="one-time-code" value={token} onChange={(e) => setToken(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input required type="password" minLength={8} placeholder="New Password (min 8 chars) *" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
                  {busy ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />} Update Password
                </button>
                <button type="button" className="button button-outline-blue" disabled={busy} onClick={handleRequest}>
                  Request another code
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
