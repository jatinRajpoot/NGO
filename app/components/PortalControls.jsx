'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

const fontSizes = [12, 13, 14, 15, 16];
const defaultFontSize = 13;

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Treat unavailable storage as "no preference saved" instead of crashing.
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The control still works for this visit when storage is unavailable.
  }
}

export function PortalAccessibilityControls() {
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedFont = Number(readStorage('gsdd-portal-font-size'));
    const savedContrast = readStorage('gsdd-portal-high-contrast') === 'true';
    const nextFont = fontSizes.includes(savedFont) ? savedFont : defaultFontSize;
    setFontSize(nextFont);
    setHighContrast(savedContrast);
    document.documentElement.style.setProperty('--base-font-size', `${nextFont}px`);
    document.body.classList.toggle('high-contrast', savedContrast);
  }, []);

  function changeFont(delta) {
    const nextFont = Math.max(12, Math.min(16, fontSize + delta));
    setFontSize(nextFont);
    document.documentElement.style.setProperty('--base-font-size', `${nextFont}px`);
    writeStorage('gsdd-portal-font-size', String(nextFont));
  }

  function resetFont() {
    setFontSize(defaultFontSize);
    document.documentElement.style.setProperty('--base-font-size', `${defaultFontSize}px`);
    writeStorage('gsdd-portal-font-size', String(defaultFontSize));
  }

  function toggleContrast() {
    const next = !highContrast;
    setHighContrast(next);
    document.body.classList.toggle('high-contrast', next);
    writeStorage('gsdd-portal-high-contrast', String(next));
  }

  return <div className="portal-accessibility" role="group" aria-label="Accessibility controls">
    <span className="portal-control-label">Text size</span>
    <button type="button" onClick={() => changeFont(-1)} aria-label="Decrease text size" disabled={fontSize <= 12}>A−</button>
    <button type="button" onClick={resetFont} aria-label={`Reset text size to ${defaultFontSize} pixels`}>A</button>
    <button type="button" onClick={() => changeFont(1)} aria-label="Increase text size" disabled={fontSize >= 16}>A+</button>
    <button type="button" className="portal-contrast-toggle" onClick={toggleContrast} aria-pressed={highContrast}>{highContrast ? 'Standard view' : 'High contrast'}</button>
    <span className="sr-only" role="status">
      {`Text size ${fontSize} pixels. ${highContrast ? 'High contrast on.' : 'Standard contrast.'}`}
    </span>
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

function searchSitePages(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return [];
  return sitePages.filter((page) => `${page.label} ${page.terms}`.toLowerCase().includes(normalized));
}

export function PortalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const results = useMemo(() => searchSitePages(submittedQuery).slice(0, 6), [submittedQuery]);

  // Search results belong to the page where the search was made, so clear
  // them whenever navigation takes the visitor elsewhere.
  useEffect(() => {
    setSubmittedQuery('');
  }, [pathname]);

  useEffect(() => {
    if (submittedQuery) resultsRef.current?.focus();
  }, [submittedQuery]);

  function closeResults(refocus = false) {
    setSubmittedQuery('');
    if (refocus && inputRef.current) inputRef.current.focus();
  }

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const matches = searchSitePages(value);
    if (matches.length === 1) {
      // A single confident match jumps straight to the page; skip the panel
      // so it does not follow the visitor into the navigation.
      setSubmittedQuery('');
      router.push(matches[0].href);
      return;
    }
    setSubmittedQuery(value);
  }

  return <div className="portal-search-wrap" onKeyDown={(event) => { if (event.key === 'Escape' && submittedQuery) { event.preventDefault(); closeResults(true); } }}>
    <form className="portal-search" role="search" onSubmit={submitSearch}>
      <label className="sr-only" htmlFor="portal-site-search">Search this website</label>
      <input ref={inputRef} id="portal-site-search" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(''); }} placeholder="Search this website" autoComplete="off" />
      <button type="submit">Search</button>
    </form>
    {submittedQuery && <div ref={resultsRef} tabIndex={-1} className="portal-search-results" role="region" aria-label="Search results">
      <strong>Results for “{submittedQuery}”</strong>
      {results.length ? <ul>{results.map((page) => <li key={page.href}><Link href={page.href} onClick={() => closeResults()}>{page.label}</Link></li>)}</ul> : <p>No matching pages. Try “news”, “projects” or “contact”.</p>}
      <button type="button" className="portal-search-close" onClick={() => closeResults(true)}>Close results</button>
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
