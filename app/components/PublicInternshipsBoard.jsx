'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, CheckCircle2, ShieldCheck, X, Loader2 } from 'lucide-react';

export default function PublicInternshipsBoard({ initialInternships = [] }) {
  const [internships] = useState(Array.isArray(initialInternships) ? initialInternships : []);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ applicantName: '', email: '', phone: '', qualification: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/public/internships/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internshipId: selected.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Could not submit internship application.');
        return;
      }
      setSuccessMsg(`Application submitted for ${selected.title}! Reference ID: ${data.application.id}`);
      setSelected(null);
      setForm({ applicantName: '', email: '', phone: '', qualification: '', city: '' });
    } catch {
      setErrorMsg('Network error submitting application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Available Internships</h2>
        <Link href="/internships/verify-certificate" className="button button-outline">
          <ShieldCheck size={16} /> Verify Internship Certificate
        </Link>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {internships.map((item) => (
          <article key={item.id} style={{ background: '#fff', border: '1px solid #e6e2d8', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: '#dbeafe', color: '#1e3a8a', fontSize: 11, fontWeight: 700 }}>{item.type}</span>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700 }}>{item.status}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18 }}>{item.title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{item.description}</p>
            <div style={{ fontSize: 12, color: '#64748b', display: 'grid', gap: 4 }}>
              <div><strong>Duration:</strong> {item.duration} • <strong>Stipend:</strong> {item.stipend}</div>
              <div><strong>Location:</strong> {item.city}, {item.state} • <strong>Seats:</strong> {item.seats}</div>
              <div><strong>Min Qualification:</strong> {item.minQualification}</div>
            </div>
            <button type="button" className="button button-blue" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => setSelected(item)}>
              <GraduationCap size={16} /> Apply Online
            </button>
          </article>
        ))}
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,21,47,0.7)', padding: 16 }} onClick={() => setSelected(null)}>
          <form onSubmit={handleApply} style={{ width: 'min(460px, 100%)', background: '#fff', borderRadius: 12, padding: 22, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Apply: {selected.title}</h3>
              <button type="button" onClick={() => setSelected(null)} style={{ background: 'transparent', border: 0 }}><X size={16} /></button>
            </div>
            {errorMsg && <div role="alert" style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{errorMsg}</div>}
            <input required placeholder="Full Name *" value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="Mobile Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="Current Qualification (e.g. B.A. / B.C.A.)" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="City / District" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
              {busy ? <Loader2 size={15} className="spin" /> : null} Submit Internship Application
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
