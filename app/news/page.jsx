import PageHero from '../components/PageHero';
import SampleUpdates from '../components/SampleUpdates';

export const metadata = {
  title: 'News & Updates | GSDD Foundation',
  description: 'Public news and updates from Global Skills & Digital Development Foundation.',
};

export default function NewsPage() {
  return <>
    <PageHero eyebrow="News & updates" title="Stories from the foundation." description="The items below are dummy news and updates for layout preview. Replace them with verified stories before publishing." />
    <section className="section-pad public-listing-section">
      <div className="container"><SampleUpdates /></div>
    </section>
  </>;
}
