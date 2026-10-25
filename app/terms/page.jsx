import PolicyPage from '../components/PolicyPage';
import { organization } from '../data/site-data';

export const metadata = { title: 'Terms & Conditions | GSDD Foundation', description: 'Terms for using the GSDD Foundation website.' };

export default function TermsPage() {
  return <PolicyPage title="Terms & conditions" description="Terms for using the GSDD Foundation website.">
    <h2>Use of this website</h2>
    <p>Use of https://gsddfoundation.org is governed by Indian law. The information on this site is provided to introduce the foundation and its stated areas of work. Program descriptions may be plans or areas of focus and should not be read as confirmation that an activity has already taken place.</p>
    <h2>Content and contributions</h2>
    <p>All text, emblems, and visual assets are the property of GSDD Foundation or their respective rights holders. Charitable contributions are voluntary. This website does not process payments; contact the foundation directly for current official payment instructions and applicable documentation.</p>
    <h2>Jurisdiction</h2>
    <p>Legal disputes are subject to the exclusive jurisdiction of the competent courts in Araria, Bihar.</p>
    <h2>Organization</h2>
    <p>{organization.legalName}<br />CIN: {organization.cin}<br />{organization.address}</p>
  </PolicyPage>;
}
