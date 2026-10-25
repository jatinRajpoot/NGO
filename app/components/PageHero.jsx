import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function PageHero({ eyebrow, title, description, image, imageAlt, actionLabel, actionHref = '/get-involved', tone = 'default' }) {
  return (
    <section className={`page-hero page-hero-${tone}`}>
      <div className="container page-hero-inner">
        <div className="page-hero-copy">
          <p className="eyebrow"><span></span>{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-hero-description">{description}</p>
          {actionLabel && <Link className="button button-blue" href={actionHref}>{actionLabel}<ArrowRight size={17} aria-hidden="true" /></Link>}
        </div>
        {image && <div className="page-hero-media"><Image src={image} alt={imageAlt || ''} fill priority sizes="(max-width: 800px) 100vw, 44vw" /></div>}
      </div>
    </section>
  );
}
