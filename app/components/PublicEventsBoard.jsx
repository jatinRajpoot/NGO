'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, CheckCircle2, X, Loader2 } from 'lucide-react';

export default function PublicEventsBoard({ initialEvents = [] }) {
  const [events] = useState(Array.isArray(initialEvents) ? initialEvents : []);
  const [tab, setTab] = useState('All');
  const [dateSearch, setDateSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = events.filter((e) => {
    if (tab !== 'All' && e.status !== tab) return false;
    if (dateSearch && !`${e.date} ${e.title} ${e.venue}`.toLowerCase().includes(dateSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleRegister = async (ev) => {
    ev.preventDefault();
    if (!selectedEvent) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/public/events/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Registration failed.');
        return;
      }
      setSuccessMsg(`Registered successfully for "${selectedEvent.title}"! Confirmation ID: ${data.applicant.id}`);
      setSelectedEvent(null);
      setForm({ name: '', email: '', phone: '', city: '' });
    } catch {
      setErrorMsg('Network error submitting event registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Active', 'Completed'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid #dfd9cc',
                background: tab === t ? 'var(--gsdd-navy-dark)' : '#f5f3ed',
                color: tab === t ? '#fff' : 'var(--gsdd-navy-dark)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {t} Events
            </button>
          ))}
        </div>
        <input
          value={dateSearch}
          onChange={(e) => setDateSearch(e.target.value)}
          placeholder="Search events by title, date (YYYY-MM-DD), venue..."
          style={{ minWidth: 260, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
        {filtered.map((evt) => (
          <article key={evt.id} style={{ background: '#fff', border: '1px solid #e6e2d8', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 700 }}>{evt.eventType}</span>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: evt.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: evt.status === 'Active' ? '#15803d' : '#475569', fontSize: 11, fontWeight: 700 }}>{evt.status}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--gsdd-navy-dark)' }}>{evt.title}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{evt.description}</p>
            <div style={{ fontSize: 12, color: '#64748b', display: 'grid', gap: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {evt.date} • {evt.time}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {evt.venue}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Capacity: {evt.capacity} • Fee: Rs. {evt.fee}</span>
            </div>
            {evt.status === 'Active' && (
              <button type="button" className="button button-blue" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => { setErrorMsg(''); setSelectedEvent(evt); }}>
                Register for Event
              </button>
            )}
          </article>
        ))}
      </div>

      {selectedEvent && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,21,47,0.7)', padding: 16 }} onClick={() => setSelectedEvent(null)}>
          <form onSubmit={handleRegister} style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 12, padding: 22, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Register: {selectedEvent.title}</h3>
              <button type="button" onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {errorMsg && <div role="alert" style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{errorMsg}</div>}
            <input required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="Mobile Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="City / District" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
              {busy ? <Loader2 size={15} className="spin" /> : null} Confirm Registration
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
