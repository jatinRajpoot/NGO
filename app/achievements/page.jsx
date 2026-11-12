import PageHero from '../components/PageHero';
import PublicPostsFeed from '../components/PublicPostsFeed';
import { listPosts } from '../lib/posts-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Achievements & Milestones | GSDD Foundation',
  description:
    'Milestones, community recognitions, press features, and documented impact activities of GSDD Foundation.',
};

export default async function AchievementsPage() {
  const posts = await listPosts({ filter: 'all' });

  return (
    <>
      <PageHero
        eyebrow="Milestones & Impact"
        title="Achievements and recognition."
        description="Documented community milestones, programme outcomes, field activities, and media recognition of GSDD Foundation."
      />
      <section className="section-pad public-listing-section">
        <div className="container">
          <PublicPostsFeed
            initialPosts={posts}
            defaultFilter="all"
            showFilterTabs={true}
            emptyEyebrow="Achievements"
            emptyTitle="No milestones have been posted yet."
            emptyDescription="Verified milestones and press highlights shared by the foundation will appear here."
          />
        </div>
      </section>
    </>
  );
}
