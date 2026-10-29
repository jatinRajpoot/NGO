'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowDown, Heart, Phone } from 'lucide-react';
import { organization, socialLinks } from '../data/site-data';
import MobileNavigation from './MobileNavigation';
import { LanguageToggle } from './LanguageProvider';
import PortalLoginMenu from './PortalLoginMenu';
import { PortalAccessibilityControls, PortalAnnouncements, PortalSearch } from './PortalControls';

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: 'About us', href: '/about', children: [
      ['Our foundation', '/about#foundation'],
      ['Mission & vision', '/about#mission'],
      ['Management team', '/team'],
      ['Transparency', '/transparency'],
    ],
  },
  {
    label: 'Our work', href: '/core-areas', children: [
      ['Focus areas', '/core-areas'],
      ['Projects', '/projects'],
      ['Photo gallery', '/gallery'],
      ['Events', '/events'],
    ],
  },
  {
    label: 'Get involved', href: '/get-involved', children: [
      ['Membership', '/membership'],
      ['Volunteer with us', '/get-involved#volunteer'],
      ['Internships', '/internships'],
      ['Partnerships', '/get-involved#partnerships'],
    ],
  },
  { label: 'Campaigns', href: '/campaigns' },
  {
    label: 'News & updates', href: '/news', children: [
      ['News and updates', '/news'],
      ['Photo gallery', '/gallery'],
      ['Upcoming events', '/events'],
    ],
  },
  {
    label: 'Transparency', href: '/transparency', children: [
      ['Registration details', '/transparency'],
      ['Document verification', '/verify'],
    ],
  },
  { label: 'Contact', href: '/contact' },
];

function isCurrent(item, pathname) {
  if (item.href === '/') return pathname === '/';
  const routes = [item.href, ...(item.children || []).map(([, href]) => href.split('#')[0])];
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function NavigationLinks({ mobile = false, pathname = '/' }) {
  return navItems.map((item) => {
    const active = isCurrent(item, pathname);
    if (mobile && item.children) {
      return <details className="nav-item mobile-nav-group" key={item.href}>
        <summary className="nav-link" aria-current={active ? 'page' : undefined}>{item.label}<ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" /></summary>
        <div className="nav-dropdown-menu">
          <Link href={item.href}>Overview</Link>
          {item.children.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </div>
      </details>;
    }
    return <div className={item.children ? 'nav-item nav-dropdown' : 'nav-item'} key={item.href}>
      <Link className="nav-link" href={item.href} aria-current={active ? 'page' : undefined}>
        {item.label}{item.children && <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />}
      </Link>
      {item.children && <div className="nav-dropdown-menu">{item.children.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>}
    </div>;
  });
}

const socialAbbreviations = {
  'WhatsApp Channel': 'wa',
  Telegram: 'tg',
  YouTube: 'yt',
  LinkedIn: 'in',
  Facebook: 'f',
  Instagram: 'ig',
  X: '𝕏',
};

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const featuredSocials = socialLinks.filter(({ label }) => ['WhatsApp Channel', 'Facebook', 'Instagram', 'YouTube', 'X'].includes(label));

  return <header className="site-header redesigned-site-header">
    <div className="redesign-utility-bar">
      <div className="home-container redesign-utility-inner">
        <nav className="redesign-socials" aria-label="Social media">
          {featuredSocials.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>{socialAbbreviations[social.label]}</a>)}
        </nav>
        <PortalAnnouncements />
        <div className="redesign-header-tools">
          <LanguageToggle />
          <a className="redesign-phone" href={`tel:${organization.phoneHref}`}><Phone size={14} aria-hidden="true" /><span>{organization.phone}</span></a>
          <PortalAccessibilityControls />
        </div>
      </div>
    </div>

    <div className="main-header redesign-main-header">
      <div className="home-container main-header-inner redesign-brand-row">
        <Link className="brand" href="/" aria-label={`${organization.shortName} home`}>
          <span className="brand-logo-wrap"><Image className="brand-logo" src="/logo.png" alt="" width={58} height={58} priority /></span>
          <span className="brand-copy">
            <strong>GSDD <span>FOUNDATION</span></strong>
            <small>GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</small>
            <small className="brand-hindi" lang="hi">ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन</small>
          </span>
        </Link>
        <div className="portal-header-actions redesign-header-actions">
          <PortalSearch />
          <Link className="button button-donate header-donate" href="/donate"><Heart size={15} fill="currentColor" aria-hidden="true" /> Donate</Link>
          <MobileNavigation>
            <NavigationLinks mobile pathname={pathname} />
            <PortalLoginMenu />
            <Link className="button button-donate mobile-donate" href="/donate"><Heart size={15} fill="currentColor" aria-hidden="true" /> Donate</Link>
          </MobileNavigation>
        </div>
      </div>
    </div>

    <div className="portal-nav-row redesigned-nav-row">
      <div className="home-container redesigned-nav-inner">
        <nav className="desktop-nav" aria-label="Main navigation"><NavigationLinks pathname={pathname} /><PortalLoginMenu /></nav>
        <Link className="redesign-nav-donate" href="/donate"><Heart size={14} fill="currentColor" aria-hidden="true" /> Donate</Link>
      </div>
    </div>
  </header>;
}
