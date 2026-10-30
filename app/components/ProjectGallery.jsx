'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff, Loader2, X } from 'lucide-react';

const moments = [
  {
    category: 'Skill & Digital Training',
    title: 'Digital literacy',
    image: '/images/computer-lab.jpg',
    alt: 'Students using computers in a classroom',
  },
  {
    category: 'Health & Hygiene Camps',
    title: 'Health awareness',
    image: '/images/health-check.jpg',
    alt: 'A doctor checking a patient’s blood pressure',
  },
  {
    category: 'Women Empowerment',
    title: 'Women and livelihoods',
    image: '/images/rural-woman.jpg',
    alt: 'A woman in a sari standing with a child in a village',
  },
  {
    category: 'Community & Environment',
    title: 'Community participation',
    image: '/images/rural-community.jpg',
    alt: 'Women and children in a rural community',
  },
  {
    category: 'Skill & Digital Training',
    title: 'Learning together',
    image: '/hero-bg.jpg',
    alt: 'Children reading together in a village',
  },
];

const filters = [
  'All moments',
  'Skill & Digital Training',
  'Health & Hygiene Camps',
  'Women Empowerment',
  'Community & Environment',
];

export default function ProjectGallery() {
  const [filter, setFilter] = useState(filters[0]);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [filterAnnouncement, setFilterAnnouncement] = useState('');

  const visibleMoments = useMemo(() => {
    return filter === filters[0]
      ? moments
      : moments.filter((moment) => moment.category === filter);
  }, [filter]);

  // Lightbox state for enlarging project moments
  const [activeIndex, setActiveIndex] = useState(null);
  const [isLightboxLoading, setIsLightboxLoading] = useState(false);
  const [lightboxError, setLightboxError] = useState(false);

  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < visibleMoments.length;
  const activeMoment = isOpen ? visibleMoments[activeIndex] : null;

  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const cardButtonRefs = useRef(new Map());
  const lightboxDialogRef = useRef(null);
  const titleId = useId();
  const captionId = useId();

  const markImageFailed = useCallback((imageSrc) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(imageSrc);
      return next;
    });
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    const count =
      newFilter === filters[0]
        ? moments.length
        : moments.filter((m) => m.category === newFilter).length;
    setFilterAnnouncement(`Showing ${count} ${count === 1 ? 'moment' : 'moments'} for ${newFilter}.`);
  }, []);

  const openViewer = useCallback((index, triggerElement) => {
    openerRef.current = triggerElement;
    setActiveIndex(index);
    setIsLightboxLoading(true);
    setLightboxError(false);
  }, []);

  const closeViewer = useCallback(() => {
    const currentKey = activeMoment ? `${activeMoment.title}-${activeMoment.image}` : null;
    setActiveIndex(null);
    setIsLightboxLoading(false);
    setLightboxError(false);

    requestAnimationFrame(() => {
      if (currentKey && cardButtonRefs.current.has(currentKey)) {
        const targetBtn = cardButtonRefs.current.get(currentKey);
        if (targetBtn) {
          targetBtn.focus();
          targetBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          return;
        }
      }
      openerRef.current?.focus();
    });
  }, [activeMoment]);

  const moveMoment = useCallback(
    (direction) => {
      setActiveIndex((current) => {
        if (current === null || visibleMoments.length === 0) return null;
        return (current + direction + visibleMoments.length) % visibleMoments.length;
      });
      setIsLightboxLoading(true);
      setLightboxError(false);
    },
    [visibleMoments.length]
  );

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
      if (event.key === 'ArrowLeft' && visibleMoments.length > 1) {
        event.preventDefault();
        moveMoment(-1);
        return;
      }
      if (event.key === 'ArrowRight' && visibleMoments.length > 1) {
        event.preventDefault();
        moveMoment(1);
        return;
      }
      if (event.key === 'Home' && visibleMoments.length > 1) {
        event.preventDefault();
        setActiveIndex(0);
        setIsLightboxLoading(true);
        setLightboxError(false);
        return;
      }
      if (event.key === 'End' && visibleMoments.length > 1) {
        event.preventDefault();
        setActiveIndex(visibleMoments.length - 1);
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
  }, [isOpen, visibleMoments.length, closeViewer, moveMoment]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => cancelAnimationFrame(timer);
  }, [isOpen]);

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

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {filterAnnouncement}
      </div>

      <div className="gallery-filters" role="group" aria-label="Filter project images">
        {filters.map((item) => {
          const isActive = filter === item;
          const count =
            item === filters[0]
              ? moments.length
              : moments.filter((m) => m.category === item).length;

          return (
            <button
              type="button"
              key={item}
              className={isActive ? 'is-active' : ''}
              aria-pressed={isActive}
              aria-label={`Filter by ${item} (${count} moments)`}
              onClick={() => handleFilterChange(item)}
            >
              {item} <span style={{ opacity: 0.75, fontSize: '9px' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {visibleMoments.length === 0 ? (
        <div
          className="gallery-empty-state"
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            background: '#fff',
            borderRadius: '8px',
            border: '1px dashed #dce2dc',
            margin: '20px 0',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--gsdd-navy-dark, #0b1a30)',
            }}
          >
            No moments found for &ldquo;{filter}&rdquo;
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--gsdd-text-muted, #64748b)' }}>
            Please select another focus area or reset to view all moments.
          </p>
          <button
            type="button"
            className="button button-outline-blue"
            onClick={() => handleFilterChange(filters[0])}
            style={{ minHeight: '36px', padding: '0 16px', fontSize: '12px' }}
          >
            Show all moments
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {visibleMoments.map((moment, index) => {
            const cardKey = `${moment.title}-${moment.image}`;
            const isImageFailed = failedImages.has(moment.image);

            return (
              <article className="gallery-card" key={cardKey}>
                <div className="gallery-media">
                  <button
                    ref={(el) => {
                      if (el) cardButtonRefs.current.set(cardKey, el);
                      else cardButtonRefs.current.delete(cardKey);
                    }}
                    type="button"
                    className="gallery-media-button"
                    aria-label={`View enlarged photograph: ${moment.title} (${moment.category})`}
                    onClick={(event) => openViewer(index, event.currentTarget)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      cursor: 'zoom-in',
                    }}
                  >
                    {isImageFailed ? (
                      <div
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
                          size={24}
                          aria-hidden="true"
                          style={{ marginBottom: '4px', opacity: 0.6 }}
                        />
                        <span style={{ fontSize: '10px' }}>Image unavailable</span>
                      </div>
                    ) : (
                      <Image
                        src={moment.image}
                        alt={moment.alt}
                        fill
                        loading="lazy"
                        sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 25vw, 280px"
                        onError={() => markImageFailed(moment.image)}
                      />
                    )}
                  </button>
                </div>
                <div className="gallery-card-copy">
                  <span>{moment.category}</span>
                  <h3>{moment.title}</h3>
                  <small>Illustrative community image</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="gallery-note">
        These photographs illustrate the foundation’s focus areas and are not represented as GSDD Foundation field documentation. Follow official channels for organization updates.
      </p>

      {/* Lightbox Modal for Project Moments */}
      {activeMoment && (
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
            <h2 id={titleId} className="sr-only">
              {activeMoment.title} &ndash; {activeMoment.category}
            </h2>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              Moment {activeIndex + 1} of {visibleMoments.length}: {activeMoment.title}.{' '}
              {activeMoment.category}
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
              aria-label={`Previous moment (${activeIndex === 0 ? visibleMoments.length : activeIndex} of ${visibleMoments.length})`}
              disabled={visibleMoments.length < 2}
              onClick={() => moveMoment(-1)}
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
                    The illustrative photograph could not be loaded.
                  </p>
                </div>
              ) : (
                <Image
                  key={activeMoment.image}
                  src={activeMoment.image}
                  alt={activeMoment.alt}
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
              aria-label={`Next moment (${activeIndex + 2 > visibleMoments.length ? 1 : activeIndex + 2} of ${visibleMoments.length})`}
              disabled={visibleMoments.length < 2}
              onClick={() => moveMoment(1)}
            >
              <ChevronRight size={32} aria-hidden="true" />
            </button>

            <p id={captionId} className="gallery-lightbox-caption">
              {activeMoment.category}: {activeMoment.title} &bull; Image {activeIndex + 1} of{' '}
              {visibleMoments.length}
            </p>
          </section>
        </div>
      )}
    </>
  );
}
