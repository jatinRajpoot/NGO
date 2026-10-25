import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import PageHero from './PageHero';
import { organization } from '../data/site-data';

export default function PolicyPage({ eyebrow = 'Legal information', title, description, updated = 'October 2026', children }) {
  return <>
    <PageHero eyebrow={eyebrow} title={title} description={description} />
    <section className="section-pad policy-section"><article className="container policy-content"><p className="policy-updated">Last updated: {updated}</p>{children}<div className="policy-contact"><span>Questions about this policy?</span><a href={`mailto:${organization.email}`}><Mail size={15} aria-hidden="true" /> {organization.email}</a><a href={`tel:${organization.phoneHref}`}><Phone size={15} aria-hidden="true" /> {organization.phone}</a></div><Link href="/" className="text-link"><ArrowLeft size={15} aria-hidden="true" /> Back to home</Link></article></section>
  </>;
}
