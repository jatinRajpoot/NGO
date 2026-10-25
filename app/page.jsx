import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { organization, projects } from './data/site-data';

export const metadata = {
  title: 'GSDD Foundation | Practical skills for rural Araria',
  description: 'GSDD Foundation is preparing practical digital and livelihood skills programmes rooted in Raniganj, Araria, Bihar.',
};

export default function Home() {
  return <>
    <section className="home-hero">
      <div className="container home-hero-inner">
        <div className="home-hero-copy">
          <p className="eyebrow"><span /> Raniganj · Araria · Bihar</p>
          <h1>Practical digital and livelihood skills for rural communities in Araria.</h1>
          <p className="home-hero-description">GSDD Foundation is preparing community programmes in digital literacy and livelihood skills, rooted in its home district.</p>
          <div className="home-hero-actions">
            <Link className="button button-primary" href="/projects">Explore our work <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="home-secondary-link" href="/get-involved">Get involved</Link>
          </div>
        </div>
        <aside className="hero-place-panel" aria-label="GSDD Foundation's location and programme status">
          <p className="hero-place-label">Our starting point</p>
          <div className="hero-place-wordmark" aria-hidden="true">ARARIA</div>
          <div className="hero-place-marker">
            <MapPin size={20} aria-hidden="true" />
            <span><strong>Raniganj</strong><small>Araria district · Bihar</small></span>
          </div>
          <div className="hero-place-divider" />
          <p className="hero-place-status">Programmes in preparation</p>
          <span className="hero-place-note">A place-led, non-photographic illustration</span>
        </aside>
      </div>
    </section>

    <section className="section-pad home-programmes" id="our-work">
      <div className="container">
        <div className="home-programmes-heading">
          <div>
            <p className="eyebrow"><span /> Our work</p>
            <h2>Work being prepared for local priorities.</h2>
          </div>
          <p>These are proposed programme directions, not a record of completed or currently operating projects.</p>
        </div>
        <div className="home-programme-list">
          {projects.map((project) => <article className="home-programme-row" key={project.number}>
            <span className="home-programme-number">{project.number}</span>
            <div className="home-programme-copy">
              <p className="home-programme-area">{project.area}</p>
              <h3>{project.title}</h3>
              <p>{project.objective}</p>
            </div>
            <div className="home-programme-meta">
              <span>In preparation</span>
              <small>{project.location}</small>
            </div>
          </article>)}
        </div>
        <Link className="text-link home-programmes-link" href="/projects">See all programme directions <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>

    <section className="section-pad home-local-section">
      <div className="container home-local-grid">
        <div className="home-local-copy">
          <p className="eyebrow"><span /> Local starting point</p>
          <h2>Rooted in Raniganj, Araria.</h2>
          <p>GSDD Foundation is based in Raniganj, Araria district, Bihar. The programme directions above are being prepared with this local context in view.</p>
          <a className="home-address" href="https://maps.google.com/?q=Raniganj+Araria+Bihar" target="_blank" rel="noreferrer">
            <MapPin size={18} aria-hidden="true" />
            <span>{organization.address}</span>
          </a>
        </div>
        <div className="home-transparency-block">
          <p className="eyebrow eyebrow-light"><span /> Transparency</p>
          <h2>Check the details. Request the records.</h2>
          <p>Statutory registrations and governance information are listed together, with copies of official documents available from the foundation on request.</p>
          <Link href="/transparency">Visit Transparency <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>

    <section className="home-contact-cta">
      <div className="container home-contact-cta-inner">
        <p>Interested in volunteering or exploring a partnership?</p>
        <Link className="button button-primary" href="/get-involved">Talk with GSDD <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>
  </>;
}
