'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff, Loader2, X } from 'lucide-react';

export default function PhotoGallery({ dates = [], initialPage = 1, pageSize = 24 }) {
  const allPhotos = useMemo(() => {
    if (!Array.isArray(dates)) return [];
    return dates.flatMap(({ dateKey, dateLabel, photos: datePhotos }) =>
      Array.isArray(datePhotos)
        ? datePhotos.map((photo, photoIndex) => ({
            ...photo,
            dateKey: dateKey || 'undated',
            dateLabel: dateLabel || 'Other moments',
            photoIndex,
          }))
        : []
    );
  }, [dates]);

  const totalPhotos = allPhotos.length;
  const totalPages = Math.max(1, Math.ceil(totalPhotos / pageSize));

  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(Math.max(1, initialPage), totalPages)
  );
  const [showAll, setShowAll] = useState(false);
  const [pageAnnouncement, setPageAnnouncement] = useState('');
  const [failedImages, setFailedImages] = useState(() => new Set());

  const photoIndexBySource = useMemo(() => {
    const map = new Map();
    allPhotos.forEach((photo, index) => {
      if (photo?.src) map.set(photo.src, index);
    });
    return map;
  }, [allPhotos]);

  const dateCounts = useMemo(() => {
    const map = new Map();
    for (const group of dates) {
      if (group && group.dateKey) {
        map.set(group.dateKey, Array.isArray(group.photos) ? group.photos.length : 0);
      }
    }
    return map;
  }, [dates]);

  // Synchronize initialPage if changed from parent
  useEffect(() => {
    if (Number.isInteger(initialPage) && initialPage >= 1) {
      setCurrentPage(Math.min(initialPage, totalPages));
    }
  }, [initialPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const displayedPhotos = useMemo(() => {
    if (showAll || pageSize <= 0) return allPhotos;
    return allPhotos.slice(startIndex, endIndex);
  }, [allPhotos, showAll, pageSize, startIndex, endIndex]);

  const visibleDateGroups = useMemo(() => {
    if (showAll || pageSize <= 0) return dates;
    const groups = [];
    const map = new Map();
    for (const photo of displayedPhotos) {
      if (!map.has(photo.dateKey)) {
        const group = {
          dateKey: photo.dateKey,
          dateLabel: photo.dateLabel,
          photos: [],
        };
        map.set(photo.dateKey, group);
        groups.push(group);
      }
      map.get(photo.dateKey).photos.push(photo);
    }
    return groups;
  }, [dates, displayedPhotos, showAll, pageSize]);

  // Lightbox State
  const [activeIndex, setActiveIndex] = useState(null);
  const [isLightboxLoading, setIsLightboxLoading] = useState(false);
  const [lightboxError, setLightboxError] = useState(false);

  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < allPhotos.length;
  const activePhoto = isOpen ? allPhotos[activeIndex] : null;

  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const photoButtonRefs = useRef(new Map());
  const lightboxDialogRef = useRef(null);
  const galleryTopRef = useRef(null);
  const titleId = useId();
  const captionId = useId();

  const markImageFailed = useCallback((src) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const openViewer = useCallback((src, triggerElement) => {
    openerRef.current = triggerElement;
    const index = photoIndexBySource.get(src);
    if (index !== undefined) {
      setActiveIndex(index);
      setIsLightboxLoading(true);
      setLightboxError(false);
    }
  }, [photoIndexBySource]);

  const closeViewer = useCallback(() => {
    const currentSrc = activePhoto?.src;
    setActiveIndex(null);
    setIsLightboxLoading(false);
    setLightboxError(false);

    // If viewer navigated to a photo outside the current page, synchronize page so the card is visible
    if (activePhoto && !showAll && pageSize > 0) {
      const globalIdx = photoIndexBySource.get(currentSrc);
      if (globalIdx !== undefined) {
        const targetPage = Math.floor(globalIdx / pageSize) + 1;
        if (targetPage !== currentPage && targetPage <= totalPages) {
          setCurrentPage(targetPage);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('page', String(targetPage));
            window.history.replaceState({}, '', url.toString());
          }
        }
      }
    }

    requestAnimationFrame(() => {
      if (currentSrc && photoButtonRefs.current.has(currentSrc)) {
        const targetBtn = photoButtonRefs.current.get(currentSrc);
        if (targetBtn) {
          targetBtn.focus();
          targetBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          return;
        }
      }
      openerRef.current?.focus();
    });
  }, [activePhoto, showAll, pageSize, photoIndexBySource, currentPage, totalPages]);

  const movePhoto = useCallback((direction) => {
    setActiveIndex((current) => {
      if (current === null || allPhotos.length === 0) return null;
      return (current + direction + allPhotos.length) % allPhotos.length;
    });
    setIsLightboxLoading(true);
    setLightboxError(false);
  }, [allPhotos.length]);

  // Body scroll locking and keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === 'ArrowLeft' && allPhotos.length > 1) {
        event.preventDefault();
        movePhoto(-1);
        return;
      }
      if (event.key === 'ArrowRight' && allPhotos.length > 1) {
        event.preventDefault();
        movePhoto(1);
        return;
      }
      if (event.key === 'Home' && allPhotos.length > 1) {
        event.preventDefault();
        setActiveIndex(0);
        setIsLightboxLoading(true);
        setLightboxError(false);
        return;
      }
      if (event.key === 'End' && allPhotos.length > 1) {
        event.preventDefault();
        setActiveIndex(allPhotos.length - 1);
        setIsLightboxLoading(true);
        setLightboxError(false);
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen, allPhotos.length, closeViewer, movePhoto]);

  // Set initial focus once; navigating photos must not steal focus from Next/Previous.
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => cancelAnimationFrame(timer);
  }, [isOpen]);

  // Trap focus inside lightbox modal
  function trapTab(event) {
    if (event.key !== 'Tab') return;
    const dialog = lightboxDialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(
      dialog.querySelectorAll('button:not(:disabled), [tabindex="0"], a[href]')
    );
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const goToPage = useCallback((newPage) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(target);
    setShowAll(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(target));
      window.history.replaceState({}, '', url.toString());
    }
    setPageAnnouncement(
      `Page ${target} of ${totalPages} loaded. Showing photographs ${(target - 1) * pageSize + 1} to ${Math.min(target * pageSize, totalPhotos)} of ${totalPhotos}.`
    );
    requestAnimationFrame(() => {
      galleryTopRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    });
  }, [totalPages, pageSize, totalPhotos]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  if (totalPhotos === 0) {
    return (
      <div
        className="gallery-empty-state"
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '8px',
          border: '1px dashed #dce2dc',
        }}
      >
        <p style={{ margin: 0, color: 'var(--gsdd-text-muted, #64748b)', fontSize: '15px' }}>
          No photographs to display in this collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={galleryTopRef} tabIndex={-1} style={{ outline: 'none' }} />

      {/* Screen reader live announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {pageAnnouncement}
      </div>

      {visibleDateGroups.map(({ dateKey, dateLabel, photos: datePhotos }) => {
        const totalForDate = dateCounts.get(dateKey) || datePhotos.length;
        const countLabel =
          !showAll && totalForDate > datePhotos.length
            ? `${datePhotos.length} of ${totalForDate} photos`
            : `${totalForDate} ${totalForDate === 1 ? 'photo' : 'photos'}`;

        return (
          <section
            className="gallery-date-group"
            key={dateKey}
            aria-labelledby={`gallery-date-${dateKey}`}
          >
            <div className="gallery-date-heading">
              <h3 id={`gallery-date-${dateKey}`}>{dateLabel}</h3>
              <span>{countLabel}</span>
            </div>
            <div className="gallery-page-grid">
              {datePhotos.map((photo, index) => {
                const globalIndex = photoIndexBySource.get(photo.src) ?? index;
                const isImageFailed = failedImages.has(photo.src);
                const isPriority = currentPage === 1 && globalIndex < 3;

                return (
                  <figure className="gallery-page-card" key={photo.src}>
                    <button
                      ref={(el) => {
                        if (el) photoButtonRefs.current.set(photo.src, el);
                        else photoButtonRefs.current.delete(photo.src);
                      }}
                      type="button"
                      className="gallery-page-image gallery-page-image-button"
                      aria-label={
                        photo.alt
                          ? `View photograph: ${photo.alt} (${dateLabel})`
                          : `View photograph ${globalIndex + 1} of ${totalPhotos} from ${dateLabel}`
                      }
                      onClick={(event) => openViewer(photo.src, event.currentTarget)}
                    >
                      {isImageFailed ? (
                        <div
                          className="gallery-page-image-fallback"
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            height: '100%',
                            padding: '16px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            textAlign: 'center',
                          }}
                        >
                          <ImageOff
                            size={28}
                            aria-hidden="true"
                            style={{ marginBottom: '6px', opacity: 0.6 }}
                          />
                          <span style={{ fontSize: '11px', lineHeight: 1.3 }}>
                            Photograph unavailable
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={photo.src}
                          alt={photo.alt || `Photograph from ${dateLabel}`}
                          unoptimized={photo.src.startsWith('/api/gallery/images/')}
                          fill
                          priority={isPriority}
                          loading={isPriority ? 'eager' : 'lazy'}
                          sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, (max-width: 1400px) 33vw, 440px"
                          onError={() => markImageFailed(photo.src)}
                        />
                      )}
                    </button>
                  </figure>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Pagination & Batch Navigation Controls */}
      {totalPages > 1 && (
        <nav
          className="gallery-pagination"
          aria-label="Gallery pagination"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '52px',
            paddingTop: '28px',
            borderTop: '1px solid var(--redesign-line, #e2e8e2)',
          }}
        >
          <div
            className="gallery-pagination-info"
            style={{
              fontSize: '13px',
              color: 'var(--redesign-muted, #556255)',
              textAlign: 'center',
            }}
          >
            {showAll ? (
              <span>
                Showing all <strong>{totalPhotos}</strong> photographs
              </span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–
                <strong>{Math.min(endIndex, totalPhotos)}</strong> of{' '}
                <strong>{totalPhotos}</strong> photographs
              </span>
            )}
          </div>

          <div
            className="gallery-pagination-controls"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <button
              type="button"
              className="gallery-pagination-btn"
              disabled={showAll || currentPage <= 1}
              aria-label="Go to previous gallery page"
              onClick={() => goToPage(currentPage - 1)}
              style={{
                minHeight: '38px',
                padding: '0 14px',
                color: currentPage <= 1 || showAll ? '#94a3b8' : 'var(--redesign-navy, #0b1a30)',
                background: '#fff',
                border: '1px solid #dce2dc',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage <= 1 || showAll ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>

            {!showAll &&
              paginationItems.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '32px',
                        height: '38px',
                        color: '#64748b',
                        fontSize: '12px',
                      }}
                    >
                      &hellip;
                    </span>
                  );
                }

                const pageNum = Number(item);
                const isCurrent = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`gallery-pagination-page ${isCurrent ? 'is-active' : ''}`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => goToPage(pageNum)}
                    style={{
                      minWidth: '38px',
                      minHeight: '38px',
                      padding: '0 8px',
                      color: isCurrent ? '#fff' : 'var(--redesign-navy, #0b1a30)',
                      background: isCurrent ? 'var(--redesign-navy, #0b1a30)' : '#fff',
                      border: `1px solid ${isCurrent ? 'var(--redesign-navy, #0b1a30)' : '#dce2dc'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

            <button
              type="button"
              className="gallery-pagination-btn"
              disabled={showAll || currentPage >= totalPages}
              aria-label="Go to next gallery page"
              onClick={() => goToPage(currentPage + 1)}
              style={{
                minHeight: '38px',
                padding: '0 14px',
                color: currentPage >= totalPages || showAll ? '#94a3b8' : 'var(--redesign-navy, #0b1a30)',
                background: '#fff',
                border: '1px solid #dce2dc',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage >= totalPages || showAll ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>

            <button
              type="button"
              className="gallery-pagination-toggle"
              aria-pressed={showAll}
              onClick={() => {
                if (showAll) {
                  setShowAll(false);
                  goToPage(1);
                } else {
                  setShowAll(true);
                  setPageAnnouncement(`Displaying all ${totalPhotos} photographs.`);
                }
              }}
              style={{
                minHeight: '38px',
                padding: '0 14px',
                marginLeft: '8px',
                color: showAll ? '#fff' : 'var(--redesign-navy, #0b1a30)',
                background: showAll ? 'var(--redesign-green, #1b7a42)' : '#fff',
                border: `1px solid ${showAll ? 'var(--redesign-green, #1b7a42)' : '#dce2dc'}`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAll ? 'View in pages' : `View all (${totalPhotos})`}
            </button>
          </div>
        </nav>
      )}

      {/* Accessible Lightbox Modal */}
      {activePhoto && (
        <div
          className="gallery-lightbox-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <section
            ref={lightboxDialogRef}
            className="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={captionId}
            onKeyDown={trapTab}
          >
            {/* Visually hidden modal title and live updates for assistive technologies */}
            <h2 id={titleId} className="sr-only">
              Photograph {activeIndex + 1} of {allPhotos.length}
            </h2>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              Photograph {activeIndex + 1} of {allPhotos.length}.{' '}
              {activePhoto.alt || 'GSDD Foundation photograph'}. {activePhoto.dateLabel}
            </div>

            <button
              ref={closeButtonRef}
              className="gallery-lightbox-control gallery-lightbox-close"
              type="button"
              aria-label="Close photo viewer (Escape)"
              onClick={closeViewer}
            >
              <X size={25} aria-hidden="true" />
            </button>

            <button
              className="gallery-lightbox-control gallery-lightbox-previous"
              type="button"
              aria-label={`Previous photo (${activeIndex === 0 ? allPhotos.length : activeIndex} of ${allPhotos.length})`}
              disabled={allPhotos.length < 2}
              onClick={() => movePhoto(-1)}
            >
              <ChevronLeft size={32} aria-hidden="true" />
            </button>

            <div className="gallery-lightbox-image">
              {isLightboxLoading && (
                <div
                  className="gallery-lightbox-loader"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                >
                  <Loader2
                    size={36}
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              )}

              {lightboxError ? (
                <div
                  className="gallery-lightbox-error-box"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    alignContent: 'center',
                    height: '100%',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '24px',
                  }}
                >
                  <ImageOff
                    size={48}
                    aria-hidden="true"
                    style={{ marginBottom: '12px', opacity: 0.6 }}
                  />
                  <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>
                    Photograph preview unavailable
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                    The photograph could not be loaded at this time.
                  </p>
                </div>
              ) : (
                <Image
                  key={activePhoto.src}
                  src={activePhoto.src}
                  alt={activePhoto.alt}
                  unoptimized={activePhoto.src.startsWith('/api/gallery/images/')}
                  fill
                  priority
                  sizes="(max-width: 1600px) 100vw, 1600px"
                  onLoad={() => setIsLightboxLoading(false)}
                  onError={() => {
                    setIsLightboxLoading(false);
                    setLightboxError(true);
                  }}
                />
              )}
            </div>

            <button
              className="gallery-lightbox-control gallery-lightbox-next"
              type="button"
              aria-label={`Next photo (${activeIndex + 2 > allPhotos.length ? 1 : activeIndex + 2} of ${allPhotos.length})`}
              disabled={allPhotos.length < 2}
              onClick={() => movePhoto(1)}
            >
              <ChevronRight size={32} aria-hidden="true" />
            </button>

            <p id={captionId} className="gallery-lightbox-caption">
              {activePhoto.dateLabel} &bull; Photo {activeIndex + 1} of {allPhotos.length}
            </p>
          </section>
        </div>
      )}
    </>
  );
}
