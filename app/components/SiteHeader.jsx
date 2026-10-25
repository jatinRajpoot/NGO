import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, Heart, Mail, MapPin, Phone } from 'lucide-react';
import { organization } from '../data/site-data';
import MobileNavigation from './MobileNavigation';

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: 'About Us', href: '/about', children: [
      ['Our Foundation', '/about#foundation'],
      ['Mission, Vision & Goal', '/about#mission'],
      ['13 Key Aims', '/about#aims'],
      ['Leadership', '/about#leadership'],
    ],
  },
  {
    label: 'Core Areas', href: '/core-areas', children: [
      ['Health Awareness', '/core-areas#health-awareness'],
      ['Education & Skills', '/core-areas#education-skills'],
      ['Digital Empowerment', '/core-areas#digital-empowerment'],
      ['Community Development', '/core-areas#community-development'],
      ['Women Empowerment', '/core-areas#women-empowerment'],
    ],
  },
  { label: 'Work Sectors', href: '/work-sectors' },
  { label: 'Projects', href: '/projects' },
  {
    label: 'Get Involved', href: '/get-involved', children: [
      ['Volunteer with us', '/get-involved#volunteer'],
      ['CSR partnerships', '/get-involved#partnerships'],
      ['Digital community', '/get-involved#community'],
    ],
  },
  { label: 'Transparency', href: '/transparency' },
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
            <a href="https://maps.google.com/?q=Raniganj+Araria+Bihar" target="_blank" rel="noreferrer"><MapPin size={13} aria-hidden="true" /> Raniganj, Araria, Bihar</a>
            <a href={`tel:${organization.phoneHref}`}><Phone size={13} aria-hidden="true" /> {organization.phone}</a>
            <a href={`mailto:${organization.email}`}><Mail size={13} aria-hidden="true" /> {organization.email}</a>
          </div>
          <div className="utility-trust">
            <span>NITI Aayog ID: {organization.darpan}</span>
            <span className="utility-divider" aria-hidden="true">/</span>
            <a href="https://whatsapp.com/channel/0029VbDI7zjElagzRp0vTp0t" target="_blank" rel="noreferrer">Join WhatsApp Channel <ArrowDown size={12} className="utility-external" aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <div className="main-header">
        <div className="container main-header-inner">
          <Link className="brand" href="/" aria-label={`${organization.shortName} home`}>
            <span className="brand-logo-wrap"><Image className="brand-logo" src="/logo.png" alt="" width={56} height={56} priority /></span>
            <span className="brand-copy">
              <strong>GSDD <span>FOUNDATION</span></strong>
              <small>Empowering People. Developing Skills. Transforming Communities.</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation"><NavigationLinks /></nav>
          <Link className="button button-donate header-donate" href="/donate"><Heart size={16} fill="currentColor" aria-hidden="true" /> Donate Now</Link>
          <MobileNavigation>
            <NavigationLinks />
            <Link className="button button-donate mobile-donate" href="/donate"><Heart size={16} fill="currentColor" aria-hidden="true" /> Donate Now</Link>
          </MobileNavigation>
        </div>
      </div>
    </header>
  );
}
