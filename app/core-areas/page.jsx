import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import { coreAreas } from '../data/site-data';

export const metadata = {
  title: 'Core Areas | GSDD Foundation',
  description: 'Five connected focus areas: health awareness, education and skills, digital inclusion, community welfare, and women’s empowerment.',
};

export default function CoreAreasPage() {
  return <>
    <PageHero eyebrow="Our core areas" title="Five connected priorities. One shared purpose." description="We focus on key development areas that support community well-being, individual empowerment, and inclusive socio-economic growth across India." image="/images/computer-lab.jpg" imageAlt="Students using computers in a school lab" actionLabel="See all 12 work sectors" actionHref="/work-sectors" />
    <section className="section-pad core-detail-section">
      <div className="container">
        {coreAreas.map((area, index) => <article id={area.slug} className={`core-detail-row${index % 2 ? ' is-reversed' : ''}`} key={area.number}>
          <div className="core-detail-media"><Image src={area.image} alt={area.alt} fill sizes="(max-width: 780px) 100vw, 44vw" /><span className="core-detail-number">{area.number}</span></div>
          <div className="core-detail-copy"><p className="eyebrow"><span /> Core area {area.number}</p><h2>{area.title}</h2><h3>{area.subtitle}</h3><p>{area.description}</p><Link className="text-link" href="/work-sectors">Explore related sectors <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </article>)}
        <div className="commitment-banner"><span>Our commitment</span><p>Through these core areas, GSDD FOUNDATION aspires to promote equal opportunities, strengthen community capabilities, and contribute to a more inclusive, empowered, and sustainable society.</p><strong>Empowering People. Strengthening Communities. Enabling Sustainable Progress.</strong></div>
      </div>
    </section>
  </>;
}
