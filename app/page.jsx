import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, BookOpenCheck, HeartHandshake, MoveUpRight } from 'lucide-react';
import DonationChooser from './components/DonationChooser';
import TrustStrip from './components/TrustStrip';
import { coreAreas, organization, projects } from './data/site-data';

export const metadata = {
  title: 'GSDD Foundation | Skills, digital access and community development',
  description: 'Global Skills & Digital Development Foundation works to connect underserved communities with education, skills, digital literacy, health awareness and opportunity.',
};

const focusTiles = [
  { image: '/hero-bg.jpg', alt: 'Children learning together in a village', label: 'Education & learning' },
  { image: '/images/computer-lab.jpg', alt: 'Students working at computers', label: 'Digital inclusion' },
  { image: '/images/rural-woman.jpg', alt: 'A woman in a sari with a child', label: 'Women & livelihoods' },
  { image: '/images/health-check.jpg', alt: 'A doctor checks a patient', label: 'Health awareness' },
];

export default function Home() {
  return <>
    <section className="home-hero">
      <div className="container hero-grid">
        <div className="hero-photo-panel">
          <Image src="/hero-bg.jpg" alt="Children reading and learning together in a village" fill priority sizes="(max-width: 920px) 100vw, 62vw" />
          <div className="hero-photo-overlay" />
          <div className="hero-content">
            <p className="hero-verification"><BadgeCheck size={17} aria-hidden="true" /> NITI Aayog Darpan: {organization.darpan} <span>·</span> 12A &amp; 80G details</p>
            <p className="hero-kicker">A community-led future starts with access</p>
            <h1>Empowering People.<br /><span>Developing Skills.</span><br /><span className="hero-final-line">Transforming Communities.</span></h1>
            <p className="hero-description">Global Skills &amp; Digital Development Foundation connects underserved communities with useful knowledge, skills and opportunities across Bihar and India.</p>
            <p className="hero-detail">Digital literacy · Vocational skills · Health awareness · Women’s livelihoods · Public services</p>
            <div className="hero-actions">
              <Link className="button button-donate" href="/donate">Support our mission <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className="button button-outline-light" href="/get-involved">Partner or volunteer</Link>
            </div>
          </div>
          <div className="hero-location"><span>01</span><span>Raniganj, Araria, Bihar</span><span className="hero-location-line" /></div>
        </div>
        <div className="hero-donation"><DonationChooser compact /></div>
      </div>
    </section>

    <TrustStrip />

    <section className="section-pad home-about" id="about">
      <div className="container home-about-grid">
        <div className="photo-collage">
          {focusTiles.map((tile, index) => <figure className={`collage-tile collage-tile-${index + 1}`} key={tile.label}>
            <Image src={tile.image} alt={tile.alt} fill sizes="(max-width: 700px) 46vw, 24vw" />
            <figcaption>{tile.label}</figcaption>
          </figure>)}
          <div className="collage-badge"><span>From</span><strong>Araria, Bihar</strong><small>with a wider purpose</small></div>
        </div>
        <div className="home-about-copy">
          <p className="eyebrow"><span /> About our foundation</p>
          <h2>Global Skills &amp; Digital Development Foundation</h2>
          <p className="section-subtitle">{organization.tagline}</p>
          <p>GSDD FOUNDATION is a non-profit organization dedicated to advancing social development, educational awareness, healthcare awareness, digital literacy, skill development, women empowerment, livelihood opportunities, environmental sustainability, and community welfare.</p>
          <p>We work to bridge the gap between underserved communities and meaningful opportunities through grassroots engagement, awareness, practical learning, digital inclusion, and collaboration.</p>
          <div className="commitment-box"><strong>Our commitment</strong><p>Contributing to a more educated, digitally empowered, skilled, healthy, self-reliant, and inclusive society.</p></div>
          <Link className="text-link" href="/about">Read our story, mission &amp; governance <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>

    <section className="section-pad core-section">
      <div className="container">
        <div className="section-heading section-heading-centered">
          <p className="eyebrow"><span /> Our core areas</p>
          <h2>Transforming lives through sustainable action</h2>
          <p>We focus on connected areas that contribute to community well-being, individual empowerment, and inclusive socio-economic growth.</p>
        </div>
        <div className="core-card-grid">
          {coreAreas.map((area) => <article className="core-card" key={area.number}>
            <Link href={`/core-areas#${area.slug}`} className="core-card-media" aria-label={`Explore ${area.title}`}>
              <Image src={area.image} alt={area.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
              <span className="core-card-number">{area.number}</span>
            </Link>
            <div className="core-card-copy"><p>{area.subtitle}</p><h3>{area.title}</h3><span className="core-card-rule" /><Link href="/core-areas">Explore area <ArrowRight size={14} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
        <div className="section-action"><Link className="button button-outline-blue" href="/core-areas">Explore all five core areas <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
    </section>

    <section className="purpose-section section-pad">
      <div className="container">
        <div className="section-heading purpose-heading">
          <p className="eyebrow eyebrow-light"><span /> Our direction</p>
          <h2>Purpose that grows from people and place.</h2>
        </div>
        <div className="purpose-grid">
          <article className="purpose-card"><span className="purpose-number">01</span><BookOpenCheck size={25} aria-hidden="true" /><p className="purpose-eyebrow">Our mission</p><h3>Creating opportunities.<br />Empowering communities.</h3><p>Connect people with opportunities, empower communities with knowledge, encourage self-reliance, and promote service, dignity, equality, and social responsibility.</p><Link href="/about#mission">Read our mission <ArrowRight size={15} aria-hidden="true" /></Link></article>
          <article className="purpose-card"><span className="purpose-number">02</span><HeartHandshake size={25} aria-hidden="true" /><p className="purpose-eyebrow">Our vision</p><h3>An inclusive, empowered, sustainable society.</h3><p>A future where every individual is empowered, every community is strengthened, and every opportunity contributes to an equitable future.</p><Link href="/about#vision">Explore our vision <ArrowRight size={15} aria-hidden="true" /></Link></article>
          <article className="purpose-card"><span className="purpose-number">03</span><MoveUpRight size={25} aria-hidden="true" /><p className="purpose-eyebrow">Our goal</p><h3>Advancing inclusive growth.</h3><p>Support rural and underserved communities through skills, health awareness, digital inclusion, stronger livelihoods, and access to essential services.</p><Link href="/about#goal">See our goal <ArrowRight size={15} aria-hidden="true" /></Link></article>
        </div>
      </div>
    </section>

    <section className="section-pad initiatives-section">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div><p className="eyebrow"><span /> Projects &amp; activities</p><h2>Local priorities.<br />Practical initiatives.</h2></div>
          <div><p>Flagship initiatives focus on learning, women’s livelihoods, public service awareness, and preventive health.</p><Link className="text-link" href="/projects">View project directions <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </div>
        <div className="initiative-preview-grid">
          {projects.slice(0, 3).map((project) => <article className="initiative-preview" key={project.number}>
            <div className="initiative-preview-image"><Image src={project.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /></div>
            <div className="initiative-preview-copy"><span>{project.area}</span><h3>{project.title}</h3><p>{project.location}</p><Link href="/projects">Project details <ArrowRight size={14} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
        <p className="illustration-caption">Project descriptions are forward-looking plans. Photographs are illustrative and do not document completed GSDD Foundation activities.</p>
      </div>
    </section>

    <section className="home-last-cta">
      <div className="container home-last-cta-inner">
        <div><p className="eyebrow eyebrow-light"><span /> Work with us</p><h2>Let’s create more ways forward, together.</h2><p>Join as a volunteer, explore a partnership, or talk with us about supporting community-led development.</p></div>
        <div className="home-last-actions"><Link className="button button-donate" href="/get-involved">Get involved <ArrowRight size={16} aria-hidden="true" /></Link><Link className="button button-outline-light" href="/transparency">See our registrations <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
    </section>
  </>;
}
