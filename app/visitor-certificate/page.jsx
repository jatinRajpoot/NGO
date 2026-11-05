import PageHero from '../components/PageHero';
import VisitorCertificatePortal from '../components/VisitorCertificatePortal';

export const metadata = {
  title: 'Visitor Certificate | GSDD Foundation',
  description: 'Request and download official Visitor, Guest and Participant Certificates for non-members from GSDD Foundation.',
};

export default function VisitorCertificatePage() {
  return (
    <>
      <PageHero
        eyebrow="Visitor Services"
        title="Visitor and Participant Certificate"
        description="Non-members, workshop attendees, community guests, and conclave participants can request and instantly download their official certificate."
      />
      <section className="section-pad" style={{ background: '#F9F8F5' }}>
        <div className="container">
          <VisitorCertificatePortal />
        </div>
      </section>
    </>
  );
}
