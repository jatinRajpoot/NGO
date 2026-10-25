import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import { workSectors } from '../data/site-data';

export const metadata = {
  title: '12 Work Sectors | GSDD Foundation',
  description: 'Explore the 12 development sectors where GSDD Foundation aims to support community welfare, skills, awareness and inclusive opportunity.',
};

export default function WorkSectorsPage() {
  return <>
    <PageHero eyebrow="Our work sectors" title="Driving inclusive growth through community-centred development." description="Our sectors reflect a commitment to expanding access to opportunities, strengthening participation, promoting awareness, and encouraging inclusive socio-economic development." image="/images/rural-woman.jpg" imageAlt="A woman in a sari standing with a child in a village" actionLabel="Explore our projects" actionHref="/projects" />
    <section className="section-pad sectors-section">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Sector directory</p><h2>12 areas of community development.</h2></div><p>Each sector reflects an area where awareness, collaboration, and practical learning can help address community needs.</p></div>
        <div className="sectors-grid">
          {workSectors.map((sector) => <article className="sector-card" key={sector.number}>
            <div className="sector-card-image"><Image src={sector.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /><span>{sector.number}</span></div>
            <div className="sector-card-copy"><h3>{sector.title}</h3><p>{sector.description}</p><Link href="/get-involved">Collaborate <ArrowRight size={14} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
        <div className="commitment-banner"><span>Our commitment</span><p>GSDD FOUNDATION aims to work collaboratively with communities, NGOs, educational institutions, CSR partners, companies, and other development stakeholders to support meaningful initiatives and contribute to sustainable social progress.</p><strong>Empowering People, Strengthening Communities, and Building a Sustainable Future for All.</strong></div>
      </div>
    </section>
  </>;
}
