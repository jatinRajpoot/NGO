import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from './components/PageHero';

export const metadata = {
  title: 'Page not found | GSDD Foundation',
  description: 'This public page is unavailable. Browse current information from GSDD Foundation.',
};

export default function NotFoundPage() {
  return <>
    <PageHero eyebrow="Page not found" title="This page isn’t available." description="The link may be out of date, or the requested public information has not been published by GSDD Foundation." />
    <section className="section-pad public-listing-section"><div className="container">
      <div className="not-found-links" aria-label="Explore public information">
        <Link href="/projects">Programme concepts <ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/events">Events <ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/campaigns">Campaigns <ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/news">News &amp; updates <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div></section>
  </>;
}
