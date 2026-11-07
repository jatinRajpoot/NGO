import { BadgeCheck, ShieldCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import CertificateRecipientHub from '../components/CertificateRecipientHub';
import VerificationLookup from '../components/VerificationLookup';

export const metadata = {
  title: 'Certificate Verification & Recipient Portal | GSDD Foundation',
  description: 'Verify certificate authenticity, receive certificates via email, scan QR codes, search certificate IDs, and view, print or download official Section 8 certificates.',
};

export default function VerifyPage() {
  return <>
    <PageHero
      eyebrow="Document verification"
      title="Check a document code."
      description="Check a document code. Verify authenticity, receive certificates via email, scan document QR codes, and view, download, or print genuine Section 8 non-profit credentials."
    />
    <section className="section-pad verification-section">
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Recipient Certificate Hub (Features 1 - 8) */}
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
