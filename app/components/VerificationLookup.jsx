'use client';

import { useId, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Search, ShieldCheck } from 'lucide-react';

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
  'GSDD-APT-2026-003': {
    type: 'Official Foundation Appointment Letter',
    recipient: 'Md. Tariq Anwar (President, Youth Sports Club)',
    date: '2026-03-10 at 10:00 AM',
    purpose: 'Coordination for youth sports and drug awareness rally in Araria district.',
    authority: 'Executive Committee, GSDD Foundation',
  },
  'GSDD-APT-2026-004': {
    type: 'Official Foundation Appointment Letter',
    recipient: 'Anita Soren (Self-Help Group Federation)',
    date: '2026-03-12 at 04:00 PM',
    purpose: 'Skill development training program for rural women artisans and handicrafts marketing.',
    authority: 'Executive Committee, GSDD Foundation',
  },
};

export default function VerificationLookup() {
  const captionId = useId();
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [checked, setChecked] = useState(false);
  const [verifiedDoc, setVerifiedDoc] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initial = (query.get('code') || query.get('id') || '').trim().slice(0, MAX_CODE_LENGTH);
    if (initial) {
      setCode(initial);
      const cleanUpper = initial.toUpperCase();
      setEnteredCode(initial);
      setChecked(true);
      if (KNOWN_DOCS[cleanUpper]) {
        setVerifiedDoc(KNOWN_DOCS[cleanUpper]);
      }
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = code.trim().slice(0, MAX_CODE_LENGTH);
    if (!trimmed) return;
    setEnteredCode(trimmed);
    setChecked(true);
    const cleanUpper = trimmed.toUpperCase();
    if (KNOWN_DOCS[cleanUpper]) {
      setVerifiedDoc(KNOWN_DOCS[cleanUpper]);
    } else {
      setVerifiedDoc(null);
    }
  }

  const echoedCode = enteredCode.length > 80 ? `${enteredCode.slice(0, 80)}…` : enteredCode;

  return (
    <>
      <form className="verification-form" onSubmit={handleSubmit}>
        <label htmlFor="verification-code">Document or reference code</label>
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
            placeholder="Enter the code printed on the document"
            aria-describedby={captionId}
          />
          <button type="submit" className="button button-blue">
            <Search size={16} aria-hidden="true" /> Check code
          </button>
        </div>
        <p className="form-caption" id={captionId}>
          You can also open a QR link that includes <code>?code=…</code> or <code>?id=…</code>.
        </p>
      </form>
      {checked && (
        verifiedDoc ? (
          <div
            className="verification-result"
            role="status"
            aria-live="polite"
            style={{
              background: '#f0fdf4',
              borderColor: '#86efac',
              color: '#14532d',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #86efac',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={22} style={{ color: '#16a34a' }} aria-hidden="true" />
              <strong style={{ fontSize: '15px' }}>Document Officially Verified</strong>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#166534' }}>
              <div>Code: <strong style={{ fontFamily: 'monospace' }}>{enteredCode}</strong></div>
              <div>Document: <strong>{verifiedDoc.type}</strong></div>
              <div>Recipient / Bearer: <strong>{verifiedDoc.recipient}</strong></div>
              <div>Date Issued: {verifiedDoc.date}</div>
              <div>Details: {verifiedDoc.purpose}</div>
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '6px' }}>
                Issued by: {verifiedDoc.authority} &bull; Section 8 Non-Profit (CIN: U88900BR2026NPL086114)
              </div>
            </div>
          </div>
        ) : (
          <div className="verification-result" role="status" aria-live="polite">
            <AlertCircle size={22} aria-hidden="true" />
            <div>
              <strong>Online verification is unavailable</strong>
              <p>
                Entered code: <code>{echoedCode}</code>. Online verification is not connected to this website. This check cannot confirm whether a document is genuine, valid, or expired, and the code was not transmitted anywhere. For official document verification, please contact the foundation directly through its published channels.
              </p>
            </div>
          </div>
        )
      )}
    </>
  );
}
