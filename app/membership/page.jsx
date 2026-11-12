import Link from 'next/link';
import { ArrowRight, UsersRound, ShieldCheck, UserCheck } from 'lucide-react';
import EmailDraftForm from '../components/EmailDraftForm';
import PageHero from '../components/PageHero';
import MembershipPlans from '../components/MembershipPlans';
import ExtendedMembershipForm from '../components/ExtendedMembershipForm';

export const metadata = {
  title: 'Membership | GSDD Foundation',
  description: 'View membership plans, designations, and apply for registration with Global Skills & Digital Development Foundation.',
};

const groups = [
  { legend: 'Your details', fields: [
    { name: 'name', label: 'Full name', autoComplete: 'name' },
    { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', autoComplete: 'tel', optional: true },
    { name: 'location', label: 'District and state', autoComplete: 'address-level2' },
  ] },
  { legend: 'Membership enquiry', fields: [
    { name: 'information', label: 'What would you like information about?', type: 'select', options: ['Membership options', 'Available designations', 'Fees and process', 'General membership information'] },
    { name: 'message', label: 'Anything else you would like us to know', type: 'textarea', optional: true, rows: 3 },
  ] },
];

export default function MembershipPage() {
  return <>
    <PageHero eyebrow="Join the foundation" title="Interested in becoming a member?" description="Explore our official membership plans, executive designations, and apply for membership to become an active changemaker in our community." />
    
    <section className="section-pad" style={{ background: '#FAF9F6', paddingBottom: 0 }}>
      <div className="container">
        <MembershipPlans />
        <ExtendedMembershipForm />
      </div>
    </section>

    <section className="section-pad membership-section">
      <div className="container membership-layout">
        <div className="membership-information">
          <p className="eyebrow"><span /> Custom Enquiries</p>
          <h2>Have questions before applying?</h2>
          <p>Our executive team is available to assist you with queries regarding specific membership portfolios, regional committees, or corporate patron memberships.</p>
          <div className="membership-note"><UsersRound size={20} aria-hidden="true" /><p>You can also submit a direct email draft enquiry using the form on the right.</p></div>
          <Link className="text-link" href="/contact">Other ways to contact us <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="form-panel membership-form-panel"><p className="eyebrow"><span /> Ask about membership</p><h2>Send a membership enquiry</h2><EmailDraftForm formId="membership" subject="Membership information enquiry" submitLabel="Prepare membership enquiry" groups={groups} note="Please provide only information you are comfortable including in an email." /></div>
      </div>
    </section>
  </>;
}
