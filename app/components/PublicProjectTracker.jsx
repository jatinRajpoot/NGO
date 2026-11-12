'use client';

import { useMemo, useState } from 'react';
import { PROJECT_CATEGORIES } from '../lib/operations-constants';

export default function PublicProjectTracker({ initialProjects = [] }) {
  const [projects] = useState(Array.isArray(initialProjects) ? initialProjects : []);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (status !== 'All' && p.status !== status) return false;
      if (search && !`${p.title} ${p.location} ${p.description}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [projects, category, status, search]);

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Live Project Budgets &amp; Expenditure Tracker</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
            <option value="All">All Categories</option>
            {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
        {filtered.map((p) => (
          <article key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 700 }}>{p.category}</span>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: p.status === 'Completed' ? '#dcfce7' : '#fef3c7', color: p.status === 'Completed' ? '#15803d' : '#b45309', fontSize: 11, fontWeight: 700 }}>{p.status}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 17 }}>{p.title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{p.description}</p>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span>Spent: Rs. {Number(p.spentAmount).toLocaleString('en-IN')}</span>
                <span>Goal: Rs. {Number(p.goalAmount).toLocaleString('en-IN')} ({p.progressPercent}%)</span>
              </div>
              <div style={{ height: 9, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${p.progressPercent}%`, height: '100%', background: p.status === 'Completed' ? '#059669' : '#2563eb' }} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
