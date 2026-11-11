'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Eye, Play, PauseCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function RecurringDonations({ notify }) {
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(null);

  const loadMandates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/autopay/', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setMandates(json.mandates || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMandates();
  }, [loadMandates]);

  const toggleStatus = async (m, nextStatus) => {
    const res = await fetch('/api/admin/autopay/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, status: nextStatus }),
    });
    if (res.ok) {
      await loadMandates();
      notify?.(`AutoPay mandate ${m.mandateRef} marked ${nextStatus}.`);
    }
  };

  const triggerCycle = async (m) => {
    const res = await fetch('/api/admin/autopay/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id }),
    });
    if (res.ok) {
      await loadMandates();
      notify?.(`Recorded recurring debit for ${m.mandateRef}.`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Auto-Pay &amp; Recurring Donations</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Inspect registered AutoPay mandates, recurring payment histories, and export CSV reports.
          </p>
        </div>
        <a href="/api/admin/autopay/?export=csv" className="adm-btn adm-btn-sm adm-btn-outline">
          <Download size={14} /> Export AutoPay Data
        </a>
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        {loading ? (
          <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Mandate Ref</th>
                  <th>Donor</th>
                  <th>Monthly Amount</th>
                  <th>Gateway &amp; Purpose</th>
                  <th>Status</th>
                  <th>Next Debit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mandates.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.mandateRef}</strong></td>
                    <td>
                      <div><strong>{m.donorName}</strong></div>
                      <small style={{ color: '#64748b' }}>{m.email}</small>
                    </td>
                    <td><strong>Rs. {Number(m.amount).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <div>{m.gateway}</div>
                      <small style={{ color: '#64748b' }}>{m.purpose}</small>
                    </td>
                    <td>
                      <span className={`adm-badge ${m.status === 'Active' ? 'green' : m.status === 'Paused' ? 'amber' : 'red'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.nextDebitDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          title="View Payment History"
                          onClick={() => setHistoryModal(m)}
                        >
                          <Eye size={13} /> History ({(m.payments || []).length})
                        </button>
                        {m.status === 'Active' ? (
                          <>
                            <button
                              type="button"
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              title="Process Test Debit"
                              onClick={() => triggerCycle(m)}
                            >
                              <Play size={13} /> Charge
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              title="Pause Mandate"
                              onClick={() => toggleStatus(m, 'Paused')}
                            >
                              <PauseCircle size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            title="Activate Mandate"
                            onClick={() => toggleStatus(m, 'Active')}
                          >
                            <CheckCircle2 size={13} /> Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {historyModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }}
          onClick={() => setHistoryModal(null)}
        >
          <div style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px' }}>AutoPay Payment History — {historyModal.mandateRef}</h3>
            <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
              {(historyModal.payments || []).map((p) => (
                <div key={p.txId} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                  <span><strong>{p.txId}</strong></span>
                  <span>Rs. {Number(p.amount).toLocaleString('en-IN')}</span>
                  <span>{String(p.paidAt).slice(0, 10)}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{p.status}</span>
                </div>
              ))}
            </div>
            <button type="button" className="adm-btn adm-btn-outline" onClick={() => setHistoryModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
