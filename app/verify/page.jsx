import { BadgeCheck, ShieldCheck, QrCode } from 'lucide-react';
import PageHero from '../components/PageHero';
import VerificationLookup from '../components/VerificationLookup';
import { organization } from '../data/site-data';

export const metadata = {
  title: 'Document & Certificate Verification | GSDD Foundation',
  description: 'Verify GSDD Foundation visitor certificates, member IDs, receipts, and appointment letters by QR code or serial reference.',
};

export default function VerifyPage() {
  return <>
    <PageHero eyebrow="Document verification" title="Check a document code." description="Scan a QR code from a printed document or enter the official reference code below to verify authenticity in the public registry." />
    <section className="section-pad verification-section">
      <div className="container verification-layout">
        <div className="verification-copy">
          <p className="eyebrow"><span /> Public Document Verification</p>
          <h2>Instant Official Registry Verification</h2>
          <p>Global Skills &amp; Digital Development Foundation issues verifiable certificates, membership ID cards, appointment letters, and Section 80G donation receipts backed by our digital verification database.</p>
          <div className="verification-caution" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' }}>
            <ShieldCheck size={22} aria-hidden="true" color="#15803D" />
            <p><strong>Government Registered Registry:</strong> All documents bearing CIN {organization.cin} or Darpan ID {organization.darpan} can be verified instantly with zero ambiguity.</p>
          </div>
        </div>
        <div className="verification-panel">
          <h2>Scan QR or Enter Document Code</h2>
          <VerificationLookup />
        </div>
      </div>
    </section>
  </>;
}
