'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { DONATION_PURPOSE_PRESETS } from '../../lib/finance-constants';

export default function CoordinatorPortalPage() {
  const router = useRouter();
  const [coord, setCoord] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    donorName: '',
    donorPhone: '',
    amount: '',
    method: 'Direct QR',
    purpose: 'Education',
    proofRef: '',
    proofNote: '',
  });

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/coordinator/me/', { cache: 'no-store' });
      if (!meRes.ok) {
        router.replace('/coordinator/login');
        return;
      }
      const meData = await meRes.json();
      setCoord(meData.coordinator);

      const dRes = await fetch('/api/coordinator/donations/', { cache: 'no-store' });
      if (dRes.ok) {
        const dData = await dRes.json();
        setDonations(dData.donations || []);
      }
    } catch {}
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/coordinator/donations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data?.error || 'Could not record collection.');
        return;
      }
      setDonations((prev) => [data.donation, ...prev]);
      setForm({ donorName: '', donorPhone: '', amount: '', method: 'Direct QR', purpose: 'Education', proofRef: '', proofNote: '' });
      setMsg('Collection recorded and sent for Admin Verification!');
    } catch {
      setMsg('Network error submitting collection.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/coordinator/logout/', { method: 'POST' }).catch(() => {});
    router.replace('/coordinator/login');
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Loader2 size={28} className="spin" />
      </div>
    );
  }

  if (!coord) return null;

  const completedTotal = donations
    .filter((d) => d.status === 'Completed')
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  return (
    <div style={{ maxWidth: 1080, margin: '36px auto', padding: '0 20px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          padding: 20,
          background: '#0f172a',
          color: '#fff',
          borderRadius: 14,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#93c5fd', fontWeight: 700 }}>
            {coord.code} • {coord.designation}
          </div>
          <h1 style={{ margin: '4px 0', fontSize: 22 }}>Welcome, {coord.name}</h1>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            {coord.district}, {coord.state} • Verified Collected: Rs. {completedTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {msg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 18,
            padding: 12,
            borderRadius: 10,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) minmax(0, 1fr)', gap: 20 }}>
        <form
          onSubmit={handleSubmitDonation}
          style={{
            padding: 20,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            display: 'grid',
            gap: 10,
            alignSelf: 'start',
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>Record Coordinator Collection</h2>
          <input
            required
            placeholder="Donor Name *"
            value={form.donorName}
            onChange={(e) => setForm({ ...form, donorName: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <input
            placeholder="Donor Mobile"
            value={form.donorPhone}
            onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <input
            required
            type="number"
            min="1"
            placeholder="Amount (Rs.) *"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          >
            <option value="Direct QR">Direct QR</option>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
          </select>
          <select
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          >
            {DONATION_PURPOSE_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            placeholder="Payment Proof Ref / UTR / Receipt Book No"
            value={form.proofRef}
            onChange={(e) => setForm({ ...form, proofRef: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <textarea
            rows={2}
            placeholder="Verification note"
            value={form.proofNote}
            onChange={(e) => setForm({ ...form, proofNote: e.target.value })}
            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Submit Collection
          </button>
        </form>

        <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>My Submitted Collections ({donations.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: 10 }}>Receipt</th>
                <th style={{ padding: 10 }}>Donor</th>
                <th style={{ padding: 10 }}>Amount</th>
                <th style={{ padding: 10 }}>Method &amp; Proof</th>
                <th style={{ padding: 10 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}><strong>{d.receiptNo}</strong></td>
                  <td style={{ padding: 10 }}>{d.donorName}</td>
                  <td style={{ padding: 10 }}>Rs. {Number(d.amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding: 10 }}>
                    <div>{d.method}</div>
                    <small style={{ color: '#64748b' }}>{d.proofRef}</small>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: d.status === 'Completed' ? '#dcfce7' : d.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                        color: d.status === 'Completed' ? '#15803d' : d.status === 'Rejected' ? '#b91c1c' : '#b45309',
                      }}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
