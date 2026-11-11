'use client';

import { useEffect, useState } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function GeneralMembersDirectoryPage() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/members/?view=general&q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.ok) setMembers(data.members || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadMembers('');
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Public Member Roster"
        title="Verified general members."
        description="Search verified active members associated with Global Skills & Digital Development Foundation."
      />
      <section className="section-pad">
        <div className="container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadMembers(query);
            }}
            style={{ display: 'flex', gap: 10, maxWidth: 480, marginBottom: 24 }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Reg No, name, or district..."
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" className="button button-blue"><Search size={15} /> Search</button>
          </form>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
              {members.map((m) => (
                <article key={m.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                      <Users size={18} />
                    </span>
                    <div>
                      <strong style={{ display: 'block', fontSize: 16 }}>{m.name}</strong>
                      <small style={{ color: '#2563eb', fontWeight: 700 }}>{m.regNo}</small>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    <div><strong>Designation:</strong> {m.designation}</div>
                    <div><strong>Location:</strong> {m.district}, {m.state}</div>
                    <div><strong>Joined:</strong> {m.joinedAt}</div>
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
