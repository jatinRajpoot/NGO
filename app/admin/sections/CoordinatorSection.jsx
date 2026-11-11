'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  X,
} from 'lucide-react';

const PRESETS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_2_weeks', label: 'Last 2 Weeks' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
];

export default function CoordinatorSection({ notify }) {
  const [section, setSection] = useState('coordinators'); // 'coordinators' | 'donations'
  const [coordTab, setCoordTab] = useState('all'); // 'all' | 'active'
  const [coordinators, setCoordinators] = useState([]);
  const [coordLoading, setCoordLoading] = useState(true);

  const [coordModalOpen, setCoordModalOpen] = useState(false);
  const [editingCoordId, setEditingCoordId] = useState(null);
  const [coordForm, setCoordForm] = useState({
    name: '',
    email: '',
    phone: '',
    district: 'Araria',
    state: 'Bihar',
    designation: 'District Coordinator',
    status: 'Active',
    password: '',
  });

  // Coordinator Donations state
  const [donTab, setDonTab] = useState('all'); // 'all' | 'Pending' | 'Completed'
  const [filterCoordId, setFilterCoordId] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterPreset, setFilterPreset] = useState('all');
  const [coordDonations, setCoordDonations] = useState([]);
  const [donLoading, setDonLoading] = useState(false);
  const [selectedDonIds, setSelectedDonIds] = useState([]);
  const [proofModal, setProofModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadCoordinators = useCallback(async () => {
    setCoordLoading(true);
    try {
      const res = await fetch(`/api/admin/coordinators/?tab=${encodeURIComponent(coordTab)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) setCoordinators(json.coordinators || []);
    } catch {}
    setCoordLoading(false);
  }, [coordTab]);

  const loadCoordDonations = useCallback(async () => {
    setDonLoading(true);
    try {
      const qs = new URLSearchParams({
        coordinatorId: filterCoordId,
        method: filterMethod,
        status: donTab,
        preset: filterPreset,
      });
      const res = await fetch(`/api/admin/coordinator-donations/?${qs.toString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCoordDonations(json.donations || []);
        setSelectedDonIds([]);
      }
    } catch {}
    setDonLoading(false);
  }, [filterCoordId, filterMethod, donTab, filterPreset]);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  useEffect(() => {
    if (section === 'donations') loadCoordDonations();
  }, [section, loadCoordDonations]);

  const openNewCoord = () => {
    setEditingCoordId(null);
    setCoordForm({
      name: '',
      email: '',
      phone: '',
      district: 'Araria',
      state: 'Bihar',
      designation: 'District Coordinator',
      status: 'Active',
      password: '',
    });
    setCoordModalOpen(true);
  };

  const openEditCoord = (c) => {
    setEditingCoordId(c.id);
    setCoordForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      district: c.district || '',
      state: c.state || '',
      designation: c.designation || '',
      status: c.status || 'Active',
      password: '',
    });
    setCoordModalOpen(true);
  };

  const saveCoordinator = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/coordinators/', {
      method: editingCoordId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCoordId ? { id: editingCoordId, ...coordForm } : coordForm),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      notify?.(json?.error || 'Could not save coordinator.');
      return;
    }
    setCoordModalOpen(false);
    await loadCoordinators();
    notify?.(editingCoordId ? 'Coordinator updated.' : 'Coordinator created.');
  };

  const deleteCoord = async (id) => {
    if (!window.confirm('Delete this coordinator account?')) return;
    const res = await fetch('/api/admin/coordinators/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      await loadCoordinators();
      notify?.('Coordinator deleted.');
    }
  };

  const approveDonation = async (id) => {
    const res = await fetch('/api/admin/coordinator-donations/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Completed' }),
    });
    if (res.ok) {
      await loadCoordDonations();
      notify?.('Coordinator donation approved and completed.');
    }
  };

  const confirmRejectDonation = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    const res = await fetch('/api/admin/coordinator-donations/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: rejectModal.id,
        status: 'Rejected',
        rejectionReason: rejectReason || 'Rejected by admin review',
      }),
    });
    if (res.ok) {
      setRejectModal(null);
      setRejectReason('');
      await loadCoordDonations();
      notify?.('Coordinator donation rejected.');
    }
  };

  const bulkDeleteDonations = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} coordinator donation record(s)?`)) return;
    const res = await fetch('/api/admin/coordinator-donations/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      await loadCoordDonations();
      notify?.(`Deleted ${ids.length} record(s).`);
    }
  };

  const exportCsvUrl = `/api/admin/coordinator-donations/?${new URLSearchParams({
    coordinatorId: filterCoordId,
    method: filterMethod,
    status: donTab,
    preset: filterPreset,
    export: 'csv',
  }).toString()}`;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Coordinators &amp; Field Collections</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Manage field coordinators, issue portal credentials, inspect Direct QR / Cash proofs, and verify collections.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${section === 'coordinators' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
            onClick={() => setSection('coordinators')}
          >
            Coordinator Management
          </button>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${section === 'donations' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
            onClick={() => setSection('donations')}
          >
            Coordinator Donations
          </button>
        </div>
      </div>

      {section === 'coordinators' ? (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${coordTab === 'all' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setCoordTab('all')}
              >
                All Coordinators
              </button>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${coordTab === 'active' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setCoordTab('active')}
              >
                Active Coordinators
              </button>
            </div>
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={openNewCoord}>
              <Plus size={14} /> Add Coordinator
            </button>
          </div>

          {coordLoading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name &amp; Designation</th>
                    <th>Contact</th>
                    <th>District / State</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.code}</strong></td>
                      <td>
                        <div><strong>{c.name}</strong></div>
                        <small style={{ color: '#64748b' }}>{c.designation}</small>
                      </td>
                      <td>
                        <div>{c.email}</div>
                        <small style={{ color: '#64748b' }}>{c.phone}</small>
                      </td>
                      <td>{c.district}, {c.state}</td>
                      <td>
                        <span className={`adm-badge ${c.status === 'Active' ? 'green' : 'gray'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => openEditCoord(c)}>
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            style={{ color: '#dc2626' }}
                            onClick={() => deleteCoord(c.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Donations' },
                { id: 'Pending', label: 'Pending Verification' },
                { id: 'Completed', label: 'Completed Donations' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${donTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setDonTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedDonIds.length > 0 && (
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={() => bulkDeleteDonations(selectedDonIds)}
                >
                  <Trash2 size={13} /> Bulk Delete ({selectedDonIds.length})
                </button>
              )}
              <a href={exportCsvUrl} className="adm-btn adm-btn-sm adm-btn-outline">
                <Download size={13} /> Export Report
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <select
              value={filterCoordId}
              onChange={(e) => setFilterCoordId(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="all">All Coordinators</option>
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="all">All Methods</option>
              <option value="Online">Online</option>
              <option value="Cash">Cash</option>
              <option value="Direct QR">Direct QR</option>
            </select>
            <select
              value={filterPreset}
              onChange={(e) => setFilterPreset(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {donLoading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        checked={coordDonations.length > 0 && selectedDonIds.length === coordDonations.length}
                        onChange={(e) =>
                          setSelectedDonIds(e.target.checked ? coordDonations.map((d) => d.id) : [])
                        }
                      />
                    </th>
                    <th>Receipt</th>
                    <th>Coordinator</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coordDonations.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedDonIds.includes(d.id)}
                          onChange={() =>
                            setSelectedDonIds((prev) =>
                              prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                            )
                          }
                        />
                      </td>
                      <td><strong>{d.receiptNo}</strong></td>
                      <td>{d.coordinatorName}</td>
                      <td>
                        <div>{d.donorName}</div>
                        <small style={{ color: '#64748b' }}>{d.donorPhone}</small>
                      </td>
                      <td><strong>Rs. {Number(d.amount).toLocaleString('en-IN')}</strong></td>
                      <td>{d.method}</td>
                      <td>
                        <span className={`adm-badge ${d.status === 'Completed' ? 'green' : d.status === 'Rejected' ? 'red' : 'amber'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            title="Inspect Proof"
                            onClick={() => setProofModal(d)}
                          >
                            <Eye size={13} />
                          </button>
                          {d.status !== 'Completed' && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              style={{ color: '#059669' }}
                              title="Approve"
                              onClick={() => approveDonation(d.id)}
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          {d.status !== 'Rejected' && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              style={{ color: '#dc2626' }}
                              title="Reject"
                              onClick={() => setRejectModal(d)}
                            >
                              <XCircle size={13} />
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
      )}

      {/* Add/Edit Coordinator Modal */}
      {coordModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }}
          onClick={() => setCoordModalOpen(false)}
        >
          <div style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{editingCoordId ? 'Edit Coordinator' : 'Add Coordinator'}</h3>
              <button type="button" onClick={() => setCoordModalOpen(false)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveCoordinator} style={{ display: 'grid', gap: 10 }}>
              <input required placeholder="Full Name *" value={coordForm.name} onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input required type="email" disabled={Boolean(editingCoordId)} placeholder="Email *" value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input placeholder="Phone" value={coordForm.phone} onChange={(e) => setCoordForm({ ...coordForm, phone: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="District" value={coordForm.district} onChange={(e) => setCoordForm({ ...coordForm, district: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input placeholder="State" value={coordForm.state} onChange={(e) => setCoordForm({ ...coordForm, state: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <input placeholder="Designation" value={coordForm.designation} onChange={(e) => setCoordForm({ ...coordForm, designation: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={coordForm.status} onChange={(e) => setCoordForm({ ...coordForm, status: e.target.value })} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input
                type="password"
                minLength={6}
                placeholder={editingCoordId ? 'New Portal Password (optional)' : 'Set Portal Password (min 6 chars)'}
                value={coordForm.password}
                onChange={(e) => setCoordForm({ ...coordForm, password: e.target.value })}
                style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
              <button type="submit" className="adm-btn adm-btn-primary" style={{ justifyContent: 'center' }}>Save Coordinator</button>
            </form>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {proofModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }}
          onClick={() => setProofModal(null)}
        >
          <div style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px' }}>Payment Proof — {proofModal.receiptNo}</h3>
            <div style={{ display: 'grid', gap: 6, fontSize: 13, marginBottom: 14 }}>
              <div><strong>Coordinator:</strong> {proofModal.coordinatorName}</div>
              <div><strong>Donor:</strong> {proofModal.donorName} ({proofModal.donorPhone})</div>
              <div><strong>Amount:</strong> Rs. {Number(proofModal.amount).toLocaleString('en-IN')}</div>
              <div><strong>Method:</strong> {proofModal.method}</div>
              <div><strong>Proof Ref / UTR:</strong> <code>{proofModal.proofRef}</code></div>
              <div><strong>Note:</strong> {proofModal.proofNote || '—'}</div>
              {proofModal.rejectionReason && (
                <div style={{ color: '#dc2626' }}><strong>Rejection Reason:</strong> {proofModal.rejectionReason}</div>
              )}
            </div>
            <button type="button" className="adm-btn adm-btn-outline" onClick={() => setProofModal(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {rejectModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }}
          onClick={() => setRejectModal(null)}
        >
          <form
            onSubmit={confirmRejectDonation}
            style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Confirm Reject — {rejectModal.receiptNo}</h3>
            <textarea
              required
              rows={3}
              placeholder="Enter reason for rejecting payment verification..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
              <button type="submit" className="adm-btn" style={{ background: '#dc2626', color: '#fff' }}>Confirm Reject</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
