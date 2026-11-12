'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Newspaper, Plus, Edit2, Trash2, UploadCloud, X, Loader2, ExternalLink, RefreshCw
} from 'lucide-react';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function NewsManagementSection({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'active' | 'draft'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [existingImage, setExistingImage] = useState(null);
  const [removeExistingImg, setRemoveExistingImg] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef(null);

  const loadNews = useCallback(async (activeType = typeFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/news/?type=${encodeURIComponent(activeType)}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(Array.isArray(data.news) ? data.news : []);
        setSelectedIds([]);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadNews(typeFilter);
  }, [typeFilter, loadNews]);

  const clearPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
  };

  const openCreate = () => {
    clearPreview();
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setStatus(typeFilter === 'draft' ? 'draft' : 'active');
    setExistingImage(null);
    setRemoveExistingImg(false);
    setNewImageFile(null);
    setPreviewUrl('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    clearPreview();
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setStatus(item.status || 'active');
    setExistingImage(item.image || null);
    setRemoveExistingImg(false);
    setNewImageFile(null);
    setPreviewUrl(item.image?.src || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    setFormError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setFormError('Image must be 2 MB or smaller.');
      return;
    }
    clearPreview();
    setNewImageFile(file);
    setRemoveExistingImg(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    clearPreview();
    setNewImageFile(null);
    setPreviewUrl('');
    setRemoveExistingImg(true);
    setExistingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingItem) fd.set('id', editingItem.id);
      fd.set('title', title.trim());
      fd.set('description', description.trim());
      fd.set('status', status);
      if (removeExistingImg) fd.set('removeImage', 'true');
      if (newImageFile) fd.set('image', newImageFile);

      const res = await fetch('/api/admin/news/', {
        method: editingItem ? 'PATCH' : 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data?.error || 'Could not save news article.');
        return;
      }

      notify?.(editingItem ? 'News article updated.' : 'News article created.');
      clearPreview();
      setModalOpen(false);
      await loadNews(typeFilter);
    } catch {
      setFormError('Network error saving news.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'draft' : 'active';
    const res = await fetch('/api/admin/news/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      notify?.(`News moved to ${nextStatus === 'active' ? 'Published' : 'Draft'}.`);
      await loadNews(typeFilter);
    }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} news article(s)?`)) return;
    const res = await fetch('/api/admin/news/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      notify?.(`Deleted ${data.deletedCount} news article(s).`);
      await loadNews(typeFilter);
    }
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>News Management</h2>
          <p>Publish official foundation news updates or save drafts for review. Published articles appear live on the public News page.</p>
        </div>
        <div className="adm-sec-actions">
          <a href="/news/" target="_blank" rel="noreferrer" className="adm-btn adm-btn-outline">
            <ExternalLink size={14} /> Public News Page
          </a>
          <button type="button" className="adm-btn adm-btn-outline" onClick={() => loadNews(typeFilter)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={openCreate}>
            <Plus size={15} /> Create News
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="adm-tabs" style={{ borderBottom: 0 }}>
          {[
            { id: 'all', label: 'All News' },
            { id: 'active', label: 'Published (Active)' },
            { id: 'draft', label: 'Draft News' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`adm-tab${typeFilter === t.id ? ' active' : ''}`}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleDelete(selectedIds)}>
            <Trash2 size={13} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={() =>
                      setSelectedIds(selectedIds.length === items.length ? [] : items.map((i) => i.id))
                    }
                  />
                </th>
                <th>Image</th>
                <th>Headline &amp; Summary</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>Loading news...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No news articles in this view.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                          )
                        }
                      />
                    </td>
                    <td>
                      {item.image?.src ? (
                        <img src={item.image.src} alt="" style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No image</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '420px' }}>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`adm-badge ${item.status === 'active' ? 'green' : 'amber'}`}
                        style={{ border: 0, cursor: 'pointer' }}
                        title="Click to toggle Published/Draft"
                      >
                        {item.status === 'active' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button type="button" className="adm-btn-icon" onClick={() => openEdit(item)} title="Edit News">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" className="adm-btn-icon adm-btn-danger" onClick={() => handleDelete([item.id])} title="Delete News">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="adm-modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{editingItem ? 'Edit News Article' : 'Create News Article'}</h3>
              <button type="button" className="adm-btn-icon" onClick={() => !submitting && setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="adm-modal-body" style={{ display: 'grid', gap: '16px' }}>
                {formError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                <div className="adm-form-group">
                  <label>News Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="adm-form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Status *</label>
                  <select className="adm-form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active (Publish on Website)</option>
                    <option value="draft">Draft (Save Privately)</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    className="adm-form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Featured Single Image (Optional, max 2 MB)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="adm-btn adm-btn-outline" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={15} /> {previewUrl ? 'Replace Image' : 'Upload Image'}
                    </button>
                    {previewUrl && (
                      <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={handleRemoveImage}>
                        <X size={13} /> Remove Image
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                  {previewUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={previewUrl} alt="Preview" style={{ maxWidth: '240px', maxHeight: '160px', borderRadius: '8px', border: '1px solid #cbd5e1', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save News'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
