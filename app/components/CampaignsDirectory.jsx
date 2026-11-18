'use client';

import { useMemo, useState } from 'react';
import { HeartHandshake, Target, Users, Calendar } from 'lucide-react';
import OnlineDonationModal from './OnlineDonationModal';
import './public-finance.css';

export default function CampaignsDirectory({ initialCampaigns = [] }) {
  const campaigns = initialCampaigns;
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(campaigns.map((c) => c.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [campaigns]);

  const visible = useMemo(() => {
    return campaigns.filter((c) => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      return true;
    });
  }, [campaigns, categoryFilter, statusFilter]);

  return (
    <div>
      <div className="posts-feed-controls">
        <div className="posts-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`posts-filter-btn ${categoryFilter === cat ? 'is-active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter campaigns by status"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Causes</option>
          <option value="Completed">Completed Causes</option>
        </select>
      </div>

      <div className="posts-card-list">
        {visible.map((c) => {
          const pct = Math.min(100, Math.round((Number(c.raisedAmount || 0) / Math.max(1, Number(c.goalAmount || 1))) * 100));
          return (
            <article key={c.id} className="post-feed-card">
              <div className="post-card-body">
                <div className="post-card-meta">
                  <span className="post-type-badge is-activity">{c.category}</span>
                  <span
                    className={`post-type-badge ${c.status === 'Completed' ? 'is-news' : 'is-press'}`}
                  >
                    {c.status}
                  </span>
                </div>

                <h2 className="post-card-title">{c.title}</h2>
                <p className="post-richtext">{c.description}</p>

                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: '#059669' }}>
                      Raised: Rs. {Number(c.raisedAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: '#475569' }}>
                      Goal: Rs. {Number(c.goalAmount || 0).toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: '#e2e8f0',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: c.status === 'Completed' ? '#059669' : '#2563eb',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    fontSize: 12,
                    color: '#64748b',
                    marginTop: 8,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} /> {c.donorsCount} Donors
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> Ends {c.endDate}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Target size={13} /> {pct}% Funded
                  </span>
                </div>

                {c.status === 'Active' && (
                  <form className="post-card-actions" onSubmit={event => {
                    event.preventDefault();
                    const amount = Number(new FormData(event.currentTarget).get('amount'));
                    setSelectedCampaign({ id: c.id, amount, title: c.title });
                  }}>
                    <label>
                      Amount (₹)
                      <input name="amount" type="number" min={100} max={10000000} defaultValue={1000} required />
                    </label>
                    <button type="submit" className="button button-blue">
                      <HeartHandshake size={16} /> Donate to This Cause
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {selectedCampaign && (
        <OnlineDonationModal
          amount={selectedCampaign.amount}
          frequency="One-time"
          purpose={selectedCampaign.title}
          campaignId={selectedCampaign.id}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}
