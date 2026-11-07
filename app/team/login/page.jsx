'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Lock, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { defaultTeamMembers } from '../team-data';

export default function TeamMemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const term = identifier.trim().toLowerCase();
    const found = defaultTeamMembers.find(
      (m) =>
        m.email.toLowerCase() === term ||
        m.id.toLowerCase() === term ||
        m.phone.replace(/\s+/g, '') === term.replace(/\s+/g, '')
    );

    if (!found) {
      setError('Invalid Team Member credentials. Please check your official Email or Team ID.');
      setLoading(false);
      return;
    }

    if (password.trim() === '') {
      setError('Please enter your account password.');
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem('gsdd_active_team_member', JSON.stringify(found));
    } catch {
      // Ignore
    }

    router.push('/team/portal');
  }

  function handleDemoLogin(member) {
    try {
      localStorage.setItem('gsdd_active_team_member', JSON.stringify(member));
    } catch {
      // Ignore
    }
    router.push('/team/portal');
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#F8FAFC' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '12px', background: '#EFF6FF', color: '#1E40AF', marginBottom: '14px' }}>
            <Building2 size={28} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E40AF', background: '#DBEAFE', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>
            Management Portal
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px' }}>Team Member Login</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Dedicated access for GSDD Foundation executive and operational management team.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
              Official Email / Team ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="e.g. ceo@gsddfoundation.org or GSDD-TM-01"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Team Portal'}
          </button>
        </form>

        {/* Demo Fast Login Box */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '10px' }}>
            ⚡ 1-Click Demo Executive Logins
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin(defaultTeamMembers[0])}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>Manoj Kumar Bishwas</strong>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Founder / CEO • Governing Board</span>
              </div>
              <ArrowRight size={14} color="#1E40AF" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin(defaultTeamMembers[1])}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>Arvind Kumar</strong>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Founder / MD • Operations & Finance</span>
              </div>
              <ArrowRight size={14} color="#1E40AF" />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
          <Link href="/team" style={{ color: '#1E40AF', textDecoration: 'none', fontWeight: '600' }}>
            ← Public Management Directory
          </Link>
        </div>

      </div>
    </div>
  );
}
