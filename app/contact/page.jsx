import { Mail, MapPin, Phone, UserRound } from 'lucide-react';
import PageHero from '../components/PageHero';
import { ContactForm } from '../components/InquiryForm';
import { organization } from '../data/site-data';

export const metadata = {
  title: 'Contact GSDD Foundation',
  description: 'Contact Global Skills & Digital Development Foundation in Raniganj, Araria, Bihar.',
};

export default function ContactPage() {
  return <>
    <PageHero eyebrow="Contact GSDD Foundation" title="Tell us what you would like to make possible." description="Ask about volunteering, training, community initiatives, CSR partnerships, or donation documentation." image="/images/rural-community.jpg" imageAlt="Women and children gathered in a rural community" />
    <section className="section-pad contact-page-section">
      <div className="container contact-page-grid">
        <div className="contact-details-panel">
          <p className="eyebrow"><span /> Get in touch</p><h2>We’d be glad to hear from you.</h2>
          <div className="contact-detail-item"><span><MapPin size={19} aria-hidden="true" /></span><div><strong>Office address</strong><address>{organization.address}</address><a className="detail-small-link" href="https://maps.google.com/?q=Dhak+Bangla+Raniganj+Araria+Bihar" target="_blank" rel="noreferrer">Open map</a></div></div>
          <div className="contact-detail-item"><span><Phone size={19} aria-hidden="true" /></span><div><strong>Telephone &amp; WhatsApp</strong><a href={`tel:${organization.phoneHref}`}>{organization.phone}</a><a className="detail-small-link" href={`https://wa.me/${organization.phoneHref.replace('+', '')}`} target="_blank" rel="noreferrer">Start WhatsApp chat</a></div></div>
          <div className="contact-detail-item"><span><Mail size={19} aria-hidden="true" /></span><div><strong>Official inquiries</strong><a href={`mailto:${organization.email}`}>{organization.email}</a></div></div>
          <div className="contact-detail-item"><span><UserRound size={19} aria-hidden="true" /></span><div><strong>Founding leadership</strong><p>Manoj Kumar Bishwas · Founder / CEO<br />Arvind Kumar · Founder / MD</p></div></div>
        </div>
        <div className="form-panel contact-form-panel"><p className="eyebrow"><span /> Send an enquiry</p><h2>What would you like to discuss?</h2><p>This form prepares a message in your email application.</p><ContactForm /></div>
      </div>
    </section>
  </>;
}
