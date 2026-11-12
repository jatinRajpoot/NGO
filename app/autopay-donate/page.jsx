'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import PageHero from '../components/PageHero';
import { DONATION_PURPOSE_PRESETS } from '../lib/finance-constants';

export default function AutoPayDonatePage() {
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('500');
  const [purpose, setPurpose] = useState('Education');
  const [gateway, setGateway] = useState('PhonePe AutoPay');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mandate, setMandate] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/autopay/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorName, email, phone, amount: Number(amount), purpose, gateway }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not activate AutoPay mandate.');
        return;
      }
      setMandate(data.mandate);
    } catch {
      setError('Network error activating AutoPay.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Recurring Support"
        title="Auto-Pay monthly donation."
        description="Set up an automatic monthly contribution to sustain community classrooms, women livelihood cohorts, and preventive health camps."
      />
      <section className="section-pad">
        <div className="container" style={{ maxWidth: 680 }}>
          {mandate ? (
            <div
              style={{
                padding: 28,
                background: '#fff',
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={46} color="#059669" style={{ marginBottom: 10 }} />
              <h2 style={{ margin: '0 0 8px' }}>Monthly AutoPay Mandate Activated!</h2>
              <p style={{ color: '#475569', fontSize: 14 }}>
                Your Mandate Reference Number is <strong>{mandate.mandateRef}</strong>.
              </p>
              <div
                style={{
                  margin: '18px auto',
                  padding: 16,
                  background: '#f8fafc',
                  borderRadius: 10,
                  textAlign: 'left',
                  fontSize: 13,
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div><strong>Donor:</strong> {mandate.donorName}</div>
                <div><strong>Monthly Amount:</strong> Rs. {Number(mandate.amount).toLocaleString('en-IN')}</div>
                <div><strong>Gateway:</strong> {mandate.gateway}</div>
                <div><strong>Next Scheduled Debit:</strong> {mandate.nextDebitDate}</div>
              </div>
              <Link href="/autopay-donate/status" className="button button-blue">
                Track AutoPay Status <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                padding: 28,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                display: 'grid',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Register Monthly Mandate</h2>
                <Link href="/autopay-donate/status" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                  Already registered? Check Status &rarr;
                </Link>
              </div>

              {error && (
                <div role="alert" style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name *</label>
                <input
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Email Address *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mobile Number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Monthly Amount (Min Rs. 50) *</label>
                  <input
                    required
                    type="number"
                    min="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mandate Gateway</label>
                  <select
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  >
                    <option value="PhonePe AutoPay">PhonePe AutoPay</option>
                    <option value="Razorpay eMandate">Razorpay eMandate</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Cause / Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  {DONATION_PURPOSE_PRESETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={submitting} className="button button-blue" style={{ justifyContent: 'center' }}>
                {submitting ? <Loader2 size={16} className="spin" /> : <CalendarClock size={16} />} Start Monthly AutoPay
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
