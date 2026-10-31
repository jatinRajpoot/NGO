'use client';

import { useState, useRef, useEffect } from 'react';
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

function normalizePath(pathname) {
  if (!pathname) return '/';
  const clean = pathname.split('#')[0].split('?')[0];
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

function getActiveNavHref(pathname) {
  const current = normalizePath(pathname);
  if (current === '/') return '/';

  // 1. Exact top-level match takes highest precedence
  const directMatch = navItems.find((item) => item.href !== '/' && normalizePath(item.href) === current);
  if (directMatch) return directMatch.href;

  // 2. Canonical child ownership mapping (disambiguates shared and cross-linked routes)
  if (current === '/verify' || current.startsWith('/verify/')) return '/transparency';
  if (current === '/team' || current.startsWith('/team/')) return '/about';
  if (
    current === '/membership' || current.startsWith('/membership/') ||
    current === '/internships' || current.startsWith('/internships/')
  ) {
    return '/get-involved';
  }
  if (
    current === '/projects' || current.startsWith('/projects/') ||
    current === '/gallery' || current.startsWith('/gallery/') ||
    current === '/events' || current.startsWith('/events/') ||
    current === '/activities' || current.startsWith('/activities/') ||
    current === '/work-sectors' || current.startsWith('/work-sectors/')
  ) {
    return '/core-areas';
  }
  if (current === '/complaints' || current.startsWith('/complaints/')) return '/contact';

  // 3. Prefix match on top-level href
  const prefixMatch = navItems.find((item) => item.href !== '/' && current.startsWith(normalizePath(item.href) + '/'));
  if (prefixMatch) return prefixMatch.href;

  // 4. Any remaining child routes
  const childMatch = navItems.find((item) =>
    (item.children || []).some(([, href]) => {
      const childNorm = normalizePath(href);
      return childNorm === current || current.startsWith(childNorm + '/');
    })
  );
  if (childMatch) return childMatch.href;

  return null;
}

function DesktopNavItem({ item, activeHref, currentPath }) {
  const isActive = activeHref === item.href;
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDismissed(false);
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  if (!item.children) {
    return (
      <div className="nav-item" key={item.href}>
        <Link
          className="nav-link"
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
        >
          {item.label}
        </Link>
      </div>
    );
  }

  function handleContainerBlur(e) {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsDismissed(false);
      setIsOpen(false);
    }
  }

  function handleTriggerKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDismissed(false);
      setIsOpen(true);
      requestAnimationFrame(() => menuRef.current?.querySelector('a')?.focus());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDismissed(true);
    }
  }

  function handleMenuKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsDismissed(true);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const links = Array.from(menuRef.current?.querySelectorAll('a') || []);
      const currentIndex = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % links.length;
        links[nextIndex]?.focus();
      } else {
        if (currentIndex <= 0) {
          triggerRef.current?.focus();
        } else {
          links[currentIndex - 1]?.focus();
        }
      }
    }
  }

  const menuId = `desktop-menu-${item.href.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div
      ref={containerRef}
      className="nav-item nav-dropdown"
      key={item.href}
      onBlur={handleContainerBlur}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => { setIsDismissed(false); setIsOpen(true); }}
      onMouseLeave={() => {
        if (!containerRef.current?.contains(document.activeElement)) setIsOpen(false);
      }}
    >
      <Link
        ref={triggerRef}
        className="nav-link"
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        aria-haspopup="true"
        aria-expanded={isOpen && !isDismissed}
        aria-controls={menuId}
        onKeyDown={handleTriggerKeyDown}
      >
        {item.label}
        <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />
      </Link>
      <div
        id={menuId}
        ref={menuRef}
        className="nav-dropdown-menu"
        style={{ display: isOpen && !isDismissed ? 'grid' : 'none' }}
        role="group"
        aria-label={`${item.label} submenu`}
        onKeyDown={handleMenuKeyDown}
      >
        {item.children.map(([label, href]) => {
          const childPath = normalizePath(href);
          const isChildActive = currentPath === childPath;
          return (
            <Link
              href={href}
              key={href}
              aria-current={isChildActive ? 'page' : undefined}
              className={isChildActive ? 'active' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileNavItem({ item, activeHref, currentPath }) {
  const isActive = activeHref === item.href;
  const isDirectActive = currentPath === normalizePath(item.href);
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => { setIsOpen(isActive); }, [currentPath, isActive]);

  if (!item.children) {
    return (
      <div className="nav-item" key={item.href}>
        <Link
          className="nav-link"
          href={item.href}
          aria-current={isDirectActive ? 'page' : undefined}
        >
          {item.label}
        </Link>
      </div>
    );
  }

  return (
    <details
      className="nav-item mobile-nav-group"
      key={item.href}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary
        className="nav-link"
        aria-current={isDirectActive ? 'page' : (isActive ? 'true' : undefined)}
      >
        {item.label}
        <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />
      </summary>
      <div className="nav-dropdown-menu">
        <Link
          href={item.href}
          aria-current={isDirectActive ? 'page' : undefined}
          className={isDirectActive ? 'active' : undefined}
        >
          Overview
        </Link>
        {item.children.map(([label, href]) => {
          const childPath = normalizePath(href);
          const isChildActive = currentPath === childPath;
          return (
            <Link
              href={href}
              key={href}
              aria-current={isChildActive ? 'page' : undefined}
              className={isChildActive ? 'active' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function NavigationLinks({ mobile = false, pathname = '/' }) {
  const currentPath = normalizePath(pathname);
  const activeHref = getActiveNavHref(pathname);

  if (mobile) {
    return navItems.map((item) => (
      <MobileNavItem
        key={item.href}
        item={item}
        activeHref={activeHref}
        currentPath={currentPath}
      />
    ));
  }

  return navItems.map((item) => (
    <DesktopNavItem
      key={item.href}
      item={item}
      activeHref={activeHref}
      currentPath={currentPath}
    />
  ));
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
  const currentPath = normalizePath(pathname);
  const isDonate = currentPath === '/donate' || currentPath.startsWith('/donate/');
  const featuredSocials = socialLinks.filter(({ label }) =>
    ['WhatsApp Channel', 'Facebook', 'Instagram', 'YouTube', 'X'].includes(label)
  );

  return (
    <header className="site-header redesigned-site-header">
      <div className="redesign-utility-bar">
        <div className="home-container redesign-utility-inner">
          <nav className="redesign-socials" aria-label="Social media">
            {featuredSocials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                {socialAbbreviations[social.label]}
              </a>
            ))}
          </nav>
          <PortalAnnouncements />
          <div className="redesign-header-tools">
            <LanguageToggle />
            <a className="redesign-phone" href={`tel:${organization.phoneHref}`}>
              <Phone size={14} aria-hidden="true" />
              <span>{organization.phone}</span>
            </a>
            <PortalAccessibilityControls />
          </div>
        </div>
      </div>

      <div className="main-header redesign-main-header">
        <div className="home-container main-header-inner redesign-brand-row">
          <Link className="brand" href="/" aria-label={`${organization.shortName} home`}>
            <span className="brand-logo-wrap">
              <Image
                className="brand-logo"
                src="/logo.png"
                alt=""
                width={58}
                height={58}
                priority
              />
            </span>
            <span className="brand-copy">
              <strong>GSDD <span>FOUNDATION</span></strong>
              <small>GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</small>
              <small className="brand-hindi" lang="hi">ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन</small>
            </span>
          </Link>
          <div className="portal-header-actions redesign-header-actions">
            <PortalSearch />
            <Link
              className="button button-donate header-donate"
              href="/donate"
              aria-current={isDonate ? 'page' : undefined}
            >
              <Heart size={15} fill="currentColor" aria-hidden="true" /> Donate
            </Link>
            <MobileNavigation>
              <NavigationLinks mobile pathname={pathname} />
              <PortalLoginMenu />
              <Link
                className="button button-donate mobile-donate"
                href="/donate"
                aria-current={isDonate ? 'page' : undefined}
              >
                <Heart size={15} fill="currentColor" aria-hidden="true" /> Donate
              </Link>
            </MobileNavigation>
          </div>
        </div>
      </div>

      <div className="portal-nav-row redesigned-nav-row">
        <div className="home-container redesigned-nav-inner">
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavigationLinks pathname={pathname} />
            <PortalLoginMenu />
          </nav>
          <Link
            className="redesign-nav-donate"
            href="/donate"
            aria-current={isDonate ? 'page' : undefined}
          >
            <Heart size={14} fill="currentColor" aria-hidden="true" /> Donate
          </Link>
        </div>
      </div>
    </header>
  );
}
