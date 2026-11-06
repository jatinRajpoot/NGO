'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, HeartHandshake, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { defaultDonors } from '../donor-data';
import '../donor.css';

export default function DonorLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const active = localStorage.getItem('gsdd_active_donor');
      if (active) {
        router.push('/donor/dashboard');
      }
    } catch {
      // Ignore SSR
    }
  }, [router]);

  function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.trim().replace(/[^0-9]/g, '');

    setTimeout(() => {
      let allDonors = [...defaultDonors];
      try {
        const stored = JSON.parse(localStorage.getItem('gsdd_donors_db') || '[]');
        allDonors = [...defaultDonors, ...stored];
      } catch {
        // Fallback to defaults
      }

      const found = allDonors.find((d) => {
        const dId = (d.id || '').toLowerCase();
        const dEmail = (d.email || '').toLowerCase();
        const dPhone = (d.phone || '').replace(/[^0-9]/g, '');
        const idMatches =
          dEmail === cleanId ||
          dId === cleanId ||
          (cleanDigits.length >= 8 && dPhone.includes(cleanDigits));
        const pwdMatches = !d.password || d.password === password;
        return idMatches && pwdMatches;
      });

      if (found) {
        try {
          localStorage.setItem('gsdd_active_donor', JSON.stringify(found));
        } catch {
          // Ignore
        }
        router.push('/donor/dashboard');
      } else {
        setError('Invalid Donor ID, email, or password. Please try again or use a demo account below.');
        setLoading(false);
      }
    }, 350);
  }

  function handleQuickLogin(email, pwd) {
    setIdentifier(email);
    setPassword(pwd);
    setError('');
  }

  return (
    <div className="donor-auth-page">
      <div className="donor-auth-card">
        <div className="donor-logo-header">
          <span className="donor-badge">
            <HeartHandshake size={14} /> Donor & Patron Portal
          </span>
          <h1>Donor Login</h1>
          <p>
            Access your tax-deductible 80G receipts, recurring donation pledges, impact reports, and donor certificates.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="donor-form-group" style={{ marginBottom: '14px' }}>
            <label>Registered Email, Phone, or Donor ID</label>
            <input
              type="text"
              required
              placeholder="e.g. rajesh.patel@example.com or GSDD-D-2026-101"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="donor-form-group" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <Link href="/contact" style={{ fontSize: '11px', color: '#2563EB', fontWeight: '600' }}>
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

          <button
            type="submit"
            className="button button-blue"
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
            disabled={loading}
          >
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Sign In to Donor Dashboard'}
          </button>
        </form>

        <div className="quick-donor-chips">
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#0F172A',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Demo Donor Accounts (Click to test):
          </span>
          <button
            type="button"
            className="donor-chip-btn"
            onClick={() => handleQuickLogin('rajesh.patel@example.com', 'password123')}
          >
            🌟 Rajesh Patel (Gold Patron - ₹38,500)
          </button>
          <button
            type="button"
            className="donor-chip-btn"
            onClick={() => handleQuickLogin('priya.sharma@example.com', 'password123')}
          >
            ✨ Priya Sharma (Silver Donor - ₹12,000)
          </button>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748B',
            paddingTop: '16px',
            borderTop: '1px solid #E2DED5',
          }}
        >
          New Philanthropist or Donor?{' '}
          <Link href="/donor/register" style={{ color: '#2563EB', fontWeight: '700' }}>
            Create Donor Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
