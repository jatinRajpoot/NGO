import { ShieldCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import CertificateRecipientHub from '../components/CertificateRecipientHub';
import VerificationLookup from '../components/VerificationLookup';
import { organization } from '../data/site-data';

export const metadata = {
  title: 'Certificate Verification & Recipient Portal | GSDD Foundation',
  description: 'Verify GSDD Foundation visitor certificates, member IDs, receipts, and appointment letters via QR code or official registry lookup.',
};

export default function VerifyPage() {
  return <>
    <PageHero
      eyebrow="Document verification"
      title="Check a document code."
      description="Verify certificate authenticity, receive certificates via email, scan document QR codes, and check appointment letters, membership IDs, and donation receipts."
    />
    <section className="section-pad verification-section">
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="verification-caution" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534', marginBottom: '28px' }}>
          <ShieldCheck size={22} aria-hidden="true" color="#15803D" />
          <p><strong>Government Registered Registry:</strong> Global Skills &amp; Digital Development Foundation (CIN {organization.cin}, Darpan ID {organization.darpan}) verifies official certificates, membership IDs, and 80G receipts against our registry.</p>
        </div>

        {/* Recipient Certificate Hub */}
        <div style={{ marginBottom: '40px' }}>
          <CertificateRecipientHub />
        </div>

        {/* Reference Lookup Section for direct codes */}
        <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E40AF', display: 'block', marginBottom: '4px' }}>
              Statutory Quick Lookup
            </span>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#0F172A' }}>
              Direct Document Reference Check
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Check appointment letters, volunteer certificates, and donation receipt numbers.
            </p>
          </div>
          <VerificationLookup />
        </div>
      </div>
    </section>
  </>;
}
