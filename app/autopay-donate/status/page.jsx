'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import PageHero from '../../components/PageHero';

export default function AutoPayStatusPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/autopay/?query=${encodeURIComponent(query.trim())}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not check status.');
        return;
      }
      setResults(data.mandates || []);
    } catch {
      setError('Network error looking up mandate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Mandate Verification"
        title="Auto-Pay status tracking."
        description="Enter your Mandate Reference (e.g. GSDD-AP-2026-1001), email address, or registered mobile number to inspect recurring payment history."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 760 }}>
          <form
            onSubmit={handleLookup}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}
          >
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Mandate Ref, Email, or Mobile..."
              style={{ flex: '1 1 260px', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" disabled={loading} className="button button-blue">
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Check Status
            </button>
          </form>

          {error && (
            <div role="alert" style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
              {error}
            </div>
          )}

          {Array.isArray(results) && results.length === 0 && (
            <div style={{ padding: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', color: '#64748b' }}>No AutoPay mandates matched your query.</p>
              <Link href="/autopay-donate" className="button button-blue">Setup New AutoPay</Link>
            </div>
          )}

          {Array.isArray(results) && results.map((m) => (
            <div
              key={m.mandateRef}
              style={{
                padding: 22,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div>
                  <strong style={{ fontSize: 17 }}>{m.mandateRef}</strong>
                  <div style={{ fontSize: 13, color: '#475569' }}>{m.donorName} • {m.purpose}</div>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: m.status === 'Active' ? '#dcfce7' : '#fef3c7',
                    color: m.status === 'Active' ? '#15803d' : '#b45309',
                  }}
                >
                  {m.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginBottom: 12 }}>
                Monthly Contribution: <strong>Rs. {Number(m.amount).toLocaleString('en-IN')}</strong> • Gateway: {m.gateway} • Next Debit: {m.nextDebitDate}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Debit History ({m.payments.length})</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {m.payments.map((p) => (
                  <div
                    key={p.txId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <span>{p.txId}</span>
                    <span>Rs. {Number(p.amount).toLocaleString('en-IN')} • {String(p.paidAt).slice(0, 10)}</span>
                    <strong style={{ color: '#059669' }}>{p.status}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
