'use client';

import { useState } from 'react';
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
    imageAlt: 'Women gathered at a community event',
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
  { image: '/media/community-learning.jpg', alt: 'Learners gathered in a classroom', label: 'Learning together' },
  { image: '/media/community-health.jpg', alt: 'Community health awareness visit', label: 'Health and well-being' },
  { image: '/media/skills-activity.jpg', alt: 'People taking part in a skills activity', label: 'Skills and opportunity' },
  { image: '/media/women-workshop.jpg', alt: 'Women attending a community workshop', label: 'Women and livelihoods' },
  { image: '/images/computer-lab.jpg', alt: 'Students learning in a computer lab', label: 'Digital inclusion' },
  { image: '/media/community-gathering.jpg', alt: 'Community members gathered together', label: 'Stronger communities' },
];

function SectionHeading({ eyebrow, title, description, href, linkLabel }) {
  return <div className="home-section-heading">
    <div>
      <p className="home-eyebrow"><span />{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="home-section-description">{description}</p>}
    </div>
    {href && <Link className="home-text-link" href={href}>{linkLabel || 'Explore'} <ArrowRight size={16} aria-hidden="true" /></Link>}
  </div>;
}

export default function PortalHome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];
  const moveSlide = (step) => setActiveSlide((current) => (current + step + slides.length) % slides.length);

  return <div className="redesign-home">
    <section className="redesign-home-hero" aria-label="Featured stories from GSDD Foundation">
      <Image className="redesign-hero-image" src={slide.image} alt={slide.imageAlt} fill priority sizes="100vw" />
      <div className="redesign-hero-overlay" />
      <div className="home-container redesign-hero-inner">
        <div className="redesign-hero-copy" aria-live="polite" aria-atomic="true">
          <p className="redesign-hero-eyebrow"><span />{slide.eyebrow}</p>
          <h1>{slide.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p className="redesign-hero-description">{slide.description}</p>
          <div className="redesign-hero-actions">
            <Link className="button button-donate" href={slide.href}>{slide.action}<ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="button redesign-hero-secondary" href="/donate"><Heart size={16} aria-hidden="true" /> Support our work</Link>
          </div>
        </div>
        <p className="redesign-hero-location"><MapPin size={16} aria-hidden="true" /> Raniganj, Araria, Bihar</p>
        <div className="redesign-hero-controls" role="group" aria-label="Featured stories">
          <span className="redesign-slide-count"><strong>{String(activeSlide + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}</span>
          <div className="redesign-slide-dots">
            {slides.map((item, index) => <button key={item.eyebrow} type="button" className={index === activeSlide ? 'is-active' : ''} aria-label={`Show story ${index + 1}: ${item.eyebrow}`} aria-current={index === activeSlide ? 'true' : undefined} onClick={() => setActiveSlide(index)} />)}
          </div>
          <button type="button" className="redesign-slide-arrow" aria-label="Previous story" onClick={() => moveSlide(-1)}><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" className="redesign-slide-arrow" aria-label="Next story" onClick={() => moveSlide(1)}><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </section>

    <section className="home-foundation-strip" aria-label="Foundation details">
      <div className="home-container home-foundation-strip-inner">
        <div><ShieldCheck size={23} aria-hidden="true" /><span><strong>Section 8 nonprofit</strong><small>Registered in Bihar, India</small></span></div>
        <div><BookOpen size={23} aria-hidden="true" /><span><strong>Knowledge. Skills. Opportunity.</strong><small>People at the heart of development</small></span></div>
        <Link href="/transparency">Registration &amp; transparency <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>

    <section className="home-overview-section" aria-label="Foundation news, activities and membership">
      <div className="home-container home-overview-grid">
        <aside className="home-overview-sidebar">
          <section className="home-surface home-news-panel">
            <p className="home-eyebrow"><span /> Updates</p>
            <h2>Latest news</h2>
            <div className="home-empty-news">
              <span className="home-empty-icon"><BookOpen size={22} aria-hidden="true" /></span>
              <strong>No public articles yet</strong>
              <p>Verified foundation news and announcements will appear here when available.</p>
              <Link className="home-text-link" href="/news">Visit news &amp; updates <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </section>
          <section className="home-surface home-quick-panel">
            <p className="home-eyebrow"><span /> Quick links</p>
            <h2>How can we help?</h2>
            <nav aria-label="Popular links">
              {quickLinks.map(([label, href, Icon]) => <Link key={href} href={href}><span className="home-quick-icon"><Icon size={19} aria-hidden="true" /></span><span>{label}</span><ChevronRight size={15} aria-hidden="true" /></Link>)}
            </nav>
          </section>
        </aside>

        <section className="home-surface home-activity-panel" aria-labelledby="home-activity-title">
          <div className="home-panel-heading">
            <div><p className="home-eyebrow"><span /> From the foundation</p><h2 id="home-activity-title">Latest activity</h2></div>
            <Link className="home-panel-arrow" href="/gallery" aria-label="View the photo gallery"><ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <p className="home-activity-intro">Discover the priorities shaping our work. For confirmed activities and announcements, visit our updates page.</p>
          <div className="home-activity-grid">
            {coreAreas.slice(1, 3).map((item) => <article className="home-activity-card" key={item.slug}>
              <Link className="home-activity-image" href={`/core-areas#${item.slug}`} aria-label={`Read about ${item.title}`}>
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 900px) 80vw, 28vw" />
                <span>Our priorities</span>
              </Link>
              <div className="home-activity-copy">
                <p>Learning &amp; opportunity</p>
                <h3>{item.title}</h3>
                <p className="home-activity-summary">{item.description}</p>
                <Link href={`/core-areas#${item.slug}`}>Explore this focus area <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </article>)}
          </div>
        </section>

        <aside className="home-overview-sidebar home-overview-sidebar-right">
          <section className="home-surface home-members-panel">
            <p className="home-eyebrow"><span /> Get involved</p>
            <h2>Our members</h2>
            <div className="home-members-visual"><UsersRound size={31} aria-hidden="true" /><span>Join our community</span></div>
            <p>Ask the foundation about current membership options and how to get involved.</p>
            <Link className="home-pill-link" href="/membership">Member application <ArrowRight size={14} aria-hidden="true" /></Link>
          </section>
          <section className="home-surface home-management-panel">
            <p className="home-eyebrow"><span /> Leadership</p>
            <h2>Management team</h2>
            <div className="home-leader"><span>MB</span><p><strong>Manoj Kumar Bishwas</strong><small>Founder / CEO</small></p></div>
            <div className="home-leader"><span>AK</span><p><strong>Arvind Kumar</strong><small>Founder / MD</small></p></div>
            <Link className="home-text-link" href="/team">Meet the team <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>
        </aside>
      </div>
    </section>

    <section className="home-about-section">
      <div className="home-container home-story-grid">
        <div className="home-story-visual">
          <Image src="/media/community-gathering.jpg" alt="Community members meeting together" fill sizes="(max-width: 760px) 100vw, 46vw" />
          <span className="home-story-badge"><strong>GSDD</strong><small>Raniganj, Bihar</small></span>
        </div>
        <div className="home-story-copy">
          <p className="home-eyebrow"><span /> About us</p>
          <h2>Building access, confidence and community opportunity.</h2>
          <p>{organization.legalName} is a Section 8 nonprofit organisation based in Raniganj, Araria, Bihar. Its stated areas of work include education, skills, digital inclusion, health awareness, women’s empowerment and community welfare.</p>
          <p>We believe sustainable progress grows when people have access to knowledge, practical opportunities and a meaningful role in shaping their communities.</p>
          <div className="home-story-values"><span>Learning</span><span>Inclusion</span><span>Community</span></div>
          <Link className="button button-blue" href="/about">Read about our foundation <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>

    <section className="home-commitment-section">
      <div className="home-container home-commitment-inner">
        <div className="home-commitment-mark" aria-hidden="true">“</div>
        <div><p className="home-eyebrow"><span /> Our commitment</p><h2>Empowering people. Developing skills. Transforming communities.</h2><p>We aim to encourage self-reliance, strengthen community participation and expand access to opportunities through inclusive, people-centred development.</p></div>
        <Link className="button home-commitment-button" href="/get-involved">Be part of the work <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>

    <section className="home-objectives-section">
      <div className="home-container">
        <SectionHeading eyebrow="What matters to us" title="Our focus areas" description="The foundation’s stated objectives span learning, health, digital access, livelihoods and community welfare." href="/core-areas" linkLabel="All focus areas" />
        <div className="home-objectives-grid">
          {coreAreas.map((area) => <article className="home-objective-card" key={area.slug}>
            <Link className="home-objective-image" href={`/core-areas#${area.slug}`} aria-label={`Explore ${area.title}`}>
              <Image src={area.image} alt={area.alt} fill sizes="(max-width: 680px) 90vw, (max-width: 1000px) 40vw, 20vw" />
              <span>{area.number}</span>
            </Link>
            <div className="home-objective-copy"><h3>{area.title}</h3><p>{area.description}</p><Link href={`/core-areas#${area.slug}`}>Explore area <ArrowRight size={14} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="home-gallery-section">
      <div className="home-container">
        <SectionHeading eyebrow="A closer look" title="Photo gallery" description="Community, learning and opportunity — the themes that guide our work." href="/gallery" linkLabel="View all photos" />
        <div className="home-gallery-grid">
          {gallery.map((item) => <figure className="home-gallery-card" key={item.image}>
            <div><Image src={item.image} alt={item.alt} fill sizes="(max-width: 680px) 90vw, 32vw" /></div>
            <figcaption>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></figcaption>
          </figure>)}
        </div>
        <p className="home-gallery-note">Representative community imagery; these photographs are not presented as records of foundation-led activities.</p>
      </div>
    </section>

    <section className="home-location-section">
      <div className="home-container">
        <SectionHeading eyebrow="Find us" title="Locate us" description="Our registered office is in Raniganj, Araria, Bihar." />
        <div className="home-location-grid">
          <div className="home-map-frame">
            <iframe title="Map search for GSDD Foundation in Raniganj, Bihar" src={`https://maps.google.com/maps?q=${encodeURIComponent(organization.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <aside className="home-location-card">
            <span className="home-location-icon"><MapPin size={22} aria-hidden="true" /></span>
            <p className="home-eyebrow"><span /> Registered office</p>
            <h3>Raniganj, Bihar</h3>
            <address>{organization.address}</address>
            <Link className="home-text-link" href="/contact">Contact us <ArrowRight size={15} aria-hidden="true" /></Link>
            <a className="home-map-link" href={`https://maps.google.com/?q=${encodeURIComponent(organization.address)}`} target="_blank" rel="noreferrer">Open directions <ArrowUpRight size={15} aria-hidden="true" /></a>
          </aside>
        </div>
      </div>
    </section>
  </div>;
}
