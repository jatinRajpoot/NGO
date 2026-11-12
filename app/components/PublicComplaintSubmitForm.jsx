'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function PublicComplaintSubmitForm() {
  const [form, setForm] = useState({
    complainantName: '',
    email: '',
    phone: '',
    category: 'Programme / Event Grievance',
    subject: '',
    description: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/public/complaints/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not submit complaint.');
        return;
      }
      setTicket(data.complaint);
      setForm({ complainantName: '', email: '', phone: '', category: 'Programme / Event Grievance', subject: '', description: '' });
    } catch {
      setError('Network error submitting complaint.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 28, padding: 24, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 19 }}>Online Grievance Ticket Submission</h2>
        <Link href="/check-status" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
          Track Existing Ticket Status &rarr;
        </Link>
      </div>

      {ticket ? (
        <div style={{ padding: 18, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontWeight: 800 }}>
            <CheckCircle2 size={18} /> Complaint Ticket Registered: {ticket.ticketNo}
          </div>
          <p style={{ margin: '6px 0 12px', fontSize: 13 }}>
            Save your ticket number to check status and admin remarks anytime.
          </p>
          <Link href="/check-status" className="button button-blue">Check Ticket Status</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          {error && <div role="alert" style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input required placeholder="Full Name *" value={form.complainantName} onChange={(e) => setForm({ ...form, complainantName: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <option>Programme / Event Grievance</option>
              <option>Certificate / ID Delay</option>
              <option>Donation Receipt Issue</option>
              <option>Volunteer / Conduct Feedback</option>
            </select>
          </div>
          <input required placeholder="Complaint Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
          <textarea required rows={3} placeholder="Detailed Complaint Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }} />
          <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Submit Complaint Ticket
          </button>
        </form>
      )}
    </div>
  );
}
