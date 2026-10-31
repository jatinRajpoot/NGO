import Link from 'next/link';
import { ArrowRight, UsersRound } from 'lucide-react';
import EmailDraftForm from '../components/EmailDraftForm';
import PageHero from '../components/PageHero';

export const metadata = {
  title: 'Membership | GSDD Foundation',
  description: 'Ask Global Skills & Digital Development Foundation for current membership information and registration steps.',
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
    <PageHero eyebrow="Join the foundation" title="Interested in becoming a member?" description="Contact GSDD Foundation to ask about current membership options and the steps to join." />
    <section className="section-pad membership-section">
      <div className="container membership-layout">
        <div className="membership-information">
          <p className="eyebrow"><span /> Membership information</p>
          <h2>Start with a conversation.</h2>
          <p>The public information supplied for this website does not include membership benefits, designations, fees or payment steps. We will not guess at those details or show a payment form until they are confirmed.</p>
          <div className="membership-note"><UsersRound size={20} aria-hidden="true" /><p>Use the form to prepare an enquiry to the foundation. This is not a completed registration and does not create a membership record.</p></div>
          <Link className="text-link" href="/contact">Other ways to contact us <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="form-panel membership-form-panel"><p className="eyebrow"><span /> Ask about membership</p><h2>Send a membership enquiry</h2><EmailDraftForm formId="membership" subject="Membership information enquiry" submitLabel="Prepare membership enquiry" groups={groups} note="Please provide only information you are comfortable including in an email." /></div>
      </div>
    </section>
  </>;
}
