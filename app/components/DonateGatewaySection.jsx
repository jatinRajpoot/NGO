'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, CalendarClock, History } from 'lucide-react';
import GatewayCheckoutModal from './GatewayCheckoutModal';

export default function DonateGatewaySection() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginTop: 22,
        padding: 20,
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: 12,
      }}
    >
      <strong style={{ display: 'block', fontSize: 15, color: '#09152f', marginBottom: 6 }}>
        Instant Online Payment Gateway (PhonePe / Razorpay)
      </strong>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569' }}>
        Contribute via PhonePe Net Banking Sandbox (username <code>test</code>, password{' '}
        <code>test</code>) or Razorpay Test Checkout with instant receipt generation.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="button button-blue" onClick={() => setOpen(true)}>
          <CreditCard size={16} /> Pay Online (PhonePe / Razorpay)
        </button>
        <Link href="/autopay-donate" className="button button-outline">
          <CalendarClock size={16} /> Monthly Auto-Pay
        </Link>
        <Link href="/donation-history" className="button button-outline">
          <History size={16} /> Check Donation History
        </Link>
      </div>
      <GatewayCheckoutModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}
