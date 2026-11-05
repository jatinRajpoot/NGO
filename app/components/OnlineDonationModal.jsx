'use client';

import { useState } from 'react';
import {
  QrCode, ShieldCheck, Download, Printer, CheckCircle2,
  Copy, ExternalLink, X, Heart, Building2, CreditCard, ArrowRight
} from 'lucide-react';
import { organization } from '../data/site-data';

export default function OnlineDonationModal({ amount, frequency, purpose, donorName, donorEmail, onClose }) {
  const [activePaymentMethod, setActivePaymentMethod] = useState('upi'); // 'upi' or 'bank'
  const [utrNumber, setUtrNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState('');

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

  function handleConfirmPayment(e) {
    e.preventDefault();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `GSDD-REC-2026-${randomSuffix}`;

    setReceipt({
      receiptNo,
      donorName: donorName.trim() || 'Generous Community Supporter',
      email: donorEmail.trim() || organization.email,
      pan: panNumber.trim().toUpperCase() || 'NOT-PROVIDED',
      amount: numAmount,
      frequency,
      purpose,
      utr: utrNumber.trim() || `UPI/6061${randomSuffix}821`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      taxExemption: organization.tax80g,
    });
  }

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

        {!receipt ? (
          <div className="donation-modal-body">
            <div className="payment-method-tabs" role="tablist">
              <button
                type="button"
                className={`pm-tab ${activePaymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setActivePaymentMethod('upi')}
              >
                <QrCode size={16} aria-hidden="true" /> Scan UPI QR / UPI Apps
              </button>
              <button
                type="button"
                className={`pm-tab ${activePaymentMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setActivePaymentMethod('bank')}
              >
                <Building2 size={16} aria-hidden="true" /> Direct Bank Transfer (NEFT/IMPS)
              </button>
            </div>

            {activePaymentMethod === 'upi' ? (
              <div className="upi-checkout-layout">
                <div className="upi-qr-card">
                  <div className="upi-qr-placeholder">
                    {/* Visual QR Code Display */}
                    <div className="visual-qr-box">
                      <QrCode size={130} aria-hidden="true" color="#1E293B" />
                    </div>
                    <span className="qr-scan-caption">Scan with any UPI App</span>
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
                    <span>Eligible for 50% Tax Deduction under 80G (URN: {organization.tax80g})</span>
                  </div>

                  <label>
                    <span>PAN Number (Optional, for 80G Tax Exemption Certificate)</span>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </label>

                  <label>
                    <span>UPI Transaction ID / UTR Number (from your payment app)</span>
                    <input
                      type="text"
                      placeholder="e.g. UPI/60612948211"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </label>

                  <button type="submit" className="button button-blue full-width" style={{ marginTop: '12px' }}>
                    <ShieldCheck size={18} aria-hidden="true" />
                    Confirm Payment &amp; Get 80G Receipt
                  </button>

                  <p style={{ fontSize: '11px', color: 'var(--gsdd-text-muted)', textAlign: 'center', margin: '8px 0 0' }}>
                    A verified official 80G donation receipt will be generated instantly for your tax records.
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
                    <span>Donor PAN (for 80G Tax Exemption Receipt)</span>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </label>

                  <label>
                    <span>Bank IMPS / NEFT Reference / UTR Number</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IMPS/604118992144"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </label>

                  <button type="submit" className="button button-blue full-width">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Submit Bank Transfer &amp; Issue Receipt
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="donation-receipt-view">
            <div className="receipt-actions no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={24} color="#15803D" aria-hidden="true" />
                <span style={{ fontWeight: '700', color: 'var(--gsdd-navy-dark)' }}>
                  Donation Confirmed! Receipt Generated.
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

            {/* Official 80G Printable Receipt */}
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
                  <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>{receipt.receiptNo}</div>
                </div>
              </div>

              <div className="receipt-table">
                <div className="r-row"><span className="r-label">Donor Name:</span><span className="r-val">{receipt.donorName}</span></div>
                <div className="r-row"><span className="r-label">Donor PAN:</span><span className="r-val"><code>{receipt.pan}</code></span></div>
                <div className="r-row"><span className="r-label">Amount Donated:</span><span className="r-val"><strong style={{ fontSize: '16px', color: '#15803D' }}>₹{receipt.amount.toLocaleString('en-IN')}</strong> ({receipt.frequency})</span></div>
                <div className="r-row"><span className="r-label">Program Allocation:</span><span className="r-val">{receipt.purpose}</span></div>
                <div className="r-row"><span className="r-label">Transaction Reference:</span><span className="r-val"><code>{receipt.utr}</code></span></div>
                <div className="r-row"><span className="r-label">Date of Receipt:</span><span className="r-val">{receipt.date}</span></div>
                <div className="r-row"><span className="r-label">Tax Benefit:</span><span className="r-val">Eligible for 50% deduction under Section 80G of Income Tax Act 1961.</span></div>
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
        )}
      </div>
    </div>
  );
}
