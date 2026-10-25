import PolicyPage from '../components/PolicyPage';
import { organization } from '../data/site-data';

export const metadata = { title: 'Privacy Policy | GSDD Foundation', description: 'How GSDD Foundation handles information when you contact or support the organization.' };

export default function PrivacyPolicyPage() {
  return <PolicyPage title="Privacy policy" description="How information is handled when you contact or support GSDD Foundation.">
    <h2>Information and contact</h2>
    <p>{organization.legalName} (CIN: {organization.cin}) respects individual privacy. This website does not submit or store contact form data on its servers. When you submit an enquiry or volunteer form, your email application opens with a draft addressed to the foundation; you choose whether to send it. WhatsApp links open the official chat service.</p>
    <p>If you contact the foundation or make a donation through a separate official process, you may provide details such as your name, email, mobile number, address, or PAN so the team can respond and, where applicable, manage donation records and statutory reporting. Please confirm how those details will be handled directly with the foundation before sharing sensitive information.</p>
    <h2>Payment and third-party services</h2>
    <p>This website does not process donations, collect PAN details, or issue tax receipts. External services such as email, maps, social networks, and WhatsApp are governed by their own privacy terms. Do not send PAN or payment credentials through an unsecured message.</p>
    <h2>Contact</h2>
    <p>For privacy questions, contact {organization.email} or call {organization.phone}.</p>
  </PolicyPage>;
}
