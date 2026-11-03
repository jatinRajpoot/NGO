'use client';

import { useState } from 'react';
import {
  CalendarClock, Search, Plus, Pause, Play, Trash2, CheckCircle2,
  Clock, DollarSign, Users, ShieldAlert, X, Settings2, Key,
  Mail, MessageSquare, Send, Check, AlertCircle, RefreshCw, Smartphone
} from 'lucide-react';
import { initialRecurringDonors } from './data/mock-admin-data';

export default function RecurringDonations({ notify }) {
  const [donors, setDonors] = useState([
    ...initialRecurringDonors,
    {
      id: 'rec-5',
      donorName: 'Dr. Sanjay Agarwal',
      email: 'sanjay.agarwal@example.com',
      phone: '+91 94318 44332',
      monthlyAmount: 3000,
      frequency: 'Monthly',
      billingDay: '1st of month',
      startDate: '2025-09-01',
      nextBillingDate: '2026-04-01',
      paymentMethod: 'UPI AutoPay',
      mandateId: 'UMN-202509-004128',
      totalContributed: 21000,
      status: 'Active',
    },
    {
      id: 'rec-6',
      donorName: 'Radha Krishna Mills',
      email: 'accounts@rkmills.in',
      phone: '+91 98114 77889',
      monthlyAmount: 10000,
      frequency: 'Monthly',
      billingDay: '5th of month',
      startDate: '2025-06-05',
      nextBillingDate: '2026-03-05',
      paymentMethod: 'eNACH Mandate',
      mandateId: 'NACH-HDFC-991204',
      totalContributed: 90000,
      status: 'Active',
    },
  ]);

  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions', 'gateways', 'notifications', 'mandates'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [notifyModalDonor, setNotifyModalDonor] = useState(null);
  const [notifyChannel, setNotifyChannel] = useState('whatsapp'); // 'whatsapp', 'email'

  // Gateway Settings state
  const [gateways, setGateways] = useState({
    razorpay: {
      name: 'Razorpay Recurring & Subscriptions',
      keyId: 'rzp_live_GSDD_9481920',
      keySecret: '••••••••••••••••••••••••',
      webhookSecret: '••••••••••••••••',
      mode: 'Live Mode',
      active: true,
    },
    cashfree: {
      name: 'Cashfree Subscriptions & eNACH',
      keyId: 'cf_app_live_883190',
      keySecret: '••••••••••••••••••••••••',
      webhookSecret: '••••••••••••••••',
      mode: 'Live Mode',
      active: true,
    },
    upiAutopay: {
      name: 'NPCI UPI AutoPay Direct Mandates',
      keyId: 'VPA: gsddfoundation@hdfcbank',
      keySecret: 'Active Bank Merchant',
      webhookSecret: '',
      mode: 'Live Mode',
      active: true,
    },
  });

  // Notification & Auto Receipt Preferences
  const [autoReceiptSettings, setAutoReceiptSettings] = useState({
    autoGenerateReceipt: true,
    sendEmailReceipt: true,
    sendWhatsappReceipt: true,
    sendDeductionReminder: true,
    reminderDaysBefore: 2,
  });

  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    monthlyAmount: 1000,
    frequency: 'Monthly',
    billingDay: '1st of month',
    paymentMethod: 'UPI AutoPay',
    mandateId: '',
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
      d.paymentMethod.toLowerCase().includes(q) ||
      (d.mandateId && d.mandateId.toLowerCase().includes(q))
    );
  });

  const handleToggleStatus = (donor) => {
    const nextStatus = donor.status === 'Active' ? 'Paused' : 'Active';
    setDonors(donors.map((d) => (d.id === donor.id ? { ...d, status: nextStatus } : d)));
    notify?.(`Recurring pledge for ${donor.donorName} is now ${nextStatus}.`);
  };

  const handleCancelSubscription = (donor) => {
    if (window.confirm(`Are you sure you want to cancel the recurring pledge for ${donor.donorName}?`)) {
      setDonors(donors.map((d) => (d.id === donor.id ? { ...d, status: 'Cancelled' } : d)));
      notify?.(`Recurring subscription for ${donor.donorName} has been cancelled.`);
    }
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
      mandateId: formData.mandateId || `AUTOPAY-${Math.floor(100000 + Math.random() * 900000)}`,
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: '2026-04-01',
      totalContributed: Number(formData.monthlyAmount),
      status: 'Active',
    };

    setDonors([newDonor, ...donors]);
    notify?.(`Recurring donor ${newDonor.donorName} enrolled with mandate ID ${newDonor.mandateId}!`);
    setModalOpen(false);
  };

  const handleOpenNotify = (donor) => {
    setNotifyModalDonor(donor);
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (notifyChannel === 'whatsapp') {
      notify?.(`WhatsApp receipt notification dispatched to ${notifyModalDonor?.phone}!`);
    } else {
      notify?.(`Email receipt notification sent to ${notifyModalDonor?.email}!`);
    }
    setNotifyModalDonor(null);
  };

  const handleSaveGateways = () => {
    notify?.('Payment Gateway credentials & AutoPay configurations saved.');
  };

  const handleSaveReceiptSettings = () => {
    notify?.('Auto Receipt & Notification preferences updated.');
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Recurring Donation Management</h2>
          <p>
            Manage monthly donor subscriptions, automated bank &amp; UPI mandates, payment gateway integrations, and auto-dispatch of receipts via Email &amp; WhatsApp.
          </p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={() => setActiveTab('gateways')}>
            <Settings2 size={15} /> Payment Gateways
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Enroll Recurring Donor
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
            <span className="adm-stat-value">₹{(totalMRR * 12).toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Projected Annual Pledges</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><CheckCircle2 size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">98.4%</span>
            <span className="adm-stat-label">Auto-Deduction Success Rate</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'subscriptions' ? ' active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Active Subscriptions <span className="adm-tab-badge">{donors.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'gateways' ? ' active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <Key size={13} /> Payment Gateway Management
        </button>
        <button
          className={`adm-tab${activeTab === 'notifications' ? ' active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <MessageSquare size={13} /> Auto Receipt &amp; WhatsApp Notifications
        </button>
      </div>

      {/* Tab 1: Subscriptions List */}
      {activeTab === 'subscriptions' && (
        <>
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search donor name, phone, mandate ID..."
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
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Monthly Amount</th>
                    <th>Auto Deduction Cycle</th>
                    <th>Mandate Mode &amp; ID</th>
                    <th>Next Charge Date</th>
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
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {d.phone} &bull; {d.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '14px' }}>
                          ₹{d.monthlyAmount.toLocaleString('en-IN')} / mo
                        </strong>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.billingDay}</span>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Auto-debit mandate</div>
                        </div>
                      </td>
                      <td>
                        <span className="adm-badge blue">{d.paymentMethod}</span>
                        {d.mandateId && (
                          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                            {d.mandateId}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                          {d.nextBillingDate}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`adm-badge ${
                            d.status === 'Active' ? 'green' : d.status === 'Paused' ? 'amber' : 'red'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {d.status !== 'Cancelled' && (
                            <>
                              <button
                                className="adm-btn adm-btn-sm adm-btn-outline"
                                onClick={() => handleToggleStatus(d)}
                                title={d.status === 'Active' ? 'Pause Auto Deduction' : 'Resume Auto Deduction'}
                              >
                                {d.status === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                                {d.status === 'Active' ? 'Pause' : 'Resume'}
                              </button>
                              <button
                                className="adm-btn-icon"
                                onClick={() => handleOpenNotify(d)}
                                title="Send WhatsApp / Email Receipt"
                                style={{ color: '#2563eb' }}
                              >
                                <Smartphone size={14} />
                              </button>
                              <button
                                className="adm-btn-icon adm-btn-danger"
                                onClick={() => handleCancelSubscription(d)}
                                title="Cancel Subscription"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Payment Gateway Management */}
      {activeTab === 'gateways' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="adm-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Connected Payment Gateways for Automated Pledges
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Configure API keys, webhooks, and live credentials for auto-debit processing across UPI AutoPay and eNACH mandates.
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Razorpay */}
              <div style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0c2340', color: '#3395ff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                      R
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{gateways.razorpay.name}</strong>
                      <div style={{ fontSize: '11px', color: '#059669' }}>Connected &bull; Webhooks Active</div>
                    </div>
                  </div>
                  <span className="adm-badge green">{gateways.razorpay.mode}</span>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Key ID</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={gateways.razorpay.keyId}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          razorpay: { ...gateways.razorpay, keyId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Key Secret</label>
                    <input
                      type="password"
                      className="adm-form-control"
                      value={gateways.razorpay.keySecret}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          razorpay: { ...gateways.razorpay, keySecret: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Cashfree */}
              <div style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#7e22ce', color: '#ffffff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                      CF
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{gateways.cashfree.name}</strong>
                      <div style={{ fontSize: '11px', color: '#059669' }}>Connected &bull; eNACH Direct</div>
                    </div>
                  </div>
                  <span className="adm-badge green">{gateways.cashfree.mode}</span>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>App ID</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={gateways.cashfree.keyId}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          cashfree: { ...gateways.cashfree, keyId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Secret Key</label>
                    <input
                      type="password"
                      className="adm-form-control"
                      value={gateways.cashfree.keySecret}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          cashfree: { ...gateways.cashfree, keySecret: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="adm-btn adm-btn-primary" onClick={handleSaveGateways}>
                <Check size={14} /> Save Gateway Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Auto Receipt & WhatsApp / Email Notifications */}
      {activeTab === 'notifications' && (
        <div className="adm-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Auto Receipt Generation &amp; Donor Notifications
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
            Automate monthly tax receipt generation and instant notification delivery via WhatsApp and Email upon successful pledge deduction.
          </p>

          <div style={{ display: 'grid', gap: '16px', maxWidth: '640px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoReceiptSettings.autoGenerateReceipt}
                onChange={(e) =>
                  setAutoReceiptSettings({ ...autoReceiptSettings, autoGenerateReceipt: e.target.checked })
                }
              />
              <div>
                <strong>Automatic 80G Receipt Generation</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Generate an official Section 80G tax receipt immediately when monthly recurring charge succeeds.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoReceiptSettings.sendWhatsappReceipt}
                onChange={(e) =>
                  setAutoReceiptSettings({ ...autoReceiptSettings, sendWhatsappReceipt: e.target.checked })
                }
              />
              <div>
                <strong>Instant WhatsApp Notification with PDF Link</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Send WhatsApp message containing payment confirmation, 80G tax receipt PDF link, and QR verification.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoReceiptSettings.sendEmailReceipt}
                onChange={(e) =>
                  setAutoReceiptSettings({ ...autoReceiptSettings, sendEmailReceipt: e.target.checked })
                }
              />
              <div>
                <strong>Official Email Receipt with Attached PDF</strong>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Email receipt PDF directly to donor's registered email address.
                </div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button className="adm-btn adm-btn-primary" onClick={handleSaveReceiptSettings}>
              <Check size={14} /> Save Notification Preferences
            </button>
          </div>
        </div>
      )}

      {/* Enroll Recurring Donor Modal */}
      {modalOpen && (
        <div className="adm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Enroll Recurring Monthly Donor</h3>
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
                      placeholder="e.g. Dr. Sanjay Agarwal"
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
                    <label>Donor WhatsApp / Mobile *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 94318 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor Email</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Auto-Debit Billing Day</label>
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
                    <label>Payment Mandate Mode</label>
                    <select
                      className="adm-form-control"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="UPI AutoPay">UPI AutoPay (PhonePe / GPay / Paytm)</option>
                      <option value="eNACH Mandate">eNACH Net Banking Mandate</option>
                      <option value="Standing Instruction">Credit Card Standing Instruction</option>
                    </select>
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Bank Mandate ID / Token (Optional)</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.mandateId}
                      onChange={(e) => setFormData({ ...formData, mandateId: e.target.value })}
                      placeholder="e.g. UMN-2026-XXXXXX"
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Save &amp; Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Notification Dispatch Modal */}
      {notifyModalDonor && (
        <div className="adm-modal-overlay" onClick={() => setNotifyModalDonor(null)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Send Receipt &amp; Notification</h3>
              <button className="adm-btn-icon" onClick={() => setNotifyModalDonor(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSendNotification}>
              <div className="adm-modal-body">
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569' }}>
                  Send monthly donation acknowledgement and 80G tax receipt to <strong>{notifyModalDonor.donorName}</strong>.
                </p>

                <div className="adm-form-group" style={{ marginBottom: '14px' }}>
                  <label>Notification Channel</label>
                  <select
                    className="adm-form-control"
                    value={notifyChannel}
                    onChange={(e) => setNotifyChannel(e.target.value)}
                  >
                    <option value="whatsapp">WhatsApp Message to {notifyModalDonor.phone}</option>
                    <option value="email">Email Notification to {notifyModalDonor.email}</option>
                  </select>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#334155' }}>
                  Preview: &ldquo;Dear {notifyModalDonor.donorName}, thank you for your recurring support of ₹{notifyModalDonor.monthlyAmount} to GSDD Foundation. Your official 80G tax receipt has been generated: gsddfoundation.org/verify?type=donation&amp;id=...&rdquo;
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setNotifyModalDonor(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Send size={14} /> Send Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
