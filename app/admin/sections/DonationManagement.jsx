'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Eye,
  Edit2,
  Loader2,
  X,
} from 'lucide-react';
import { CAMPAIGN_CATEGORIES, DONATION_PURPOSE_PRESETS } from '../../lib/finance-constants';

const DATE_PRESETS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_2_weeks', label: 'Last 2 Weeks' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
];

export default function DonationManagement({ notify }) {
  const [moduleTab, setModuleTab] = useState('visitor'); // 'visitor' | 'member' | 'receipts' | 'campaigns' | 'other'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'success' | 'pending'
  const [preset, setPreset] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [donations, setDonations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [editDonation, setEditDonation] = useState(null);

  // Create Receipt form
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    donorName: '',
    email: '',
    phone: '',
    pan: '',
    amount: '',
    purpose: 'Education',
    method: 'Cash',
    utr: '',
  });

  // Campaigns state
  const [campTab, setCampTab] = useState('all'); // 'all' | 'active' | 'completed' | 'received-donations'
  const [campaigns, setCampaigns] = useState([]);
  const [campDonations, setCampDonations] = useState([]);
  const [campModalOpen, setCampModalOpen] = useState(false);
  const [editingCampId, setEditingCampId] = useState(null);
  const [campForm, setCampForm] = useState({
    title: '',
    category: CAMPAIGN_CATEGORIES[0],
    goalAmount: '100000',
    status: 'Active',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2026-12-31',
    description: '',
  });

  // Other / Item donations state
  const [otherDonations, setOtherDonations] = useState([]);
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const [otherForm, setOtherForm] = useState({
    donorName: '',
    email: '',
    category: 'Books & Stationery',
    receivedBy: 'Admin Office',
    condition: 'New',
    date: new Date().toISOString().slice(0, 10),
    items: [{ itemName: '', quantity: 1, unit: 'Units' }],
  });

  const loadDonations = useCallback(async () => {
    setLoading(true);
    try {
      const src =
        moduleTab === 'visitor'
          ? 'visitor'
          : moduleTab === 'member'
          ? 'member'
          : moduleTab === 'receipts'
          ? 'receipt'
          : 'all';
      const qs = new URLSearchParams({
        source: src,
        status: statusFilter,
        preset,
        from: fromDate,
        to: toDate,
        search,
      });
      const res = await fetch(`/api/admin/finance/donations/?${qs.toString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setDonations(json.donations || []);
        setSelectedIds([]);
      }
    } catch {}
    setLoading(false);
  }, [moduleTab, statusFilter, preset, fromDate, toDate, search]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/?tab=${encodeURIComponent(campTab)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        if (campTab === 'received-donations') {
          setCampDonations(json.donations || []);
        } else {
          setCampaigns(json.campaigns || []);
        }
      }
    } catch {}
    setLoading(false);
  }, [campTab]);

  const loadOtherDonations = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ preset, from: fromDate, to: toDate });
      const res = await fetch(`/api/admin/other-donations/?${qs.toString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setOtherDonations(json.donations || []);
        setSelectedIds([]);
      }
    } catch {}
    setLoading(false);
  }, [preset, fromDate, toDate]);

  useEffect(() => {
    setSelectedIds([]);
    if (moduleTab === 'campaigns') loadCampaigns();
    else if (moduleTab === 'other') loadOtherDonations();
    else loadDonations();
  }, [moduleTab, loadDonations, loadCampaigns, loadOtherDonations]);

  const clearFilters = () => {
    setStatusFilter('all');
    setPreset('all');
    setFromDate('');
    setToDate('');
    setSearch('');
  };

  const handleBulkDeleteDonations = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} donation record(s)?`)) return;
    const res = await fetch('/api/admin/finance/donations/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      await loadDonations();
      notify?.(`Deleted ${ids.length} record(s).`);
    }
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/finance/donations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...receiptForm, source: 'receipt', status: 'Success' }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      notify?.(json?.error || 'Could not generate receipt.');
      return;
    }
    setReceiptOpen(false);
    setReceiptForm({
      donorName: '',
      email: '',
      phone: '',
      pan: '',
      amount: '',
      purpose: 'Education',
      method: 'Cash',
      utr: '',
    });
    await loadDonations();
    notify?.(`Donation receipt ${json.donation.receiptNo} generated.`);
  };

  const handleSaveEditedDonation = async (e) => {
    e.preventDefault();
    if (!editDonation) return;
    const res = await fetch('/api/admin/finance/donations/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDonation),
    });
    if (res.ok) {
      setEditDonation(null);
      await loadDonations();
      notify?.('Payment record updated.');
    }
  };

  const openNewCampaign = () => {
    setEditingCampId(null);
    setCampForm({
      title: '',
      category: CAMPAIGN_CATEGORIES[0],
      goalAmount: '100000',
      status: 'Active',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '2026-12-31',
      description: '',
    });
    setCampModalOpen(true);
  };

  const saveCampaign = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/campaigns/', {
      method: editingCampId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCampId ? { id: editingCampId, ...campForm } : campForm),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      notify?.(json?.error || 'Could not save campaign.');
      return;
    }
    setCampModalOpen(false);
    await loadCampaigns();
    notify?.(editingCampId ? 'Campaign updated.' : 'Campaign created.');
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this crowdfunding campaign?')) return;
    const res = await fetch('/api/admin/campaigns/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      await loadCampaigns();
      notify?.('Campaign removed.');
    }
  };

  const saveOtherDonation = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/other-donations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otherForm),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      notify?.(json?.error || 'Could not record item donation.');
      return;
    }
    setOtherModalOpen(false);
    await loadOtherDonations();
    notify?.('Item donation recorded.');
  };

  const bulkDeleteOther = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} item donation(s)?`)) return;
    const res = await fetch('/api/admin/other-donations/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      await loadOtherDonations();
      notify?.('Item donation records deleted.');
    }
  };

  const donationsCsvUrl = `/api/admin/finance/donations/?${new URLSearchParams({
    source: moduleTab === 'visitor' ? 'visitor' : moduleTab === 'member' ? 'member' : 'receipt',
    status: statusFilter,
    preset,
    from: fromDate,
    to: toDate,
    search,
    export: 'csv',
  }).toString()}`;

  const otherCsvUrl = `/api/admin/other-donations/?${new URLSearchParams({
    preset,
    from: fromDate,
    to: toDate,
    export: 'csv',
  }).toString()}`;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Donations, Receipts &amp; Crowdfunding</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Manage Visitor &amp; Member donations, manual receipts, crowdfunding campaigns, and non-monetary item gifts.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[
          { id: 'visitor', label: 'Visitor Donations' },
          { id: 'member', label: 'Member Donations' },
          { id: 'receipts', label: 'Create Receipt & List' },
          { id: 'campaigns', label: 'Crowdfunding Campaigns' },
          { id: 'other', label: 'Other / Item Donations' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`adm-btn adm-btn-sm ${moduleTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
            onClick={() => setModuleTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {moduleTab === 'campaigns' ? (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Campaigns' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' },
                { id: 'received-donations', label: 'Received Donations' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${campTab === c.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setCampTab(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={openNewCampaign}>
              <Plus size={14} /> Create Campaign
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : campTab === 'received-donations' ? (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Donor</th>
                    <th>Purpose / Cause</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campDonations.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.receiptNo}</strong></td>
                      <td>{d.donorName}</td>
                      <td>{d.purpose}</td>
                      <td>Rs. {Number(d.amount).toLocaleString('en-IN')}</td>
                      <td>{d.method}</td>
                      <td><span className="adm-badge green">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Campaign Title</th>
                    <th>Category</th>
                    <th>Progress (Raised / Goal)</th>
                    <th>Donors</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.category}</td>
                      <td>
                        Rs. {Number(c.raisedAmount).toLocaleString('en-IN')} / Rs.{' '}
                        {Number(c.goalAmount).toLocaleString('en-IN')}
                      </td>
                      <td>{c.donorsCount}</td>
                      <td>{c.endDate}</td>
                      <td>
                        <span className={`adm-badge ${c.status === 'Completed' ? 'blue' : c.status === 'Active' ? 'green' : 'gray'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            onClick={() => {
                              setEditingCampId(c.id);
                              setCampForm({
                                title: c.title,
                                category: c.category,
                                goalAmount: String(c.goalAmount),
                                status: c.status,
                                startDate: c.startDate,
                                endDate: c.endDate,
                                description: c.description || '',
                              });
                              setCampModalOpen(true);
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            style={{ color: '#dc2626' }}
                            onClick={() => deleteCampaign(c.id)}
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
      ) : moduleTab === 'other' ? (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={() => bulkDeleteOther(selectedIds)}
                >
                  <Trash2 size={13} /> Bulk Delete ({selectedIds.length})
                </button>
              )}
              <a href={otherCsvUrl} className="adm-btn adm-btn-sm adm-btn-outline">
                <Download size={13} /> Export Donations
              </a>
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setOtherModalOpen(true)}>
                <Plus size={14} /> Add Item Donation
              </button>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <input
                      type="checkbox"
                      checked={otherDonations.length > 0 && selectedIds.length === otherDonations.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? otherDonations.map((d) => d.id) : [])}
                    />
                  </th>
                  <th>Donation No</th>
                  <th>Donor</th>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Condition</th>
                  <th>Received By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {otherDonations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                          )
                        }
                      />
                    </td>
                    <td><strong>{d.donationNo}</strong></td>
                    <td>
                      <div>{d.donorName}</div>
                      <small style={{ color: '#64748b' }}>{d.email}</small>
                    </td>
                    <td>{d.category}</td>
                    <td>
                      {(d.items || []).map((i, idx) => (
                        <div key={idx} style={{ fontSize: 12 }}>
                          {i.itemName} — {i.quantity} {i.unit}
                        </div>
                      ))}
                    </td>
                    <td><span className="adm-badge blue">{d.condition}</span></td>
                    <td>{d.receivedBy}</td>
                    <td>{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Status' },
                { id: 'success', label: 'Paid / Only Success' },
                { id: 'pending', label: 'Pending' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${statusFilter === s.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setStatusFilter(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={() => handleBulkDeleteDonations(selectedIds)}
                >
                  <Trash2 size={13} /> Bulk Delete ({selectedIds.length})
                </button>
              )}
              <a href={donationsCsvUrl} className="adm-btn adm-btn-sm adm-btn-outline">
                <Download size={13} /> Export Report
              </a>
              {moduleTab === 'receipts' && (
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setReceiptOpen(true)}>
                  <Plus size={14} /> Create Receipt
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt, donor, UTR..."
              style={{ flex: '1 1 200px', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
            <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={clearFilters}>Clear Filters</button>
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        checked={donations.length > 0 && selectedIds.length === donations.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? donations.map((d) => d.id) : [])}
                      />
                    </th>
                    <th>Receipt No</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Purpose &amp; Mode</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(d.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                            )
                          }
                        />
                      </td>
                      <td><strong>{d.receiptNo}</strong></td>
                      <td>
                        <div><strong>{d.donorName}</strong></div>
                        <small style={{ color: '#64748b' }}>{d.email || d.phone}</small>
                      </td>
                      <td><strong>Rs. {Number(d.amount).toLocaleString('en-IN')}</strong></td>
                      <td>
                        <div>{d.purpose}</div>
                        <small style={{ color: '#64748b' }}>{d.method} • {d.utr}</small>
                      </td>
                      <td>
                        <span className={`adm-badge ${d.status === 'Success' ? 'green' : d.status === 'Pending' ? 'amber' : 'red'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>{String(d.createdAt || '').slice(0, 10)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setDetailModal(d)}><Eye size={13} /></button>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setEditDonation({ ...d })}><Edit2 size={13} /></button>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => handleBulkDeleteDonations([d.id])}><Trash2 size={13} /></button>
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

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setDetailModal(null)}>
          <div style={{ width: 'min(460px, 100%)', background: '#fff', borderRadius: 12, padding: 22 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px' }}>Donation Details — {detailModal.receiptNo}</h3>
            <div style={{ display: 'grid', gap: 6, fontSize: 13, marginBottom: 14 }}>
              <div><strong>Donor Name:</strong> {detailModal.donorName}</div>
              <div><strong>Email / Phone:</strong> {detailModal.email} • {detailModal.phone}</div>
              <div><strong>PAN:</strong> {detailModal.pan || '—'}</div>
              <div><strong>Amount:</strong> Rs. {Number(detailModal.amount).toLocaleString('en-IN')}</div>
              <div><strong>Purpose:</strong> {detailModal.purpose}</div>
              <div><strong>Payment Mode:</strong> {detailModal.method}</div>
              <div><strong>UTR / Ref:</strong> {detailModal.utr}</div>
              <div><strong>Status:</strong> {detailModal.status}</div>
            </div>
            <button type="button" className="adm-btn adm-btn-outline" onClick={() => setDetailModal(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Edit Donation Modal */}
      {editDonation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setEditDonation(null)}>
          <form onSubmit={handleSaveEditedDonation} style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Edit Payment Record ({editDonation.receiptNo})</h3>
            <input required value={editDonation.donorName} onChange={(e) => setEditDonation({ ...editDonation, donorName: e.target.value })} placeholder="Donor Name" style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="number" min="1" value={editDonation.amount} onChange={(e) => setEditDonation({ ...editDonation, amount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={editDonation.purpose} onChange={(e) => setEditDonation({ ...editDonation, purpose: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {DONATION_PURPOSE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={editDonation.status} onChange={(e) => setEditDonation({ ...editDonation, status: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setEditDonation(null)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Update Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Receipt Modal */}
      {receiptOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setReceiptOpen(false)}>
          <form onSubmit={handleCreateReceipt} style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Create Manual Donation Receipt</h3>
              <button type="button" onClick={() => setReceiptOpen(false)} style={{ border: 0, background: 'transparent' }}><X size={16} /></button>
            </div>
            <input required placeholder="Donor Name *" value={receiptForm.donorName} onChange={(e) => setReceiptForm({ ...receiptForm, donorName: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="number" min="1" placeholder="Amount (Rs.) *" value={receiptForm.amount} onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={receiptForm.purpose} onChange={(e) => setReceiptForm({ ...receiptForm, purpose: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {DONATION_PURPOSE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={receiptForm.method} onChange={(e) => setReceiptForm({ ...receiptForm, method: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input placeholder="Email" value={receiptForm.email} onChange={(e) => setReceiptForm({ ...receiptForm, email: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="PAN (optional)" value={receiptForm.pan} onChange={(e) => setReceiptForm({ ...receiptForm, pan: e.target.value.toUpperCase() })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="UTR / Receipt / Cheque Reference" value={receiptForm.utr} onChange={(e) => setReceiptForm({ ...receiptForm, utr: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <button type="submit" className="adm-btn adm-btn-primary" style={{ justifyContent: 'center' }}>Generate Official Receipt</button>
          </form>
        </div>
      )}

      {/* Campaign Modal */}
      {campModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setCampModalOpen(false)}>
          <form onSubmit={saveCampaign} style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>{editingCampId ? 'Edit Campaign' : 'Create Crowdfunding Campaign'}</h3>
            <input required placeholder="Campaign Title *" value={campForm.title} onChange={(e) => setCampForm({ ...campForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={campForm.category} onChange={(e) => setCampForm({ ...campForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {CAMPAIGN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required type="number" min="100" placeholder="Goal Rs. *" value={campForm.goalAmount} onChange={(e) => setCampForm({ ...campForm, goalAmount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={campForm.status} onChange={(e) => setCampForm({ ...campForm, status: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="date" value={campForm.startDate} onChange={(e) => setCampForm({ ...campForm, startDate: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="date" value={campForm.endDate} onChange={(e) => setCampForm({ ...campForm, endDate: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <textarea rows={3} placeholder="Description" value={campForm.description} onChange={(e) => setCampForm({ ...campForm, description: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setCampModalOpen(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Campaign</button>
            </div>
          </form>
        </div>
      )}

      {/* Other Item Donation Modal */}
      {otherModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setOtherModalOpen(false)}>
          <form onSubmit={saveOtherDonation} style={{ width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Add Non-Monetary / Item Donation</h3>
            <input required placeholder="Donor Name *" value={otherForm.donorName} onChange={(e) => setOtherForm({ ...otherForm, donorName: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required placeholder="Category *" value={otherForm.category} onChange={(e) => setOtherForm({ ...otherForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={otherForm.condition} onChange={(e) => setOtherForm({ ...otherForm, condition: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="New">New</option>
                <option value="Gently Used">Gently Used</option>
                <option value="Good">Good</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="Received By" value={otherForm.receivedBy} onChange={(e) => setOtherForm({ ...otherForm, receivedBy: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="date" value={otherForm.date} onChange={(e) => setOtherForm({ ...otherForm, date: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <strong style={{ fontSize: 12 }}>Donated Items List</strong>
            {otherForm.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6 }}>
                <input
                  required
                  placeholder="Item Name"
                  value={item.itemName}
                  onChange={(e) => {
                    const next = [...otherForm.items];
                    next[idx].itemName = e.target.value;
                    setOtherForm({ ...otherForm, items: next });
                  }}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <input
                  required
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...otherForm.items];
                    next[idx].quantity = Number(e.target.value);
                    setOtherForm({ ...otherForm, items: next });
                  }}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <input
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => {
                    const next = [...otherForm.items];
                    next[idx].unit = e.target.value;
                    setOtherForm({ ...otherForm, items: next });
                  }}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                {otherForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOtherForm({
                        ...otherForm,
                        items: otherForm.items.filter((_, i) => i !== idx),
                      })
                    }
                    style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '0 8px' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="adm-btn adm-btn-sm adm-btn-outline"
              onClick={() =>
                setOtherForm({
                  ...otherForm,
                  items: [...otherForm.items, { itemName: '', quantity: 1, unit: 'Units' }],
                })
              }
            >
              + Add Another Item
            </button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setOtherModalOpen(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Item Donation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
