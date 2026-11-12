'use client';

import { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, X, Loader2, Lock } from 'lucide-react';
import { CAMPAIGN_CATEGORIES, DONATION_PURPOSE_PRESETS } from '../lib/finance-constants';
import './public-finance.css';

export default function GatewayCheckoutModal({
  isOpen,
  onClose,
  initialAmount = 500,
  initialPurpose = 'General Fund',
  campaign = null,
  source = 'visitor',
  onCompleted,
}) {
  const [step, setStep] = useState('form'); // 'form' | 'sandbox' | 'receipt'
  const [gateway, setGateway] = useState('phonepe');
  const [mode, setMode] = useState('netbanking');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [amount, setAmount] = useState(String(initialAmount || 500));
  const [purpose, setPurpose] = useState(campaign ? campaign.title : initialPurpose);

  // Sandbox login fields
  const [session, setSession] = useState(null);
  const [nbUser, setNbUser] = useState('');
  const [nbPass, setNbPass] = useState('');
  const [simRef, setSimRef] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const startSession = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/payments/sandbox/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway,
          mode,
          source: campaign ? 'campaign' : source,
          donorName,
          email,
          phone,
          pan,
          address,
          referralCode,
          amount: Number(amount),
          purpose,
          campaignId: campaign?.id || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data?.error || 'Could not start payment session.');
        return;
      }
      setSession(data.session);
      setStep('sandbox');
    } catch {
      setErr('Network error initializing checkout.');
    } finally {
      setBusy(false);
    }
  };

  const verifySandbox = async (e) => {
    e.preventDefault();
    if (!session) return;
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/payments/sandbox/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          username: nbUser,
          password: nbPass,
          simulatedRef: simRef,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data?.error || 'Payment verification failed.');
        return;
      }
      setReceipt(data.donation || data.mandate || { txRef: data.txRef });
      setStep('receipt');
      onCompleted?.(data);
    } catch {
      setErr('Network error verifying payment.');
    } finally {
      setBusy(false);
    }
  };

  const resetAndClose = () => {
    setStep('form');
    setSession(null);
    setNbUser('');
    setNbPass('');
    setErr('');
    setReceipt(null);
    onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Online Payment Gateway Checkout"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: 'rgba(9, 21, 47, 0.72)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={resetAndClose}
    >
      <div
        style={{
          width: 'min(540px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} color="#2563eb" />
            <strong style={{ fontSize: 16 }}>
              {campaign ? `Support: ${campaign.title}` : 'Online Donation Gateway Checkout'}
            </strong>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close payment checkout"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {err && (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={startSession} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setGateway('phonepe');
                    setMode('netbanking');
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: gateway === 'phonepe' ? '2px solid #5f259f' : '1px solid #cbd5e1',
                    background: gateway === 'phonepe' ? '#f5f0ff' : '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  PhonePe (Net Banking / UPI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGateway('razorpay');
                    setMode('card');
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: gateway === 'razorpay' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: gateway === 'razorpay' ? '#eff6ff' : '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Razorpay (Test Checkout)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Donor Name *
                  </label>
                  <input
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Full Name"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Amount (Rs.) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donor@example.org"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Mobile Number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    PAN Number (Optional 80G)
                  </label>
                  <input
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Member Referral Code
                  </label>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Optional e.g. NGO-2026-0032"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {!campaign && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Purpose Preset
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  >
                    {DONATION_PURPOSE_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State"
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="button button-blue"
                style={{ justifyContent: 'center', marginTop: 4 }}
              >
                {busy ? <Loader2 size={16} className="spin" /> : <Lock size={15} />} Proceed to{' '}
                {gateway === 'phonepe' ? 'PhonePe Sandbox' : 'Razorpay Test Checkout'}
              </button>
            </form>
          )}

          {step === 'sandbox' && session && (
            <form onSubmit={verifySandbox} style={{ display: 'grid', gap: 14 }}>
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: gateway === 'phonepe' ? '#f5f0ff' : '#eff6ff',
                  border: '1px solid #cbd5e1',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  {gateway === 'phonepe' ? 'PhonePe Net Banking Test Simulator' : 'Razorpay Test Payment Simulator'}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  Session: <code>{session.sessionId}</code> • Amount:{' '}
                  <strong>Rs. {Number(session.amount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 6 }}>
                  {session.testHint}
                </div>
              </div>

              {gateway === 'phonepe' && mode === 'netbanking' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Net Banking Test Username *
                    </label>
                    <input
                      required
                      value={nbUser}
                      onChange={(e) => setNbUser(e.target.value)}
                      placeholder="test"
                      style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Net Banking Test Password *
                    </label>
                    <input
                      required
                      type="password"
                      value={nbPass}
                      onChange={(e) => setNbPass(e.target.value)}
                      placeholder="test"
                      style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Simulated Test Payment Reference (Optional)
                  </label>
                  <input
                    value={simRef}
                    onChange={(e) => setSimRef(e.target.value)}
                    placeholder="Leave blank to auto-generate test transaction ID"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="button button-blue"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {busy ? <Loader2 size={15} className="spin" /> : <ShieldCheck size={15} />} Complete
                  Test Payment
                </button>
              </div>
            </form>
          )}

          {step === 'receipt' && receipt && (
            <div style={{ textAlign: 'center', padding: '12px 6px' }}>
              <CheckCircle2 size={44} color="#059669" style={{ marginBottom: 10 }} />
              <h3 style={{ margin: '0 0 6px' }}>Payment Verified Successfully!</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569' }}>
                Thank you for supporting Global Skills &amp; Digital Development Foundation.
              </p>
              <div
                style={{
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 13,
                  display: 'grid',
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <div>
                  <strong>Receipt No:</strong> {receipt.receiptNo || receipt.mandateRef || 'Issued'}
                </div>
                <div>
                  <strong>Transaction Ref:</strong> {receipt.utr || receipt.txRef}
                </div>
                {receipt.amount && (
                  <div>
                    <strong>Amount:</strong> Rs. {Number(receipt.amount).toLocaleString('en-IN')}
                  </div>
                )}
                <div>
                  <strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{receipt.status || 'Success'}</span>
                </div>
              </div>
              <button type="button" className="button button-blue" onClick={resetAndClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
