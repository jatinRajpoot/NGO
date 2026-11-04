'use client';

import { useState } from 'react';
import {
  HandHeart, Plus, Search, Download, Printer, Filter, DollarSign,
  TrendingUp, CreditCard, ShieldCheck, X, QrCode, CheckCircle2,
  AlertCircle, ArrowDownToLine, Banknote, Building2, Check, ExternalLink
} from 'lucide-react';
import { initialDonations } from './data/mock-admin-data';
import QRCodeVisual from './utils/QRCodeVisual';

export default function DonationManagement({ notify }) {
  const [donations, setDonations] = useState([
    ...initialDonations,
    {
      id: 'don-6',
      receiptNo: 'GSDD-REC-2026-1037',
      donorName: 'Suresh Kumar Choudhary',
      email: 'suresh.c@example.com',
      phone: '+91 94314 55667',
      pan: 'BCKPC3321M',
      amount: 15000,
      date: '2026-02-10',
      mode: 'Bank Transfer (IMPS)',
      utr: 'IMPS/604118992144',
      program: 'Digital Literacy Lab',
      tax80g: 'Issued',
      verificationStatus: 'Verified',
      status: 'Successful',
    },
    {
      id: 'don-7',
      receiptNo: 'GSDD-REC-2026-1036',
      donorName: 'Raniganj Trade Association',
      email: '',
      phone: '+91 98351 00221',
      pan: '',
      amount: 50000,
      date: '2026-02-05',
      mode: 'Cash',
      utr: 'CASH-BOOK-VOL-2-PG44',
      program: 'Rural Health Camp',
      tax80g: 'Pending',
      verificationStatus: 'Verified',
      status: 'Successful',
    },
    {
      id: 'don-8',
      receiptNo: 'GSDD-REC-2026-1035',
      donorName: 'Rajeshwar Thakur',
      email: 'rajeshwar.t@example.com',
      phone: '+91 88771 99001',
      pan: 'AAMPT9911D',
      amount: 7500,
      date: '2026-03-01',
      mode: 'UPI / QR',
      utr: 'UPI/606112948211',
      program: 'General Welfare',
      tax80g: 'Pending',
      verificationStatus: 'Pending Verification',
      status: 'Pending',
    },
  ]);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'online', 'cash', 'bank', 'verifyQueue', 'qrVerify', 'reports'
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [modalMode, setModalMode] = useState(null); // 'addCash', 'addBank', 'receipt'
  const [selectedDonation, setSelectedDonation] = useState(null);

  // QR Verify State
  const [verifyReceiptInput, setVerifyReceiptInput] = useState('');
  const [receiptVerifyResult, setReceiptVerifyResult] = useState(null);

  const [formData, setFormData] = useState({
    donorName: '',
    email: '',
    phone: '',
    pan: '',
    amount: '',
    mode: 'Cash',
    utr: '',
    program: 'General Welfare & Education',
  });

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalCount = donations.length;
  const verifiedCount = donations.filter((d) => d.verificationStatus === 'Verified' || d.status === 'Successful').length;
  const pendingVerifyCount = donations.filter((d) => d.verificationStatus === 'Pending Verification').length;

  const filtered = donations.filter((d) => {
    if (activeTab === 'online' && !['UPI / QR', 'Net Banking (NEFT)'].includes(d.mode)) return false;
    if (activeTab === 'cash' && d.mode !== 'Cash') return false;
    if (activeTab === 'bank' && !['Net Banking (NEFT)', 'Bank Transfer (IMPS)', 'Cheque'].includes(d.mode)) return false;
    if (activeTab === 'verifyQueue' && d.verificationStatus !== 'Pending Verification') return false;
    if (modeFilter !== 'ALL' && d.mode !== modeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNo.toLowerCase().includes(q) ||
      (d.pan && d.pan.toLowerCase().includes(q)) ||
      (d.utr && d.utr.toLowerCase().includes(q)) ||
      d.mode.toLowerCase().includes(q)
    );
  });

  const handleOpenAddCash = () => {
    setFormData({
      donorName: '',
      email: '',
      phone: '',
      pan: '',
      amount: '',
      mode: 'Cash',
      utr: 'CASH-REC-' + Math.floor(1000 + Math.random() * 9000),
      program: 'Rural Health & Education',
    });
    setModalMode('addCash');
  };

  const handleOpenAddBank = () => {
    setFormData({
      donorName: '',
      email: '',
      phone: '',
      pan: '',
      amount: '',
      mode: 'Net Banking (NEFT)',
      utr: '',
      program: 'Digital Literacy Lab',
    });
    setModalMode('addBank');
  };

  const handleSaveDonation = (e) => {
    e.preventDefault();
    if (!formData.donorName.trim() || !formData.amount) {
      notify?.('Please fill out Donor Name and Amount.');
      return;
    }

    const nextCount = donations.length + 1045;
    const newReceipt = `GSDD-REC-2026-${nextCount}`;
    const newDonation = {
      ...formData,
      amount: Number(formData.amount),
      id: `don-${Date.now()}`,
      receiptNo: newReceipt,
      date: new Date().toISOString().split('T')[0],
      tax80g: formData.pan ? 'Issued' : 'Pending',
      verificationStatus: 'Verified',
      status: 'Successful',
    };

    setDonations([newDonation, ...donations]);
    notify?.(`Donation of ₹${newDonation.amount.toLocaleString('en-IN')} saved with QR receipt ${newReceipt}!`);
    setModalMode(null);
  };

  const handleVerifyPending = (donation) => {
    setDonations(
      donations.map((d) =>
        d.id === donation.id ? { ...d, verificationStatus: 'Verified', status: 'Successful', tax80g: 'Issued' } : d
      )
    );
    notify?.(`Payment verified for receipt ${donation.receiptNo}! 80G receipt issued.`);
  };

  const handleOpenReceipt = (d) => {
    setSelectedDonation(d);
    setModalMode('receipt');
  };

  // QR Code Receipt Verification lookup
  const handleVerifyReceipt = (e) => {
    e?.preventDefault();
    const query = verifyReceiptInput.trim().toUpperCase();
    if (!query) return;

    const found = donations.find(
      (d) => d.receiptNo.toUpperCase() === query || (d.utr && d.utr.toUpperCase().includes(query))
    );

    if (found) {
      setReceiptVerifyResult({
        valid: true,
        donation: found,
        hash: `GSDD-80G-${found.receiptNo}-VALIDATED`,
      });
    } else {
      setReceiptVerifyResult({
        valid: false,
        code: query,
      });
    }
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Donation Management</h2>
          <p>
            Complete donation ledger, cash &amp; UPI tracking, payment verification, QR code verification, 80G receipt generation, and reports.
          </p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={() => setActiveTab('qrVerify')}>
            <QrCode size={15} /> QR Code Verification
          </button>
          <button className="adm-btn adm-btn-outline" onClick={handleOpenAddBank}>
            <Building2 size={15} /> Add Bank / UPI Entry
          </button>
          <button className="adm-btn adm-btn-primary" onClick={handleOpenAddCash}>
            <Banknote size={15} /> Cash Donation Entry
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalAmount.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Total Funds Raised</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><HandHeart size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalCount}</span>
            <span className="adm-stat-label">Total Contributions</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><ShieldCheck size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {donations.filter((d) => d.tax80g === 'Issued').length}
            </span>
            <span className="adm-stat-label">80G Receipts Generated</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><CreditCard size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{pendingVerifyCount}</span>
            <span className="adm-stat-label">Pending Verification</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Complete History <span className="adm-tab-badge">{totalCount}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'online' ? ' active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          Online Donations (UPI / NetBanking)
        </button>
        <button
          className={`adm-tab${activeTab === 'cash' ? ' active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          Cash Donations
        </button>
        <button
          className={`adm-tab${activeTab === 'bank' ? ' active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          Bank Transfer &amp; Cheque
        </button>
        <button
          className={`adm-tab${activeTab === 'verifyQueue' ? ' active' : ''}`}
          onClick={() => setActiveTab('verifyQueue')}
        >
          Payment Verification Queue <span className="adm-tab-badge">{pendingVerifyCount}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'qrVerify' ? ' active' : ''}`}
          onClick={() => setActiveTab('qrVerify')}
        >
          <QrCode size={13} /> QR Code Verification
        </button>
      </div>

      {/* Main Table View */}
      {['all', 'online', 'cash', 'bank', 'verifyQueue'].includes(activeTab) && (
        <>
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search by receipt, donor name, PAN, UTR / ref..."
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
                <option value="UPI / QR">UPI / QR Code</option>
                <option value="Net Banking (NEFT)">Net Banking (NEFT)</option>
                <option value="Bank Transfer (IMPS)">Bank Transfer (IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Entry</option>
              </select>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Receipt No &amp; QR</th>
                    <th>Donor Name</th>
                    <th>Amount</th>
                    <th>Payment Mode &amp; UTR</th>
                    <th>Date</th>
                    <th>80G Receipt</th>
                    <th>Verification</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        No donation records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <QRCodeVisual
                              value={`https://gsddfoundation.org/verify?type=donation&id=${d.receiptNo}`}
                              size={34}
                              label=""
                            />
                            <div>
                              <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{d.receiptNo}</strong>
                              <div style={{ fontSize: '10px', color: '#059669' }}>QR Verified</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{d.donorName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.pan ? `PAN: ${d.pan}` : d.email || d.phone || 'General Donor'}
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
                          {d.utr && (
                            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                              Ref: {d.utr}
                            </div>
                          )}
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
                          <span
                            className={`adm-badge ${
                              d.verificationStatus === 'Verified' || d.status === 'Successful' ? 'green' : 'amber'
                            }`}
                          >
                            {d.verificationStatus || d.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {d.verificationStatus === 'Pending Verification' ? (
                              <button
                                className="adm-btn adm-btn-sm adm-btn-primary"
                                onClick={() => handleVerifyPending(d)}
                              >
                                <Check size={13} /> Verify Payment
                              </button>
                            ) : (
                              <button
                                className="adm-btn adm-btn-sm adm-btn-outline"
                                onClick={() => handleOpenReceipt(d)}
                                title="Download & Print 80G Receipt"
                              >
                                <Printer size={13} /> PDF Receipt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* QR Code Verification Tool Tab */}
      {activeTab === 'qrVerify' && (
        <div className="adm-card" style={{ padding: '28px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <QrCode size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              Donation Receipt QR Code Verification
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
              Verify donation receipt authenticity and Section 80G tax validity. Scan receipt QR or enter Receipt ID.
            </p>

            <form onSubmit={handleVerifyReceipt} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                required
                className="adm-form-control"
                style={{ flex: 1, fontSize: '14px', textTransform: 'uppercase' }}
                placeholder="e.g. GSDD-REC-2026-1042 or UTR..."
                value={verifyReceiptInput}
                onChange={(e) => setVerifyReceiptInput(e.target.value)}
              />
              <button type="submit" className="adm-btn adm-btn-primary">
                <Search size={15} /> Verify Receipt
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>Try sample:</span>
              {donations.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="adm-badge blue"
                  style={{ cursor: 'pointer', border: 0 }}
                  onClick={() => {
                    setVerifyReceiptInput(d.receiptNo);
                    setReceiptVerifyResult({
                      valid: true,
                      donation: d,
                      hash: `GSDD-80G-${d.receiptNo}-VALIDATED`,
                    });
                  }}
                >
                  {d.receiptNo}
                </button>
              ))}
            </div>

            {receiptVerifyResult && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1.5px solid ${receiptVerifyResult.valid ? '#10b981' : '#ef4444'}`,
                  background: receiptVerifyResult.valid ? '#f0fdf4' : '#fef2f2',
                  textAlign: 'left',
                }}
              >
                {receiptVerifyResult.valid ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', marginBottom: '14px' }}>
                      <CheckCircle2 size={24} />
                      <div>
                        <strong style={{ fontSize: '16px' }}>GENUINE 80G DONATION RECEIPT RECORD FOUND</strong>
                        <div style={{ fontSize: '11px', color: '#065f46' }}>
                          Registered under Income Tax Dept 80G: AANCG1860EF20261
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Receipt No</span>
                        <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{receiptVerifyResult.donation.receiptNo}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Donor Name</span>
                        <strong>{receiptVerifyResult.donation.donorName}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Amount</span>
                        <strong style={{ color: '#059669', fontSize: '16px' }}>₹{receiptVerifyResult.donation.amount.toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Date Received</span>
                        <strong>{receiptVerifyResult.donation.date}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Payment Mode</span>
                        <span className="adm-badge blue">{receiptVerifyResult.donation.mode}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Donor PAN</span>
                        <strong style={{ fontFamily: 'monospace' }}>{receiptVerifyResult.donation.pan || 'Not provided'}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => handleOpenReceipt(receiptVerifyResult.donation)}>
                        <Printer size={13} /> View &amp; Print 80G Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={22} />
                    <div>
                      <strong>No Donation Receipt Found for "{receiptVerifyResult.code}"</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                        Please ensure the receipt number matches format GSDD-REC-2026-XXXX.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Donation Modal */}
      {modalMode === 'addCash' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Cash Donation Entry</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveDonation}>
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
                      placeholder="e.g. Ramesh Chandra Agrawal"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Cash Amount (INR) *</label>
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
                    <label>Donor PAN (Required for 80G receipt)</label>
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
                    <label>Cash Receipt Book Ref / Receipt No</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.utr}
                      onChange={(e) => setFormData({ ...formData, utr: e.target.value })}
                      placeholder="Manual receipt book reference..."
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor Phone</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98350 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor Email</label>
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
                  Save Cash Entry &amp; Generate QR Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Transfer / UPI Modal */}
      {modalMode === 'addBank' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Bank Transfer / UPI Donation Entry</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveDonation}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Donor Full Name / Company *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      placeholder="e.g. Meera Textiles Foundation"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      className="adm-form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 25000"
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
                      <option value="Net Banking (NEFT)">Net Banking (NEFT)</option>
                      <option value="Bank Transfer (IMPS)">Bank Transfer (IMPS / RTGS)</option>
                      <option value="Cheque">Cheque / Demand Draft</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Bank UTR / Transaction ID *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.utr}
                      onChange={(e) => setFormData({ ...formData, utr: e.target.value })}
                      placeholder="e.g. UTR / UPI Ref: 604118992144"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Donor PAN</label>
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
                    <label>Donor Email</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="csr@company.com"
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Designated Program / Activity</label>
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
                  Save Bank Transfer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 80G Receipt Modal with Embedded QR Code */}
      {modalMode === 'receipt' && selectedDonation && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Official 80G Donation Receipt: {selectedDonation.receiptNo}</h3>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Receipt No</span>
                    <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{selectedDonation.receiptNo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Date Received</span>
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
                    {selectedDonation.utr && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        Ref: {selectedDonation.utr}
                      </div>
                    )}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Program / Purpose</span>
                    <div>{selectedDonation.program || 'Community Development and Digital Literacy'}</div>
                  </div>
                </div>

                {/* Footer with Embedded QR Code and Signature */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <QRCodeVisual
                      value={`https://gsddfoundation.org/verify?type=donation&id=${selectedDonation.receiptNo}`}
                      size={64}
                      label="Scan to Verify 80G"
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', maxWidth: '240px' }}>
                      Scan QR code to verify this official 80G tax receipt on the foundation document portal.
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '130px', borderBottom: '1px solid #000', marginBottom: '4px' }} />
                    <strong style={{ fontSize: '11px' }}>Authorized Signatory</strong>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>GSDD Foundation</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={14} /> Download / Print PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
