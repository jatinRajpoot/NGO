'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Calendar,
  X,
  Search,
  FileImage,
} from 'lucide-react';
import './gallery-manager.css';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB
const PAGE_SIZE = 24;
const FETCH_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 60000;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

/**
 * Best-effort read of `{ error: string }` from a JSON error response.
 * Returns null when the body is not JSON or has no error field, so callers
 * can fall back to status-based messaging. The response body is consumed.
 */
async function responseErrorCode(response) {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : null;
  } catch {
    return null;
  }
}

function requestError(response, action, errorCode) {
  if (
    errorCode === 'mismatched_content_type' ||
    errorCode === 'mismatched_extension' ||
    errorCode === 'invalid_image_format' ||
    errorCode === 'unsupported_image_format'
  ) {
    return 'The file could not be verified as a real JPEG, PNG, or WebP image. Try re-exporting or re-saving it, then upload again.';
  }
  if (response.status === 403 || errorCode === 'forbidden_origin') {
    return 'Request blocked. Please refresh the page and try again.';
  }
  if (response.status === 404 || errorCode === 'not_found') {
    return 'This photograph is no longer in the gallery. Please refresh the list.';
  }
  if (response.status === 503 || errorCode === 'storage_error') {
    return 'Gallery storage is unavailable. Please try again later.';
  }
  if (
    response.status === 413 ||
    errorCode === 'file_too_large' ||
    errorCode === 'payload_too_large'
  ) {
    return 'Choose an image smaller than 10 MiB.';
  }
  if (errorCode === 'missing_file') {
    return 'Please select an image file to upload.';
  }
  if (errorCode === 'empty_file') {
    return 'The selected image file is empty. Please choose a valid image.';
  }
  if (errorCode === 'invalid_alt' || errorCode === 'missing_alt') {
    return 'Please provide a valid description up to 300 characters.';
  }
  if (errorCode === 'invalid_date') {
    return 'Please enter a valid calendar date between 1900 and 2100 in YYYY-MM-DD format.';
  }
  if (errorCode === 'invalid_id') {
    return 'Invalid photograph identifier.';
  }
  if (response.status === 400) {
    return 'Check the image format, date, and description, then try again.';
  }
  if (response.status >= 500) {
    return 'Server error occurred. Please try again shortly.';
  }
  return `Unable to ${action}. Please try again.`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    return false;
  }

  if (year < 1900 || year > 2100) return false;
  return true;
}

function formatDisplayDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  try {
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dedupePhotos(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }
  return deduped;
}

/**
 * Client-side file validation inspecting size, extension, MIME, and magic signatures.
 */
async function validateImageFile(file) {
  if (!file) {
    return { ok: false, error: 'Please select an image file to upload.' };
  }

  if (!(file.size > 0)) {
    return { ok: false, error: 'The selected file is empty. Please choose a valid image.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Selected file exceeds 10 MiB limit (${formatFileSize(file.size)}). Please choose an image smaller than 10 MiB.`,
    };
  }

  const filename = typeof file.name === 'string' ? file.name.trim() : '';
  const extMatch = filename.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';

  if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png' && ext !== 'webp') {
    return {
      ok: false,
      error: 'Only JPEG, PNG, and WebP images (.jpg, .jpeg, .png, .webp) are supported.',
    };
  }

  const rawMime = typeof file.type === 'string' ? file.type.split(';')[0].trim().toLowerCase() : '';
  const mimeIsKnown = rawMime !== '' && rawMime !== 'application/octet-stream';

  if (mimeIsKnown) {
    if ((ext === 'jpg' || ext === 'jpeg') && rawMime !== 'image/jpeg' && rawMime !== 'image/jpg') {
      return {
        ok: false,
        error: 'The file extension (.jpg/.jpeg) does not match its declared image format.',
      };
    }
    if (ext === 'png' && rawMime !== 'image/png') {
      return {
        ok: false,
        error: 'The file extension (.png) does not match its declared image format.',
      };
    }
    if (ext === 'webp' && rawMime !== 'image/webp') {
      return {
        ok: false,
        error: 'The file extension (.webp) does not match its declared image format.',
      };
    }
  }

  // Magic signature verification using file slice
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
    const isWebp =
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    if (isJpeg) {
      if (ext !== 'jpg' && ext !== 'jpeg') {
        return {
          ok: false,
          error: 'File content is a JPEG image, but does not use a .jpg or .jpeg extension.',
        };
      }
      return { ok: true, canonicalMime: 'image/jpeg' };
    }

    if (isPng) {
      if (ext !== 'png') {
        return {
          ok: false,
          error: 'File content is a PNG image, but does not use a .png extension.',
        };
      }
      return { ok: true, canonicalMime: 'image/png' };
    }

    if (isWebp) {
      if (ext !== 'webp') {
        return {
          ok: false,
          error: 'File content is a WebP image, but does not use a .webp extension.',
        };
      }
      return { ok: true, canonicalMime: 'image/webp' };
    }

    return {
      ok: false,
      error: 'The file could not be verified as a real JPEG, PNG, or WebP image. Try re-exporting or re-saving it, then upload again.',
    };
  } catch {
    return { ok: false, error: 'The image could not be read. Please select it again or choose another file.' };
  }
}

export default function GalleryManager({ id = 'gallery', className = '' } = {}) {
  const [photos, setPhotos] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Form state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [date, setDate] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Deletion state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Pagination & Search
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Refs for race condition handling and memory safety
  const fileInputRef = useRef(null);
  const listVersionRef = useRef(0);
  const fileSelectionVersionRef = useRef(0);
  const uploadPreparationRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchAbortRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const deleteAbortRef = useRef(null);
  const previewUrlRef = useRef(null);
  const uploadErrorRef = useRef(null);
  const deleteErrorRef = useRef(null);

  // Keep previewUrlRef in sync
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // Track mount status and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (uploadAbortRef.current) uploadAbortRef.current.abort();
      if (deleteAbortRef.current) deleteAbortRef.current.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Focus error messages when they appear for accessibility
  useEffect(() => {
    if (uploadError && uploadErrorRef.current) {
      uploadErrorRef.current.focus();
    }
  }, [uploadError]);

  useEffect(() => {
    if (deleteError && deleteErrorRef.current) {
      deleteErrorRef.current.focus();
    }
  }, [deleteError]);

  const handleUnauthorized = useCallback(() => {
    window.location.href = '/admin/login/';
  }, []);

  const fetchPhotos = useCallback(async (isRefresh = false) => {
    // Abort any ongoing fetch request to avoid racing responses
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }

    const version = ++listVersionRef.current;
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    setFetchError(null);

    try {
      const response = await fetch('/api/admin/gallery/', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(requestError(response, 'load photographs', data?.error ?? null));
      }

      const fetchedPhotos = Array.isArray(data?.photos) ? data.photos : [];
      if (isMountedRef.current && version === listVersionRef.current) {
        setPhotos(dedupePhotos(fetchedPhotos));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      if (err.name === 'AbortError') {
        if (version === listVersionRef.current) {
          setFetchError('Request timed out while loading gallery photographs. Please retry.');
        }
      } else if (version === listVersionRef.current) {
        setFetchError(err.message || 'Unable to load gallery photos. Please check your connection.');
      }
    } finally {
      if (isMountedRef.current && version === listVersionRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    setDate(getTodayDateString());
    fetchPhotos(false);
  }, [fetchPhotos]);

  // Close any deletion confirmation whose photo left the list
  useEffect(() => {
    setConfirmDeleteId((current) => {
      if (current == null) return current;
      return photos.some((photo) => photo.id === current) ? current : null;
    });
  }, [photos]);

  async function handleFileSelection(selectedFile) {
    if (uploading) return;
    const selectionVersion = ++fileSelectionVersionRef.current;
    setUploadError(null);

    if (!selectedFile) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    const validation = await validateImageFile(selectedFile);
    if (!isMountedRef.current || selectionVersion !== fileSelectionVersionRef.current) return;
    if (!validation.ok) {
      setUploadError(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setFile(selectedFile);
    try {
      const url = URL.createObjectURL(selectedFile);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }

  function resetForm() {
    fileSelectionVersionRef.current += 1;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setDate(getTodayDateString());
    setAlt('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (uploading || deletingId || uploadPreparationRef.current) return;

    setUploadError(null);
    setSuccessMessage(null);

    if (!file) {
      setUploadError('Please select an image file to upload.');
      return;
    }

    uploadPreparationRef.current = true;
    let validation;
    try {
      validation = await validateImageFile(file);
    } finally {
      uploadPreparationRef.current = false;
    }
    if (!isMountedRef.current) return;
    if (!validation.ok) {
      setUploadError(validation.error);
      return;
    }

    const trimmedDate = date.trim();
    if (!isValidCalendarDate(trimmedDate)) {
      setUploadError('Please enter a valid calendar date between 1900 and 2100 in YYYY-MM-DD format.');
      return;
    }

    const trimmedAlt = alt.trim();
    if (!trimmedAlt) {
      setUploadError('Please provide alternative text (description) for the photograph.');
      return;
    }

    if (trimmedAlt.length > 300) {
      setUploadError('Alternative text cannot exceed 300 characters.');
      return;
    }

    if (CONTROL_CHARACTER_PATTERN.test(trimmedAlt)) {
      setUploadError('Alternative text cannot contain control characters.');
      return;
    }

    setUploading(true);

    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const formData = new FormData();
      // Ensure file carries canonical image MIME type to avoid browser octet-stream anomalies
      const normalizedFile =
        !file.type || file.type === 'application/octet-stream'
          ? new File([file], file.name, { type: validation.canonicalMime })
          : file;

      formData.set('file', normalizedFile);
      formData.set('date', trimmedDate);
      formData.set('alt', trimmedAlt);

      const response = await fetch('/api/admin/gallery/', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 201) {
        const data = await response.json();
        if (!isMountedRef.current) return;
        if (data?.photo) {
          listVersionRef.current += 1;
          setPhotos((prev) => dedupePhotos([data.photo, ...prev]));
          setSuccessMessage('Photograph uploaded successfully to the gallery.');
          resetForm();
        } else {
          throw new Error('Upload succeeded but server did not return photograph record.');
        }
      } else {
        const errorCode = await responseErrorCode(response);
        throw new Error(requestError(response, 'upload the photograph', errorCode));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      if (err.name === 'AbortError') {
        setUploadError('Upload timed out. Please check your connection and choose a smaller image.');
      } else {
        setUploadError(err.message || 'Network error occurred during upload. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  }

  async function handleDelete(id) {
    if (deletingId) return;

    setDeleteError(null);
    setDeletingId(id);

    if (deleteAbortRef.current) {
      deleteAbortRef.current.abort();
    }

    const controller = new AbortController();
    deleteAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch('/api/admin/gallery/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        listVersionRef.current += 1;
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setConfirmDeleteId(null);
        setSuccessMessage('Photograph removed successfully.');
      } else {
        const errorCode = await responseErrorCode(response);
        throw new Error(requestError(response, 'remove the photograph', errorCode));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      if (err.name === 'AbortError') {
        setDeleteError('Delete request timed out. Please retry.');
      } else {
        setDeleteError(err.message || 'Unable to delete photograph. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setDeletingId(null);
      }
    }
  }

  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return photos;
    const q = searchQuery.toLowerCase().trim();
    return photos.filter(
      (p) =>
        (p.alt && p.alt.toLowerCase().includes(q)) ||
        (p.date && p.date.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)),
    );
  }, [photos, searchQuery]);

  const visiblePhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  const hasMore = visiblePhotos.length < filteredPhotos.length;
  const isAnyActionPending = uploading || Boolean(deletingId) || refreshing || initialLoading;

  return (
    <section id={id} className={`admin-gallery-manager ${className}`.trim()} aria-label="Media gallery management">
      {/* Header */}
      <header className="admin-gallery-manager-header">
        <div className="admin-gallery-manager-title-group">
          <p className="admin-gallery-manager-eyebrow">ADMINISTRATION</p>
          <h2 className="admin-gallery-manager-title">Photo Gallery Management</h2>
          <p className="admin-gallery-manager-subtitle">
            Upload new community photographs, view the gallery collection, or manage existing images.
          </p>
        </div>

        <div className="admin-gallery-manager-header-actions">
          <span className="admin-gallery-manager-stat-pill" aria-label={`Total photographs: ${photos.length}`}>
            <ImageIcon size={15} aria-hidden="true" />
            <span>
              Total: <strong>{photos.length}</strong>
            </span>
          </span>

          <button
            type="button"
            className="admin-gallery-manager-btn admin-gallery-manager-btn-outline"
            onClick={() => fetchPhotos(true)}
            disabled={isAnyActionPending}
            aria-label="Refresh gallery photos"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'admin-gallery-spinner' : ''}
              aria-hidden="true"
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Global Alerts */}
      {fetchError && photos.length > 0 && (
        <div
          className="admin-gallery-manager-alert admin-gallery-manager-alert-error"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle size={18} aria-hidden="true" />
          <div className="admin-gallery-manager-alert-content">
            <strong>Fetch Alert: </strong>
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            className="admin-gallery-manager-alert-close"
            onClick={() => setFetchError(null)}
            aria-label="Dismiss fetch error alert"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="admin-gallery-manager-alert admin-gallery-manager-alert-success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          <div className="admin-gallery-manager-alert-content">
            <strong>Success: </strong>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className="admin-gallery-manager-alert-close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss success message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {deleteError && (
        <div
          ref={deleteErrorRef}
          tabIndex={-1}
          className="admin-gallery-manager-alert admin-gallery-manager-alert-error"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle size={18} aria-hidden="true" />
          <div className="admin-gallery-manager-alert-content">
            <strong>Deletion Error: </strong>
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            className="admin-gallery-manager-alert-close"
            onClick={() => setDeleteError(null)}
            aria-label="Dismiss deletion error message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Upload Section */}
      <section className="admin-gallery-upload-card" aria-labelledby="upload-section-title">
        <div className="admin-gallery-upload-header">
          <h2 id="upload-section-title" className="admin-gallery-upload-title">
            Upload Photograph
          </h2>
          <p className="admin-gallery-upload-desc">
            Add a new photograph to the foundation gallery. Supports JPEG, PNG, and WebP up to 10 MiB.
          </p>
        </div>

        {uploadError && (
          <div
            ref={uploadErrorRef}
            tabIndex={-1}
            className="admin-gallery-manager-alert admin-gallery-manager-alert-error admin-gallery-upload-alert"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle size={18} aria-hidden="true" />
            <div className="admin-gallery-manager-alert-content">
              <strong>Upload Error: </strong>
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              className="admin-gallery-manager-alert-close"
              onClick={() => setUploadError(null)}
              aria-label="Dismiss upload error"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        <form className="admin-gallery-upload-form" onSubmit={handleUpload} aria-busy={uploading}>
          {/* File Picker / Dropzone */}
          {!file ? (
            <div
              className={`admin-gallery-dropzone${isDragging ? ' is-dragging' : ''}${uploading ? ' is-disabled' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploading) fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (uploading) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={uploading ? -1 : 0}
              aria-label="Upload file area: click or drag and drop an image here"
              aria-disabled={uploading}
            >
              <span className="admin-gallery-dropzone-icon">
                <UploadCloud size={24} aria-hidden="true" />
              </span>
              <div className="admin-gallery-dropzone-text">
                <strong>Click to browse or drag and drop an image</strong>
                <span>JPEG, PNG, or WebP (max 10 MiB)</span>
              </div>
              <input
                ref={fileInputRef}
                id="admin-gallery-file-input"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="admin-gallery-file-input"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="admin-gallery-file-preview-strip">
              <div className="admin-gallery-file-thumbnail">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview of selected upload" />
                ) : (
                  <FileImage size={24} color="#64748b" />
                )}
              </div>
              <div className="admin-gallery-file-info">
                <div className="admin-gallery-file-name" title={file.name}>
                  {file.name}
                </div>
                <div className="admin-gallery-file-size">{formatFileSize(file.size)}</div>
              </div>
              <button
                type="button"
                className="admin-gallery-manager-btn admin-gallery-manager-btn-quiet"
                onClick={() => handleFileSelection(null)}
                disabled={uploading}
                aria-label="Remove selected image"
              >
                <X size={16} aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* Form Fields: Date & Alt */}
          <div className="admin-gallery-fields-row">
            <div className="admin-gallery-form-group">
              <label htmlFor="admin-gallery-date-input" className="admin-gallery-form-label">
                Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="admin-gallery-date-input"
                name="date"
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                required
                className="admin-gallery-input"
                value={date}
                disabled={uploading}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (uploadError) setUploadError(null);
                }}
              />
            </div>

            <div className="admin-gallery-form-group">
              <label htmlFor="admin-gallery-alt-input" className="admin-gallery-form-label">
                Alternative text (description) <span aria-hidden="true">*</span>
              </label>
              <input
                id="admin-gallery-alt-input"
                name="alt"
                type="text"
                maxLength={300}
                required
                className="admin-gallery-input"
                placeholder="e.g. Community members attending digital literacy session"
                value={alt}
                disabled={uploading}
                onChange={(e) => {
                  setAlt(e.target.value);
                  if (uploadError) setUploadError(null);
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="admin-gallery-form-actions">
            {file && (
              <button
                type="button"
                className="admin-gallery-manager-btn admin-gallery-manager-btn-quiet"
                onClick={resetForm}
                disabled={uploading}
              >
                Reset
              </button>
            )}

            <button
              type="submit"
              className="admin-gallery-manager-btn admin-gallery-manager-btn-primary"
              disabled={uploading || !file}
              aria-disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="admin-gallery-spinner" aria-hidden="true" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} aria-hidden="true" />
                  <span>Upload Photograph</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Gallery Photos Section */}
      <section className="admin-gallery-collection-section" aria-labelledby="collection-section-title">
        <h2 id="collection-section-title" className="sr-only">
          Gallery Photographs
        </h2>

        {/* Toolbar */}
        <div className="admin-gallery-toolbar">
          <div className="admin-gallery-search-wrap">
            <Search size={16} className="admin-gallery-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="admin-gallery-search-input"
              placeholder="Search photographs by description, date, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Filter gallery photographs by description, date, or ID"
            />
          </div>

          <div className="admin-gallery-count-label" role="status" aria-live="polite">
            Showing <strong>{visiblePhotos.length}</strong> of{' '}
            <strong>{filteredPhotos.length}</strong> photographs
            {searchQuery && ` (filtered from ${photos.length})`}
          </div>
        </div>

        {/* Initial Loading */}
        {initialLoading && (
          <div className="admin-gallery-loading-state" role="status" aria-live="polite">
            <Loader2 size={36} className="admin-gallery-spinner" aria-hidden="true" />
            <span>Loading gallery photographs...</span>
          </div>
        )}

        {/* Initial Load Error with Retry */}
        {!initialLoading && fetchError && photos.length === 0 && (
          <div
            className="admin-gallery-manager-alert admin-gallery-manager-alert-error admin-gallery-fetch-banner"
            role="alert"
            aria-live="assertive"
          >
            <div className="admin-gallery-fetch-banner-head">
              <AlertCircle size={20} aria-hidden="true" />
              <strong>Failed to load photographs</strong>
            </div>
            <p className="admin-gallery-fetch-banner-text">{fetchError}</p>
            <button
              type="button"
              className="admin-gallery-manager-btn admin-gallery-manager-btn-outline"
              onClick={() => fetchPhotos(false)}
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Retry loading gallery</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && !fetchError && photos.length === 0 && (
          <div className="admin-gallery-empty-state">
            <div className="admin-gallery-empty-icon">
              <ImageIcon size={28} aria-hidden="true" />
            </div>
            <h3 className="admin-gallery-empty-title">No photographs in gallery</h3>
            <p className="admin-gallery-empty-desc">
              There are currently no photographs uploaded or configured. Use the upload form above to add your first photo.
            </p>
          </div>
        )}

        {/* No Filter Results */}
        {!initialLoading && photos.length > 0 && filteredPhotos.length === 0 && (
          <div className="admin-gallery-empty-state">
            <div className="admin-gallery-empty-icon">
              <Search size={28} aria-hidden="true" />
            </div>
            <h3 className="admin-gallery-empty-title">No matching photographs</h3>
            <p className="admin-gallery-empty-desc">
              No photos matched your search query &ldquo;{searchQuery}&rdquo;. Try another search term.
            </p>
            <button
              type="button"
              className="admin-gallery-manager-btn admin-gallery-manager-btn-outline"
              onClick={() => setSearchQuery('')}
            >
              Clear search filter
            </button>
          </div>
        )}

        {/* Photo Grid */}
        {!initialLoading && visiblePhotos.length > 0 && (
          <div className="admin-gallery-manager-grid">
            {visiblePhotos.map((photo) => {
              const isUploaded = typeof photo.src === 'string' && photo.src.startsWith('/api/gallery/images/');
              const isConfirming = confirmDeleteId === photo.id;
              const isDeletingThis = deletingId === photo.id;
              const isDeleteDisabled = Boolean(deletingId) || uploading;

              return (
                <article className="admin-gallery-card" key={photo.id}>
                  <div className="admin-gallery-card-image-wrap">
                    <img
                      src={photo.src}
                      alt={photo.alt || 'Gallery photograph'}
                      loading="lazy"
                      className="admin-gallery-card-img"
                    />
                    <span className={`admin-gallery-card-source-tag${isUploaded ? ' is-uploaded' : ''}`}>
                      {isUploaded ? 'Uploaded' : 'Original'}
                    </span>
                  </div>

                  <div className="admin-gallery-card-body">
                    <div className="admin-gallery-card-meta">
                      <span className="admin-gallery-card-date">
                        <Calendar size={13} aria-hidden="true" />
                        <span>{formatDisplayDate(photo.date)}</span>
                      </span>
                    </div>

                    <p className="admin-gallery-card-alt" title={photo.alt}>
                      {photo.alt || '(No description provided)'}
                    </p>

                    {isConfirming ? (
                      <div
                        className="admin-gallery-card-confirm-box"
                        role="dialog"
                        aria-label="Confirm photograph deletion"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setConfirmDeleteId(null);
                          }
                        }}
                      >
                        <p className="admin-gallery-card-confirm-text">
                          Are you sure you want to remove this photograph?
                        </p>
                        <div className="admin-gallery-card-confirm-actions">
                          <button
                            type="button"
                            className="admin-gallery-card-confirm-btn admin-gallery-card-confirm-btn-yes"
                            onClick={() => handleDelete(photo.id)}
                            disabled={isDeleteDisabled}
                            aria-label={`Confirm delete photo ${photo.id}`}
                          >
                            {isDeletingThis ? (
                              <Loader2 size={13} className="admin-gallery-spinner" aria-hidden="true" />
                            ) : (
                              <Trash2 size={13} aria-hidden="true" />
                            )}
                            <span>{isDeletingThis ? 'Deleting...' : 'Delete'}</span>
                          </button>
                          <button
                            type="button"
                            className="admin-gallery-card-confirm-btn admin-gallery-card-confirm-btn-cancel"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleteDisabled}
                            aria-label={`Cancel deletion of photo ${photo.id}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-gallery-card-footer">
                        <span className="admin-gallery-card-id-text" title={`ID: ${photo.id}`}>
                          {photo.id}
                        </span>

                        <button
                          type="button"
                          className="admin-gallery-manager-btn admin-gallery-manager-btn-quiet admin-gallery-card-delete-btn"
                          onClick={() => setConfirmDeleteId(photo.id)}
                          disabled={isDeleteDisabled}
                          aria-label={`Delete photograph ${photo.id}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!initialLoading && hasMore && (
          <div className="admin-gallery-load-more-wrap">
            <button
              type="button"
              className="admin-gallery-manager-btn admin-gallery-manager-btn-outline"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              aria-label={`Load more photographs. Currently showing ${visiblePhotos.length} of ${filteredPhotos.length}`}
            >
              <span>Load more photographs</span>
            </button>
            <span className="admin-gallery-load-more-status">
              Showing {visiblePhotos.length} of {filteredPhotos.length} photographs
            </span>
          </div>
        )}

        {!initialLoading && !hasMore && filteredPhotos.length > PAGE_SIZE && (
          <div className="admin-gallery-load-more-wrap">
            <span className="admin-gallery-load-more-status">
              Showing all {filteredPhotos.length} photographs
            </span>
          </div>
        )}
      </section>
    </section>
  );
}
