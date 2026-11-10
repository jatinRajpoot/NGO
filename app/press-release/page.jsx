import PageHero from '../components/PageHero';
import PublicPostsFeed from '../components/PublicPostsFeed';
import { listPosts } from '../lib/posts-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Press Releases & Media Coverage | GSDD Foundation',
  description:
    'Official press releases, public statements, and media announcements from Global Skills & Digital Development Foundation.',
};

export default async function PressReleasePage() {
  const posts = await listPosts({ filter: 'all' });

  return (
    <>
      <PageHero
        eyebrow="Press & Media"
        title="Press releases and statements."
        description="Official announcements, media notes, and programme briefings issued by Global Skills & Digital Development Foundation."
      />
      <section className="section-pad public-listing-section">
        <div className="container">
          <PublicPostsFeed
            initialPosts={posts}
            defaultFilter="press"
            showFilterTabs={true}
            emptyEyebrow="Press & Media"
            emptyTitle="No press releases have been published yet."
            emptyDescription="Press statements and media updates published by the foundation will appear here."
          />
        </div>
      </section>
    </>
  );
}
