'use client';

import { useState } from 'react';
import {
  CalendarClock, Search, Plus, Pause, Play, Trash2, CheckCircle2,
  Clock, DollarSign, Users, ShieldAlert, X
} from 'lucide-react';
import { initialRecurringDonors } from './data/mock-admin-data';

export default function RecurringDonations({ notify }) {
  const [donors, setDonors] = useState(initialRecurringDonors);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    monthlyAmount: 1000,
    frequency: 'Monthly',
    billingDay: '1st of month',
    paymentMethod: 'UPI AutoPay',
  });

  const totalMRR = donors
    .filter((d) => d.status === 'Active')
    .reduce((sum, d) => sum + Number(d.monthlyAmount || 0), 0);
  const activeCount = donors.filter((d) => d.status === 'Active').length;

  const filtered = donors.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      d.paymentMethod.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = (donor) => {
    const nextStatus = donor.status === 'Active' ? 'Paused' : 'Active';
    setDonors(donors.map((d) => (d.id === donor.id ? { ...d, status: nextStatus } : d)));
    notify?.(`Recurring subscription for ${donor.donorName} is now ${nextStatus}.`);
  };

  const handleAddDonor = (e) => {
    e.preventDefault();
    if (!formData.donorName.trim() || !formData.monthlyAmount) {
      notify?.('Please fill out donor name and pledge amount.');
      return;
    }

    const newDonor = {
      ...formData,
      id: `rec-${Date.now()}`,
      monthlyAmount: Number(formData.monthlyAmount),
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: '2026-04-01',
      totalContributed: Number(formData.monthlyAmount),
      status: 'Active',
    };

    setDonors([newDonor, ...donors]);
    notify?.(`Recurring donor ${newDonor.donorName} enrolled successfully!`);
    setModalOpen(false);
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Recurring Donations</h2>
          <p>Manage monthly supporters, automated pledges, eNACH/UPI mandates, and subscription cycles.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add Recurring Pledge
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalMRR.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Monthly Recurring Revenue (MRR)</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Users size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{activeCount}</span>
            <span className="adm-stat-label">Active Monthly Donors</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><Clock size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              ₹{(totalMRR * 12).toLocaleString('en-IN')}
            </span>
            <span className="adm-stat-label">Annual Projected Run-rate</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><CalendarClock size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {donors.filter((d) => d.status === 'Paused').length}
            </span>
            <span className="adm-stat-label">Paused Subscriptions</span>
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
            placeholder="Search recurring donor by name, phone, mandate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="adm-filters">
          <select
            className="adm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Monthly Pledge</th>
                <th>Billing Cycle</th>
                <th>Mandate Mode</th>
                <th>Next Charge</th>
                <th>Total Donated</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div>
                      <strong>{d.donorName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{d.email || d.phone}</div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: '14px' }}>
                      ₹{d.monthlyAmount.toLocaleString('en-IN')} / mo
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#475569' }}>{d.billingDay}</span>
                  </td>
                  <td>
                    <span className="adm-badge blue">{d.paymentMethod}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#1e40af' }}>{d.nextBillingDate}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      ₹{d.totalContributed.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${d.status === 'Active' ? 'green' : 'amber'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="adm-btn adm-btn-sm adm-btn-outline"
                      onClick={() => handleToggleStatus(d)}
                      title={d.status === 'Active' ? 'Pause Pledge' : 'Resume Pledge'}
                    >
                      {d.status === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                      {d.status === 'Active' ? 'Pause' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pledge Modal */}
      {modalOpen && (
        <div className="adm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Enroll Recurring Supporter Pledge</h3>
              <button className="adm-btn-icon" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddDonor}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Donor Full Name *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      placeholder="e.g. Ananya Deshmukh"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Monthly Pledge Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      className="adm-form-control"
                      value={formData.monthlyAmount}
                      onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Billing Day</label>
                    <select
                      className="adm-form-control"
                      value={formData.billingDay}
                      onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
                    >
                      <option value="1st of month">1st of every month</option>
                      <option value="5th of month">5th of every month</option>
                      <option value="10th of month">10th of every month</option>
                      <option value="15th of month">15th of every month</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Mandate Method</label>
                    <select
                      className="adm-form-control"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="UPI AutoPay">UPI AutoPay</option>
                      <option value="eNACH Mandate">eNACH Net Banking Mandate</option>
                      <option value="Standing Instruction">Standing Instruction / Credit Card</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Save Recurring Supporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
