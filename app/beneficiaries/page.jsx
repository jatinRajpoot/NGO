'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, HeartHandshake, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function PublicBeneficiariesPage() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/beneficiaries/?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setList(data.beneficiaries || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load('');
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Community Welfare"
        title="Active beneficiaries & aid."
        description="Search verified beneficiaries receiving educational, medical, and livelihood support from Global Skills & Digital Development Foundation."
      />
      <section className="section-pad">
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
            <form
              onSubmit={(e) => { e.preventDefault(); load(query); }}
              style={{ display: 'flex', gap: 8, flex: '1 1 320px', maxWidth: 480 }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by tracking code (GSDD-BEN-...), name, district..."
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
              <button type="submit" className="button button-blue"><Search size={15} /> Search</button>
            </form>
            <Link href="/beneficiaries/apply" className="button button-blue">
              <HeartHandshake size={16} /> Apply For Beneficiary Aid
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
              {list.map((b) => (
                <article key={b.id} style={{ background: '#fff', border: '1px solid #e6e2d8', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1' }}>{b.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>{b.status}</span>
                  </div>
                  <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{b.name}</h2>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    {b.trackingCode} • {b.district}, {b.state}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>{b.needSummary}</p>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                    Verified Benefits Received: {b.benefitsCount}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
