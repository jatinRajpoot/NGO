import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Fundraising Campaigns | GSDD Foundation',
  description: 'Public fundraising campaigns from Global Skills & Digital Development Foundation.',
};

export default function CampaignsPage() {
  return <>
    <PageHero eyebrow="Fundraising campaigns" title="Support a clearly described cause." description="Campaign details and live fundraising totals will be shown here when the foundation publishes them." />
    <section className="section-pad public-listing-section">
      <div className="container"><EmptyState eyebrow="Campaigns" title="No public campaigns are listed right now." description="No campaign goals, donation totals, or active dates have been supplied. This page does not display estimated or invented fundraising progress." actionLabel="General donation information" actionHref="/donate" /></div>
    </section>
  </>;
}
