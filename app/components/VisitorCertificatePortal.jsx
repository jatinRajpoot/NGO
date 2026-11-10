'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Printer, CheckCircle2, ShieldCheck, QrCode, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { organization } from '../data/site-data';
import QRCodeSvg from './QRCodeSvg';

export default function VisitorCertificatePortal() {
  const [visitorName, setVisitorName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('Annual Skill Development Conclave 2026');
  const [visitDate, setVisitDate] = useState('2026-03-05');
  const [comments, setComments] = useState('');

  const [certRecord, setCertRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/certificates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName.trim(),
          organization: organizationName.trim() || 'Independent Visitor',
          email: email.trim(),
          phone: phone.trim(),
          purpose: visitPurpose,
          date: visitDate,
          comments: comments.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Unable to log certificate request.');
        return;
      }
      setCertRecord(data.certificate);
    } catch {
      setErrorMsg('Network error submitting certificate request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshStatus() {
    if (!certRecord?.id) return;
    setChecking(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/certificates/verify/?code=${encodeURIComponent(certRecord.id)}`);
      const data = await res.json();
      if (data?.document) {
        setCertRecord((prev) => ({
          ...prev,
          id: data.document.code || prev.id,
          status: data.document.status,
          isVerifiedOfficial: data.document.isVerifiedOfficial,
          authority: data.document.authority,
          type: data.document.type,
        }));
      }
    } catch {
      setErrorMsg('Unable to check approval status right now.');
    } finally {
      setChecking(false);
    }
  }

  const isOfficial = Boolean(certRecord?.isVerifiedOfficial && certRecord?.status === 'Verified');
  const verifyUrl = certRecord ? `https://gsddfoundation.org/verify/?code=${encodeURIComponent(certRecord.id)}` : '';

  return (
    <div className="visitor-cert-portal">
      {!certRecord ? (
        <form onSubmit={handleGenerate} className="visitor-cert-form card-surface">
          <div className="form-header">
            <span className="pill-badge"><Award size={14} aria-hidden="true" /> Visitor Certificate Request</span>
            <h2>Request Your Visitor Certificate</h2>
            <p>Non-members, guests, seminar participants, and community visitors can submit a certificate request for staff verification and official issuance.</p>
          </div>

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="form-grid">
            <label>
              <span>Full Name (as to appear on certificate) *</span>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Dr. Rajesh Sharma / Sunita Verma"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
              />
            </label>

            <label>
              <span>Organization / Affiliation (optional)</span>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Delhi University / Self-employed / Tech NGO"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </label>

            <label>
              <span>Email Address</span>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              <span>Mobile / WhatsApp Number</span>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="span-two">
              <span>Event / Program Attended / Visit Purpose *</span>
              <select
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value)}
              >
                <option value="Annual Skill Development Conclave 2026">Annual Skill Development Conclave 2026</option>
                <option value="Community Digital Literacy Workshop">Community Digital Literacy Workshop</option>
                <option value="Rural Health &amp; Hygiene Awareness Camp">Rural Health &amp; Hygiene Awareness Camp</option>
                <option value="Women Empowerment &amp; Livelihood Exhibition">Women Empowerment &amp; Livelihood Exhibition</option>
                <option value="GSDD Foundation Head Office Official Visit">GSDD Foundation Head Office Official Visit</option>
                <option value="Youth Career Guidance &amp; Mentorship Session">Youth Career Guidance &amp; Mentorship Session</option>
              </select>
            </label>

            <label>
              <span>Date of Visit / Attendance *</span>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </label>

            <label>
              <span>Remarks / Feedback (optional)</span>
              <input
                type="text"
                placeholder="Great initiative for rural digital skills!"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </label>
          </div>

          <div className="form-action-row">
            <button type="submit" className="button button-blue" disabled={loading}>
              <Award size={18} aria-hidden="true" />
              {loading ? 'Submitting Request...' : 'Submit Certificate Request'}
            </button>
          </div>
          <p className="form-note"><ShieldCheck size={14} aria-hidden="true" /> Requests are logged on our server and become verifiable official certificates once approved by foundation staff.</p>
        </form>
      ) : !isOfficial ? (
        <div className="issued-cert-wrapper card-surface" style={{ padding: '24px' }} role="status" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '18px' }}>
            <Clock size={22} color="#B45309" aria-hidden="true" />
            <div>
              <strong style={{ display: 'block', color: '#92400E' }}>
                Request Logged — {certRecord.status}
              </strong>
              <span style={{ fontSize: '13px', color: '#78350F' }}>
                Request ID: <code>{certRecord.id}</code>. This certificate is not official or verified until approved by foundation staff.
              </span>
            </div>
          </div>

          <div className="app-summary-box" style={{ marginBottom: '18px' }}>
            <div className="summary-row"><span className="lbl">Request Tracking ID:</span><span className="val"><code>{certRecord.id}</code></span></div>
            <div className="summary-row"><span className="lbl">Visitor Name:</span><span className="val">{certRecord.recipient}</span></div>
            <div className="summary-row"><span className="lbl">Affiliation:</span><span className="val">{certRecord.organization}</span></div>
            <div className="summary-row"><span className="lbl">Program / Event:</span><span className="val">{certRecord.purpose}</span></div>
            <div className="summary-row"><span className="lbl">Visit Date:</span><span className="val">{certRecord.date}</span></div>
            <div className="summary-row"><span className="lbl">Status:</span><span className="val"><strong>{certRecord.status}</strong></span></div>
          </div>

          <div className="cert-action-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button type="button" onClick={handleRefreshStatus} disabled={checking} className="button button-blue">
              <RefreshCw size={15} aria-hidden="true" /> {checking ? 'Checking...' : 'Check Approval Status'}
            </button>
            <Link href={`/verify/?code=${encodeURIComponent(certRecord.id)}`} className="button button-outline-blue">
              <QrCode size={16} aria-hidden="true" /> View Verification Status
            </Link>
            <button type="button" onClick={() => setCertRecord(null)} className="button-text">
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        <div className="issued-cert-wrapper">
          <div className="cert-toolbar no-print">
            <div className="cert-status-msg">
              <CheckCircle2 size={20} color="#15803D" aria-hidden="true" />
              <span><strong>Verified Official Certificate!</strong> Serial: <code>{certRecord.id}</code></span>
            </div>
            <div className="cert-action-buttons">
              <button type="button" onClick={() => window.print()} className="button button-blue">
                <Printer size={16} aria-hidden="true" /> Print / Save as PDF
              </button>
              <Link href={`/verify/?code=${encodeURIComponent(certRecord.id)}`} className="button button-outline-blue">
                <QrCode size={16} aria-hidden="true" /> Verify Online
              </Link>
              <button type="button" onClick={() => setCertRecord(null)} className="button-text">
                Request Another
              </button>
            </div>
          </div>

          <div className="printable-certificate-frame">
            <div className="cert-border-outer">
              <div className="cert-border-inner">
                <div className="cert-header">
                  <div className="cert-logo-mark">GSDD</div>
                  <h1 className="cert-org-title">{organization.legalName}</h1>
                  <p className="cert-org-sub">A Registered Section 8 Non-Profit Organization &bull; Govt. of India</p>
                  <p className="cert-reg-details">CIN: {organization.cin} &bull; NGO Darpan: {organization.darpan} &bull; 80G: {organization.tax80g}</p>
                </div>

                <div className="cert-ribbon-badge">CERTIFICATE OF PARTICIPATION &amp; HONOR</div>

                <p className="cert-certifies">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>
                <div className="cert-recipient-name">{certRecord.recipient}</div>
                {certRecord.organization && (
                  <p className="cert-recipient-org">Representing: <strong>{certRecord.organization}</strong></p>
                )}

                <p className="cert-body-text">
                  in recognition and appreciation of your valuable presence, participation, and contribution during the{' '}
                  <strong>&ldquo;{certRecord.purpose}&rdquo;</strong> organized by Global Skills &amp; Digital Development Foundation at Raniganj, Araria, Bihar on <strong>{certRecord.date}</strong>.
                </p>

                <div className="cert-footer">
                  <div className="cert-sig-block">
                    <div className="sig-line">Manoj Kumar Bishwas</div>
                    <span className="sig-title">Founder / CEO</span>
                    <span className="sig-org">GSDD Foundation</span>
                  </div>

                  <div className="cert-qr-block">
                    <div className="cert-qr-box">
                      <QRCodeSvg value={verifyUrl} size={96} label={certRecord.id} />
                    </div>
                    <small>Scan or visit /verify to validate</small>
                  </div>

                  <div className="cert-sig-block">
                    <div className="sig-line">Arvind Kumar</div>
                    <span className="sig-title">Founder / MD</span>
                    <span className="sig-org">GSDD Foundation</span>
                  </div>
                </div>

                <div className="cert-bottom-id">
                  <span>Certificate ID: <strong>{certRecord.id}</strong></span>
                  <span>Visit Date: {certRecord.date}</span>
                  <span>Authenticity: Verified Server Registry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
