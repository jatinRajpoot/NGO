import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import TeamList from './TeamList';
import SocialMediaBar from '../components/SocialMediaBar';

export const metadata = {
  title: 'Management Team | GSDD Foundation',
  description: 'Meet the founding leadership and executive management team of Global Skills & Digital Development Foundation.',
};

export default function TeamPage() {
  return <>
    <PageHero
      eyebrow="People behind the foundation"
      title="Management team"
      description="The leadership, executive committee, and advisory board guiding the initiatives of GSDD Foundation."
      actionLabel="About the foundation"
      actionHref="/about"
    />
    <section className="section-pad team-page-section">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow"><span /> Governance &amp; Leadership</p>
            <h2>Meet the founders and management team.</h2>
          </div>
          <p>The individuals steering the mission of social development, education, and digital skill building across underserved communities.</p>
        </div>

        <TeamList />

        <div className="team-contact-note">
          <p>For official collaboration, partnerships, or organization enquiries, please contact the foundation directly.</p>
          <Link className="text-link" href="/contact">Contact GSDD Foundation <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>

        <div style={{ marginTop: '36px' }}>
          <SocialMediaBar title="Connect with our team &amp; community on Social Media" />
        </div>
      </div>
    </section>
  </>;
}
