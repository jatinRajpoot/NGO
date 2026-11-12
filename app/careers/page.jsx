'use client';

import { useEffect, useState } from 'react';
import { Briefcase, MapPin, CheckCircle2, X, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: '', coverNote: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/public/jobs/', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setJobs(d.jobs || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submitApp = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/public/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJob.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data?.error || 'Could not submit application.');
        return;
      }
      setMsg(`Career application submitted for ${selectedJob.title}! Ref: ${data.application.id}`);
      setSelectedJob(null);
      setForm({ name: '', email: '', phone: '', experience: '', coverNote: '' });
    } catch {
      setErr('Network error submitting application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join our programme team."
        description="Explore open field and coordination positions across digital skills, women empowerment, and community health initiatives."
      />
      <section className="section-pad">
        <div className="container">
          {msg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13 }}>
              <CheckCircle2 size={18} /> {msg}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {jobs.map((job) => (
                <article key={job.id} style={{ background: '#fff', border: '1px solid #e6e2d8', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: '#dbeafe', color: '#1e3a8a', fontSize: 11, fontWeight: 700 }}>{job.jobType}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Exp: {job.experience}</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{job.title}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{job.description}</p>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} /> {job.location}
                  </div>
                  <button type="button" className="button button-blue" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => { setErr(''); setSelectedJob(job); }}>
                    <Briefcase size={15} /> Apply for Position
                  </button>
                </article>
              ))}
            </div>
          )}

          {selectedJob && (
            <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,21,47,0.7)', padding: 16 }} onClick={() => setSelectedJob(null)}>
              <form onSubmit={submitApp} style={{ width: 'min(460px, 100%)', background: '#fff', borderRadius: 12, padding: 22, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 17 }}>Apply: {selectedJob.title}</h3>
                  <button type="button" onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 0 }}><X size={16} /></button>
                </div>
                {err && <div role="alert" style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{err}</div>}
                <input required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input required type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input required placeholder="Mobile Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input placeholder="Relevant Experience (Years)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <textarea rows={3} placeholder="Short Cover Note" value={form.coverNote} onChange={(e) => setForm({ ...form, coverNote: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
                  {busy ? <Loader2 size={15} className="spin" /> : null} Submit Career Application
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
