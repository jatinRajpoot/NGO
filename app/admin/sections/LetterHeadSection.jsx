'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Loader2,
  X,
  ScrollText,
} from 'lucide-react';
import './admin-system.css';

export default function LetterHeadSection({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    refNo: '',
    recipientName: '',
    date: new Date().toISOString().slice(0, 10),
    email: '',
    subject: '',
    address: '',
    description: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/letterheads/', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setItems(Array.isArray(json.letterheads) ? json.letterheads : []);
        setSelectedIds([]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      refNo: '',
      recipientName: '',
      date: new Date().toISOString().slice(0, 10),
      email: '',
      subject: '',
      address: '',
      description: '',
    });
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      refNo: item.refNo || '',
      recipientName: item.recipientName || '',
      date: item.date || '',
      email: item.email || '',
      subject: item.subject || '',
      address: item.address || '',
      description: item.description || '',
    });
    setEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const payload = editingId ? { id: editingId, ...form } : form;
      const res = await fetch('/api/admin/letterheads/', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        notify?.(json?.error || 'Unable to save letterhead.');
        return;
      }
      setEditorOpen(false);
      await loadList();
      notify?.(editingId ? 'Letterhead updated.' : 'Official letterhead created.');
    } catch {
      notify?.('Network error saving letterhead.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ids) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} letterhead record(s)?`)) return;
    try {
      const res = await fetch('/api/admin/letterheads/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        await loadList();
        notify?.(`Deleted ${json.deletedCount} letterhead(s).`);
      } else {
        notify?.(json?.error || 'Could not delete letterhead.');
      }
    } catch {
      notify?.('Network error deleting letterhead.');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      <div className="admin-section-header no-print">
        <div>
          <h1>Official NGO Letter Head</h1>
          <p>Draft, manage, view, and print formal foundation communication on official letterhead.</p>
        </div>
        <div className="admin-header-actions">
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="admin-btn-danger"
              onClick={() => handleDelete(selectedIds)}
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button type="button" className="admin-btn-primary" onClick={openNew}>
            <Plus size={15} /> Create Letter Head
          </button>
        </div>
      </div>

      <div className="admin-card no-print">
        {loading ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
            <ScrollText size={30} style={{ opacity: 0.6, marginBottom: 8 }} />
            <p>No letterheads drafted yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all letterheads"
                      checked={items.length > 0 && selectedIds.length === items.length}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? items.map((i) => i.id) : [])
                      }
                    />
                  </th>
                  <th>Ref No</th>
                  <th>Recipient Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td>
                      <strong>{item.refNo}</strong>
                    </td>
                    <td>
                      <div>{item.recipientName}</div>
                      {item.email && <small style={{ color: '#64748b' }}>{item.email}</small>}
                    </td>
                    <td style={{ maxWidth: 280 }}>{item.subject}</td>
                    <td>{item.date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn-ghost"
                          style={{ padding: '5px 8px' }}
                          title="View & Print Letter Head"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost"
                          style={{ padding: '5px 8px' }}
                          title="Edit"
                          onClick={() => openEdit(item)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost"
                          style={{ padding: '5px 8px', color: '#dc2626' }}
                          title="Delete"
                          onClick={() => handleDelete([item.id])}
                        >
                          <Trash2 size={14} />
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

      {/* Create / Edit Modal */}
      {editorOpen && (
        <div
          className="admin-modal-backdrop no-print"
          role="dialog"
          aria-modal="true"
          onClick={() => !saving && setEditorOpen(false)}
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>{editingId ? 'Edit Official Letter Head' : 'Create Official Letter Head'}</h2>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setEditorOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Recipient Name *
                  </label>
                  <input
                    required
                    className="admin-input"
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    className="admin-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    className="admin-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Reference No (Optional)
                  </label>
                  <input
                    className="admin-input"
                    placeholder="Auto-generated if blank"
                    value={form.refNo}
                    onChange={(e) => setForm({ ...form, refNo: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Subject *
                </label>
                <input
                  required
                  className="admin-input"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Recipient Address
                </label>
                <input
                  className="admin-input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Letter Body / Description *
                </label>
                <textarea
                  required
                  rows={6}
                  className="admin-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={14} className="spin" /> : null} Save Letter Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Preview Modal */}
      {previewItem && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="admin-modal-card"
            style={{ maxWidth: 840, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header no-print">
              <h2>Print Preview — {previewItem.refNo}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => window.print()}
                >
                  <Printer size={14} /> Print Letter Head
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setPreviewItem(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div className="letterhead-paper">
                <div className="letterhead-banner">
                  <div>
                    <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: 20 }}>
                      GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION
                    </h2>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#475569' }}>
                      Section 8 Non-Profit Company • CIN: U88900BR2026NPL086114
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                      Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, Araria, Bihar - 854334
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div>
                      <strong>Ref:</strong> {previewItem.refNo}
                    </div>
                    <div>
                      <strong>Date:</strong> {previewItem.date}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 18, fontSize: 13 }}>
                  <div>
                    <strong>To:</strong> {previewItem.recipientName}
                  </div>
                  {previewItem.address && <div>{previewItem.address}</div>}
                  {previewItem.email && <div>Email: {previewItem.email}</div>}
                </div>

                <div
                  style={{
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderLeft: '3px solid #1e3a8a',
                    fontSize: 14,
                  }}
                >
                  <strong>Subject:</strong> {previewItem.subject}
                </div>

                <div
                  style={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.75,
                    fontSize: 13.5,
                    minHeight: 180,
                  }}
                >
                  {previewItem.description}
                </div>

                <div
                  style={{
                    marginTop: 36,
                    paddingTop: 14,
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#64748b',
                  }}
                >
                  <span>foundationgsdd@gmail.com • +91 95467 52915</span>
                  <strong>Authorized Signatory — GSDD Foundation</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
