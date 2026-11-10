'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
  Newspaper,
  Sparkles,
  X,
} from 'lucide-react';
import EmptyState from './EmptyState';
import './public-posts.css';

function normalizeAssetUrl(src) {
  const clean = String(src || '').trim();
  if (!clean) return '';
  if (clean.startsWith('/api/') && !clean.endsWith('/') && !clean.includes('?')) {
    return `${clean}/`;
  }
  return clean;
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

export default function PublicPostsFeed({
  initialPosts = [],
  defaultFilter = 'all',
  showFilterTabs = true,
  emptyEyebrow = 'Updates',
  emptyTitle = 'No posts published yet.',
  emptyDescription = 'Updates, field activities, and press releases shared by GSDD Foundation will appear here.',
}) {
  const [posts, setPosts] = useState(Array.isArray(initialPosts) ? initialPosts : []);
  const [filter, setFilter] = useState(defaultFilter);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [lightbox, setLightbox] = useState(null); // { title, images, index }

  const handleFilterChange = useCallback(async (nextFilter) => {
    setFilter(nextFilter);
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/posts/?filter=${encodeURIComponent(nextFilter)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error || 'Unable to load posts.');
        return;
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      setErrorMsg('Network error while refreshing posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  const visiblePosts = useMemo(() => {
    if (filter === 'press' || filter === 'activity') {
      return posts.filter((p) => p.type === filter);
    }
    return posts;
  }, [posts, filter]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openLightbox = (post, startIndex = 0) => {
    const imgs = (post.images || []).filter((img) => img && img.src);
    if (imgs.length === 0) return;
    setLightbox({
      title: post.title,
      images: imgs,
      index: Math.max(0, Math.min(startIndex, imgs.length - 1)),
    });
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index - 1 + prev.images.length) % prev.images.length,
              }
            : null
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <div className="posts-feed-root">
      {showFilterTabs && (
        <div className="posts-feed-controls">
          <div className="posts-filter-tabs" role="tablist" aria-label="Filter posts by category">
            {[
              { id: 'all', label: 'All Updates' },
              { id: 'activity', label: 'Activity Posts' },
              { id: 'press', label: 'Press & Media' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                className={`posts-filter-btn ${filter === tab.id ? 'is-active' : ''}`}
                onClick={() => handleFilterChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="posts-feed-count">
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" aria-hidden="true" /> Updating...
              </span>
            ) : (
              `${visiblePosts.length} ${visiblePosts.length === 1 ? 'post' : 'posts'}`
            )}
          </p>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {visiblePosts.length === 0 ? (
        <EmptyState
          eyebrow={emptyEyebrow}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Contact the foundation"
          actionHref="/contact"
        />
      ) : (
        <div className="posts-card-list">
          {visiblePosts.map((post) => {
            const imgs = Array.isArray(post.images) ? post.images.filter((i) => i?.src) : [];
            const hero = imgs[0];
            const isExpanded = expandedIds.has(post.id);
            const htmlContent = String(post.descriptionHtml || '');

            return (
              <article key={post.id} className="post-feed-card">
                {hero && (
                  <>
                    <div className="post-card-media">
                      <button
                        type="button"
                        className="post-card-hero-btn"
                        onClick={() => openLightbox(post, 0)}
                        aria-label={`View ${imgs.length} photo(s) for ${post.title}`}
                      >
                        <img
                          src={normalizeAssetUrl(hero.src)}
                          alt={hero.originalName || post.title}
                          loading="lazy"
                        />
                        {imgs.length > 1 && (
                          <span className="post-media-count-badge">
                            <Images size={13} aria-hidden="true" /> {imgs.length} Photos
                          </span>
                        )}
                      </button>
                    </div>
                    {imgs.length > 1 && (
                      <div className="post-card-thumbs" aria-label="Post thumbnails">
                        {imgs.slice(0, 5).map((img, idx) => (
                          <button
                            key={img.id || idx}
                            type="button"
                            className="post-thumb-btn"
                            onClick={() => openLightbox(post, idx)}
                            aria-label={`Open photo ${idx + 1} of ${post.title}`}
                          >
                            <img
                              src={normalizeAssetUrl(img.src)}
                              alt={`${post.title} thumbnail ${idx + 1}`}
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="post-card-body">
                  <div className="post-card-meta">
                    <span
                      className={`post-type-badge ${
                        post.type === 'press' ? 'is-press' : 'is-activity'
                      }`}
                    >
                      {post.type === 'press' ? (
                        <>
                          <Newspaper size={12} aria-hidden="true" /> Press &amp; Media
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} aria-hidden="true" /> Activity
                        </>
                      )}
                    </span>
                    <span className="post-card-date">
                      <Calendar size={12} aria-hidden="true" /> {formatDate(post.createdAt)}
                    </span>
                  </div>

                  <h2 className="post-card-title">{post.title}</h2>

                  <div
                    className="post-richtext"
                    style={
                      isExpanded
                        ? undefined
                        : {
                            maxHeight: 160,
                            overflow: 'hidden',
                            maskImage: 'linear-gradient(to bottom, #000 72%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent)',
                          }
                    }
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />

                  <div className="post-card-actions">
                    <button
                      type="button"
                      className="post-read-toggle"
                      onClick={() => toggleExpand(post.id)}
                    >
                      {isExpanded ? 'Show less' : 'Read full post'}
                    </button>
                    {imgs.length > 0 && (
                      <button
                        type="button"
                        className="post-read-toggle"
                        onClick={() => openLightbox(post, 0)}
                      >
                        <Images size={13} aria-hidden="true" /> View Gallery ({imgs.length})
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="post-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div className="post-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="post-lightbox-header">
              <h3 className="post-lightbox-title">{lightbox.title}</h3>
              <button
                type="button"
                className="post-lightbox-close"
                onClick={() => setLightbox(null)}
                aria-label="Close image viewer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="post-lightbox-stage">
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  className="post-lightbox-nav is-prev"
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      index: (prev.index - 1 + prev.images.length) % prev.images.length,
                    }))
                  }
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <img
                src={normalizeAssetUrl(lightbox.images[lightbox.index]?.src)}
                alt={
                  lightbox.images[lightbox.index]?.originalName ||
                  `${lightbox.title} photo ${lightbox.index + 1}`
                }
              />
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  className="post-lightbox-nav is-next"
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      index: (prev.index + 1) % prev.images.length,
                    }))
                  }
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <div className="post-lightbox-footer">
              <span>{lightbox.images[lightbox.index]?.originalName || 'Post Image'}</span>
              <span>
                {lightbox.index + 1} / {lightbox.images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
