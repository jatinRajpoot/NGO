import { ArrowDown } from 'lucide-react';

const loginRoles = ['Management Login', 'Coordinator Login'];

export default function PortalLoginMenu() {
  return <details className="nav-item nav-dropdown portal-login-menu">
    <summary className="nav-link">Login <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" /></summary>
    <div className="nav-dropdown-menu portal-login-options" role="group" aria-label="Portal logins">
      {loginRoles.map((role) => <div className="portal-login-option" key={role}>
        <button type="button" disabled>{role}</button>
        <span className="portal-coming-soon">Coming soon</span>
      </div>)}
    </div>
  </details>;
}
