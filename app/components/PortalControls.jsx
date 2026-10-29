'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const sitePages = [
  { label: 'Home', href: '/', terms: 'home foundation welcome' },
  { label: 'About the foundation', href: '/about', terms: 'about mission vision organisation organization' },
  { label: 'Management team', href: '/team', terms: 'team founders leadership people' },
  { label: 'Projects', href: '/projects', terms: 'projects programmes programs' },
  { label: 'Photo gallery', href: '/gallery', terms: 'activities photos gallery pictures media' },
  { label: 'Core areas', href: '/core-areas', terms: 'focus areas health education skills digital women' },
  { label: 'Work sectors', href: '/work-sectors', terms: 'sectors services' },
  { label: 'News and updates', href: '/news', terms: 'news updates latest circular announcements' },
  { label: 'Events', href: '/events', terms: 'events camps' },
  { label: 'Campaigns', href: '/campaigns', terms: 'campaign donation fundraising' },
  { label: 'Membership', href: '/membership', terms: 'membership join member' },
  { label: 'Volunteer', href: '/get-involved#volunteer', terms: 'volunteer volunteering participate' },
  { label: 'Complaints and suggestions', href: '/complaints', terms: 'complaint grievance feedback suggestion' },
  { label: 'Verify a document', href: '/verify', terms: 'verify verification document certificate' },
  { label: 'Transparency and registrations', href: '/transparency', terms: 'transparency registration credentials' },
  { label: 'Contact', href: '/contact', terms: 'contact email phone address' },
  { label: 'Privacy policy', href: '/privacy-policy', terms: 'privacy personal data' },
  { label: 'Terms of use', href: '/terms', terms: 'terms use website' },
  { label: 'Refund policy', href: '/refund-policy', terms: 'refund donation policy' },
];

export function PortalAccessibilityControls() {
  const [fontSize, setFontSize] = useState(13);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedFont = Number(window.localStorage.getItem('gsdd-portal-font-size'));
    const savedContrast = window.localStorage.getItem('gsdd-portal-high-contrast') === 'true';
    const nextFont = [12, 13, 14, 15, 16].includes(savedFont) ? savedFont : 13;
    setFontSize(nextFont);
    setHighContrast(savedContrast);
    document.documentElement.style.setProperty('--base-font-size', `${nextFont}px`);
    document.body.classList.toggle('high-contrast', savedContrast);
  }, []);

  function changeFont(delta) {
    const nextFont = Math.max(12, Math.min(16, fontSize + delta));
    setFontSize(nextFont);
    document.documentElement.style.setProperty('--base-font-size', `${nextFont}px`);
    window.localStorage.setItem('gsdd-portal-font-size', String(nextFont));
  }

  function resetFont() {
    setFontSize(13);
    document.documentElement.style.setProperty('--base-font-size', '13px');
    window.localStorage.setItem('gsdd-portal-font-size', '13');
  }

  function toggleContrast() {
    const next = !highContrast;
    setHighContrast(next);
    document.body.classList.toggle('high-contrast', next);
    window.localStorage.setItem('gsdd-portal-high-contrast', String(next));
  }

  return <div className="portal-accessibility" aria-label="Accessibility controls">
    <span className="portal-control-label">Text size</span>
    <button type="button" onClick={() => changeFont(-1)} aria-label="Decrease text size" disabled={fontSize <= 12}>A−</button>
    <button type="button" onClick={resetFont} aria-label="Reset text size">A</button>
    <button type="button" onClick={() => changeFont(1)} aria-label="Increase text size" disabled={fontSize >= 16}>A+</button>
    <button type="button" className="portal-contrast-toggle" onClick={toggleContrast} aria-pressed={highContrast}>{highContrast ? 'Standard view' : 'High contrast'}</button>
  </div>;
}

export function PortalClock() {
  const [dateTime, setDateTime] = useState('');
  useEffect(() => {
    const update = () => setDateTime(new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <time className="portal-clock" aria-label={dateTime ? `Current Indian Standard Time: ${dateTime}` : 'Indian Standard Time clock'}>{dateTime || 'IST clock loading'} <strong>IST</strong></time>;
}

export function PortalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const results = useMemo(() => {
    const normalized = submittedQuery.trim().toLowerCase();
    if (!normalized) return [];
    return sitePages.filter((page) => `${page.label} ${page.terms}`.toLowerCase().includes(normalized)).slice(0, 6);
  }, [submittedQuery]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const matches = sitePages.filter((page) => `${page.label} ${page.terms}`.toLowerCase().includes(value.toLowerCase()));
    setSubmittedQuery(value);
    if (matches.length === 1) router.push(matches[0].href);
  }

  return <div className="portal-search-wrap">
    <form className="portal-search" role="search" onSubmit={submitSearch}>
      <label className="sr-only" htmlFor="portal-site-search">Search this website</label>
      <input id="portal-site-search" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(''); }} placeholder="Search this website" autoComplete="off" />
      <button type="submit">Search</button>
    </form>
    {submittedQuery && <div className="portal-search-results" role="region" aria-label="Search results">
      <strong>Results for “{submittedQuery}”</strong>
      {results.length ? <ul>{results.map((page) => <li key={page.href}><Link href={page.href} onClick={() => setSubmittedQuery('')}>{page.label}</Link></li>)}</ul> : <p>No matching pages. Try “news”, “projects” or “contact”.</p>}
      <button type="button" className="portal-search-close" onClick={() => setSubmittedQuery('')}>Close results</button>
    </div>}
  </div>;
}

const announcements = [
  { text: 'News and updates: no public articles have been published yet.', href: '/news' },
  { text: 'Events: no upcoming public events are listed.', href: '/events' },
  { text: 'Campaigns: no public fundraising campaigns are listed.', href: '/campaigns' },
];

export function PortalAnnouncements() {
  const [index, setIndex] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setManualPaused(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (manualPaused) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % announcements.length), 6000);
    return () => window.clearInterval(timer);
  }, [manualPaused]);

  return <div className="portal-announcements">
    <strong className="portal-announcements-label">Latest announcements</strong>
    <Link className="portal-announcement-link" href={announcements[index].href}>{announcements[index].text}</Link>
    <button type="button" className="portal-announcement-control" onClick={() => setManualPaused((value) => !value)} aria-label={manualPaused ? 'Play announcements' : 'Pause announcements'}>{manualPaused ? 'Play' : 'Pause'}</button>
  </div>;
}
