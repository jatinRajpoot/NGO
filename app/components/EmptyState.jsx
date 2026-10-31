import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function EmptyState({ eyebrow = 'No public listing', title, description, actionLabel, actionHref }) {
  return <div className="empty-state">
    <span className="empty-state-rule" aria-hidden="true" />
    <p className="eyebrow"><span />{eyebrow}</p>
    <h2>{title}</h2>
    <p className="empty-state-description">{description}</p>
    {actionLabel && actionHref && <Link className="text-link" href={actionHref}>{actionLabel}<ArrowRight size={16} aria-hidden="true" /></Link>}
  </div>;
}
