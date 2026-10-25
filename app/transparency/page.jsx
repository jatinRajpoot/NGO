import Link from 'next/link';
import { ArrowRight, BadgeCheck, FileText } from 'lucide-react';
import PageHero from '../components/PageHero';
import { credentials, organization } from '../data/site-data';

export const metadata = {
  title: 'Transparency & Governance | GSDD Foundation',
  description: 'Statutory identifiers and governance information for Global Skills & Digital Development Foundation.',
};

export default function TransparencyPage() {
  return <>
    <PageHero eyebrow="Transparency & governance" title="Integrity, accountability and clear records." description="Statutory identifiers provided by the foundation are listed below for community members, donors, and prospective partners." image="/images/health-check.jpg" imageAlt="A doctor checking a patient’s blood pressure" actionLabel="Contact us about records" actionHref="/contact" />
    <section className="section-pad credentials-section">
      <div className="container">
        <div className="section-heading section-heading-row"><div><p className="eyebrow"><span /> Statutory directory</p><h2>Organization details.</h2></div><p>GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION (GSDD FOUNDATION)</p></div>
        <div className="credentials-grid">
          {credentials.map(([label, value, authority], index) => <article className="credential-card" key={label}>
            <span className={`credential-icon${index === 3 ? ' credential-icon-green' : ''}`}><BadgeCheck size={19} aria-hidden="true" /></span>
            <div><p>{label}</p><strong>{value}</strong><small>{authority}</small></div>
          </article>)}
        </div>
        <p className="credential-note">These registration details are reproduced from information supplied for this website. Please request the underlying certificate or profile for verification.</p>
      </div>
    </section>
    <section className="section-pad governance-docs-section">
      <div className="container governance-docs-grid">
        <div><p className="eyebrow eyebrow-light"><span /> Governance documents</p><h2>Request official copies.</h2><p>Certificate of Incorporation, Section 12A and 80G certificates, NITI Aayog Darpan profile, Form 10BE guidance, and annual audit filings can be requested from the foundation.</p><a className="button button-outline-light" href={`mailto:${organization.email}?subject=${encodeURIComponent('Request for governance documents')}`}>Request documents <ArrowRight size={16} aria-hidden="true" /></a></div>
        <div className="document-request-list">
          {[
            ['Certificate of Incorporation', organization.cin],
            ['Section 12A Registration Certificate', organization.tax12a],
            ['Section 80G Tax Exemption Certificate', organization.tax80g],
            ['NITI Aayog Darpan Registration Profile', organization.darpan],
            ['Statutory Form 10BE guidance & annual audit filings', 'Available on request'],
          ].map(([title, detail]) => <div key={title}><FileText size={19} aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={15} aria-hidden="true" /></div>)}
        </div>
      </div>
    </section>
    <section className="section-pad compliance-note-section">
      <div className="container compliance-note"><p className="eyebrow"><span /> Donor information</p><h2>Questions about an 80G donation or receipt?</h2><p>Contact the foundation before making a contribution to confirm the current payment process and documentation. This website does not process donations or issue receipts.</p><Link className="text-link" href="/donate">View contribution information <ArrowRight size={16} aria-hidden="true" /></Link></div>
    </section>
  </>;
}
