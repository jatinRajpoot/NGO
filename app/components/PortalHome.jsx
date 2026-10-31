'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Heart,
  MapPin,
  ShieldCheck,
  UserPlus,
  Megaphone,
  UsersRound,
} from 'lucide-react';
import { coreAreas, organization } from '../data/site-data';

const slides = [
  {
    eyebrow: 'Learning and skills',
    title: 'Empowering people.\nDeveloping skills.',
    description: 'Connecting people with learning, practical skills and the confidence to shape their own next step.',
    image: '/media/community-classroom.jpg',
    imageAlt: 'Learners taking part in a classroom session',
    action: 'Explore our focus areas',
    href: '/core-areas',
  },
  {
    eyebrow: 'Community participation',
    title: 'Stronger communities\nstart together.',
    description: 'We believe useful information and meaningful opportunities begin with listening to local communities.',
    image: '/media/community-gathering.jpg',
    imageAlt: 'Women meeting together in a community setting',
    action: 'About the foundation',
    href: '/about',
  },
  {
    eyebrow: 'Opportunity for everyone',
    title: 'Creating space.\nOpening doors.',
    description: 'Explore ways to support education, digital inclusion, health awareness and community welfare.',
    image: '/media/women-workshop.jpg',
    imageAlt: 'Women gathered at a community skills event',
    action: 'Get involved',
    href: '/get-involved',
  },
];

const quickLinks = [
  ['Member application', '/membership', UserPlus],
  ['Support our work', '/donate', Heart],
  ['Verify a document', '/verify', ShieldCheck],
  ['Explore campaigns', '/campaigns', Megaphone],
];

const gallery = [
  { image: '/media/community-learning.jpg', alt: 'Learners gathered in a classroom setting', label: 'Learning together' },
  { image: '/media/community-health.jpg', alt: 'A community health awareness visit', label: 'Health and well-being' },
  { image: '/media/skills-activity.jpg', alt: 'Community participants engaged in a skills development activity', label: 'Skills and opportunity' },
  { image: '/media/women-workshop.jpg', alt: 'Women attending a community livelihood workshop', label: 'Women and livelihoods' },
  { image: '/images/computer-lab.jpg', alt: 'Students learning computer skills in an educational lab', label: 'Digital inclusion' },
  { image: '/media/community-gathering.jpg', alt: 'Community members gathered together for a local meeting', label: 'Stronger communities' },
];

function SectionHeading({ eyebrow, title, description, href, linkLabel }) {
  return (
    <div className="home-section-heading">
      <div>
        <p className="home-eyebrow"><span aria-hidden="true" />{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="home-section-description">{description}</p>}
      </div>
      {href && (
        <Link className="home-text-link" href={href}>
          {linkLabel || 'Explore'} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function PortalHome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartXRef = useRef(null);

  const moveSlide = useCallback((step) => {
    setActiveSlide((current) => (current + step + slides.length) % slides.length);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveSlide(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveSlide(1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveSlide(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveSlide(slides.length - 1);
      }
    },
    [moveSlide]
  );

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 48) {
      if (deltaX > 0) {
        moveSlide(-1);
      } else {
        moveSlide(1);
      }
    }
    touchStartXRef.current = null;
  };

  const slide = slides[activeSlide];

  return (
    <div className="redesign-home">
      <section
        className="redesign-home-hero"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured stories from GSDD Foundation"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((item, index) => (
          <Image
            key={item.image}
            className="redesign-hero-image"
            src={item.image}
            alt={index === activeSlide ? item.imageAlt : ''}
            fill
            priority={index === 0}
            sizes="100vw"
            aria-hidden={index !== activeSlide}
            style={{
              opacity: index === activeSlide ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
              pointerEvents: 'none',
            }}
          />
        ))}
        <div className="redesign-hero-overlay" aria-hidden="true" />
        <div className="home-container redesign-hero-inner">
          <div
            id={`portal-hero-slide-${activeSlide}`}
            className="redesign-hero-copy"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${activeSlide + 1} of ${slides.length}: ${slide.eyebrow}`}
            key={slide.title}
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="redesign-hero-eyebrow"><span aria-hidden="true" />{slide.eyebrow}</p>
            <h1>
              {slide.title.split('\n').map((line, index) => (
                <span key={line}>{index > 0 && <br />}{line}</span>
              ))}
            </h1>
            <p className="redesign-hero-description">{slide.description}</p>
            <div className="redesign-hero-actions">
              <Link className="button button-donate" href={slide.href}>
                {slide.action}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="button redesign-hero-secondary" href="/donate">
                <Heart size={16} aria-hidden="true" /> Support our work
              </Link>
            </div>
          </div>
          <p className="redesign-hero-location">
            <MapPin size={16} aria-hidden="true" /> Raniganj, Araria, Bihar
          </p>
          <div className="redesign-hero-controls" role="group" aria-label="Featured story controls">
            <span className="redesign-slide-count" aria-hidden="true">
              <strong>{String(activeSlide + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}
            </span>
            <div className="redesign-slide-dots" role="group" aria-label="Select a story slide">
              {slides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  id={`portal-dot-${index}`}
                  className={index === activeSlide ? 'is-active' : ''}
                  aria-label={`Slide ${index + 1} of ${slides.length}: ${item.eyebrow}`}
                  aria-pressed={index === activeSlide}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="redesign-slide-arrow"
              aria-label="Previous story slide"
              onClick={() => moveSlide(-1)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="redesign-slide-arrow"
              aria-label="Next story slide"
              onClick={() => moveSlide(1)}
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section className="home-foundation-strip" aria-label="Foundation registration and identity">
        <div className="home-container home-foundation-strip-inner">
          <div>
            <ShieldCheck size={23} aria-hidden="true" />
            <span>
              <strong>Section 8 nonprofit</strong>
              <small>Registered in Bihar, India &bull; CIN: {organization.cin}</small>
            </span>
          </div>
          <div>
            <BookOpen size={23} aria-hidden="true" />
            <span>
              <strong>Knowledge. Skills. Opportunity.</strong>
              <small>People at the heart of community development</small>
            </span>
          </div>
          <Link href="/transparency" aria-label="View registration and transparency disclosures">
            Registration &amp; transparency <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

    <section className="home-overview-section" aria-label="Foundation news, activities and membership">
      <div className="home-container home-overview-grid">
        <aside className="home-overview-sidebar">
          <section className="home-surface home-news-panel" aria-labelledby="home-news-title">
            <p className="home-eyebrow"><span aria-hidden="true" /> Updates</p>
            <h2 id="home-news-title">Latest news</h2>
            <div className="home-empty-news">
              <span className="home-empty-icon"><BookOpen size={22} aria-hidden="true" /></span>
              <strong>No public articles yet</strong>
              <p>Verified foundation news and announcements will appear here when available.</p>
              <Link className="home-text-link" href="/news">Visit news &amp; updates <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </section>
          <section className="home-surface home-quick-panel" aria-labelledby="home-quick-title">
            <p className="home-eyebrow"><span aria-hidden="true" /> Quick links</p>
            <h2 id="home-quick-title">How can we help?</h2>
            <nav aria-label="Popular services and quick links">
              {quickLinks.map(([label, href, Icon]) => (
                <Link key={href} href={href}>
                  <span className="home-quick-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span>{label}</span>
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </section>
        </aside>

        <section className="home-surface home-activity-panel" aria-labelledby="home-activity-title">
          <div className="home-panel-heading">
            <div>
              <p className="home-eyebrow"><span aria-hidden="true" /> From the foundation</p>
              <h2 id="home-activity-title">Latest activity</h2>
            </div>
            <Link className="home-panel-arrow" href="/gallery" aria-label="View the foundation photo gallery">
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className="home-activity-intro">
            Discover the priorities shaping our work. For confirmed activities and announcements, visit our updates page.
          </p>
          <div className="home-activity-grid">
            {coreAreas.slice(1, 3).map((item) => (
              <article className="home-activity-card" key={item.slug}>
                <Link className="home-activity-image" href={`/core-areas#${item.slug}`} aria-label={`Read about ${item.title}`}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 26vw, 340px"
                  />
                  <span>Our priorities</span>
                </Link>
                <div className="home-activity-copy">
                  <p>{item.subtitle || 'Focus area'}</p>
                  <h3>{item.title}</h3>
                  <p className="home-activity-summary">{item.description}</p>
                  <Link href={`/core-areas#${item.slug}`} aria-label={`Explore focus area: ${item.title}`}>
                    Explore this focus area <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="home-overview-sidebar home-overview-sidebar-right">
          <section className="home-surface home-members-panel" aria-labelledby="home-members-title">
            <p className="home-eyebrow"><span aria-hidden="true" /> Get involved</p>
            <h2 id="home-members-title">Our members</h2>
            <div className="home-members-visual" aria-hidden="true">
              <UsersRound size={31} aria-hidden="true" />
              <span>Join our community</span>
            </div>
            <p>Ask the foundation about current membership options and how to get involved.</p>
            <Link className="home-pill-link" href="/membership">
              Member application <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
          <section className="home-surface home-management-panel" aria-labelledby="home-team-title">
            <p className="home-eyebrow"><span aria-hidden="true" /> Leadership</p>
            <h2 id="home-team-title">Management team</h2>
            <div className="home-leader">
              <span aria-hidden="true">MB</span>
              <p>
                <strong>Manoj Kumar Bishwas</strong>
                <small>Founder / CEO</small>
              </p>
            </div>
            <div className="home-leader">
              <span aria-hidden="true">AK</span>
              <p>
                <strong>Arvind Kumar</strong>
                <small>Founder / MD</small>
              </p>
            </div>
            <Link className="home-text-link" href="/team" aria-label="Meet the founding leadership team">
              Meet the team <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </section>

    <section className="home-about-section" aria-label="About GSDD Foundation">
      <div className="home-container home-story-grid">
        <div className="home-story-visual">
          <Image
            src="/media/community-gathering.jpg"
            alt="Community members gathered for a local discussion in Raniganj, Bihar"
            fill
            sizes="(max-width: 680px) 100vw, (max-width: 1120px) 50vw, 620px"
            loading="lazy"
          />
          <span className="home-story-badge" aria-hidden="true">
            <strong>GSDD</strong>
            <small>Raniganj, Bihar</small>
          </span>
        </div>
        <div className="home-story-copy">
          <p className="home-eyebrow"><span aria-hidden="true" /> About us</p>
          <h2>Building access, confidence and community opportunity.</h2>
          <p>
            {organization.legalName} is a Section 8 nonprofit organisation based in Raniganj, Araria, Bihar. Its stated areas of work include education, skills, digital inclusion, health awareness, women&rsquo;s empowerment and community welfare.
          </p>
          <p>
            We believe sustainable progress grows when people have access to knowledge, practical opportunities and a meaningful role in shaping their communities.
          </p>
          <div className="home-story-values">
            <span>Learning</span>
            <span>Inclusion</span>
            <span>Community</span>
          </div>
          <Link className="button button-blue" href="/about">
            Read about our foundation <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>

    <section className="home-commitment-section" aria-label="Our commitment">
      <div className="home-container home-commitment-inner">
        <div className="home-commitment-mark" aria-hidden="true">&ldquo;</div>
        <div>
          <p className="home-eyebrow"><span aria-hidden="true" /> Our commitment</p>
          <h2>Empowering people. Developing skills. Transforming communities.</h2>
          <p>
            We aim to encourage self-reliance, strengthen community participation and expand access to opportunities through inclusive, people-centred development.
          </p>
        </div>
        <Link className="button home-commitment-button" href="/get-involved">
          Be part of the work <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>

    <section className="home-objectives-section" aria-label="Foundation focus areas">
      <div className="home-container">
        <SectionHeading
          eyebrow="What matters to us"
          title="Our focus areas"
          description="The foundation’s stated objectives span learning, health, digital access, livelihoods and community welfare."
          href="/core-areas"
          linkLabel="All focus areas"
        />
        <div className="home-objectives-grid">
          {coreAreas.map((area) => (
            <article className="home-objective-card" key={area.slug}>
              <Link className="home-objective-image" href={`/core-areas#${area.slug}`} aria-label={`Explore ${area.title}`}>
                <Image
                  src={area.image}
                  alt={area.alt}
                  fill
                  sizes="(max-width: 390px) 100vw, (max-width: 680px) 48vw, (max-width: 1120px) 31vw, 250px)"
                  loading="lazy"
                />
                <span aria-hidden="true">{area.number}</span>
              </Link>
              <div className="home-objective-copy">
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                <Link href={`/core-areas#${area.slug}`} aria-label={`Explore focus area: ${area.title}`}>
                  Explore area <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="home-gallery-section" aria-label="Community photo gallery preview">
      <div className="home-container">
        <SectionHeading
          eyebrow="A closer look"
          title="Photo gallery"
          description="Community, learning and opportunity — the themes that guide our work."
          href="/gallery"
          linkLabel="View all photos"
        />
        <div className="home-gallery-grid">
          {gallery.map((item) => (
            <figure className="home-gallery-card" key={item.image}>
              <Link
                href="/gallery"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                aria-label={`View photo in gallery: ${item.label}`}
              >
                <div>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 680px) 100vw, (max-width: 1120px) 33vw, 440px"
                    loading="lazy"
                  />
                </div>
                <figcaption>
                  {item.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </figcaption>
              </Link>
            </figure>
          ))}
        </div>
        <p className="home-gallery-note">
          Representative community imagery; these photographs are not presented as records of foundation-led activities.
        </p>
      </div>
    </section>

    <section className="home-location-section" aria-label="Foundation registered office location">
      <div className="home-container">
        <SectionHeading
          eyebrow="Find us"
          title="Locate us"
          description="Our registered office is in Raniganj, Araria, Bihar."
        />
        <div className="home-location-grid">
          <div className="home-map-frame">
            <iframe
              title="Map search for GSDD Foundation in Raniganj, Bihar"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(organization.address)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <aside className="home-location-card">
            <span className="home-location-icon" aria-hidden="true"><MapPin size={22} aria-hidden="true" /></span>
            <p className="home-eyebrow"><span aria-hidden="true" /> Registered office</p>
            <h3>Raniganj, Bihar</h3>
            <address>{organization.address}</address>
            <Link className="home-text-link" href="/contact">
              Contact us <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <a
              className="home-map-link"
              href={`https://maps.google.com/?q=${encodeURIComponent(organization.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open directions in Google Maps (opens in a new tab)"
            >
              Open directions <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </aside>
        </div>
      </div>
    </section>
  </div>
  );
}
