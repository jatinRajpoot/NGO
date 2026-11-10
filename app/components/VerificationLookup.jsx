'use client';

import { useId, useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Search, ShieldCheck, QrCode, Upload, Clock } from 'lucide-react';
import { organization } from '../data/site-data';

const MAX_CODE_LENGTH = 100;

export default function VerificationLookup() {
  const captionId = useId();
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [scanNote, setScanNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  async function verifyCodeString(inputCode) {
    const trimmed = (inputCode || '').trim().slice(0, MAX_CODE_LENGTH);
    if (!trimmed) return;
    setEnteredCode(trimmed);
    setLoading(true);
    setErrorMsg('');
    setScanNote('');

    try {
      const res = await fetch(`/api/certificates/verify/?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setChecked(true);
      if (data?.found && data?.document) {
        setLookupResult({
          found: true,
          verified: Boolean(data.verified),
          status: data.status,
          document: data.document,
        });
      } else {
        setLookupResult({ found: false, verified: false, document: null });
      }
    } catch {
      setErrorMsg('Unable to reach the server verification registry. Please try again.');
      setChecked(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const query = new URLSearchParams(window.location.search);
      const initial = (query.get('code') || query.get('id') || '').trim().slice(0, MAX_CODE_LENGTH);
      if (initial) {
        setCode(initial);
        verifyCodeString(initial);
      }
    } catch {
      // Ignore
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    verifyCodeString(code);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanNote('');
    setErrorMsg('');

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const bitmap = await createImageBitmap(file);
        const barcodes = await detector.detect(bitmap);
        bitmap.close?.();
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          let raw = barcodes[0].rawValue.trim();
          try {
            const parsed = new URL(raw);
            raw = parsed.searchParams.get('code') || parsed.searchParams.get('id') || raw;
          } catch {
            // Raw value is already a direct code
          }
          setCode(raw);
          setScanNote(`Decoded QR payload from ${file.name}. Verifying against server registry...`);
          await verifyCodeString(raw);
          return;
        }
        setErrorMsg(`No QR code detected inside ${file.name}. Enter the printed code below instead.`);
        return;
      } catch {
        // Fall through to manual guidance
      }
    }

    setScanNote('In-browser QR image decoding is unavailable in this browser. Please scan with your phone camera or enter the printed reference code below.');
  }

  const doc = lookupResult?.document;

  return (
    <div className="verification-lookup-container">
      <div className="verification-options-bar">
        <button
          type="button"
          className="button button-outline-blue"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload QR code image file"
        >
          <Upload size={16} aria-hidden="true" /> Decode QR Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>

      {scanNote && (
        <p className="form-caption" role="status" style={{ color: '#1E40AF', marginBottom: '10px' }}>
          <QrCode size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} aria-hidden="true" />
          {scanNote}
        </p>
      )}

      {errorMsg && (
        <p className="form-caption" role="alert" style={{ color: '#991B1B', marginBottom: '10px' }}>
          {errorMsg}
        </p>
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
              setLookupResult(null);
            }}
            autoComplete="off"
            spellCheck="false"
            maxLength={MAX_CODE_LENGTH}
            required
            placeholder="e.g. GSDD-VIS-2026-015 or GSDD-ACH-2026-081"
            aria-describedby={captionId}
          />
          <button type="submit" className="button button-blue" disabled={loading}>
            <Search size={16} aria-hidden="true" /> {loading ? 'Checking...' : 'Check code'}
          </button>
        </div>
        <p className="form-caption" id={captionId}>
          Lookups query the durable server registry in real time, or open a link containing <code>?code=…</code>.
        </p>
      </form>

      <div className="sample-verification-chips">
        <span style={{ fontSize: '11px', color: 'var(--gsdd-text-muted)', fontWeight: '600' }}>Sample Registry Codes:</span>
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

      {checked && lookupResult && (
        lookupResult.found && doc ? (
          lookupResult.verified ? (
            <div className="verification-result verified-card" role="status" aria-live="polite">
              <div className="verified-header">
                <CheckCircle2 size={32} color="#15803D" aria-hidden="true" />
                <div>
                  <span className="auth-stamp">OFFICIALLY VERIFIED &bull; SERVER RECORD</span>
                  <h3>{doc.type}</h3>
                </div>
              </div>

              <div className="verified-details-list">
                <div className="v-row">
                  <span className="v-lbl">Document Reference:</span>
                  <span className="v-val"><code>{doc.code || enteredCode}</code></span>
                </div>
                <div className="v-row">
                  <span className="v-lbl">Recipient / Holder:</span>
                  <span className="v-val"><strong>{doc.recipient}</strong></span>
                </div>
                <div className="v-row">
                  <span className="v-lbl">Issue / Verification Date:</span>
                  <span className="v-val">{doc.date}</span>
                </div>
                <div className="v-row">
                  <span className="v-lbl">Purpose / Event:</span>
                  <span className="v-val">{doc.purpose}</span>
                </div>
                <div className="v-row">
                  <span className="v-lbl">Issuing Authority:</span>
                  <span className="v-val">{doc.authority}</span>
                </div>
                <div className="v-row">
                  <span className="v-lbl">Organization:</span>
                  <span className="v-val">{organization.legalName} (CIN: {organization.cin})</span>
                </div>
              </div>

              <div className="verified-footer">
                <ShieldCheck size={16} color="#15803D" aria-hidden="true" />
                <span>Record validated against the server-backed GSDD Foundation registry.</span>
              </div>
            </div>
          ) : (
            <div className="verification-result" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '16px' }} role="status" aria-live="polite">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Clock size={24} color="#B45309" aria-hidden="true" />
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase' }}>
                    PENDING VERIFICATION / APPROVAL
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#78350F' }}>{doc.type}</h3>
                </div>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#78350F' }}>
                Code <code>{doc.code || enteredCode}</code> exists in the server queue with status <strong>{lookupResult.status}</strong>, but has not yet been approved/settled as an official verified record.
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#92400E' }}>
                Holder: <strong>{doc.recipient}</strong> &bull; {doc.purpose}
              </p>
            </div>
          )
        ) : (
          <div className="verification-result not-found-card" role="status" aria-live="polite">
            <AlertCircle size={28} color="#B91C1C" aria-hidden="true" />
            <div>
              <h4 style={{ margin: 0, color: '#991B1B' }}>No Record Found</h4>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7F1D1D' }}>
                Code <code>{enteredCode}</code> was not found in our server registry. Please check the spelling or contact the foundation for manual verification.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
