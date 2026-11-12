'use client';

import { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PageHero from '../../components/PageHero';

export default function VerifyInternshipCertificatePage() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/public/internships/?verifyCert=${encodeURIComponent(certId.trim())}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Credential Check"
        title="Internship certificate verification."
        description="Verify the authenticity of internship completion certificates issued by Global Skills & Digital Development Foundation."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 680 }}>
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <input
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. GSDD-INT-2026-001)"
              style={{ flex: '1 1 260px', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
            <button type="submit" disabled={loading} className="button button-blue">
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Verify Certificate
            </button>
          </form>

          {result && result.found && result.certificate && (
            <div style={{ padding: 24, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontWeight: 800, marginBottom: 12 }}>
                <CheckCircle2 size={20} /> Authentic Foundation Internship Certificate
              </div>
              <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                <div><strong>Certificate ID:</strong> {result.certificate.certificateId}</div>
                <div><strong>Intern Name:</strong> {result.certificate.internName}</div>
                <div><strong>Programme:</strong> {result.certificate.internshipTitle}</div>
                <div><strong>Qualification:</strong> {result.certificate.qualification}</div>
                <div><strong>Issue Date:</strong> {result.certificate.issuedAt}</div>
              </div>
            </div>
          )}

          {result && !result.found && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 18, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b' }}>
              <AlertCircle size={18} /> No matching internship certificate found for ID &quot;{certId}&quot;.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
