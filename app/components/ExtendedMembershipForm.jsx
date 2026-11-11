'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function ExtendedMembershipForm() {
  const [designations, setDesignations] = useState([]);
  const [step, setStep] = useState('edit'); // 'edit' | 'review' | 'done'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: 'Male',
    maritalStatus: 'Single',
    bloodGroup: 'O+',
    category: 'General',
    occupation: '',
    aadhaarNumber: '',
    state: 'Bihar',
    district: 'Araria',
    address: '',
    designation: 'General Member',
    membershipFee: 500,
    referralCode: '',
  });

  useEffect(() => {
    fetch('/api/public/members/?view=designations', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.designations) && d.designations.length > 0) {
          setDesignations(d.designations);
        }
      })
      .catch(() => {});
  }, []);

  const submitFinal = async () => {
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (photo) fd.append('photo', photo);

      const res = await fetch('/api/public/members/', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not submit application.');
        setStep('edit');
        return;
      }
      setCreated(data.member);
      setStep('done');
    } catch {
      setError('Network error submitting membership.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done' && created) {
    return (
      <div style={{ padding: 26, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, marginTop: 28 }}>
        <CheckCircle2 size={36} color="#059669" style={{ marginBottom: 8 }} />
        <h3 style={{ margin: '0 0 6px' }}>Membership Application Submitted!</h3>
        <p style={{ margin: '0 0 10px', fontSize: 13 }}>
          Registration No: <strong>{created.regNo}</strong> • Designation: {created.designation} • Status: {created.accountStatus}
        </p>
        <Link href="/member/login" className="button button-blue">Proceed to Member Login <ArrowRight size={15} /></Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32, padding: 24, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Apply For Full Digital Membership (With Referral &amp; Photo)</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
        Complete demographics, Aadhaar verification, designation selection, optional member referral code, and review before submission.
      </p>

      {error && (
        <div role="alert" style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      {step === 'edit' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!agreed) {
              setError('Please accept the Membership Terms before continuing.');
              return;
            }
            setError('');
            setStep('review');
          }}
          style={{ display: 'grid', gap: 12 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            <input required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="Mobile Number *" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="Referral Code (Optional)" value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Male</option><option>Female</option><option>Other</option></select>
            <select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Single</option><option>Married</option></select>
            <input placeholder="Blood Group (e.g. O+)" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="Aadhaar No (Last 4 or 12 digits)" value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="District *" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="State *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select
              value={form.designation}
              onChange={(e) => {
                const d = designations.find((x) => x.title === e.target.value);
                setForm({ ...form, designation: e.target.value, membershipFee: d ? d.feeRs : 500 });
              }}
              style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
            >
              {designations.length > 0 ? (
                designations.map((d) => <option key={d.id} value={d.title}>{d.title} (Rs. {d.feeRs})</option>)
              ) : (
                <option value="General Member">General Member (Rs. 500)</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Profile Photo (JPG/PNG/WebP &le; 2 MB)</label>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I confirm that my details are accurate and agree to the GSDD Foundation membership code of conduct.
          </label>
          <button type="submit" className="button button-blue" style={{ justifySelf: 'start' }}>
            Review Application <ArrowRight size={15} />
          </button>
        </form>
      ) : (
        <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
          <div><strong>Name:</strong> {form.name} • <strong>Mobile:</strong> {form.mobile} • <strong>Email:</strong> {form.email}</div>
          <div><strong>Demographics:</strong> {form.gender} / {form.maritalStatus} / Blood: {form.bloodGroup}</div>
          <div><strong>Location:</strong> {form.district}, {form.state}</div>
          <div><strong>Designation:</strong> {form.designation} (Fee: Rs. {form.membershipFee})</div>
          {form.referralCode && <div><strong>Referred By:</strong> {form.referralCode}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => setStep('edit')} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}>Edit Details</button>
            <button type="button" disabled={busy} onClick={submitFinal} className="button button-blue">
              {busy ? <Loader2 size={15} className="spin" /> : null} Confirm &amp; Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
