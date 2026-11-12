'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  HandHeart,
  Megaphone,
  Calendar,
  HeartHandshake,
  GraduationCap,
  Wallet,
  CreditCard,
  UserCheck,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import './admin-system.css';

function formatRs(val) {
  return `Rs. ${Number(val || 0).toLocaleString('en-IN')}`;
}

export default function AdminOverviewSection({ onNavigate, notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/overview/', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorMsg(json?.error || 'Unable to load overview analytics.');
        return;
      }
      setData(json.overview);
    } catch {
      setErrorMsg('Network error loading overview metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: 48, textAlign: 'center' }}>
        <Loader2 size={28} className="spin" aria-hidden="true" />
        <p style={{ marginTop: 12, color: '#64748b' }}>Loading foundation KPIs and analytics...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="admin-card" style={{ padding: 24, borderColor: '#fecaca' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', margin: 0 }}>
          <AlertCircle size={18} /> {errorMsg || 'Overview unavailable.'}
        </p>
        <button
          type="button"
          className="admin-btn-primary"
          style={{ marginTop: 14 }}
          onClick={loadOverview}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { kpis, monthlyDonations, paymentBreakdown, quickStats, recentMembers, recentActivity } = data;

  const kpiCards = [
    {
      label: 'Total Members',
      value: kpis.totalMembers.count,
      sub: `${kpis.totalMembers.monthlyGrowth} monthly growth`,
      icon: Users,
      target: 'membership',
    },
    {
      label: 'Total Donations',
      value: formatRs(kpis.totalDonations.amount),
      sub: `Monthly total: ${formatRs(kpis.totalDonations.monthlyTotal)}`,
      icon: HandHeart,
      target: 'donations',
    },
    {
      label: 'Active Campaigns',
      value: kpis.activeCampaigns.count,
      sub: `Total raised: ${formatRs(kpis.activeCampaigns.totalRaised)}`,
      icon: Megaphone,
      target: 'donations',
    },
    {
      label: 'Upcoming Events',
      value: kpis.upcomingEvents.count,
      sub: 'Community workshops & drives',
      icon: Calendar,
      target: 'website',
    },
    {
      label: 'Beneficiaries',
      value: kpis.beneficiaries.count,
      sub: `${kpis.beneficiaries.activeCount} active assisted`,
      icon: HeartHandshake,
      target: 'reports',
    },
    {
      label: 'Active Interns',
      value: kpis.activeInterns.count,
      sub: `${kpis.activeInterns.certificatesIssued} certificates issued`,
      icon: GraduationCap,
      target: 'certificates',
    },
    {
      label: 'Total Membership Fee',
      value: formatRs(kpis.totalMembershipFee.amount),
      sub: 'Cumulative verified fees',
      icon: CreditCard,
      target: 'membership',
    },
    {
      label: 'Total Member Donation',
      value: formatRs(kpis.totalMemberDonation.amount),
      sub: `${kpis.totalMemberDonation.count} member contributions`,
      icon: UserCheck,
      target: 'donations',
    },
    {
      label: 'Total Visitor Donation',
      value: formatRs(kpis.totalVisitorDonation.amount),
      sub: `${kpis.totalVisitorDonation.count} public visitor gifts`,
      icon: Wallet,
      target: 'donations',
    },
    {
      label: 'Total Crowdfunding Donation',
      value: formatRs(kpis.totalCrowdfundingDonation.amount),
      sub: 'Direct cause fundraising',
      icon: TrendingUp,
      target: 'reports',
    },
  ];

  const maxMonthlyTotal = Math.max(
    1,
    ...monthlyDonations.map((m) => Number(m.total || m.online + m.cash || 0))
  );
  const expensePct = Math.min(
    100,
    Math.round((quickStats.expenseThisMonth / Math.max(1, quickStats.monthlyBudget)) * 100)
  );

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h1>Admin Dashboard Overview</h1>
          <p>
            Real-time snapshot of memberships, donations (Jun–Nov), quick operations stats, and
            live foundation activity.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => {
              loadOverview();
              notify?.('Overview metrics refreshed.');
            }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>
      </div>

      {/* 10 KPI Summary Cards */}
      <div className="overview-kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="overview-kpi-card">
              <div className="overview-kpi-top">
                <span className="overview-kpi-label">{card.label}</span>
                <span className="overview-kpi-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
              </div>
              <div className="overview-kpi-value">{card.value}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span className="overview-kpi-sub">{card.sub}</span>
                {card.target && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(card.target)}
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: '#2563eb',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    Open <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Quick Stats Row */}
      <div className="overview-analytics-grid">
        {/* Monthly Donations Chart (Jun-Nov) */}
        <div className="overview-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <h2 className="overview-panel-title" style={{ margin: 0 }}>
              Monthly Donations (Jun–Nov)
            </h2>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ width: 10, height: 10, borderRadius: 3, background: '#2563eb' }}
                />
                Online
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }}
                />
                Cash / UPI
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 600 220"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label="Monthly donations chart from June to November"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = 180 - ratio * 150;
              return (
                <g key={ratio}>
                  <line x1="40" y1={y} x2="585" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x="4" y={y + 4} fontSize="10" fill="#64748b">
                    {Math.round((maxMonthlyTotal * ratio) / 1000)}k
                  </text>
                </g>
              );
            })}
            {monthlyDonations.map((row, idx) => {
              const groupX = 62 + idx * 88;
              const onlineH = Math.max(4, Math.round((row.online / maxMonthlyTotal) * 145));
              const cashH = Math.max(4, Math.round((row.cash / maxMonthlyTotal) * 145));
              return (
                <g key={row.month}>
                  <rect
                    x={groupX}
                    y={180 - onlineH}
                    width="24"
                    height={onlineH}
                    rx="4"
                    fill="#2563eb"
                  >
                    <title>{`${row.month} Online: ${formatRs(row.online)}`}</title>
                  </rect>
                  <rect
                    x={groupX + 28}
                    y={180 - cashH}
                    width="24"
                    height={cashH}
                    rx="4"
                    fill="#f59e0b"
                  >
                    <title>{`${row.month} Cash/UPI: ${formatRs(row.cash)}`}</title>
                  </rect>
                  <text
                    x={groupX + 26}
                    y="198"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {row.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Online vs Cash + Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="overview-panel">
            <h2 className="overview-panel-title">Online vs Cash Donations</h2>
            <div
              style={{
                display: 'flex',
                height: 16,
                borderRadius: 999,
                overflow: 'hidden',
                background: '#e2e8f0',
                marginBottom: 12,
              }}
            >
              <div
                style={{ width: `${paymentBreakdown.onlinePercent}%`, background: '#2563eb' }}
                title={`Online: ${paymentBreakdown.onlinePercent}%`}
              />
              <div
                style={{ width: `${paymentBreakdown.cashPercent}%`, background: '#f59e0b' }}
                title={`Cash: ${paymentBreakdown.cashPercent}%`}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>
                <strong style={{ color: '#2563eb' }}>{paymentBreakdown.onlinePercent}% Online</strong>{' '}
                ({formatRs(paymentBreakdown.onlineAmount)})
              </span>
              <span>
                <strong style={{ color: '#d97706' }}>{paymentBreakdown.cashPercent}% Cash</strong> (
                {formatRs(paymentBreakdown.cashAmount)})
              </span>
            </div>
          </div>

          <div className="overview-panel">
            <h2 className="overview-panel-title">Quick Stats</h2>
            <div className="overview-quick-stat-row">
              <span>Active Members (Last 30 days)</span>
              <strong>{quickStats.activeMembersLast30Days}</strong>
            </div>
            <div className="overview-quick-stat-row">
              <span>Approved IDs vs Pending</span>
              <strong>
                {quickStats.approvedIds} Approved / {quickStats.pendingIds} Pending
              </strong>
            </div>
            <div className="overview-quick-stat-row">
              <span>Expense This Month vs Budget ({expensePct}%)</span>
              <strong>
                {formatRs(quickStats.expenseThisMonth)} / {formatRs(quickStats.monthlyBudget)}
              </strong>
            </div>
            <div className="overview-quick-stat-row">
              <span>Active / Completed Projects</span>
              <strong>
                {quickStats.activeProjects} Active / {quickStats.completedProjects} Completed
              </strong>
            </div>
            <div className="overview-quick-stat-row">
              <span>Pending Actions (Enquiries &amp; Complaints)</span>
              <strong style={{ color: '#dc2626' }}>
                {quickStats.pendingEnquiries} Enquiries • {quickStats.pendingComplaints} Complaints
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feeds Row */}
      <div className="overview-feeds-grid">
        <div className="overview-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h2 className="overview-panel-title" style={{ margin: 0 }}>
              Recent Members
            </h2>
            {onNavigate && (
              <button
                type="button"
                className="admin-btn-ghost"
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => onNavigate('membership')}
              >
                Manage All
              </button>
            )}
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.name}</strong>
                    </td>
                    <td>{m.district}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          m.status === 'Active' ? 'admin-badge-green' : 'admin-badge-amber'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        style={{ padding: '4px 9px', fontSize: 12 }}
                        onClick={() => onNavigate?.('membership')}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overview-panel">
          <h2 className="overview-panel-title">Recent Activity Feed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background:
                      act.kind === 'donation'
                        ? '#dcfce7'
                        : act.kind === 'member'
                        ? '#dbeafe'
                        : '#fef3c7',
                    color:
                      act.kind === 'donation'
                        ? '#15803d'
                        : act.kind === 'member'
                        ? '#1d4ed8'
                        : '#b45309',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={15} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{act.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{act.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
