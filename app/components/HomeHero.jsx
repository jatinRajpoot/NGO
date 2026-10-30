'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const slides = [
  {
    image: '/media/community-classroom.jpg',
    alt: 'Students and a facilitator gathered for a learning session',
    eyebrow: 'Learning creates new possibilities',
    title: 'Empowering people.',
    highlight: 'Developing skills.',
    description: 'Connecting people with learning, practical skills and the confidence to shape their own next step.',
    action: 'Explore our focus areas',
    href: '/core-areas',
  },
  {
    image: '/media/community-gathering.jpg',
    alt: 'Community members gathered together for a local discussion',
    eyebrow: 'Stronger communities start together',
    title: 'Listening first.',
    highlight: 'Growing together.',
    description: 'We work alongside communities to support awareness, participation and inclusive local development.',
    action: 'About the foundation',
    href: '/about',
  },
  {
    image: '/media/women-workshop.jpg',
    alt: 'Women gathered at a community skills session',
    eyebrow: 'Opportunity belongs to everyone',
    title: 'Creating space.',
    highlight: 'Opening doors.',
    description: 'Supporting women, young people and families with access to knowledge, skills and opportunity.',
    action: 'Get involved',
    href: '/get-involved',
  },
];

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const touchStartXRef = useRef(null);

  const showSlide = useCallback((index) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(active - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(active + 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        showSlide(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        showSlide(slides.length - 1);
      }
    },
    [active, showSlide]
  );

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 48) {
      if (deltaX > 0) {
        showSlide(active - 1);
      } else {
        showSlide(active + 1);
      }
    }
    touchStartXRef.current = null;
  };

  const slide = slides[active];

  return (
    <section
      className="community-hero"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured stories from GSDD Foundation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((item, index) => (
        <div
          className={`community-hero-image${index === active ? ' is-active' : ''}`}
          key={item.image}
          aria-hidden={index !== active}
        >
          <Image
            src={item.image}
            alt={index === active ? item.alt : ''}
            fill
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="community-hero-overlay" aria-hidden="true" />
      <div className="container community-hero-inner">
        <div
          id={`community-hero-slide-${active}`}
          className="community-hero-copy"
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${active + 1} of ${slides.length}: ${slide.eyebrow}`}
          key={slide.title}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="community-hero-kicker"><span aria-hidden="true" /> {slide.eyebrow}</p>
          <h1>{slide.title}<br /><span>{slide.highlight}</span></h1>
          <p className="community-hero-description">{slide.description}</p>
          <div className="community-hero-actions">
            <Link className="button button-blue" href={slide.href}>
              {slide.action}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button button-outline-light" href="/about">
              Meet the foundation
            </Link>
          </div>
        </div>
        <div className="community-hero-location">
          <MapPin size={15} aria-hidden="true" />
          <span>Raniganj, Araria, Bihar</span>
        </div>
        <div className="community-hero-controls" role="group" aria-label="Featured story controls">
          <span className="community-hero-count" aria-hidden="true">
            <strong>{String(active + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}
          </span>
          <div className="community-hero-dots" role="group" aria-label="Select a story slide">
            {slides.map((item, index) => (
              <button
                key={item.image}
                type="button"
                id={`community-dot-${index}`}
                className={index === active ? 'is-active' : ''}
                aria-label={`Slide ${index + 1} of ${slides.length}: ${item.eyebrow}`}
                aria-pressed={index === active}
                onClick={() => showSlide(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="community-hero-arrow"
            aria-label="Previous story slide"
            onClick={() => showSlide(active - 1)}
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="community-hero-arrow"
            aria-label="Next story slide"
            onClick={() => showSlide(active + 1)}
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
