'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp,
  FileText, FolderKanban, HandCoins, Image as ImageIcon, LayoutDashboard, Loader2, LogOut,
  Megaphone, Menu, Settings, Users, X,
} from 'lucide-react';
import GalleryManager from './GalleryManager';

const sections = [
  {
    key: 'overview',
    label: 'Overview',
    group: 'Workspace',
    icon: LayoutDashboard,
    title: 'Overview',
    description: 'One place to see programs, reach, and funding across the foundation.',
    features: ['Program snapshot and people reached', 'Donation trend and funding goal', 'Items that need a look'],
  },
  {
    key: 'programs',
    label: 'Programs',
    group: 'Workspace',
    icon: FolderKanban,
    title: 'Programs',
    description: 'Track every program, its focus area, location, and delivery progress.',
    features: ['Create and edit program records', 'Progress against each program plan', 'Status updates for the team'],
  },
  {
    key: 'impact',
    label: 'People reached',
    group: 'Workspace',
    icon: Users,
    title: 'People reached',
    description: 'Measure who the foundation reaches, where, and through which program.',
    features: ['Reach by focus area and location', 'Year-to-date and financial-year totals', 'Breakdowns by program and activity'],
  },
  {
    key: 'donations',
    label: 'Donations',
    group: 'Workspace',
    icon: HandCoins,
    title: 'Donations',
    description: 'See funds received, donor records, and progress against the funding goal.',
    features: ['Donation ledger and receipts', 'Funding goal tracking', 'Donor communication history'],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    group: 'Manage',
    icon: ImageIcon,
    title: 'Gallery',
    live: true,
  },
  {
    key: 'reports',
    label: 'Reports',
    group: 'Manage',
    icon: FileText,
    title: 'Reports',
    description: 'Prepare activity and impact reports for the board, donors, and partners.',
    features: ['Quarterly activity reports', 'Exportable impact summaries', 'Report review and sign-off'],
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    group: 'Manage',
    icon: Megaphone,
    title: 'Campaigns',
    description: 'Plan fundraising campaigns and follow each one from launch to close.',
    features: ['Campaign targets and timelines', 'Donations attributed to each campaign', 'Campaign performance summaries'],
  },
  {
    key: 'events',
    label: 'Events',
    group: 'Manage',
    icon: CalendarDays,
    title: 'Events',
    description: 'Schedule community activities, camps, and workshops with the team.',
    features: ['Upcoming activity calendar', 'Venue and time confirmations', 'Attendance after each event'],
  },
  {
    key: 'settings',
    label: 'Settings',
    group: 'Settings',
    icon: Settings,
    title: 'Settings',
    description: 'Manage the foundation profile, team access, and dashboard preferences.',
    features: ['Foundation profile and contact details', 'Team members and permissions', 'Notification preferences'],
  },
];

const navGroups = [
  { label: 'Workspace', keys: ['overview', 'programs', 'impact', 'donations'] },
  { label: 'Manage', keys: ['gallery', 'reports', 'campaigns', 'events'] },
];

const sectionByKey = Object.fromEntries(sections.map((section) => [section.key, section]));

function formatToday() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function ComingSoonSection({ section, onOpenGallery }) {
  const Icon = section.icon;
  return <section className="admin-coming-soon" aria-label={`${section.title} coming soon`}>
    <div className="admin-coming-soon-main">
      <span className="admin-coming-soon-icon"><Icon size={24} strokeWidth={1.7} /></span>
      <span className="admin-coming-soon-tag">COMING SOON</span>
      <h2>In the meantime</h2>
      <p className="admin-coming-soon-copy">This section is being built. It will bring you:</p>
      <ul className="admin-coming-soon-list">
        {section.features.map((feature) => <li key={feature}><Check size={14} /> {feature}</li>)}
      </ul>
    </div>
    <div className="admin-coming-soon-foot">
      <span>Only the Media Gallery is live right now.</span>
      <button className="admin-text-link" type="button" onClick={onOpenGallery}>Open gallery <ArrowRight size={14} /></button>
    </div>
  </section>;
}

export default function AdminDashboard() {
  // Gallery is the only live section, so it is the landing view.
  const [activeKey, setActiveKey] = useState('gallery');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPreviewNotice, setShowPreviewNotice] = useState(true);
  const [toast, setToast] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const activeSection = sectionByKey[activeKey] ?? sectionByKey.gallery;
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };

  // Keep the section in the URL hash so a refresh returns to the same place.
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '');
    if (sectionByKey[fromHash]) setActiveKey(fromHash);
  }, []);

  const selectSection = (key) => {
    setActiveKey(key);
    setMenuOpen(false);
    if (window.location.hash !== `#${key}`) {
      window.history.replaceState(null, '', `#${key}`);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');

    try {
      const response = await fetch('/api/admin/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let message = 'Unable to sign out. Please try again.';
        try {
          const data = await response.json();
          if (data?.error === 'forbidden_origin') {
            message = 'Unable to sign out. Refresh the page and try again.';
          }
        } catch {}
        setLogoutError(message);
        notify(message);
        return;
      }
      window.location.assign('/admin/login/');
    } catch (error) {
      const message = 'Unable to sign out. Check your connection and try again.';
      setLogoutError(message);
      notify(message);
    } finally {
      setLoggingOut(false);
    }
  };

  const renderNavLink = (section, extraClass = '') => {
    const { key, label, icon: Icon } = section;
    return <a
      key={key}
      href={`#${key}`}
      className={`admin-nav-link${extraClass ? ` ${extraClass}` : ''}${activeKey === key ? ' is-active' : ''}`}
      aria-current={activeKey === key ? 'page' : undefined}
      onClick={(event) => { event.preventDefault(); selectSection(key); }}
    >
      <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{!section.live && <small className="admin-nav-soon">Soon</small>}
    </a>;
  };

  return <div className="admin-root">
    <aside className={`admin-sidebar${menuOpen ? ' admin-sidebar-open' : ''}`}>
      <a className="admin-brand" href="/admin/" aria-label="GSDD Foundation dashboard">
        <span className="admin-brand-mark">G</span><span className="admin-brand-word">GSDD<span>FOUNDATION</span></span>
      </a>
      <div className="admin-workspace-switch"><span className="admin-workspace-avatar">GF</span><span><strong>Foundation workspace</strong><small>Raniganj, Bihar</small></span><ChevronDown size={15} /></div>
      <nav className="admin-nav" aria-label="Dashboard navigation">
        {navGroups.map((group) => <div className="admin-nav-group" key={group.label}>
          <p className="admin-nav-heading">{group.label}</p>
          {group.keys.map((key) => renderNavLink(sectionByKey[key]))}
        </div>)}
      </nav>
      <div className="admin-sidebar-spacer" />
      <div className="admin-sidebar-note"><span className="admin-help-icon"><CircleHelp size={16} /></span><span><strong>Need a hand?</strong><small>Visit the help centre</small></span><ArrowRight size={14} /></div>
      {renderNavLink(sectionByKey.settings, 'admin-settings-link')}
      <div className="admin-user-card">
        <span className="admin-user-avatar">FA</span>
        <span><strong>Foundation Admin</strong><small>Administrator</small></span>
        <button
          className="admin-icon-button"
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          title="Sign out"
          style={{ marginLeft: 'auto', color: '#aab3c7', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
        >
          {loggingOut ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={17} />}
        </button>
      </div>
      <div className="admin-sidebar-foot">GSDD FOUNDATION <span>•</span> ADMIN OPERATIONS</div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="admin-icon-button admin-mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <div className="admin-breadcrumb"><span>{activeSection.group === 'Settings' ? 'Workspace' : activeSection.group}</span><ChevronRight size={14} /><strong>{activeSection.label}</strong></div>
        <div className="admin-topbar-actions">
          <div className="admin-notification-wrap"><button className="admin-icon-button admin-bell" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} /><i /></button>
            {notificationsOpen && <div className="admin-notification-popover"><div><strong>Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15} /></button></div><p><span className="admin-notice-dot" /><span><b>Media Gallery is live</b><small>Connected to active storage</small></span></p><p><span className="admin-notice-dot admin-notice-dot-gold" /><span><b>Other sections are coming soon</b><small>Dashboard build in progress</small></span></p><button className="admin-notifications-link" type="button" onClick={() => { setNotificationsOpen(false); selectSection('gallery'); }}>Open gallery <ArrowRight size={13} /></button></div>}
          </div>
          <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={14} /></a>
          <button
            className="admin-button admin-button-outline"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-busy={loggingOut}
            title="Sign out of administration dashboard"
          >
            {loggingOut ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing out…</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>Sign out</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="admin-content">
        {activeSection.live && <GalleryManager />}
        {!activeSection.live && <section className="admin-welcome">
          <div>
            <p className="admin-date"><CalendarDays size={14} /> {formatToday()}</p>
            <h1>{activeSection.title}</h1>
            <p className="admin-welcome-copy">{activeSection.description}</p>
          </div>
          <div className="admin-welcome-actions"><span className="admin-sync-status admin-sync-soon"><i /> Coming soon</span></div>
        </section>}

        {showPreviewNotice && <div className="admin-preview-banner"><span className="admin-preview-symbol">i</span><p><strong>Dashboard preview</strong><span>Only the Media Gallery is live and connected to active storage. Every other section is marked coming soon.</span></p><button type="button" onClick={() => setShowPreviewNotice(false)} aria-label="Dismiss preview notice"><X size={15} /></button></div>}
        {logoutError && <div className="admin-preview-banner" role="alert" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b', marginBottom: 16 }}><span className="admin-preview-symbol" style={{ background: '#ef4444', color: '#fff' }}>!</span><p><strong>Sign out notice</strong><span>{logoutError}</span></p></div>}

        {!activeSection.live && <ComingSoonSection section={activeSection} onOpenGallery={() => selectSection('gallery')} />}

        <footer className="admin-footer"><span>GSDD Foundation <b>·</b> Internal dashboard</span><span>Live Media Gallery <i /> Other sections coming soon</span></footer>
      </div>
    </main>
    {toast && <div className="admin-toast" role="status"><span><Check size={15} /></span>{toast}</div>}
  </div>;
}
