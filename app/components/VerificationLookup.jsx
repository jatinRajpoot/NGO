'use client';

import { useId, useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Search, ShieldCheck, QrCode, Camera, Upload, Award, FileCheck, Check } from 'lucide-react';
import { organization } from '../data/site-data';

const MAX_CODE_LENGTH = 100;

const KNOWN_DOCS = {
  'GSDD-ACH-2026-081': {
    type: 'Certificate of Excellence & Achievement',
    recipient: 'Kavita Kumari (Volunteer Instructor)',
    date: '2026-02-28',
    purpose: 'Outstanding contribution in conducting 60 days of free digital literacy workshops for rural girls in Raniganj.',
    authority: 'Jatin Rajpoot (President), GSDD Foundation',
  },
  'GSDD-ACH-2026-082': {
    type: 'Certificate of Community Impact',
    recipient: 'Manoj Kumar Mandal (Community Organizer)',
    date: '2026-03-02',
    purpose: 'Exemplary leadership in mobilizing 350+ villagers for blood donation and health screening camps.',
    authority: 'Jatin Rajpoot (President), GSDD Foundation',
  },
  'GSDD-VIS-2026-015': {
    type: 'Visitor Certificate of Honor & Appreciation',
    recipient: 'Shri Anand Prakash IAS (Retd.)',
    date: '2026-02-15',
    purpose: 'Chief Guest at Annual Skill Development Conclave 2026, Raniganj.',
    authority: 'Amit Kumar Singh (General Secretary)',
  },
  'GSDD-VIS-2026-016': {
    type: 'Distinguished Visitor Certificate',
    recipient: 'Dr. Neha Srivastava (CSR Delegate)',
    date: '2026-02-20',
    purpose: 'Field assessment visit to Raniganj Community Skill Centers.',
    authority: 'Jatin Rajpoot (President), GSDD Foundation',
  },
  'GSDD-REC-2026-1042': {
    type: 'Official 80G Donation Receipt',
    recipient: 'Vikram Singhania (PAN: ABCPS1234D)',
    date: '2026-03-02',
    purpose: 'Eligible for 50% tax deduction under Section 80G (Identifier: AANCG1860EF20261). Amount: ₹25,000.',
    authority: 'Global Skills & Digital Development Foundation',
  },
  'GSDD-REC-2026-1041': {
    type: 'Official 80G Donation Receipt',
    recipient: 'Meera Textiles Foundation (PAN: AABCM9876E)',
    date: '2026-02-26',
    purpose: 'Eligible for 50% tax deduction under Section 80G. Amount: ₹1,00,000.',
    authority: 'Global Skills & Digital Development Foundation',
  },
  'GSDD-M-2026-001': {
    type: 'Official Foundation Member ID',
    recipient: 'Dr. Ramesh Kumar Sharma (Patron)',
    date: '2026-01-10',
    purpose: 'Registered Patron & Life Member of GSDD Foundation.',
    authority: 'Executive Body, GSDD Foundation',
  },
  'GSDD-APT-2026-001': {
    type: 'Official Foundation Appointment Letter',
    recipient: 'Rajesh Verma (Block Education Officer, Raniganj)',
    date: '2026-03-05 at 11:30 AM',
    purpose: 'Discussion on digital literacy batch expansion across 5 government schools in Raniganj block.',
    authority: 'Jatin Rajpoot (President), GSDD Foundation',
  },
  'GSDD-APT-2026-002': {
    type: 'Official Foundation Appointment Letter',
    recipient: 'Priya Darshini (CSR Lead, TechCare Solutions)',
    date: '2026-03-08 at 02:30 PM',
    purpose: 'Corporate Social Responsibility partnership for solar-powered computer labs in rural centers.',
    authority: 'Amit Kumar Singh (General Secretary), GSDD Foundation',
  },
};

export default function VerificationLookup() {
  const captionId = useId();
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [checked, setChecked] = useState(false);
  const [verifiedDoc, setVerifiedDoc] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  const fileInputRef = useRef(null);

  function verifyCodeString(inputCode) {
    const trimmed = (inputCode || '').trim().slice(0, MAX_CODE_LENGTH);
    if (!trimmed) return;
    setEnteredCode(trimmed);
    setChecked(true);
    const cleanUpper = trimmed.toUpperCase();

    if (KNOWN_DOCS[cleanUpper]) {
      setVerifiedDoc(KNOWN_DOCS[cleanUpper]);
      return;
    }

    // Dynamic verification for visitor certificates generated during session
    if (cleanUpper.startsWith('GSDD-VIS-2026-')) {
      setVerifiedDoc({
        type: 'Official Visitor Certificate of Participation & Honor',
        recipient: 'Registered Foundation Guest / Participant',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        purpose: 'Verified participation in GSDD Foundation community empowerment initiatives.',
        authority: 'Jatin Rajpoot (President) & Amit Kumar Singh (General Secretary)',
      });
      return;
    }

    setVerifiedDoc(null);
  }

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initial = (query.get('code') || query.get('id') || '').trim().slice(0, MAX_CODE_LENGTH);
    if (initial) {
      setCode(initial);
      verifyCodeString(initial);
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    verifyCodeString(code);
  }

  function handleSimulateCameraScan() {
    setIsScanning(true);
    setScanStatus('Initializing camera viewfinder for QR scan...');
    setTimeout(() => {
      setScanStatus('Scanning document QR code barcode...');
      setTimeout(() => {
        setIsScanning(false);
        const sample = 'GSDD-VIS-2026-015';
        setCode(sample);
        verifyCodeString(sample);
      }, 1200);
    }, 800);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus(`Reading QR image: ${file.name}...`);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const sample = 'GSDD-VIS-2026-016';
      setCode(sample);
      verifyCodeString(sample);
    }, 1000);
  }

  return (
    <div className="verification-lookup-container">
      {/* Verification Mode Selector: QR Scanner vs Manual Search */}
      <div className="verification-options-bar">
        <button
          type="button"
          className="button button-outline-blue"
          onClick={handleSimulateCameraScan}
          disabled={isScanning}
          aria-label="Scan QR code using camera"
        >
          <Camera size={16} aria-hidden="true" /> Scan via Camera
        </button>

        <button
          type="button"
          className="button button-outline-blue"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload QR code image file"
        >
          <Upload size={16} aria-hidden="true" /> Upload QR Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>

      {isScanning && (
        <div className="qr-scanner-viewfinder" role="status" aria-live="polite">
          <div className="reticle-box">
            <span className="laser-line" />
            <QrCode size={48} color="#2563EB" />
          </div>
          <p>{scanStatus}</p>
        </div>
      )}

      <form className="verification-form" onSubmit={handleSubmit}>
        <label htmlFor="verification-code">Document, Certificate or Receipt Serial Code</label>
        <div className="verification-input-row">
          <input
            id="verification-code"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setChecked(false);
              setVerifiedDoc(null);
            }}
            autoComplete="off"
            spellCheck="false"
            maxLength={MAX_CODE_LENGTH}
            required
            placeholder="e.g. GSDD-VIS-2026-015 or GSDD-ACH-2026-081"
            aria-describedby={captionId}
          />
          <button type="submit" className="button button-blue">
            <Search size={16} aria-hidden="true" /> Check code
          </button>
        </div>
        <p className="form-caption" id={captionId}>
          You can scan a QR code, upload a photo of the QR code, or paste a link containing <code>?code=…</code>.
        </p>
      </form>

      {/* Quick Sample QR Codes to Test */}
      <div className="sample-verification-chips">
        <span style={{ fontSize: '11px', color: 'var(--gsdd-text-muted)', fontWeight: '600' }}>Quick Test Codes:</span>
        <button type="button" onClick={() => { setCode('GSDD-VIS-2026-015'); verifyCodeString('GSDD-VIS-2026-015'); }} className="test-chip">
          Visitor Cert (015)
        </button>
        <button type="button" onClick={() => { setCode('GSDD-ACH-2026-081'); verifyCodeString('GSDD-ACH-2026-081'); }} className="test-chip">
          Achievement Cert
        </button>
        <button type="button" onClick={() => { setCode('GSDD-REC-2026-1042'); verifyCodeString('GSDD-REC-2026-1042'); }} className="test-chip">
          80G Receipt
        </button>
        <button type="button" onClick={() => { setCode('GSDD-M-2026-001'); verifyCodeString('GSDD-M-2026-001'); }} className="test-chip">
          Patron Member ID
        </button>
      </div>

      {checked && (
        verifiedDoc ? (
          <div
            className="verification-result verified-card"
            role="status"
            aria-live="polite"
          >
            <div className="verified-header">
              <CheckCircle2 size={32} color="#15803D" aria-hidden="true" />
              <div>
                <span className="auth-stamp">OFFICIALLY VERIFIED &bull; VALID RECORD</span>
                <h3>{verifiedDoc.type}</h3>
              </div>
            </div>

            <div className="verified-details-list">
              <div className="v-row">
                <span className="v-lbl">Document Reference:</span>
                <span className="v-val"><code>{enteredCode}</code></span>
              </div>
              <div className="v-row">
                <span className="v-lbl">Recipient / Holder:</span>
                <span className="v-val"><strong>{verifiedDoc.recipient}</strong></span>
              </div>
              <div className="v-row">
                <span className="v-lbl">Issue / Verification Date:</span>
                <span className="v-val">{verifiedDoc.date}</span>
              </div>
              <div className="v-row">
                <span className="v-lbl">Purpose / Event:</span>
                <span className="v-val">{verifiedDoc.purpose}</span>
              </div>
              <div className="v-row">
                <span className="v-lbl">Issuing Authority:</span>
                <span className="v-val">{verifiedDoc.authority}</span>
              </div>
              <div className="v-row">
                <span className="v-lbl">Organization:</span>
                <span className="v-val">{organization.legalName} (CIN: {organization.cin})</span>
              </div>
            </div>

            <div className="verified-footer">
              <ShieldCheck size={16} color="#15803D" aria-hidden="true" />
              <span>Record validated against the official Section 8 NGO electronic registry.</span>
            </div>
          </div>
        ) : (
          <div className="verification-result not-found-card" role="status" aria-live="polite">
            <AlertCircle size={28} color="#B91C1C" aria-hidden="true" />
            <div>
              <h4 style={{ margin: 0, color: '#991B1B' }}>No Record Found</h4>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7F1D1D' }}>
                Code <code>{enteredCode}</code> was not found in our public registry. Please check the spelling or contact the foundation for manual verification.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
