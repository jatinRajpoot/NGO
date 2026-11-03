'use client';

import { useState } from 'react';
import {
  HandHeart, Plus, Search, Download, Printer, Filter, DollarSign,
  TrendingUp, CreditCard, ShieldCheck, X
} from 'lucide-react';
import { initialDonations } from './data/mock-admin-data';

export default function DonationManagement({ notify }) {
  const [donations, setDonations] = useState(initialDonations);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [modalMode, setModalMode] = useState(null); // 'add', 'receipt'
  const [selectedDonation, setSelectedDonation] = useState(null);

  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    pan: '',
    amount: '',
    mode: 'UPI / QR',
    program: 'General Welfare & Education',
  });

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalCount = donations.length;

  const filtered = donations.filter((d) => {
    if (modeFilter !== 'ALL' && d.mode !== modeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNo.toLowerCase().includes(q) ||
      (d.pan && d.pan.toLowerCase().includes(q)) ||
      d.mode.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      donorName: '',
      email: '',
      phone: '',
      pan: '',
      amount: '',
      mode: 'UPI / QR',
      program: 'General Welfare & Education',
    });
    setModalMode('add');
  };

  const handleSaveDonation = (e) => {
    e.preventDefault();
    if (!formData.donorName.trim() || !formData.amount) {
      notify?.('Please fill out Donor Name and Amount.');
      return;
    }

    const nextCount = donations.length + 1043;
    const newReceipt = `GSDD-REC-2026-${nextCount}`;
    const newDonation = {
      ...formData,
      amount: Number(formData.amount),
      id: `don-${Date.now()}`,
      receiptNo: newReceipt,
      date: new Date().toISOString().split('T')[0],
      tax80g: formData.pan ? 'Issued' : 'Pending',
      status: 'Successful',
    };

    setDonations([newDonation, ...donations]);
    notify?.(`Donation of ₹${newDonation.amount.toLocaleString('en-IN')} recorded with receipt ${newReceipt}!`);
    setModalMode(null);
  };

  const handleOpenReceipt = (d) => {
    setSelectedDonation(d);
    setModalMode('receipt');
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Donation Management</h2>
          <p>Track all donor contributions, cash/bank receipts, Section 80G tax certificates, and funding ledger.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={handleOpenAdd}>
            <Plus size={15} /> Add Offline / Cash Donation
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalAmount.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Total Donations Raised</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><HandHeart size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalCount}</span>
            <span className="adm-stat-label">Contributions Received</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><ShieldCheck size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {donations.filter((d) => d.tax80g === 'Issued').length}
            </span>
            <span className="adm-stat-label">80G Receipts Issued</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><TrendingUp size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              ₹{totalCount ? Math.round(totalAmount / totalCount).toLocaleString('en-IN') : 0}
            </span>
            <span className="adm-stat-label">Average Contribution</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="adm-control-bar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="adm-search-input"
            placeholder="Search by receipt number, donor name, PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="adm-filters">
          <select
            className="adm-select"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI / QR">UPI / QR</option>
            <option value="Net Banking (NEFT)">Net Banking (NEFT)</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Donor Name</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th>80G Status</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{d.receiptNo}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{d.donorName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {d.pan ? `PAN: ${d.pan}` : d.email || d.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: '14px' }}>
                      ₹{d.amount.toLocaleString('en-IN')}
                    </strong>
                  </td>
                  <td>
                    <span className="adm-badge blue">{d.mode}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{d.date}</span>
                  </td>
                  <td>
                    <span className={`adm-badge ${d.tax80g === 'Issued' ? 'green' : 'amber'}`}>
                      {d.tax80g}
                    </span>
                  </td>
                  <td>
                    <span className="adm-badge green">{d.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="adm-btn adm-btn-sm adm-btn-outline"
                      onClick={() => handleOpenReceipt(d)}
                      title="View & Print Official 80G Receipt"
                    >
                      <Printer size={13} /> 80G Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Offline Donation Modal */}
      {modalMode === 'add' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Record Offline / Manual Donation</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveDonation}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Donor Full Name / Entity *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra Agrawal"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donation Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      className="adm-form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Payment Mode *</label>
                    <select
                      className="adm-form-control"
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    >
                      <option value="UPI / QR">UPI / QR Code</option>
                      <option value="Net Banking (NEFT)">Net Banking (NEFT / RTGS / IMPS)</option>
                      <option value="Cheque">Cheque / Demand Draft</option>
                      <option value="Cash">Cash Receipt</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Donor PAN (for Section 80G)</label>
                    <input
                      type="text"
                      maxLength={10}
                      className="adm-form-control"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor Phone Number</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98350 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor Email Address</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="donor@example.com"
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Foundation Focus Area / Program</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Save &amp; Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 80G Receipt Modal */}
      {modalMode === 'receipt' && selectedDonation && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Official Donation Receipt: {selectedDonation.receiptNo}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <div
                style={{
                  border: '2px solid #2563eb',
                  borderRadius: '10px',
                  padding: '24px',
                  background: '#ffffff',
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.04em' }}>
                    GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    CIN: U88900BR2026NPL086114 &bull; NGO Darpan: BR/2026/1140209 &bull; PAN: AANCG1860E
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    80G Identifier: AANCG1860EF20261 &bull; 12A Identifier: AANCG1860EE20261
                  </div>
                  <div style={{ display: 'inline-block', marginTop: '10px', padding: '3px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                    DONATION RECEIPT (UNDER SECTION 80G)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Receipt No</span>
                    <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{selectedDonation.receiptNo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Date</span>
                    <strong>{selectedDonation.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Donor Name</span>
                    <strong style={{ fontSize: '15px' }}>{selectedDonation.donorName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Donor PAN</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedDonation.pan || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Amount Received</span>
                    <strong style={{ color: '#059669', fontSize: '18px' }}>₹{selectedDonation.amount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Payment Method</span>
                    <strong>{selectedDonation.mode}</strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Program / Purpose</span>
                    <div>{selectedDonation.program || 'Community Development and Digital Literacy'}</div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#64748b' }}>
                  <div>
                    Registered Office: Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, Araria, Bihar
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', borderBottom: '1px solid #000', marginBottom: '4px' }} />
                    <strong>Authorized Signatory</strong>
                    <div>GSDD Foundation</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-outline"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button className="adm-btn adm-btn-primary" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
