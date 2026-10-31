import { AlertTriangle } from 'lucide-react';
import EmailDraftForm from '../components/EmailDraftForm';
import PageHero from '../components/PageHero';
import { organization } from '../data/site-data';

export const metadata = {
  title: 'Complaints & Suggestions | GSDD Foundation',
  description: 'Share a complaint or suggestion with Global Skills & Digital Development Foundation by preparing an email.',
};

const groups = [
  { legend: 'Your feedback', fields: [
    { name: 'type', label: 'I would like to share a', type: 'select', options: ['Complaint', 'Suggestion'] },
    { name: 'description', label: 'Describe your complaint or suggestion', type: 'textarea', rows: 6 },
  ] },
  { legend: 'How the foundation can contact you', fields: [
    { name: 'name', label: 'Name', autoComplete: 'name', optional: true },
    { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', optional: true },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', autoComplete: 'tel', optional: true },
  ] },
];

export default function ComplaintsPage() {
  return <>
    <PageHero eyebrow="Complaints & suggestions" title="Help us hear what needs attention." description="Share feedback with the foundation using an email draft. This public website does not have a complaint submission or case-tracking service connected." />
    <section className="section-pad complaints-section">
      <div className="container complaints-layout">
        <aside className="complaint-safety-note"><AlertTriangle size={22} aria-hidden="true" /><div><h2>Before you write</h2><p>Your message is prepared in your email app and is not sent or stored by this website. No reference number will be created here.</p><p>Please avoid including passwords, bank details or other highly sensitive personal information. For urgent concerns, contact the foundation directly by phone.</p><a href={`tel:${organization.phoneHref}`}>Call {organization.phone}</a></div></aside>
        <div className="form-panel complaint-form-panel"><p className="eyebrow"><span /> Feedback form</p><h2>Complaint or suggestion</h2><EmailDraftForm formId="complaint" subject="Website complaint or suggestion" submitLabel="Prepare email draft" groups={groups} note="You may leave contact details blank. Include a safe way for the foundation to follow up only if you want a reply." /></div>
      </div>
    </section>
  </>;
}
