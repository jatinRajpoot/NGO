import PageHero from '../components/PageHero';
import EmptyState from '../components/EmptyState';
import CampaignsDirectory from '../components/CampaignsDirectory';
import { listCampaigns } from '../lib/finance-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Campaigns | GSDD Foundation',
  description: 'Public fundraising and programme campaigns by Global Skills & Digital Development Foundation.',
};

export default async function CampaignsPage() {
  const all = await listCampaigns({ tab: 'all' });
  const published = all.filter((c) => c.status !== 'Draft');

  return (
    <>
      <PageHero
        eyebrow="Campaigns"
        title="Support a clearly described cause."
        description="Support active crowdfunding causes for digital classrooms, women livelihoods, and community healthcare."
      />
      <section className="section-pad public-listing-section">
        <div className="container">
          {published.length === 0 ? (
            <EmptyState
              eyebrow="Crowdfunding & appeals"
              title="No active campaign appeals right now."
              description="Direct online donations go towards the general programme activities of Global Skills & Digital Development Foundation."
              actionLabel="Donate to general programmes"
              actionHref="/donate"
            />
          ) : (
            <CampaignsDirectory initialCampaigns={published} />
          )}
        </div>
      </section>
    </>
  );
}
