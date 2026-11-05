'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Download, Printer, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Calendar, User, FileText, QrCode } from 'lucide-react';
import { organization } from '../data/site-data';

export default function VisitorCertificatePortal() {
  const [visitorName, setVisitorName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('Annual Skill Development Conclave 2026');
  const [visitDate, setVisitDate] = useState('2026-03-05');
  const [comments, setComments] = useState('');
  
  const [issuedCert, setIssuedCert] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleGenerate(e) {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setLoading(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const certNo = `GSDD-VIS-2026-${randomSuffix}`;

    setTimeout(() => {
      setIssuedCert({
        certNo,
        name: visitorName.trim(),
        organization: organizationName.trim() || 'Independent Visitor',
        email: email.trim(),
        phone: phone.trim(),
        purpose: visitPurpose,
        date: visitDate,
        issuedBy: 'Jatin Rajpoot (President) & Amit Kumar Singh (General Secretary)',
        timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
      setLoading(false);
    }, 600);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="visitor-cert-portal">
      {!issuedCert ? (
        <form onSubmit={handleGenerate} className="visitor-cert-form card-surface">
          <div className="form-header">
            <span className="pill-badge"><Award size={14} aria-hidden="true" /> Visitor Certificate Request</span>
            <h2>Request Your Official Visitor Certificate</h2>
            <p>Non-members, guests, seminar participants, and community visitors can request an official GSDD Foundation Visitor Certificate of Honor &amp; Participation.</p>
          </div>

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
              {loading ? 'Generating Certificate...' : 'Generate Official Certificate'}
            </button>
          </div>
          <p className="form-note"><ShieldCheck size={14} aria-hidden="true" /> Each certificate comes with an official serial number and QR verification link verifiable on our portal.</p>
        </form>
      ) : (
        <div className="issued-cert-wrapper">
          <div className="cert-toolbar no-print">
            <div className="cert-status-msg">
              <CheckCircle2 size={20} color="#15803D" aria-hidden="true" />
              <span><strong>Certificate Successfully Issued!</strong> Verified Serial: <code>{issuedCert.certNo}</code></span>
            </div>
            <div className="cert-action-buttons">
              <button type="button" onClick={handlePrint} className="button button-blue">
                <Printer size={16} aria-hidden="true" /> Print / Save as PDF
              </button>
              <Link href={`/verify?code=${issuedCert.certNo}`} className="button button-outline-blue">
                <QrCode size={16} aria-hidden="true" /> Verify Online
              </Link>
              <button type="button" onClick={() => setIssuedCert(null)} className="button-text">
                Request Another
              </button>
            </div>
          </div>

          {/* Official Printable Certificate Layout */}
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
                <div className="cert-recipient-name">{issuedCert.name}</div>
                {issuedCert.organization && (
                  <p className="cert-recipient-org">Representing: <strong>{issuedCert.organization}</strong></p>
                )}

                <p className="cert-body-text">
                  in recognition and appreciation of your valuable presence, participation, and contribution during the{' '}
                  <strong>&ldquo;{issuedCert.purpose}&rdquo;</strong> organized by Global Skills &amp; Digital Development Foundation at Raniganj, Araria, Bihar on <strong>{issuedCert.date}</strong>.
                </p>

                <div className="cert-footer">
                  <div className="cert-sig-block">
                    <div className="sig-line">Jatin Rajpoot</div>
                    <span className="sig-title">President</span>
                    <span className="sig-org">GSDD Foundation</span>
                  </div>

                  <div className="cert-qr-block">
                    <div className="cert-qr-box">
                      <QrCode size={64} aria-hidden="true" />
                    </div>
                    <span className="qr-code-text">{issuedCert.certNo}</span>
                    <small>Scan or visit /verify to validate</small>
                  </div>

                  <div className="cert-sig-block">
                    <div className="sig-line">Amit Kumar Singh</div>
                    <span className="sig-title">General Secretary</span>
                    <span className="sig-org">GSDD Foundation</span>
                  </div>
                </div>

                <div className="cert-bottom-id">
                  <span>Certificate ID: <strong>{issuedCert.certNo}</strong></span>
                  <span>Issued Date: {issuedCert.timestamp}</span>
                  <span>Authenticity: Verified Section 8 Registry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
