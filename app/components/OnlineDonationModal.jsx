'use client';

import { useState } from 'react';
import {
  QrCode, ShieldCheck, Printer, CheckCircle2,
  X, Heart, Building2, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { organization } from '../data/site-data';
import QRCodeSvg from './QRCodeSvg';

export default function OnlineDonationModal({ amount, frequency, purpose, donorName, donorEmail, onClose }) {
  const [activePaymentMethod, setActivePaymentMethod] = useState('upi');
  const [nameInput, setNameInput] = useState(donorName || '');
  const [emailInput, setEmailInput] = useState(donorEmail || '');
  const [utrNumber, setUtrNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [submission, setSubmission] = useState(null);
  const [copied, setCopied] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const numAmount = Number(amount) || 1500;
  const upiId = 'foundationgsdd@okaxis';
  const upiLink = `upi://pay?pa=${upiId}&pn=GSDD%20FOUNDATION&am=${numAmount}&cu=INR&tn=${encodeURIComponent(`Donation for ${purpose}`)}`;

  function handleCopy(text, key) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    }
  }

  async function handleConfirmPayment(e) {
    e.preventDefault();
    setErrorMsg('');
    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length < 6) {
      setErrorMsg('Please enter the valid UPI / Bank UTR transaction reference from your payment app (at least 6 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: nameInput.trim(),
          email: emailInput.trim(),
          pan: panNumber.trim().toUpperCase(),
          amount: numAmount,
          frequency: frequency === 'Monthly' ? 'monthly' : 'one-time',
          purpose,
          method: activePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer (NEFT/IMPS)',
          utr: cleanUtr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Could not submit donation verification request.');
        return;
      }
      setSubmission(data.donation);
    } catch {
      setErrorMsg('Network error submitting donation reference. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckStatus() {
    if (!submission?.trackingId) return;
    setChecking(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/donations/?trackingId=${encodeURIComponent(submission.trackingId)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.donation) {
        setSubmission(data.donation);
      } else {
        setErrorMsg(data?.error || 'Unable to refresh verification status.');
      }
    } catch {
      setErrorMsg('Unable to reach verification server.');
    } finally {
      setChecking(false);
    }
  }

  const isVerified = submission?.status === 'Verified' && Boolean(submission?.receipt80gIssued) && Boolean(submission?.receiptNo);

  return (
    <div className="donation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="donation-modal-title">
      <div className="donation-modal-window">
        <div className="donation-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="donation-mark" style={{ width: '32px', height: '32px' }}>
              <Heart size={16} fill="currentColor" aria-hidden="true" />
            </span>
            <div>
              <h2 id="donation-modal-title" style={{ fontSize: '18px', margin: 0, color: 'var(--gsdd-navy-dark)' }}>
                Online Donation Checkout
              </h2>
              <small style={{ color: 'var(--gsdd-text-muted)' }}>
                Amount: <strong>₹{numAmount.toLocaleString('en-IN')}</strong> &bull; {frequency} &bull; {purpose}
              </small>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close donation window">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {!submission ? (
          <div className="donation-modal-body">
            <div className="payment-method-tabs" role="tablist">
              <button
                type="button"
                className={`pm-tab ${activePaymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => { setActivePaymentMethod('upi'); setErrorMsg(''); }}
              >
                <QrCode size={16} aria-hidden="true" /> Scan UPI QR / UPI Apps
              </button>
              <button
                type="button"
                className={`pm-tab ${activePaymentMethod === 'bank' ? 'active' : ''}`}
                onClick={() => { setActivePaymentMethod('bank'); setErrorMsg(''); }}
              >
                <Building2 size={16} aria-hidden="true" /> Direct Bank Transfer (NEFT/IMPS)
              </button>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activePaymentMethod === 'upi' ? (
              <div className="upi-checkout-layout">
                <div className="upi-qr-card">
                  <div className="upi-qr-placeholder">
                    <div className="visual-qr-box">
                      <QRCodeSvg value={upiLink} size={140} label="Scan with any UPI App" />
                    </div>
                    <strong className="qr-amount-pill">₹{numAmount.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="upi-id-row">
                    <span>Official UPI ID: <code>{upiId}</code></span>
                    <button type="button" className="copy-pill" onClick={() => handleCopy(upiId, 'upi')}>
                      {copied === 'upi' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="quick-upi-apps">
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gsdd-text-muted)' }}>
                      Quick Pay with App:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <a href={upiLink} className="upi-app-btn">GPay</a>
                      <a href={upiLink} className="upi-app-btn">PhonePe</a>
                      <a href={upiLink} className="upi-app-btn">Paytm</a>
                      <a href={upiLink} className="upi-app-btn">BHIM</a>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="payment-confirm-form">
                  <div className="tax-notice-pill">
                    <ShieldCheck size={16} color="#15803D" aria-hidden="true" />
                    <span>80G URN: {organization.tax80g} (Receipt issued after verification)</span>
                  </div>

                  <label>
                    <span>Donor Full Name *</span>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Your full name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Donor Email Address *</span>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      placeholder="name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>PAN Number (Optional, for 80G Tax Exemption)</span>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </label>

                  <label>
                    <span>UPI Transaction ID / UTR Number *</span>
                    <input
                      type="text"
                      required
                      minLength={6}
                      placeholder="e.g. 606129482112"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </label>

                  <button type="submit" disabled={submitting} className="button button-blue full-width" style={{ marginTop: '12px' }}>
                    <ShieldCheck size={18} aria-hidden="true" />
                    {submitting ? 'Submitting for Verification...' : 'Submit UTR for Verification'}
                  </button>

                  <p style={{ fontSize: '11px', color: 'var(--gsdd-text-muted)', textAlign: 'center', margin: '8px 0 0' }}>
                    Donations remain Pending Verification until confirmed against bank settlement. Official 80G receipts are issued only after verification.
                  </p>
                </form>
              </div>
            ) : (
              <div className="bank-transfer-layout">
                <div className="bank-details-box">
                  <h4 style={{ margin: '0 0 10px', color: 'var(--gsdd-navy-dark)' }}>
                    Official Bank Account Details
                  </h4>
                  <div className="bank-detail-row">
                    <span className="lbl">Beneficiary:</span>
                    <span className="val"><strong>{organization.legalName}</strong></span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="lbl">Bank Name:</span>
                    <span className="val">State Bank of India (SBI)</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="lbl">Account Number:</span>
                    <span className="val">
                      <code>42890100982341</code>
                      <button type="button" className="copy-pill" onClick={() => handleCopy('42890100982341', 'acct')}>
                        {copied === 'acct' ? 'Copied' : 'Copy'}
                      </button>
                    </span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="lbl">IFSC Code:</span>
                    <span className="val">
                      <code>SBIN0001234</code>
                      <button type="button" className="copy-pill" onClick={() => handleCopy('SBIN0001234', 'ifsc')}>
                        {copied === 'ifsc' ? 'Copied' : 'Copy'}
                      </button>
                    </span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="lbl">Branch:</span>
                    <span className="val">Raniganj Bazar, Araria, Bihar - 854334</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="payment-confirm-form">
                  <label>
                    <span>Donor Full Name *</span>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Your full name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Donor Email Address *</span>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      placeholder="name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Donor PAN (Optional, for 80G Tax Exemption)</span>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </label>

                  <label>
                    <span>Bank IMPS / NEFT Reference / UTR Number *</span>
                    <input
                      type="text"
                      required
                      minLength={6}
                      placeholder="e.g. IMPS604118992144"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </label>

                  <button type="submit" disabled={submitting} className="button button-blue full-width">
                    <Clock size={18} aria-hidden="true" />
                    {submitting ? 'Submitting...' : 'Submit Transfer Reference (Pending Verification)'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : isVerified ? (
          <div className="donation-receipt-view">
            <div className="receipt-actions no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={24} color="#15803D" aria-hidden="true" />
                <span style={{ fontWeight: '700', color: 'var(--gsdd-navy-dark)' }}>
                  Settlement Verified! Official 80G Receipt Issued.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => window.print()} className="button button-blue">
                  <Printer size={15} aria-hidden="true" /> Print Official 80G Receipt
                </button>
                <button type="button" onClick={onClose} className="button-text">
                  Done
                </button>
              </div>
            </div>

            <div className="official-receipt-card printable-frame">
              <div className="receipt-top-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--gsdd-navy-dark)' }}>
                    {organization.legalName}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--gsdd-text-muted)' }}>
                    Section 8 Non-Profit Registered under Companies Act 2013 &bull; CIN: {organization.cin}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--gsdd-text-muted)' }}>
                    80G URN: <strong>{organization.tax80g}</strong> &bull; PAN: {organization.pan}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="receipt-title-badge">DONATION RECEIPT</span>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>{submission.receiptNo}</div>
                </div>
              </div>

              <div className="receipt-table">
                <div className="r-row"><span className="r-label">Donor Name:</span><span className="r-val">{submission.donorName}</span></div>
                <div className="r-row"><span className="r-label">Donor PAN:</span><span className="r-val"><code>{submission.pan || 'NOT-PROVIDED'}</code></span></div>
                <div className="r-row"><span className="r-label">Amount Donated:</span><span className="r-val"><strong style={{ fontSize: '16px', color: '#15803D' }}>₹{Number(submission.amount).toLocaleString('en-IN')}</strong> ({submission.frequency})</span></div>
                <div className="r-row"><span className="r-label">Program Allocation:</span><span className="r-val">{submission.program}</span></div>
                <div className="r-row"><span className="r-label">Transaction Reference:</span><span className="r-val"><code>{submission.utr}</code></span></div>
                <div className="r-row"><span className="r-label">Date of Receipt:</span><span className="r-val">{submission.date}</span></div>
                <div className="r-row"><span className="r-label">Tax Benefit:</span><span className="r-val">Eligible for 50% deduction under Section 80G of Income Tax Act 1961 (confirm current certificate eligibility).</span></div>
              </div>

              <div className="receipt-footer">
                <div>
                  <small>Head Office: {organization.address}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid #333', width: '130px', margin: '0 0 2px auto', textAlign: 'center', fontSize: '11px' }}>
                    Authorized Signatory
                  </div>
                  <small>GSDD Foundation</small>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="donation-receipt-view" role="status" aria-live="polite">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '16px' }}>
              <Clock size={22} color="#B45309" aria-hidden="true" />
              <div>
                <strong style={{ display: 'block', color: '#92400E', fontSize: '15px' }}>
                  Donation Recorded — Status: {submission.status}
                </strong>
                <span style={{ fontSize: '12px', color: '#78350F' }}>
                  No 80G tax receipt has been issued yet. Receipts are issued only after bank settlement and server-side verification.
                </span>
              </div>
            </div>

            <div className="receipt-table">
              <div className="r-row"><span className="r-label">Server Tracking ID:</span><span className="r-val"><code>{submission.trackingId}</code></span></div>
              <div className="r-row"><span className="r-label">Submitted UTR:</span><span className="r-val"><code>{submission.utr}</code></span></div>
              <div className="r-row"><span className="r-label">Donor Name:</span><span className="r-val">{submission.donorName}</span></div>
              <div className="r-row"><span className="r-label">Amount:</span><span className="r-val">₹{Number(submission.amount).toLocaleString('en-IN')}</span></div>
              <div className="r-row"><span className="r-label">Verification Status:</span><span className="r-val"><strong>{submission.status}</strong></span></div>
            </div>

            {errorMsg && <p style={{ color: '#991B1B', fontSize: '12px', marginTop: '8px' }}>{errorMsg}</p>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button type="button" onClick={handleCheckStatus} disabled={checking} className="button button-outline-blue">
                <RefreshCw size={14} aria-hidden="true" /> {checking ? 'Checking...' : 'Check Settlement Status'}
              </button>
              <button type="button" onClick={onClose} className="button button-blue">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
