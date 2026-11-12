import { BriefcaseBusiness } from 'lucide-react';
import EmailDraftForm from '../components/EmailDraftForm';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import PublicInternshipsBoard from '../components/PublicInternshipsBoard';
import { listInternships } from '../lib/operations-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Internships | GSDD Foundation',
  description: 'Check current internship information and send an enquiry to Global Skills & Digital Development Foundation.',
};

const groups = [
  { legend: 'Student details', fields: [
    { name: 'name', label: 'Full name', autoComplete: 'name' },
    { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', autoComplete: 'tel', optional: true },
    { name: 'study', label: 'Course and institution' },
  ] },
  { legend: 'Your enquiry', fields: [
    { name: 'interest', label: 'Area of interest', type: 'select', options: ['Education and skills', 'Digital inclusion', 'Health awareness', 'Community development', 'Women’s empowerment', 'Other'] },
    { name: 'availability', label: 'Availability or preferred dates', type: 'text', optional: true },
    { name: 'message', label: 'Brief introduction', type: 'textarea', rows: 3 },
  ] },
];

export default async function InternshipsPage() {
  const internships = await listInternships({ publicOnly: true });

  return <>
    <PageHero eyebrow="Internships" title="Learn through community-centred work." description="Internship opportunities will be listed here when programme details and application requirements are confirmed." />
    <section className="section-pad internship-section">
      <div className="container internship-layout">
        <div className="internship-listing">
          {internships.length === 0 ? (
            <EmptyState eyebrow="Available opportunities" title="No internship programmes are listed right now." description="There are no current programme dates, eligibility requirements or application deadlines available on this site." />
          ) : (
            <PublicInternshipsBoard initialInternships={internships} />
          )}
          <div className="internship-note"><BriefcaseBusiness size={20} aria-hidden="true" /><p>Submit an application directly for active tracks above, or use the enquiry form for future cohorts.</p></div>
        </div>
        <div className="form-panel internship-form-panel"><p className="eyebrow"><span /> Ask about future openings</p><h2>Send an internship enquiry</h2><EmailDraftForm formId="internship" subject="Internship opportunities enquiry" submitLabel="Prepare enquiry email" groups={groups} note="Do not attach identity documents or sensitive personal information to this enquiry." /></div>
      </div>
    </section>
  </>;
}
