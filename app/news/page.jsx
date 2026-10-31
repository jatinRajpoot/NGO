import PageHero from '../components/PageHero';
import EmptyState from '../components/EmptyState';

export const metadata = {
  title: 'News & Updates | GSDD Foundation',
  description: 'Public news and updates from Global Skills & Digital Development Foundation.',
};

export default function NewsPage() {
  return <>
    <PageHero eyebrow="News & updates" title="Stories from the foundation." description="Verified news and announcements from the foundation will be shared here when available." />
    <section className="section-pad public-listing-section">
      <div className="container"><EmptyState eyebrow="Latest updates" title="No news has been published yet." description="Contact the foundation for current information about its work and opportunities to get involved." actionLabel="Contact the foundation" actionHref="/contact" /></div>
    </section>
  </>;
}
