import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Management Team | GSDD Foundation',
  description: 'Meet the founding leadership publicly listed by Global Skills & Digital Development Foundation.',
};

const leaders = [
  { initials: 'MB', name: 'Manoj Kumar Bishwas', role: 'Founder / CEO' },
  { initials: 'AK', name: 'Arvind Kumar', role: 'Founder / MD' },
];

export default function TeamPage() {
  return <>
    <PageHero
      eyebrow="People behind the foundation"
      title="Management team"
      description="The founding leadership listed in the public information supplied by GSDD Foundation."
      actionLabel="About the foundation"
      actionHref="/about"
    />
    <section className="section-pad team-page-section">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div><p className="eyebrow"><span /> Founding leadership</p><h2>Meet the founders.</h2></div>
          <p>Only names and designations were provided for publication. Portraits and individual biographies are not available on this site.</p>
        </div>
        <div className="team-profile-list">
          {leaders.map((leader) => <article className="team-profile" key={leader.name}>
            <div className="team-profile-initials" aria-hidden="true">{leader.initials}</div>
            <div className="team-profile-copy"><span>{leader.role}</span><h3>{leader.name}</h3><p>Global Skills &amp; Digital Development Foundation</p></div>
          </article>)}
        </div>
        <div className="team-contact-note">
          <p>For organization enquiries, please contact the foundation directly.</p>
          <Link className="text-link" href="/contact">Contact GSDD Foundation <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  </>;
}
