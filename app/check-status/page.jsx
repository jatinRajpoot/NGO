'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function CheckComplaintStatusPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/complaints/?query=${encodeURIComponent(query.trim())}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setResults(data.complaints || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Grievance Tracking"
        title="Check complaint status."
        description="Track submitted grievance tickets by Ticket Number (e.g. GSDD-CMP-2026-001) or Email address."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={handleCheck} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Ticket No (GSDD-CMP-...) or Email..."
              style={{ flex: '1 1 260px', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" disabled={loading} className="button button-blue">
              {loading ? <Loader2 size={15} className="spin" /> : <Search size={15} />} Track Complaint
            </button>
          </form>

          {Array.isArray(results) && results.length === 0 && (
            <p style={{ color: '#64748b' }}>No matching complaint tickets found.</p>
          )}

          {Array.isArray(results) && results.map((c) => (
            <div key={c.ticketNo} style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{c.ticketNo} — {c.subject}</strong>
                <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.status === 'Resolved' ? '#dcfce7' : '#fef3c7', color: c.status === 'Resolved' ? '#15803d' : '#b45309' }}>
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                <div><strong>Complainant:</strong> {c.complainantName} ({c.category})</div>
                <div><strong>Submitted:</strong> {c.createdAt} • <strong>Updated:</strong> {c.updatedAt}</div>
                {c.adminRemark && (
                  <div style={{ marginTop: 8, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                    <strong>Admin Remark:</strong> {c.adminRemark}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
