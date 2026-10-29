import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

const loginRoles = [
  { label: 'Management Login', href: '/admin/' },
  { label: 'Coordinator Login' },
];

export default function PortalLoginMenu() {
  return <details className="nav-item nav-dropdown portal-login-menu">
    <summary className="nav-link">Login <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" /></summary>
    <div className="nav-dropdown-menu portal-login-options" role="group" aria-label="Portal logins">
      {loginRoles.map(({ label, href }) => <div className="portal-login-option" key={label}>
        {href ? <Link href={href}>{label}</Link> : <button type="button" disabled>{label}</button>}
        {!href && <span className="portal-coming-soon">Coming soon</span>}
      </div>)}
    </div>
  </details>;
}
