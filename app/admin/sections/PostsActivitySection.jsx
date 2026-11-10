'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText, Plus, Eye, Edit2, Trash2, UploadCloud, X,
  Loader2, CheckSquare, ExternalLink, Image as ImageIcon, RefreshCw, AlertCircle
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

function stripHtmlPreview(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(iso);
  }
}

export default function PostsActivitySection({ notify }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'press' | 'activity'
  const [selectedIds, setSelectedIds] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postType, setPostType] = useState('activity');
  const [title, setTitle] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // { file, previewUrl }
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Gallery Viewer Modal
  const [galleryModal, setGalleryModal] = useState(null); // { title, images, loading }

  const selectAllRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadPosts = useCallback(async (activeFilter = filter) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/posts/?filter=${encodeURIComponent(activeFilter)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Unable to load posts.');
        return;
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setSelectedIds([]);
    } catch {
      setErrorMsg('Network error loading posts.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPosts(filter);
  }, [filter, loadPosts]);

  // Update indeterminate checkbox state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const allCount = posts.length;
    const selCount = selectedIds.length;
    selectAllRef.current.indeterminate = selCount > 0 && selCount < allCount;
  }, [posts.length, selectedIds.length]);

  // Cleanup preview object URLs
  const clearNewPreviews = (list) => {
    for (const item of list) {
      if (item.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl); } catch {}
      }
    }
  };

  const openCreateModal = () => {
    clearNewPreviews(newFiles);
    setEditingPostId(null);
    setPostType(filter === 'press' ? 'press' : 'activity');
    setTitle('');
    setDescriptionHtml('');
    setExistingImages([]);
    setDeletedImageIds([]);
    setNewFiles([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = async (id) => {
    setFormError('');
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}/`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.post) {
        notify?.(data?.error || 'Failed to load post for editing.');
        return;
      }
      clearNewPreviews(newFiles);
      setEditingPostId(data.post.id);
      setPostType(data.post.type);
      setTitle(data.post.title);
      setDescriptionHtml(data.post.descriptionHtml || '');
      setExistingImages(data.post.images || []);
      setDeletedImageIds([]);
      setNewFiles([]);
      setModalOpen(true);
    } catch {
      notify?.('Network error loading post.');
    }
  };

  const closeModal = () => {
    if (submitting) return;
    clearNewPreviews(newFiles);
    setNewFiles([]);
    setModalOpen(false);
  };

  const handleImagePick = (e) => {
    setFormError('');
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length === 0) return;

    const totalCurrent = existingImages.length + newFiles.length;
    if (totalCurrent + picked.length > MAX_IMAGES) {
      setFormError(`Maximum ${MAX_IMAGES} images allowed per post (currently ${totalCurrent} attached).`);
      return;
    }

    const accepted = [];
    for (const file of picked) {
      const mime = (file.type || '').toLowerCase();
      if (mime && !ALLOWED_MIME.has(mime)) {
        setFormError(`Unsupported format for "${file.name}". Only JPG, PNG, GIF, and WebP are allowed.`);
        return;
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        setFormError(`"${file.name}" exceeds the 2 MB maximum size limit.`);
        return;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setNewFiles((prev) => [...prev, ...accepted]);
  };

  const removeExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
    setDeletedImageIds((prev) => (prev.includes(imgId) ? prev : [...prev, imgId]));
  };

  const removeNewFile = (idx) => {
    setNewFiles((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) {
        try { URL.revokeObjectURL(target.previewUrl); } catch {}
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Post Title is required.');
      return;
    }
    if (!stripHtmlPreview(descriptionHtml)) {
      setFormError('Post Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('type', postType);
      formData.set('title', title.trim());
      formData.set('descriptionHtml', descriptionHtml);
      if (editingPostId) {
        formData.set('deletedImageIds', JSON.stringify(deletedImageIds));
      }
      for (const item of newFiles) {
        formData.append('images[]', item.file);
      }

      const url = editingPostId
        ? `/api/admin/posts/${encodeURIComponent(editingPostId)}/`
        : '/api/admin/posts/';
      const method = editingPostId ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data?.error || 'Failed to save post.');
        return;
      }

      notify?.(editingPostId ? 'Post updated successfully!' : 'New post published successfully!');
      clearNewPreviews(newFiles);
      setNewFiles([]);
      setModalOpen(false);
      await loadPosts(filter);
    } catch {
      setFormError('Network error saving post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGallery = async (post) => {
    setGalleryModal({ title: post.title, images: [], loading: true });
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(post.id)}/images/`, { cache: 'no-store' });
      const data = await res.json();
      setGalleryModal({
        title: data?.title || post.title,
        images: Array.isArray(data?.images) ? data.images : post.images || [],
        loading: false,
      });
    } catch {
      setGalleryModal({ title: post.title, images: post.images || [], loading: false });
    }
  };

  const handleDeleteSingle = async (post) => {
    if (!window.confirm(`Delete post "${post.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(post.id)}/`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify?.(data?.error || 'Failed to delete post.');
        return;
      }
      notify?.('Post deleted successfully.');
      await loadPosts(filter);
    } catch {
      notify?.('Network error deleting post.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected post(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/posts/bulk-delete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify?.(data?.error || 'Bulk delete failed.');
        return;
      }
      notify?.(`Deleted ${data.deletedCount} selected post(s).`);
      await loadPosts(filter);
    } catch {
      notify?.('Network error performing bulk delete.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map((p) => p.id));
    }
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Posts &amp; Updates (Activity &amp; Press/Media)</h2>
          <p>
            Create rich-formatted Press/Media and Activity posts with up to 5 featured images, multi-image gallery preview, and bulk management.
          </p>
        </div>
        <div className="adm-sec-actions">
          <a href="/activity-post/" target="_blank" rel="noreferrer" className="adm-btn adm-btn-outline">
            <ExternalLink size={14} /> Public Activity Feed
          </a>
          <button type="button" className="adm-btn adm-btn-outline" onClick={() => loadPosts(filter)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={openCreateModal}>
            <Plus size={15} /> Create Post
          </button>
        </div>
      </div>

      {/* Category Filter Tabs + Bulk Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="adm-tabs" style={{ borderBottom: 0 }}>
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'press', label: 'Press/Media Posts' },
            { id: 'activity', label: 'Activity Posts' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`adm-tab${filter === tab.id ? ' active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px' }}>
            <span className="adm-badge red">{selectedIds.length} selected</span>
            <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={13} /> Bulk Delete
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> <span>{errorMsg}</span>
        </div>
      )}

      {/* Posts Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all posts"
                    checked={posts.length > 0 && selectedIds.length === posts.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>#</th>
                <th>Post Type</th>
                <th>Title</th>
                <th>Description Preview</th>
                <th>Images</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No posts found for this category. Click &ldquo;Create Post&rdquo; to publish one.
                  </td>
                </tr>
              ) : (
                posts.map((post, index) => {
                  const imgs = post.images || [];
                  const previewText = stripHtmlPreview(post.descriptionHtml);
                  return (
                    <tr key={post.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select post ${post.title}`}
                          checked={selectedIds.includes(post.id)}
                          onChange={() => toggleRow(post.id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <span className={`adm-badge ${post.type === 'press' ? 'purple' : 'blue'}`}>
                          {post.type === 'press' ? 'Press/Media' : 'Activity'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <strong>{post.title}</strong>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <span style={{ fontSize: '12px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {previewText}
                        </span>
                      </td>
                      <td>
                        {imgs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenGallery(post)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            title="View attached images"
                          >
                            <img
                              src={imgs[0].src}
                              alt=""
                              style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af' }}>
                              {imgs.length} {imgs.length === 1 ? 'img' : 'imgs'}
                            </span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>No images</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(post.createdAt)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-sm adm-btn-outline"
                            onClick={() => handleOpenGallery(post)}
                            title="View Images"
                          >
                            <Eye size={13} /> View Images
                          </button>
                          <button
                            type="button"
                            className="adm-btn-icon"
                            onClick={() => openEditModal(post.id)}
                            title="Edit Post"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="adm-btn-icon adm-btn-danger"
                            onClick={() => handleDeleteSingle(post)}
                            title="Delete Post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Post Modal */}
      {modalOpen && (
        <div className="adm-modal-overlay" onClick={closeModal}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="adm-modal-header">
              <h3>{editingPostId ? 'Edit Post' : 'Create Post'}</h3>
              <button type="button" className="adm-btn-icon" onClick={closeModal} aria-label="Close modal">
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

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Post Type *</label>
                    <select
                      required
                      className="adm-form-control"
                      value={postType}
                      onChange={(e) => setPostType(e.target.value)}
                    >
                      <option value="activity">Activity Post</option>
                      <option value="press">Press/Media Post</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Post Title *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      className="adm-form-control"
                      placeholder="Enter clear post headline..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label>Rich Text Description *</label>
                  <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
                </div>

                {/* Multi-Image Upload & Unified Live Preview Grid */}
                <div className="adm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>
                      Featured Images (Max {MAX_IMAGES} images, 2 MB each • JPG, PNG, GIF, WebP)
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      {existingImages.length + newFiles.length} / {MAX_IMAGES} used
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline"
                      disabled={existingImages.length + newFiles.length >= MAX_IMAGES}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={15} /> Select Images
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                      style={{ display: 'none' }}
                      onChange={handleImagePick}
                    />
                  </div>

                  {(existingImages.length > 0 || newFiles.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginTop: '12px' }}>
                      {existingImages.map((img) => (
                        <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', aspectRatio: '1 / 1' }}>
                          <img src={img.src} alt={img.originalName || 'Existing'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            aria-label="Remove existing image"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#ffffff',
                              border: 0,
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {newFiles.map((item, idx) => (
                        <div key={`new-${idx}`} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #2563eb', aspectRatio: '1 / 1' }}>
                          <img src={item.previewUrl} alt={item.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            aria-label="Remove selected image"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 0,
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </>
                  ) : (
                    <span>{editingPostId ? 'Update Post' : 'Publish Post'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Image Gallery Viewer Modal */}
      {galleryModal && (
        <div className="adm-modal-overlay" onClick={() => setGalleryModal(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Attached Images: {galleryModal.title}</h3>
              <button type="button" className="adm-btn-icon" onClick={() => setGalleryModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              {galleryModal.loading ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading attached images...</p>
              ) : galleryModal.images.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>No images attached to this post.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                  {galleryModal.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', textDecoration: 'none' }}
                      title="Open full resolution in new tab"
                    >
                      <img src={img.src} alt={img.originalName || galleryModal.title} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 10px', fontSize: '11px', color: '#2563eb', fontWeight: 600, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Open full size</span>
                        <ExternalLink size={12} />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
