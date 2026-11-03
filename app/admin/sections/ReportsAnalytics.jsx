'use client';

import { useState } from 'react';
import {
  TrendingUp, Download, Printer, BarChart3, PieChart, Users,
  DollarSign, Award, Calendar, CheckCircle2, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { initialMembers, initialDonations, initialCertificates } from './data/mock-admin-data';

export default function ReportsAnalytics({ notify }) {
  const [timeframe, setTimeframe] = useState('FY2025-26');

  const totalDonationAmount = initialDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalMembers = initialMembers.length;
  const totalCerts = initialCertificates.length;

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value', 'Timeframe'],
      ['Total Donations Raised (INR)', totalDonationAmount, timeframe],
      ['Total Registered Members', totalMembers, timeframe],
      ['Active Certificates Issued', totalCerts, timeframe],
      ['Digital Literacy Students Reached', '450+', timeframe],
      ['Free Health Checkup Beneficiaries', '1,200+', timeframe],
      ['Women Livelihood Participants', '180+', timeframe],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSDD_Foundation_Impact_Report_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify?.(`Report for ${timeframe} downloaded as CSV.`);
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Reports &amp; Analytics</h2>
          <p>Consolidated data on donations, community outreach reach, volunteer mobilization, and statutory metrics.</p>
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
            <Printer size={14} /> Print Summary
          </button>
          <button className="adm-btn adm-btn-primary" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalDonationAmount.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Total Donations ({timeframe})</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Users size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalMembers}</span>
            <span className="adm-stat-label">Active Foundation Members</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><Award size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalCerts}</span>
            <span className="adm-stat-label">Official Certificates Awarded</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><TrendingUp size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">1,830+</span>
            <span className="adm-stat-label">Direct Beneficiaries Reached</span>
          </div>
        </div>
      </div>

      {/* Program Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card 1: Focus Area Distribution */}
        <div className="adm-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Outreach by Focus Area
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Digital Literacy &amp; Computer Lab</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>38%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', background: '#2563eb', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Healthcare &amp; Preventative Camps</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>28%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '28%', height: '100%', background: '#059669', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Women Empowerment &amp; Sewing Center</span>
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>20%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '20%', height: '100%', background: '#7c3aed', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Community Welfare &amp; Awareness</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>14%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '14%', height: '100%', background: '#d97706', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Membership Breakdown */}
        <div className="adm-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Membership Demographics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Patrons &amp; Life</span>
              <strong style={{ fontSize: '20px', color: '#1e40af' }}>12</strong>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>₹1,32,000 corpus</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Annual Members</span>
              <strong style={{ fontSize: '20px', color: '#059669' }}>68</strong>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>85% renewed</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Active Volunteers</span>
              <strong style={{ fontSize: '20px', color: '#7c3aed' }}>54</strong>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Field ambassadors</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Fee Collection Rate</span>
              <strong style={{ fontSize: '20px', color: '#d97706' }}>92%</strong>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Highest compliance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
