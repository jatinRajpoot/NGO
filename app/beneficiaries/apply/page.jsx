'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, HeartHandshake, Loader2 } from 'lucide-react';
import PageHero from '../../components/PageHero';

const CATEGORIES = [
  'Education Support',
  'Healthcare Aid',
  'Women Livelihood',
  'Senior Citizen Care',
  'Child Nutrition',
  'Disaster Relief',
];

export default function ApplyBeneficiaryPage() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    email: '',
    category: CATEGORIES[0],
    district: 'Araria',
    state: 'Bihar',
    address: '',
    needSummary: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/public/beneficiaries/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not submit beneficiary request.');
        return;
      }
      setSubmitted(data.request);
    } catch {
      setError('Network error submitting request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Support Request"
        title="Apply for beneficiary aid."
        description="Submit a direct assistance request to our welfare verification team."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 680 }}>
          {submitted ? (
            <div style={{ padding: 28, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, textAlign: 'center' }}>
              <CheckCircle2 size={44} color="#059669" style={{ marginBottom: 10 }} />
              <h2 style={{ margin: '0 0 8px' }}>Request Submitted Successfully!</h2>
              <p style={{ margin: '0 0 16px', fontSize: 14 }}>
                Your Beneficiary Tracking Code is <strong>{submitted.trackingCode}</strong> (Status: {submitted.status}).
              </p>
              <Link href="/beneficiaries" className="button button-blue">View Beneficiaries Directory</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: 26, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, display: 'grid', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Direct Beneficiary Application</h2>
              {error && <div role="alert" style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{error}</div>}
              <input required placeholder="Applicant Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input required placeholder="Mobile Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input required placeholder="District *" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <input placeholder="Village / Block Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <textarea required rows={3} placeholder="Describe support needed *" value={form.needSummary} onChange={(e) => setForm({ ...form, needSummary: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
                {busy ? <Loader2 size={15} className="spin" /> : <HeartHandshake size={15} />} Submit Application
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
