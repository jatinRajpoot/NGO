'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cake, Send, Loader2, Search, CheckCircle2, X } from 'lucide-react';

export default function BirthdayWishesSection({ notify }) {
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'today'
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [wishModal, setWishModal] = useState(null); // member object
  const [wishMessage, setWishMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadBirthdays = useCallback(async (activeTab = tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/birthdays/?tab=${encodeURIComponent(activeTab)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setRecords(Array.isArray(json.birthdays) ? json.birthdays : []);
      }
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadBirthdays(tab);
  }, [tab, loadBirthdays]);

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.memberId.toLowerCase().includes(q)
    );
  });

  const handleOpenWish = (member) => {
    setWishModal(member);
    setWishMessage(
      `Warm Birthday Wishes to ${member.name} on behalf of Global Skills & Digital Development Foundation! Wishing you health, joy, and continued impact.`
    );
  };

  const handleSendWish = async (e) => {
    e.preventDefault();
    if (!wishModal || !wishMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/birthdays/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wishModal.id, message: wishMessage.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        notify?.(json?.error || 'Could not send wish.');
        return;
      }
      setRecords((prev) => prev.map((r) => (r.id === json.record.id ? { ...r, ...json.record } : r)));
      setWishModal(null);
      notify?.(`Birthday wish recorded and sent to ${wishModal.name}!`);
    } catch {
      notify?.('Network error sending birthday wish.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h1>Birthday Wishes</h1>
          <p>Celebrate foundation members with Today &amp; Upcoming Birthday greetings.</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming Birthdays
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'today' ? 'active' : ''}`}
          onClick={() => setTab('today')}
        >
          Today&apos;s Birthday
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar" style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 10, top: 11, color: '#64748b' }}
            />
            <input
              type="text"
              className="admin-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search member name, reg no, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
            <Cake size={30} style={{ marginBottom: 8, opacity: 0.6 }} />
            <p>
              {tab === 'today'
                ? 'No member birthdays fall on today.'
                : 'No upcoming birthdays in the next 45 days.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Reg No &amp; Designation</th>
                  <th>District</th>
                  <th>Birth Date</th>
                  <th>Countdown</th>
                  <th>Wish Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{m.email}</div>
                    </td>
                    <td>
                      <div>{m.memberId}</div>
                      <small style={{ color: '#64748b' }}>{m.designation}</small>
                    </td>
                    <td>{m.district}</td>
                    <td>{m.dob}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          m.daysUntil === 0 ? 'admin-badge-green' : 'admin-badge-blue'
                        }`}
                      >
                        {m.daysUntil === 0 ? 'Today!' : `In ${m.daysUntil} day(s)`}
                      </span>
                    </td>
                    <td>
                      {m.lastWishedAt ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: '#059669',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={14} /> Wished
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleOpenWish(m)}
                      >
                        <Send size={13} /> Send Wish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {wishModal && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !sending && setWishModal(null)}
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>Send Birthday Wish — {wishModal.name}</h2>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setWishModal(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSendWish} style={{ padding: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Greeting Message
              </label>
              <textarea
                rows={4}
                className="admin-textarea"
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                required
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => setWishModal(null)}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={sending}>
                  {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Send
                  Greeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
