import { BadgeCheck } from 'lucide-react';
import PageHero from '../components/PageHero';
import VerificationLookup from '../components/VerificationLookup';

export const metadata = {
  title: 'Document Verification | GSDD Foundation',
  description: 'Enter a public document verification code. Online verification is not yet connected.',
};

export default function VerifyPage() {
  return <>
    <PageHero eyebrow="Document verification" title="Check a document code." description="Use this page for a QR link or a code printed on a public GSDD Foundation document. Online verification is not connected yet, so this page cannot confirm validity." />
    <section className="section-pad verification-section">
      <div className="container verification-layout">
        <div className="verification-copy"><p className="eyebrow"><span /> Public document check</p><h2>Verification service unavailable</h2><p>Membership cards, certificates, appointment letters and receipts can only be confirmed against an official verification record. No verification service or public document data has been connected to this website.</p><div className="verification-caution"><BadgeCheck size={19} aria-hidden="true" /><p>Entering a code here does not establish that a document is valid or invalid. Contact the foundation using its published details for a manual enquiry.</p></div></div>
        <div className="verification-panel"><h2>Enter a reference code</h2><VerificationLookup /></div>
      </div>
    </section>
  </>;
}
