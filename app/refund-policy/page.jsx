import PolicyPage from '../components/PolicyPage';
import { organization } from '../data/site-data';

export const metadata = { title: 'Donation Refund & Cancellation Policy | GSDD Foundation', description: 'Donation refund and recurring contribution cancellation information for GSDD Foundation.' };

export default function RefundPolicyPage() {
  return <PolicyPage title="Donation refund & cancellation policy" description="Information for donors about duplicate or accidental transactions and recurring contributions.">
    <h2>Refunds and cancellations</h2>
    <p>While charitable contributions are non-refundable once deployed into community programs, any duplicate deduction or accidental transaction reported within 7 working days to {organization.email} or {organization.phone} with transaction proof may be reviewed for refund to the original payment source within 7–10 working days, subject to the transaction provider’s process and prior to statutory Form 10BE filing.</p>
    <p>Recurring monthly donation pledges coordinated directly with the foundation can be discontinued upon written request. Contact the foundation with your request and sufficient transaction details to identify the contribution. Do not include full payment card details or passwords.</p>
    <h2>How to request help</h2>
    <p>Email {organization.email} or call {organization.phone}. Include the contribution date, amount, and transaction reference, but never send card PINs, passwords, or full account credentials.</p>
    <p>This website does not currently process donations or recurring payments. Contact the foundation to confirm the current payment and refund process before making a contribution.</p>
  </PolicyPage>;
}
