'use client';

import { useState } from 'react';
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
    action: 'Explore our work',
    href: '/core-areas',
  },
  {
    image: '/media/community-gathering.jpg',
    alt: 'Women taking part in a community gathering',
    eyebrow: 'Stronger communities start together',
    title: 'Listening first.',
    highlight: 'Growing together.',
    description: 'We work alongside communities to support awareness, participation and inclusive local development.',
    action: 'See our projects',
    href: '/projects',
  },
  {
    image: '/media/women-workshop.jpg',
    alt: 'Women standing together at a community event',
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
  const showSlide = (index) => setActive((index + slides.length) % slides.length);
  const slide = slides[active];

  return (
    <section className="community-hero" aria-label="Featured stories from GSDD Foundation">
      {slides.map((item, index) => (
        <div className={`community-hero-image${index === active ? ' is-active' : ''}`} key={item.image} aria-hidden={index !== active}>
          <Image src={item.image} alt={index === active ? item.alt : ''} fill priority={index === 0} sizes="100vw" />
        </div>
      ))}
      <div className="community-hero-overlay" />
      <div className="container community-hero-inner">
        <div className="community-hero-copy" key={slide.title} aria-live="polite" aria-atomic="true">
          <p className="community-hero-kicker"><span /> {slide.eyebrow}</p>
          <h1>{slide.title}<br /><span>{slide.highlight}</span></h1>
          <p className="community-hero-description">{slide.description}</p>
          <div className="community-hero-actions">
            <Link className="button button-blue" href={slide.href}>{slide.action}<ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="button button-outline-light" href="/about">Meet the foundation</Link>
          </div>
        </div>
        <div className="community-hero-location"><MapPin size={15} aria-hidden="true" /><span>Raniganj, Araria, Bihar</span></div>
        <div className="community-hero-controls" aria-label="Featured stories">
          <span className="community-hero-count"><strong>{String(active + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}</span>
          <div className="community-hero-dots">
            {slides.map((item, index) => (
              <button key={item.image} type="button" className={index === active ? 'is-active' : ''} aria-label={`Show story ${index + 1}: ${item.eyebrow}`} aria-current={index === active ? 'true' : undefined} onClick={() => showSlide(index)} />
            ))}
          </div>
          <button type="button" className="community-hero-arrow" aria-label="Previous story" onClick={() => showSlide(active - 1)}><ChevronLeft size={19} aria-hidden="true" /></button>
          <button type="button" className="community-hero-arrow" aria-label="Next story" onClick={() => showSlide(active + 1)}><ChevronRight size={19} aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
