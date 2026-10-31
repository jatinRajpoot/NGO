import Link from 'next/link';
import { ArrowRight, BadgeCheck, ClipboardCheck, HeartHandshake, MessageCircle, ShieldCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import DonationChooser from '../components/DonationChooser';
import { organization } from '../data/site-data';

export const metadata = {
  title: 'Donate & Support | GSDD Foundation',
  description: 'Choose a contribution amount and contact GSDD Foundation for official payment instructions and 80G documentation details.',
};

const steps = [
  ['01', 'Choose an amount', 'Choose a suggested amount or enter a custom amount. A monthly choice is only a preference request.'],
  ['02', 'Contact the foundation', 'Request verified payment instructions directly from the official team.'],
  ['03', 'Confirm receipt details', 'Ask the team about applicable 80G documentation and receipt timing before paying.'],
];

export default function DonatePage() {
  return <>
    <PageHero eyebrow="Support our mission" title="A contribution can help open a door to opportunity." description="Support community learning, digital inclusion, health awareness, and livelihood opportunities. Contact the foundation for its current, official donation process." image="/hero-bg.jpg" imageAlt="Children learning together in a village" />
    <section className="donate-trust-band"><div className="container"><span><ShieldCheck size={16} aria-hidden="true" /> 80G identifier supplied: {organization.tax80g}</span><span><BadgeCheck size={16} aria-hidden="true" /> PAN: {organization.pan}</span><span><MessageCircle size={16} aria-hidden="true" /> Official assistance: {organization.phone}</span></div></section>
    <section className="section-pad donate-checkout-section">
      <div className="container donate-layout">
        <div className="donate-assurance">
          <p className="eyebrow"><span /> Give with clarity</p>
          <h2>Your support can help communities build skills and access information.</h2>
          <p>Confirm the current programme allocation, official payment instructions, tax eligibility and donation documentation with the foundation before transferring funds.</p>
          <div className="donate-assurance-list">
            <div><HeartHandshake size={20} aria-hidden="true" /><span><strong>Community-focused</strong><small>Support learning, livelihoods, health awareness, or local initiatives.</small></span></div>
            <div><ClipboardCheck size={20} aria-hidden="true" /><span><strong>Ask about documentation</strong><small>Section 80G identifier supplied: {organization.tax80g} · PAN: {organization.pan}. Confirm current eligibility and receipts with the foundation.</small></span></div>
            <div><ShieldCheck size={20} aria-hidden="true" /><span><strong>Confirm before paying</strong><small>Ask the foundation for verified payment instructions and receipt process.</small></span></div>
          </div>
          <div className="donate-contact-card"><span>Donor support</span><a href={`tel:${organization.phoneHref}`}>{organization.phone}</a><a href={`mailto:${organization.email}`}>{organization.email}</a></div>
        </div>
        <DonationChooser />
      </div>
    </section>
    <section className="section-pad donation-steps-section">
      <div className="container"><div className="section-heading section-heading-centered"><p className="eyebrow"><span /> How to contribute</p><h2>Three clear steps.</h2><p>Donation support is currently coordinated directly with the foundation.</p></div><div className="donation-steps-grid">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="payment-status-note">This website does not collect donor PAN or process UPI, cards, or net banking. No bank account details or payment gateway credentials were included in the supplied brief.</p><div className="section-action"><Link className="text-link" href="/transparency">Review the statutory directory <ArrowRight size={16} aria-hidden="true" /></Link></div></div>
    </section>
  </>;
}
