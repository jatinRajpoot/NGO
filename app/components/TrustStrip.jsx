import { BadgeCheck } from 'lucide-react';
import { credentials } from '../data/site-data';

const items = [credentials[0], credentials[1], credentials[3], credentials[2], ['PAN / TAN', 'AANCG1860E / PTNG16847'], credentials[6]];

export default function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Statutory registrations">
      <div className="container trust-strip-inner">
        {items.map(([label, value]) => <div className="trust-item" key={label}>
          <BadgeCheck size={17} aria-hidden="true" />
          <span><small>{label}</small><strong>{value}</strong></span>
        </div>)}
      </div>
    </section>
  );
}
