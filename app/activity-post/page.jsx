import PageHero from '../components/PageHero';
import PublicPostsFeed from '../components/PublicPostsFeed';
import { listPosts } from '../lib/posts-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Activity Posts & Field Updates | GSDD Foundation',
  description:
    'Browse community workshops, digital literacy drives, health outreach, and field activity posts from GSDD Foundation.',
};

export default async function ActivityPostPage() {
  const posts = await listPosts({ filter: 'all' });

  return (
    <>
      <PageHero
        eyebrow="Field & Community"
        title="Activity posts and outreach."
        description="Explore verified community workshops, digital skills sessions, health drives, and field updates shared by Global Skills & Digital Development Foundation."
      />
      <section className="section-pad public-listing-section">
        <div className="container">
          <PublicPostsFeed
            initialPosts={posts}
            defaultFilter="activity"
            showFilterTabs={true}
            emptyEyebrow="Activity Posts"
            emptyTitle="No activity posts have been published yet."
            emptyDescription="Field activity updates published through the foundation panel will appear here."
          />
        </div>
      </section>
    </>
  );
}
