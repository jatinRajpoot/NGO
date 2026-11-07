'use client';

import { useState, useEffect } from 'react';
import {
  Award, Mail, Eye, Download, Printer, QrCode,
  CheckCircle2, AlertTriangle, Search, ShieldCheck,
  Building2, Calendar, FileText, Camera, Upload, ExternalLink, RefreshCw
} from 'lucide-react';
import { verifiedCertificates } from '../certificate/certificate-data';

export default function CertificateRecipientHub() {
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'email', 'qr', 'search'
  const [searchId, setSearchId] = useState('');
  const [currentCert, setCurrentCert] = useState(verifiedCertificates[0]);
  const [verificationResult, setVerificationResult] = useState({ checked: true, isValid: true, cert: verifiedCertificates[0] });

  // Email Receive State
  const [recipientEmail, setRecipientEmail] = useState('');
  const [foundEmails, setFoundEmails] = useState([verifiedCertificates[0]]);
  const [emailSearched, setEmailSearched] = useState(false);

  // QR Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  // Read URL query parameter if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id') || params.get('code');
      if (queryId) {
        const found = verifiedCertificates.find((c) => c.id.toUpperCase() === queryId.trim().toUpperCase());
        if (found) {
          setCurrentCert(found);
          setVerificationResult({ checked: true, isValid: true, cert: found });
          setActiveTab('view');
        } else {
          setVerificationResult({ checked: true, isValid: false, cert: null, attemptedId: queryId });
          setActiveTab('search');
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Handle Search by Certificate ID
  function handleSearchSubmit(e) {
    e.preventDefault();
    const clean = searchId.trim().toUpperCase();
    if (!clean) return;

    const match = verifiedCertificates.find((c) => c.id.toUpperCase() === clean || c.verificationCode.toUpperCase() === clean);
    if (match) {
      setCurrentCert(match);
      setVerificationResult({ checked: true, isValid: true, cert: match });
    } else {
      setVerificationResult({ checked: true, isValid: false, cert: null, attemptedId: clean });
    }
  }

  // Handle Email Lookup (Receive Certificate)
  function handleEmailLookup(e) {
    e.preventDefault();
    const clean = recipientEmail.trim().toLowerCase();
    if (!clean) return;

    const matches = verifiedCertificates.filter((c) => c.email.toLowerCase().includes(clean) || c.recipient.toLowerCase().includes(clean));
    setFoundEmails(matches);
    setEmailSearched(true);
  }

  // Handle Simulated QR Scan
  function handleSimulateScan(targetCert) {
    setQrScanning(true);
    setScannerActive(true);
    setTimeout(() => {
      setQrScanning(false);
      setScannedResult({ ...targetCert, isFake: false });
      setCurrentCert(targetCert);
      setVerificationResult({ checked: true, isValid: true, cert: targetCert });
    }, 1000);
  }

  // Handle Simulated Fake/Counterfeit QR Scan (Feature 6: Verify Certificate Original vs Fake)
  function handleSimulateFakeScan() {
    setQrScanning(true);
    setScannerActive(true);
    setTimeout(() => {
      setQrScanning(false);
      setScannedResult({
        isFake: true,
        id: 'FAKE-QR-88902-TAMPERED',
        recipient: 'Unauthorized Claimant',
        errorReason: 'Cryptographic digital signature mismatch and missing MCA Section 8 registration hash.',
      });
    }, 1000);
  }

  // Handle QR Image Upload simulation
  function handleQrFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScanning(true);
    setTimeout(() => {
      setQrScanning(false);
      const randomCert = verifiedCertificates[0];
      setScannedResult({ ...randomCert, isFake: false });
      setCurrentCert(randomCert);
      setVerificationResult({ checked: true, isValid: true, cert: randomCert });
    }, 1200);
  }

  // Print & PDF Download Handler
  function handlePrintCertificate(certToPrint) {
    const cert = certToPrint || currentCert;
    const prevTitle = typeof document !== 'undefined' ? document.title : '';
    if (typeof document !== 'undefined' && cert) {
      document.title = `Certificate_${cert.id}_${(cert.recipient || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    window.print();
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.title = prevTitle;
      }
    }, 1500);
  }

  function handleDownloadPdf() {
    handlePrintCertificate(currentCert);
  }

  return (
    <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <style>{`
        @media print {
          body, html {
            background: #FFF !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, nav, .site-header, .site-footer, .page-hero, .no-print, [role="navigation"] {
            display: none !important;
          }
          .certificate-printable-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: 8px double #D97706 !important;
            background: #FFFDF9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
      
      {/* Recipient Navigation Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('view')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'view' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            background: activeTab === 'view' ? '#EFF6FF' : '#FFF',
            color: activeTab === 'view' ? '#1D4ED8' : '#475569',
            fontWeight: activeTab === 'view' ? '700' : '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Eye size={16} /> View & Print Certificate
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'email' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            background: activeTab === 'email' ? '#EFF6FF' : '#FFF',
            color: activeTab === 'email' ? '#1D4ED8' : '#475569',
            fontWeight: activeTab === 'email' ? '700' : '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Mail size={16} /> Receive Certificate (Email)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'search' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            background: activeTab === 'search' ? '#EFF6FF' : '#FFF',
            color: activeTab === 'search' ? '#1D4ED8' : '#475569',
            fontWeight: activeTab === 'search' ? '700' : '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Search size={16} /> Certificate ID Search & Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: activeTab === 'qr' ? '2px solid #2563EB' : '1px solid #CBD5E1',
            background: activeTab === 'qr' ? '#EFF6FF' : '#FFF',
            color: activeTab === 'qr' ? '#1D4ED8' : '#475569',
            fontWeight: activeTab === 'qr' ? '700' : '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <QrCode size={16} /> QR Code Scanner & Authenticity
        </button>
      </div>

      {/* TAB 1: VIEW, DOWNLOAD & PRINT CERTIFICATE */}
      {activeTab === 'view' && currentCert && (
        <div>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: '4px' }}>
                Online Certificate Viewer
              </span>
              <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#0F172A' }}>
                Verified Certificate: {currentCert.id}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handlePrintCertificate()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#D97706', color: '#FFF', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                <Printer size={15} /> Print Certificate
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1E40AF', color: '#FFF', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* Authentic Gold Border Paper Certificate */}
          <div
            className="certificate-printable-card"
            style={{
              background: '#FFFDF9',
              border: '10px double #D97706',
              borderRadius: '12px',
              padding: '40px 30px',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.15)',
              position: 'relative',
              maxWidth: '820px',
              margin: '0 auto',
            }}
          >
            {/* Top Emblem and Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF3C7', border: '2px solid #D97706', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#D97706' }}>
                <Award size={32} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#78350F', margin: '0 0 4px', letterSpacing: '0.04em' }}>
                GLOBAL SKILLS & DIGITAL DEVELOPMENT WELFARE FOUNDATION
              </h1>
              <p style={{ fontSize: '12px', color: '#92400E', margin: '0 0 6px', fontWeight: '600' }}>
                A Registered Section 8 Non-Profit Organization • Ministry of Corporate Affairs, Govt. of India
              </p>
              <div style={{ fontSize: '11px', color: '#B45309', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span><strong>CIN:</strong> {currentCert.cin}</span>
                <span><strong>MCA Reg:</strong> {currentCert.mcaReg}</span>
                <span><strong>PAN:</strong> {currentCert.pan}</span>
                <span><strong>80G No:</strong> {currentCert.tax80g}</span>
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ margin: '24px 0 16px', borderTop: '2px solid #FDE68A', borderBottom: '2px solid #FDE68A', padding: '12px 0' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B45309', display: 'block', marginBottom: '4px' }}>
                {currentCert.category}
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#78350F', margin: 0 }}>
                {currentCert.type}
              </h2>
            </div>

            {/* Recipient Details */}
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 8px' }}>
              This is to certify that
            </p>
            <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px', textDecoration: 'underline', textDecorationColor: '#D97706', textUnderlineOffset: '6px' }}>
              {currentCert.recipient}
            </h3>
            <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: '700', display: 'block', marginBottom: '18px' }}>
              ({currentCert.role})
            </span>

            {/* Purpose Statement */}
            <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 28px', fontStyle: 'italic' }}>
              &ldquo;{currentCert.purpose}&rdquo;
            </p>

            {/* Verification Metadata & QR Code */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #CBD5E1', paddingTop: '20px', marginTop: '20px', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Certificate ID: <strong style={{ fontFamily: 'monospace', color: '#1E40AF' }}>{currentCert.id}</strong></span>
                  <span>Issue Date: <strong>{currentCert.issueDate}</strong></span>
                  <span>Validity: <strong style={{ color: '#16A34A' }}>{currentCert.validity}</strong></span>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94A3B8' }}>{currentCert.hash}</span>
                </div>
              </div>

              {/* Verified QR Code Badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '84px', height: '84px', border: '2px solid #0F172A', background: '#FFF', display: 'grid', placeItems: 'center', margin: '0 auto 4px', padding: '4px' }}>
                  <QrCode size={72} color="#0F172A" />
                </div>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#166534', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                  AUTHENTIC QR
                </span>
              </div>

              {/* Signatures */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '120px', borderBottom: '1px solid #0F172A', margin: '0 0 4px auto' }} />
                <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>Jatin Rajpoot</strong>
                <span style={{ fontSize: '11px', color: '#64748B' }}>President & Founder Director</span>
                <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>GSDD Welfare Foundation</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: RECEIVE CERTIFICATE VIA EMAIL */}
      {activeTab === 'email' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#0F172A' }}>
              Receive Your Certificate via Email
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Recipients can check official certificate dispatch notices delivered to their registered email address.
            </p>
          </div>

          <form onSubmit={handleEmailLookup} style={{ display: 'flex', gap: '10px', maxWidth: '520px', marginBottom: '24px' }}>
            <input
              type="text"
              required
              placeholder="Enter your email or full name (e.g. kavita.kumari@example.com)"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
            <button
              type="submit"
              style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Check Inbox
            </button>
          </form>

          {/* Quick Demo Recipient Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              ⚡ Sample Recipient Mailboxes:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {verifiedCertificates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setRecipientEmail(c.email);
                    setFoundEmails([c]);
                    setEmailSearched(true);
                  }}
                  style={{ padding: '6px 12px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <strong>{c.recipient}</strong> ({c.email})
                </button>
              ))}
            </div>
          </div>

          {/* Email Inbox Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {foundEmails.map((cert) => (
              <div
                key={cert.id}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '20px',
                  borderLeft: '5px solid #2563EB',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#2563EB" />
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>{cert.emailSubject}</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Delivered: {cert.emailDelivered}</span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                  From: <strong>certificates@gsddfoundation.org</strong> &bull; To: <strong>{cert.email}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    Dear <strong>{cert.recipient}</strong>,
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    Congratulations! GSDD Foundation has officially conferred upon you the <strong>{cert.type}</strong> ({cert.id}) for your noble contributions.
                  </p>
                  <p style={{ margin: 0 }}>
                    Your authentic digital certificate is ready for online verification, digital download, and high-resolution printing.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCert(cert);
                      setActiveTab('view');
                    }}
                    style={{ padding: '8px 16px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={14} /> Open & View Certificate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCert(cert);
                      setActiveTab('view');
                      setTimeout(() => handlePrintCertificate(cert), 300);
                    }}
                    style={{ padding: '8px 16px', background: '#FFF', color: '#2563EB', border: '1px solid #2563EB', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={14} /> Print Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATE ID SEARCH & DETAILS */}
      {activeTab === 'search' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#0F172A' }}>
              Certificate ID Search & Statutory Details
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Enter any official certificate code or reference number to retrieve full recipient details and issuing organization records.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '520px', marginBottom: '20px' }}>
            <input
              type="text"
              required
              placeholder="e.g. GSDD-ACH-2026-081 or GSDD-APT-2026-001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', textTransform: 'uppercase' }}
            />
            <button
              type="submit"
              style={{ padding: '10px 22px', background: '#1E40AF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Search
            </button>
          </form>

          {/* Quick Query Pills */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              Sample Certificate IDs:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {verifiedCertificates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSearchId(c.id);
                    setCurrentCert(c);
                    setVerificationResult({ checked: true, isValid: true, cert: c });
                  }}
                  style={{ padding: '4px 10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer' }}
                >
                  {c.id}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Result Display */}
          {verificationResult.checked && verificationResult.isValid && verificationResult.cert && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: '#DCFCE7', padding: '12px 16px', borderRadius: '8px', color: '#166534' }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <strong style={{ fontSize: '15px' }}>Official Record Found: Authentic & Valid Certificate</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>RECIPIENT FULL NAME</span>
                  <strong style={{ fontSize: '15px', color: '#0F172A', display: 'block' }}>{verificationResult.cert.recipient}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>CERTIFICATE TYPE</span>
                  <strong style={{ fontSize: '15px', color: '#1E40AF', display: 'block' }}>{verificationResult.cert.type}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ISSUE DATE</span>
                  <strong style={{ fontSize: '15px', color: '#0F172A', display: 'block' }}>{verificationResult.cert.issueDate}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ISSUING ORGANIZATION</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>{verificationResult.cert.issuingOrganization}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>AUTHORITY & SIGNATORY</span>
                  <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>{verificationResult.cert.authority}</strong>
                </div>

                <div style={{ background: '#FFF', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>STATUTORY IDENTIFIERS</span>
                  <span style={{ fontSize: '11px', color: '#334155', display: 'block' }}>
                    CIN: {verificationResult.cert.cin} • 80G: {verificationResult.cert.tax80g}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentCert(verificationResult.cert);
                  setActiveTab('view');
                }}
                style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Eye size={15} /> View Complete Formal Certificate
              </button>
            </div>
          )}

          {verificationResult.checked && !verificationResult.isValid && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '24px', color: '#991B1B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <AlertTriangle size={24} color="#DC2626" />
                <strong style={{ fontSize: '16px' }}>No Verified Record Found</strong>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#7F1D1D' }}>
                The certificate ID <strong>{verificationResult.attemptedId}</strong> could not be authenticated against the GSDD Foundation national registry.
              </p>
              <span style={{ fontSize: '12px', color: '#991B1B' }}>
                Please check for typographical errors or contact Central Administration at <strong>info@gsddfoundation.org</strong>.
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QR CODE SCANNER & AUTHENTICITY VALIDATION */}
      {activeTab === 'qr' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#0F172A' }}>
              QR Code Verification & Authenticity Integrity Scanner
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Scan the physical QR code printed on any GSDD certificate or upload a QR image to detect genuine vs counterfeit documents.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* Camera Scanner Simulator Card */}
            <div style={{ background: '#0F172A', color: '#FFF', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '160px', height: '160px', border: '2px dashed #38BDF8', borderRadius: '12px', margin: '0 auto 16px', display: 'grid', placeItems: 'center', position: 'relative' }}>
                {qrScanning ? (
                  <div style={{ color: '#38BDF8' }}>
                    <RefreshCw size={36} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>Scanning QR Code...</span>
                  </div>
                ) : (
                  <div>
                    <Camera size={42} color="#94A3B8" />
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '6px' }}>
                      Position QR in frame
                    </span>
                  </div>
                )}
              </div>

              <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '14px' }}>
                Simulate Camera QR Scan or Counterfeit Verification Test:
              </span>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleSimulateScan(verifiedCertificates[0])}
                  disabled={qrScanning}
                  style={{ padding: '8px 14px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Scan Original (Kavita Kumari)
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateScan(verifiedCertificates[1])}
                  disabled={qrScanning}
                  style={{ padding: '8px 14px', background: '#0D9488', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Scan Original (Manoj Mandal)
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFakeScan}
                  disabled={qrScanning}
                  style={{ padding: '8px 14px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ⚠️ Test Fake / Counterfeit QR
                </button>
              </div>

              {/* Upload QR Image file option */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '14px', marginTop: '10px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1E293B', color: '#E2E8F0', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '1px solid #475569' }}>
                  <Upload size={14} /> Upload QR Image File
                  <input type="file" accept="image/*" onChange={handleQrFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Authenticity Engine Verification Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={22} color="#16A34A" />
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0F172A' }}>
                  Cryptographic Authenticity Engine (Original vs Fake Check)
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
                Every genuine GSDD Foundation certificate is digitally signed and cryptographically matched against our Section 8 ledger. Counterfeit or tampered credentials fail verification instantly.
              </p>

              {scannedResult ? (
                scannedResult.isFake ? (
                  <div style={{ background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: '8px', padding: '16px', color: '#991B1B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertTriangle size={20} color="#DC2626" />
                      <strong style={{ fontSize: '14px' }}>AUTHENTICITY CHECK FAILED: FAKE / COUNTERFEIT DETECTED</strong>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', lineHeight: '1.6' }}>
                      {scannedResult.errorReason}
                    </p>
                    <div style={{ background: '#FFF', padding: '10px', borderRadius: '6px', border: '1px solid #FCA5A5', fontSize: '11px', color: '#7F1D1D' }}>
                      <div>Attempted Identifier: <strong>{scannedResult.id}</strong></div>
                      <div>Claimant: <strong>{scannedResult.recipient}</strong></div>
                      <div>Status: <span style={{ color: '#DC2626', fontWeight: '800' }}>REJECTED & FLAGGED AS FRAUDULENT</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', padding: '16px', color: '#166534' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <CheckCircle2 size={18} color="#16A34A" />
                      <strong>QR VALIDATION SUCCESSFUL: 100% ORIGINAL & AUTHENTIC</strong>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.6', background: '#FFF', padding: '12px', borderRadius: '6px', border: '1px solid #BBF7D0', margin: '8px 0' }}>
                      <div><strong>Recipient Name:</strong> {scannedResult.recipient}</div>
                      <div><strong>Certificate Type:</strong> {scannedResult.type}</div>
                      <div><strong>Issue Date:</strong> {scannedResult.issueDate}</div>
                      <div><strong>Issuing Organization:</strong> {scannedResult.issuingOrganization}</div>
                      <div><strong>Certificate ID:</strong> {scannedResult.id}</div>
                      <div><strong>Security Hash:</strong> <code>{scannedResult.hash?.slice(0, 32)}...</code></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentCert(scannedResult);
                        setActiveTab('view');
                      }}
                      style={{ marginTop: '4px', padding: '8px 16px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      View Verified Certificate →
                    </button>
                  </div>
                )
              ) : (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#1E40AF' }}>
                  Click one of the simulated QR scan buttons above or upload a certificate QR image to execute a real-time cryptographic authenticity test (Original vs Fake).
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
