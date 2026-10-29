'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PhotoGallery({ dates }) {
  const photos = dates.flatMap(({ dateLabel, photos: datePhotos }) =>
    datePhotos.map((photo) => ({ ...photo, dateLabel })),
  );
  const photoIndexBySource = new Map(photos.map((photo, index) => [photo.src, index]));
  const [activeIndex, setActiveIndex] = useState(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const isOpen = activeIndex !== null;
  const activePhoto = isOpen ? photos[activeIndex] : null;

  const closeViewer = useCallback(() => {
    setActiveIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  const movePhoto = useCallback((direction) => {
    setActiveIndex((current) => (current + direction + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft' && photos.length > 1) movePhoto(-1);
      if (event.key === 'ArrowRight' && photos.length > 1) movePhoto(1);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, photos.length, closeViewer, movePhoto]);

  function trapTab(event) {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <>
    {dates.map(({ dateKey, dateLabel, photos: datePhotos }) => <section className="gallery-date-group" key={dateKey} aria-labelledby={`gallery-date-${dateKey}`}>
      <div className="gallery-date-heading">
        <h3 id={`gallery-date-${dateKey}`}>{dateLabel}</h3>
        <span>{datePhotos.length} photos</span>
      </div>
      <div className="gallery-page-grid">
        {datePhotos.map((photo) => <figure className="gallery-page-card" key={photo.src}>
          <button
            type="button"
            className="gallery-page-image gallery-page-image-button"
            aria-label={`Open photo from ${dateLabel}`}
            onClick={(event) => {
              openerRef.current = event.currentTarget;
              setActiveIndex(photoIndexBySource.get(photo.src));
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading="lazy"
              sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
            />
          </button>
        </figure>)}
      </div>
    </section>)}

    {activePhoto && <div
      className="gallery-lightbox-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeViewer();
      }}
    >
      <section className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onKeyDown={trapTab}>
        <button ref={closeButtonRef} className="gallery-lightbox-control gallery-lightbox-close" type="button" aria-label="Close photo viewer" onClick={closeViewer}>
          <X size={25} aria-hidden="true" />
        </button>
        <button className="gallery-lightbox-control gallery-lightbox-previous" type="button" aria-label="Previous photo" disabled={photos.length < 2} onClick={() => movePhoto(-1)}>
          <ChevronLeft size={32} aria-hidden="true" />
        </button>
        <div className="gallery-lightbox-image">
          <Image src={activePhoto.src} alt={activePhoto.alt} fill priority sizes="100vw" />
        </div>
        <button className="gallery-lightbox-control gallery-lightbox-next" type="button" aria-label="Next photo" disabled={photos.length < 2} onClick={() => movePhoto(1)}>
          <ChevronRight size={32} aria-hidden="true" />
        </button>
        <p className="gallery-lightbox-caption">{activePhoto.dateLabel}</p>
      </section>
    </div>}
  </>;
}
