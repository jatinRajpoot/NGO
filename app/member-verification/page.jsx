'use client';

import { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function MemberVerificationPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/public/members/?verify=${encodeURIComponent(query.trim())}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Public Identity Check"
        title="Members verification lookup."
        description="Verify active foundation members using their official Registration Number (e.g. NGO-2026-0032) or full name."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 680 }}>
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Reg No (NGO-2026-...) or Full Name..."
              style={{ flex: '1 1 260px', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" disabled={loading} className="button button-blue">
              {loading ? <Loader2 size={15} className="spin" /> : <Search size={15} />} Verify Member
            </button>
          </form>

          {result && result.found && result.member && (
            <div style={{ padding: 24, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontWeight: 800, marginBottom: 12 }}>
                <ShieldCheck size={20} /> Active Verified Member
              </div>
              <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                <div><strong>Registration No:</strong> {result.member.regNo}</div>
                <div><strong>Member Name:</strong> {result.member.name}</div>
                <div><strong>Designation:</strong> {result.member.designation}</div>
                <div><strong>District / State:</strong> {result.member.district}, {result.member.state}</div>
                <div><strong>Status:</strong> {result.member.status} (Joined {result.member.joinedAt})</div>
              </div>
            </div>
          )}

          {result && !result.found && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 18, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b' }}>
              <AlertCircle size={18} /> No active verified member found matching &quot;{query}&quot;.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
