import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, Heart, Phone } from 'lucide-react';
import { organization } from '../data/site-data';
import MobileNavigation from './MobileNavigation';

const navItems = [
  { label: 'About', href: '/about' },
  {
    label: 'Our Work', href: '/projects', children: [
      ['Core Areas', '/core-areas'],
      ['Work Sectors', '/work-sectors'],
      ['Projects', '/projects'],
    ],
  },
  { label: 'Transparency', href: '/transparency' },
  { label: 'Get Involved', href: '/get-involved' },
  { label: 'Contact', href: '/contact' },
];

function NavigationLinks() {
  return navItems.map((item) => (
    <div className={item.children ? 'nav-item nav-dropdown' : 'nav-item'} key={item.href}>
      <Link className="nav-link" href={item.href}>
        {item.label}{item.children && <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />}
      </Link>
      {item.children && (
        <div className="nav-dropdown-menu">
          {item.children.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </div>
      )}
    </div>
  ));
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-inner">
          <div className="utility-contact">
            <a href={`tel:${organization.phoneHref}`}><Phone size={13} aria-hidden="true" /> Call GSDD: {organization.phone}</a>
          </div>
        </div>
      </div>
      <div className="main-header">
        <div className="container main-header-inner">
          <Link className="brand" href="/" aria-label={`${organization.shortName} home`}>
            <span className="brand-logo-wrap"><Image className="brand-logo" src="/logo.png" alt="" width={56} height={56} priority /></span>
            <span className="brand-copy">
              <strong>GSDD <span>FOUNDATION</span></strong>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation"><NavigationLinks /></nav>
          <Link className="button button-donate header-donate" href="/donate"><Heart size={16} fill="currentColor" aria-hidden="true" /> Donate</Link>
          <MobileNavigation>
            <NavigationLinks />
          </MobileNavigation>
        </div>
      </div>
    </header>
  );
}
