'use client';

import { useState } from 'react';
import {
  TrendingUp, Download, Printer, BarChart3, PieChart, Users,
  DollarSign, Award, Calendar, CheckCircle2, ShieldCheck, ArrowUpRight,
  Filter, Search, CreditCard, Banknote, FileSpreadsheet, Check
} from 'lucide-react';
import { initialMembers, initialDonations, initialCertificates, initialAppointments } from './data/mock-admin-data';

export default function ReportsAnalytics({ notify }) {
  const [activeReportTab, setActiveReportTab] = useState('summary'); // 'summary', 'members', 'donations', 'certificates', 'payments'
  const [timeframe, setTimeframe] = useState('FY2025-26');
  const [search, setSearch] = useState('');

  const totalDonationAmount = initialDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalMembers = initialMembers.length;
  const totalCerts = initialCertificates.length;
  const totalApts = initialAppointments.length;

  const handleExportCSV = (reportType = activeReportTab) => {
    let rows = [];
    let filename = `GSDD_Foundation_${reportType}_Report_${timeframe}.csv`;

    if (reportType === 'members') {
      rows.push(['Member ID', 'Name', 'Designation', 'Category', 'Fee Type', 'Fee Status', 'Status', 'Join Date']);
      initialMembers.forEach((m) => {
        rows.push([m.id, m.name, m.designation, m.category, m.feeType, m.feeStatus, m.status, m.joinDate]);
      });
    } else if (reportType === 'donations') {
      rows.push(['Receipt No', 'Donor Name', 'Amount (INR)', 'Payment Mode', 'PAN', '80G Status', 'Date']);
      initialDonations.forEach((d) => {
        rows.push([d.receiptNo, d.donorName, d.amount, d.mode, d.pan || 'N/A', d.tax80g, d.date]);
      });
    } else if (reportType === 'certificates') {
      rows.push(['Certificate No', 'Recipient Name', 'Category', 'Title', 'Purpose', 'Issued By', 'Issue Date']);
      initialCertificates.forEach((c) => {
        rows.push([c.certNo, c.recipientName, c.certificateType, c.title, c.purpose, c.issuedBy, c.issueDate]);
      });
    } else if (reportType === 'payments') {
      rows.push(['Transaction/Receipt', 'Source Name', 'Amount', 'Mode', 'Category', 'Status', 'Date']);
      initialDonations.forEach((d) => {
        rows.push([d.receiptNo, d.donorName, d.amount, d.mode, 'Donation', 'Verified', d.date]);
      });
      initialMembers.forEach((m) => {
        rows.push([m.id, m.name, m.feeAmount, 'Membership Fee', m.feeType, m.feeStatus, m.joinDate]);
      });
    } else {
      // Summary
      rows.push(['Metric', 'Value', 'Timeframe']);
      rows.push(['Total Donations Raised (INR)', `₹${totalDonationAmount.toLocaleString('en-IN')}`, timeframe]);
      rows.push(['Total Registered Members', totalMembers, timeframe]);
      rows.push(['Official Certificates Awarded', totalCerts, timeframe]);
      rows.push(['Appointments & Consultations', totalApts, timeframe]);
      rows.push(['Digital Literacy Beneficiaries', '450+ students', timeframe]);
      rows.push(['Rural Health Camp Reach', '1,200+ villagers', timeframe]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify?.(`Report "${filename}" exported successfully as CSV.`);
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Reports &amp; Records Management</h2>
          <p>
            Generate comprehensive statutory reports on new members, donations, certificates, and payment records with CSV export &amp; print capabilities.
          </p>
        </div>
        <div className="adm-sec-actions">
          <select
            className="adm-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="FY2025-26">Financial Year 2025-2026</option>
            <option value="Q4-2025-26">Q4 (Jan - Mar 2026)</option>
            <option value="Q3-2025-26">Q3 (Oct - Dec 2025)</option>
            <option value="All-Time">All-Time Cumulative</option>
          </select>
          <button className="adm-btn adm-btn-outline" onClick={() => window.print()}>
            <Printer size={14} /> Print Summary Report
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => handleExportCSV(activeReportTab)}>
            <Download size={14} /> Export {activeReportTab.toUpperCase()} CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalDonationAmount.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Donation Collections ({timeframe})</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Users size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalMembers}</span>
            <span className="adm-stat-label">Total Registered Members</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><Award size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalCerts}</span>
            <span className="adm-stat-label">Certificates Issued</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><CreditCard size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">92%</span>
            <span className="adm-stat-label">Fee Collection Rate</span>
          </div>
        </div>
      </div>

      {/* Report Categories Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeReportTab === 'summary' ? ' active' : ''}`}
          onClick={() => setActiveReportTab('summary')}
        >
          <BarChart3 size={13} /> Executive Summary
        </button>
        <button
          className={`adm-tab${activeReportTab === 'members' ? ' active' : ''}`}
          onClick={() => setActiveReportTab('members')}
        >
          <Users size={13} /> New Members Reports
        </button>
        <button
          className={`adm-tab${activeReportTab === 'donations' ? ' active' : ''}`}
          onClick={() => setActiveReportTab('donations')}
        >
          <DollarSign size={13} /> Donation Reports
        </button>
        <button
          className={`adm-tab${activeReportTab === 'certificates' ? ' active' : ''}`}
          onClick={() => setActiveReportTab('certificates')}
        >
          <Award size={13} /> Certificate Reports
        </button>
        <button
          className={`adm-tab${activeReportTab === 'payments' ? ' active' : ''}`}
          onClick={() => setActiveReportTab('payments')}
        >
          <CreditCard size={13} /> Payment &amp; Collections
        </button>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeReportTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="adm-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Focus Area Outreach Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Digital Literacy &amp; Computer Centers</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>38%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Healthcare &amp; Preventative Camps</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>28%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '28%', height: '100%', background: '#059669', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Women Livelihood &amp; Sewing Center</span>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>20%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '20%', height: '100%', background: '#7c3aed', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="adm-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Statutory Compliance &amp; 80G Filings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Section 80G Receipts</span>
                <strong style={{ fontSize: '20px', color: '#1e40af' }}>{initialDonations.filter((d) => d.tax80g === 'Issued').length} Issued</strong>
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>100% compliant</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Section 12A Status</span>
                <strong style={{ fontSize: '20px', color: '#059669' }}>Active</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>AANCG1860EE20261</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>NITI Aayog Darpan</span>
                <strong style={{ fontSize: '20px', color: '#7c3aed' }}>Verified</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>BR/2026/1140209</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Corporate CIN</span>
                <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>U88900BR2026NPL086114</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: New Members Reports */}
      {activeReportTab === 'members' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th>Membership Category</th>
                  <th>Fee Type &amp; Status</th>
                  <th>Membership Status</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {initialMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{m.id}</strong>
                    </td>
                    <td>{m.name}</td>
                    <td><span className="adm-badge blue">{m.designation}</span></td>
                    <td>{m.category}</td>
                    <td>
                      <span className={`adm-badge ${m.feeStatus === 'Paid' ? 'green' : 'amber'}`}>
                        {m.feeType.split(' ')[0]} - {m.feeStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge ${m.status === 'Active' ? 'green' : 'amber'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Donation Reports */}
      {activeReportTab === 'donations' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Donor Name</th>
                  <th>Amount (INR)</th>
                  <th>Payment Mode</th>
                  <th>Donor PAN</th>
                  <th>Program / Cause</th>
                  <th>80G Tax Receipt</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {initialDonations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{d.receiptNo}</strong>
                    </td>
                    <td>{d.donorName}</td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: '14px' }}>₹{d.amount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td><span className="adm-badge blue">{d.mode}</span></td>
                    <td><code>{d.pan || 'N/A'}</code></td>
                    <td>{d.program}</td>
                    <td><span className="adm-badge green">{d.tax80g}</span></td>
                    <td>{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Certificate Reports */}
      {activeReportTab === 'certificates' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Certificate No</th>
                  <th>Recipient Name</th>
                  <th>Category</th>
                  <th>Purpose / Citation</th>
                  <th>Authorized Signatory</th>
                  <th>Date Issued</th>
                  <th>QR Authenticated</th>
                </tr>
              </thead>
              <tbody>
                {initialCertificates.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{c.certNo}</strong>
                    </td>
                    <td>{c.recipientName}</td>
                    <td>
                      <span className={`adm-badge ${c.certificateType.includes('Visitor') ? 'purple' : 'green'}`}>
                        {c.certificateType}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>{c.purpose}</td>
                    <td>{c.issuedBy}</td>
                    <td>{c.issueDate}</td>
                    <td><span className="adm-badge green">Verified Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Payment Reports */}
      {activeReportTab === 'payments' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Reference / ID</th>
                  <th>Payer / Contributor</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Transaction Category</th>
                  <th>Credit Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {initialDonations.map((d) => (
                  <tr key={d.id}>
                    <td><code>{d.receiptNo}</code></td>
                    <td>{d.donorName}</td>
                    <td><strong style={{ color: '#059669' }}>₹{d.amount.toLocaleString('en-IN')}</strong></td>
                    <td><span className="adm-badge blue">{d.mode}</span></td>
                    <td>Donation Contribution</td>
                    <td><span className="adm-badge green">Credited &bull; Verified</span></td>
                    <td>{d.date}</td>
                  </tr>
                ))}
                {initialMembers.map((m) => (
                  <tr key={m.id}>
                    <td><code>{m.id}</code></td>
                    <td>{m.name}</td>
                    <td><strong style={{ color: '#1e40af' }}>₹{m.feeAmount.toLocaleString('en-IN')}</strong></td>
                    <td>UPI / Bank / Cash</td>
                    <td>Membership Fee ({m.feeType.split(' ')[0]})</td>
                    <td>
                      <span className={`adm-badge ${m.feeStatus === 'Paid' ? 'green' : 'amber'}`}>
                        {m.feeStatus}
                      </span>
                    </td>
                    <td>{m.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
