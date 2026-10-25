import Link from 'next/link';
import { ArrowRight, HandHeart, UsersRound } from 'lucide-react';
import PageHero from '../components/PageHero';
import { VolunteerForm } from '../components/InquiryForm';
import { organization, socialLinks } from '../data/site-data';

export const metadata = {
  title: 'Get Involved | GSDD Foundation',
  description: 'Volunteer, join the youth community, or explore CSR and institutional partnerships with GSDD Foundation.',
};

export default function GetInvolvedPage() {
  return <>
    <PageHero eyebrow="Get involved" title="Be part of the work that opens new pathways." description="Share your time, knowledge, skills, or institutional support with communities across Araria, Bihar, and beyond." image="/images/rural-community.jpg" imageAlt="Women and children gathered in a rural community" actionLabel="Volunteer with us" actionHref="#volunteer" />
    <section className="section-pad volunteer-section" id="volunteer">
      <div className="container involved-grid">
        <div className="involved-copy"><p className="eyebrow"><span /> Volunteer &amp; youth leadership</p><h2>Be the catalyst for grassroots change.</h2><p>Whether you can teach digital literacy, assist in community health and government scheme awareness surveys, or mentor youth and women in vocational and technical skills, your time can help create meaningful opportunities.</p><div className="involved-callout"><UsersRound size={20} aria-hidden="true" /><p>Share your interests and availability. The foundation team will follow up by email.</p></div></div>
        <div className="form-panel"><h3>Volunteer with GSDD</h3><p>Complete the details below to prepare an email application.</p><VolunteerForm /></div>
      </div>
    </section>
    <section className="section-pad partnership-section" id="partnerships">
      <div className="container partnership-grid">
        <div className="partnership-copy"><p className="eyebrow eyebrow-light"><span /> CSR &amp; institutional partnerships</p><h2>Co-design community initiatives across Bihar and India.</h2><p>GSDD Foundation welcomes conversations with organizations interested in skill training, surveys, awareness initiatives, and community-centred development.</p><p>Registration identifiers and governance records are listed on the <Link href="/transparency">Transparency page</Link>.</p><a className="button button-donate" href={`mailto:${organization.email}?subject=${encodeURIComponent('CSR and institutional partnership')}`}>Request a CSR proposal <ArrowRight size={16} aria-hidden="true" /></a><small>Or write to {organization.email}</small></div>
        <div className="partnership-points"><div><span>01</span><strong>Start with local context</strong><p>Discuss the community need, geography, and intended participants.</p></div><div><span>02</span><strong>Shape a practical plan</strong><p>Agree activities, partners, timelines, and responsibilities together.</p></div><div><span>03</span><strong>Share clear updates</strong><p>Set an approach for documentation and reporting from the outset.</p></div></div>
      </div>
    </section>
    <section className="section-pad community-section" id="community">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Join our digital community</p><h2>Stay connected with GSDD.</h2></div><p>Follow the foundation’s official channels for announcements and updates.</p></div>
        <div className="social-card-grid">{socialLinks.map((social, index) => <a href={social.href} target="_blank" rel="noreferrer" className="social-card" key={social.label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{social.label}</strong><ArrowRight size={16} aria-hidden="true" /></a>)}</div>
        <div className="involved-bottom"><HandHeart size={24} aria-hidden="true" /><p>Want to support the mission financially? Contact the foundation for official donation instructions and receipt information.</p><Link href="/donate">Contribution information <ArrowRight size={15} aria-hidden="true" /></Link></div>
      </div>
    </section>
  </>;
}
