'use client';

import { useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FileText, FolderKanban,
  HandCoins, LayoutDashboard, MapPin, Megaphone, Menu, MoreHorizontal, Plus,
  Search, Settings, Target, UploadCloud, Users, X,
} from 'lucide-react';

const initialPrograms = [
  { name: 'Digital Skills for Youth', area: 'Skills & livelihoods', location: 'Raniganj', progress: 74, people: '248 people', status: 'On track', initials: 'DS', tint: 'blue' },
  { name: 'Learning Centres', area: 'Education', location: 'Araria', progress: 58, people: '186 people', status: 'On track', initials: 'LC', tint: 'gold' },
  { name: 'Swasthya Saathi', area: 'Health & well-being', location: 'Forbesganj', progress: 42, people: '320 people', status: 'Needs update', initials: 'SS', tint: 'green' },
  { name: 'Women’s Enterprise Circle', area: 'Women’s empowerment', location: 'Jokihat', progress: 86, people: '96 people', status: 'On track', initials: 'WE', tint: 'rose' },
];

const chartSets = {
  Month: { labels: ['1 Oct', '5 Oct', '9 Oct', '13 Oct', '17 Oct', '21 Oct', '25 Oct', '30 Oct'], values: [22, 38, 34, 56, 48, 72, 66, 88], total: '₹2.46L', change: '+12.8%' },
  Quarter: { labels: ['Aug', 'Mid Aug', 'Sep', 'Mid Sep', 'Oct', 'Mid Oct', 'Late Oct', 'Now'], values: [29, 48, 39, 60, 52, 73, 64, 88], total: '₹7.82L', change: '+9.4%' },
  Year: { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Now'], values: [28, 36, 31, 50, 47, 68, 72, 88], total: '₹12.8L', change: '+18.2%' },
};

const navGroups = [
  { label: 'Workspace', items: [
    { label: 'Overview', href: '#overview', icon: LayoutDashboard },
    { label: 'Programs', href: '#programs', icon: FolderKanban, count: '08' },
    { label: 'People reached', href: '#impact', icon: Users },
    { label: 'Donations', href: '#donations', icon: HandCoins },
  ] },
  { label: 'Manage', items: [
    { label: 'Reports', href: '#reports', icon: FileText, count: '3' },
    { label: 'Campaigns', href: '#campaigns', icon: Megaphone },
    { label: 'Events', href: '#events', icon: CalendarDays },
  ] },
];

function formatToday() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function RevenueChart({ range }) {
  const data = chartSets[range];
  const points = data.values.map((value, index) => `${30 + index * 75},${152 - value * 1.32}`).join(' ');
  const area = `M ${points.replaceAll(' ', ' L ')} L 555,160 L 30,160 Z`;
  return <div className="admin-chart-wrap">
    <div className="admin-chart-summary">
      <div><span className="admin-chart-total">{data.total}</span><span className="admin-chart-change"><ArrowUpRight size={13} /> {data.change}</span></div>
      <span className="admin-muted">vs. previous period</span>
    </div>
    <div className="admin-chart" role="img" aria-label={`Illustrative donation trend for the ${range.toLowerCase()}, total ${data.total}`}>
      <svg viewBox="0 0 585 184" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="donation-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3765d8" stopOpacity=".16" /><stop offset="100%" stopColor="#3765d8" stopOpacity="0" /></linearGradient></defs>
        {[30, 68, 106, 144].map((y) => <line key={y} x1="30" x2="555" y1={y} y2={y} className="admin-chart-gridline" />)}
        <path d={area} fill="url(#donation-fill)" />
        <polyline points={points} fill="none" className="admin-chart-line" />
        {data.values.map((value, index) => <circle key={`${range}-${index}`} cx={30 + index * 75} cy={152 - value * 1.32} r={index === data.values.length - 1 ? 4 : 2.5} className={index === data.values.length - 1 ? 'admin-chart-dot admin-chart-dot-current' : 'admin-chart-dot'} />)}
      </svg>
      <div className="admin-chart-labels">{data.labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
    <div className="admin-chart-foot"><span><i className="admin-legend-dot" /> Donations received</span><span>Illustrative sample data</span></div>
  </div>;
}

function NewProgramDialog({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('Education');
  const submit = (event) => {
    event.preventDefault();
    if (name.trim()) onSave({ name: name.trim(), area, location: 'Raniganj', progress: 0, people: '0 people', status: 'Planning', initials: name.trim().slice(0, 2).toUpperCase(), tint: 'blue' });
  };
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-program-title">
      <button className="admin-icon-button admin-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <span className="admin-modal-icon"><FolderKanban size={19} /></span>
      <p className="admin-eyebrow">WORKSPACE</p><h2 id="new-program-title">Add a program</h2>
      <p className="admin-modal-copy">Create a sample program entry in this dashboard preview.</p>
      <form onSubmit={submit}>
        <label htmlFor="program-name">Program name</label>
        <input id="program-name" autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Community Learning Hub" />
        <label htmlFor="program-area">Focus area</label>
        <select id="program-area" value={area} onChange={(event) => setArea(event.target.value)}><option>Education</option><option>Skills &amp; livelihoods</option><option>Health &amp; well-being</option><option>Women’s empowerment</option></select>
        <div className="admin-modal-actions"><button className="admin-button admin-button-quiet" type="button" onClick={onClose}>Cancel</button><button className="admin-button admin-button-primary" type="submit"><Plus size={16} /> Add program</button></div>
      </form>
      <p className="admin-modal-note"><Activity size={13} /> Preview only. Changes are not saved to a live system.</p>
    </section>
  </div>;
}

export default function AdminDashboard() {
  const [programs, setPrograms] = useState(initialPrograms);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('Quarter');
  const [activeNav, setActiveNav] = useState('Overview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPreviewNotice, setShowPreviewNotice] = useState(true);
  const [toast, setToast] = useState('');
  const filteredPrograms = useMemo(() => programs.filter((program) => `${program.name} ${program.area} ${program.location}`.toLowerCase().includes(query.toLowerCase())), [programs, query]);
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const createProgram = (program) => { setPrograms((current) => [program, ...current]); setDialogOpen(false); notify('Sample program added to this preview.'); };

  return <div className="admin-root" id="overview">
    <aside className={`admin-sidebar${menuOpen ? ' admin-sidebar-open' : ''}`}>
      <a className="admin-brand" href="/admin/" aria-label="GSDD Foundation dashboard">
        <span className="admin-brand-mark">G</span><span className="admin-brand-word">GSDD<span>FOUNDATION</span></span>
      </a>
      <div className="admin-workspace-switch"><span className="admin-workspace-avatar">GF</span><span><strong>Foundation workspace</strong><small>Raniganj, Bihar</small></span><ChevronDown size={15} /></div>
      <nav className="admin-nav" aria-label="Dashboard navigation">
        {navGroups.map((group) => <div className="admin-nav-group" key={group.label}>
          <p className="admin-nav-heading">{group.label}</p>
          {group.items.map(({ label, href, icon: Icon, count }) => <a key={label} href={href} className={`admin-nav-link${activeNav === label ? ' is-active' : ''}`} onClick={() => { setActiveNav(label); setMenuOpen(false); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{count && <small>{count}</small>}</a>)}
        </div>)}
      </nav>
      <div className="admin-sidebar-spacer" />
      <div className="admin-sidebar-note"><span className="admin-help-icon"><CircleHelp size={16} /></span><span><strong>Need a hand?</strong><small>Visit the help centre</small></span><ArrowRight size={14} /></div>
      <a className="admin-nav-link admin-settings-link" href="#settings" onClick={() => { setActiveNav('Settings'); setMenuOpen(false); }}><Settings size={17} strokeWidth={1.8} /><span>Settings</span></a>
      <div className="admin-user-card"><span className="admin-user-avatar">FA</span><span><strong>Foundation Admin</strong><small>Administrator</small></span><MoreHorizontal size={18} /></div>
      <div className="admin-sidebar-foot">GSDD FOUNDATION <span>•</span> ADMIN PREVIEW</div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="admin-icon-button admin-mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <div className="admin-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
        <div className="admin-topbar-actions">
          <label className="admin-search"><Search size={16} /><input aria-label="Search programs" placeholder="Search programs…" value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} /><kbd>⌘ K</kbd></label>
          <div className="admin-notification-wrap"><button className="admin-icon-button admin-bell" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} /><i /></button>
            {notificationsOpen && <div className="admin-notification-popover"><div><strong>Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15} /></button></div><p><span className="admin-notice-dot" /><span><b>Report review due</b><small>Education Centre · 2 hours ago</small></span></p><p><span className="admin-notice-dot admin-notice-dot-gold" /><span><b>New volunteer application</b><small>Community outreach · Yesterday</small></span></p><button className="admin-notifications-link" type="button" onClick={() => { setNotificationsOpen(false); notify('You’re viewing all sample notifications.'); }}>View all notifications <ArrowRight size={13} /></button></div>}
          </div>
          <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={14} /></a>
        </div>
      </header>

      <div className="admin-content">
        <section className="admin-welcome">
          <div><p className="admin-date"><CalendarDays size={14} /> {formatToday()}</p><h1>Good morning, team <span>✦</span></h1><p className="admin-welcome-copy">Here’s what’s happening across your foundation.</p></div>
          <div className="admin-welcome-actions"><span className="admin-sync-status"><i /> Sample overview</span><button className="admin-button admin-button-primary" type="button" onClick={() => setDialogOpen(true)}><Plus size={16} /> New program</button></div>
        </section>

        {showPreviewNotice && <div className="admin-preview-banner"><span className="admin-preview-symbol">i</span><p><strong>Dashboard preview</strong><span>All figures are illustrative sample data. No live donations, beneficiary records, or admin actions are connected.</span></p><button type="button" onClick={() => setShowPreviewNotice(false)} aria-label="Dismiss preview notice"><X size={15} /></button></div>}

        <section className="admin-metrics" id="impact" aria-label="Foundation overview statistics">
          <article className="admin-metric-card"><div className="admin-metric-top"><span>Active programs</span><span className="admin-metric-icon admin-icon-blue"><FolderKanban size={17} /></span></div><div className="admin-metric-value">08 <span className="admin-metric-delta admin-delta-neutral">across 4 focus areas</span></div><div className="admin-metric-bottom"><span className="admin-mini-progress"><i style={{ width: '69%' }} /></span><span>5 on track</span></div></article>
          <article className="admin-metric-card"><div className="admin-metric-top"><span>People reached</span><span className="admin-metric-icon admin-icon-green"><Users size={17} /></span></div><div className="admin-metric-value">1,284 <span className="admin-metric-delta"><ArrowUpRight size={13} /> 14.6%</span></div><div className="admin-metric-bottom"><span className="admin-muted">Illustrative year-to-date reach</span><span className="admin-metric-sparkline"><i /><i /><i /><i /><i /><i /><i /></span></div></article>
          <article className="admin-metric-card" id="donations"><div className="admin-metric-top"><span>Funds received</span><span className="admin-metric-icon admin-icon-gold"><HandCoins size={17} /></span></div><div className="admin-metric-value">₹12.8L <span className="admin-metric-delta"><ArrowUpRight size={13} /> 8.2%</span></div><div className="admin-metric-bottom"><span className="admin-mini-progress admin-progress-gold"><i style={{ width: '64%' }} /></span><span>64% of ₹20L goal</span></div></article>
          <article className="admin-metric-card"><div className="admin-metric-top"><span>Items to review</span><span className="admin-metric-icon admin-icon-rose"><ClipboardListIcon /></span></div><div className="admin-metric-value">06 <span className="admin-metric-delta admin-delta-alert">Needs attention</span></div><div className="admin-metric-bottom"><span className="admin-muted">3 reports · 2 requests · 1 event</span><ArrowRight size={14} className="admin-metric-arrow" /></div></article>
        </section>

        <section className="admin-overview-grid">
          <article className="admin-panel admin-donations-panel">
            <div className="admin-panel-heading"><div><p className="admin-eyebrow">FUNDRAISING</p><h2>Donation overview <span className="admin-sample-tag">SAMPLE</span></h2></div><label className="admin-select-wrap"><span className="sr-only">Donation time range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option>Month</option><option>Quarter</option><option>Year</option></select><ChevronDown size={14} /></label></div>
            <RevenueChart range={range} />
          </article>

          <article className="admin-panel admin-activity-panel" id="reports">
            <div className="admin-panel-heading"><div><p className="admin-eyebrow">YOUR ATTENTION</p><h2>Needs a look</h2></div><button className="admin-icon-button admin-more-button" type="button" aria-label="More review options" onClick={() => notify('Review list is sample data.')}><MoreHorizontal size={19} /></button></div>
            <div className="admin-review-list">
              <a className="admin-review-item" href="#programs" onClick={() => setActiveNav('Programs')}><span className="admin-review-icon admin-review-amber"><FileText size={16} /></span><span className="admin-review-copy"><strong>Quarterly activity report</strong><small>Learning Centres · Due today</small></span><span className="admin-review-arrow"><ChevronRight size={16} /></span></a>
              <a className="admin-review-item" href="#campaigns" onClick={() => setActiveNav('Campaigns')}><span className="admin-review-icon admin-review-blue"><Users size={16} /></span><span className="admin-review-copy"><strong>Volunteer applications</strong><small>2 new requests · 1 day ago</small></span><span className="admin-review-arrow"><ChevronRight size={16} /></span></a>
              <a className="admin-review-item" href="#events" onClick={() => setActiveNav('Events')}><span className="admin-review-icon admin-review-rose"><CalendarDays size={16} /></span><span className="admin-review-copy"><strong>Community health camp</strong><small>Confirm venue · In 4 days</small></span><span className="admin-review-arrow"><ChevronRight size={16} /></span></a>
            </div>
            <button className="admin-text-link" type="button" onClick={() => notify('You’re up to date on sample review items.')}>View all 6 items <ArrowRight size={14} /></button>
          </article>
        </section>

        <section className="admin-panel admin-programs-panel" id="programs">
          <div className="admin-panel-heading admin-programs-heading"><div><p className="admin-eyebrow">ON THE GROUND</p><h2>Program snapshot</h2><p className="admin-section-subtitle">A quick look at your active work across the region.</p></div><div className="admin-program-actions"><label className="admin-table-search"><Search size={15} /><input aria-label="Filter programs" placeholder="Filter programs" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="admin-button admin-button-outline" type="button" onClick={() => setDialogOpen(true)}><Plus size={15} /> Add program</button></div></div>
          <div className="admin-table-scroll"><table className="admin-program-table"><thead><tr><th>Program</th><th>Location</th><th>People reached</th><th>Progress</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredPrograms.map((program, index) => <tr key={`${program.name}-${index}`}><td><span className={`admin-program-mark admin-tint-${program.tint}`}>{program.initials}</span><span className="admin-program-name"><strong>{program.name}</strong><small>{program.area}</small></span></td><td><span className="admin-location"><MapPin size={13} /> {program.location}</span></td><td>{program.people}</td><td><span className="admin-progress-cell"><span className="admin-progress-bar"><i style={{ width: `${program.progress}%` }} /></span><small>{program.progress}%</small></span></td><td><span className={`admin-status-pill${program.status === 'Needs update' ? ' status-needs-update' : program.status === 'Planning' ? ' status-planning' : ''}`}><i />{program.status}</span></td><td><button className="admin-icon-button admin-row-more" aria-label={`More options for ${program.name}`} type="button" onClick={() => notify(`Sample record: ${program.name}`)}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>
          {filteredPrograms.length === 0 && <div className="admin-table-empty"><Search size={19} /><strong>No programs match “{query}”</strong><span>Try another name, focus area, or location.</span></div>}
          <div className="admin-table-footer"><span>Showing <strong>{filteredPrograms.length}</strong> of <strong>{programs.length}</strong> sample programs</span><button className="admin-text-link" type="button" onClick={() => { setQuery(''); notify('Showing all sample programs.'); }}>View all programs <ArrowRight size={14} /></button></div>
        </section>

        <section className="admin-bottom-grid">
          <article className="admin-panel admin-events-panel" id="events">
            <div className="admin-panel-heading"><div><p className="admin-eyebrow">COMING UP</p><h2>Upcoming activities</h2></div><button className="admin-text-link" type="button" onClick={() => { setActiveNav('Events'); notify('Showing sample events.'); }}>All events <ArrowRight size={14} /></button></div>
            <div className="admin-event-list">
              <div className="admin-event-item"><span className="admin-event-date"><b>04</b><small>NOV</small></span><span className="admin-event-copy"><strong>Community health camp</strong><small><Clock3 size={12} /> 9:30 AM <MapPin size={12} /> Raniganj block</small></span><span className="admin-event-type">HEALTH</span></div>
              <div className="admin-event-item"><span className="admin-event-date event-date-gold"><b>09</b><small>NOV</small></span><span className="admin-event-copy"><strong>Digital literacy workshop</strong><small><Clock3 size={12} /> 11:00 AM <MapPin size={12} /> Araria centre</small></span><span className="admin-event-type event-type-blue">SKILLS</span></div>
              <div className="admin-event-item"><span className="admin-event-date event-date-green"><b>14</b><small>NOV</small></span><span className="admin-event-copy"><strong>Women’s enterprise circle</strong><small><Clock3 size={12} /> 10:00 AM <MapPin size={12} /> Jokihat</small></span><span className="admin-event-type event-type-green">COMMUNITY</span></div>
            </div>
          </article>

          <article className="admin-impact-card" id="campaigns">
            <div className="admin-impact-top"><span className="admin-impact-icon"><Target size={18} /></span><span className="admin-impact-label">IMPACT GOAL <span className="admin-sample-tag">SAMPLE</span></span><button className="admin-icon-button admin-more-button" type="button" aria-label="More impact goal options" onClick={() => notify('Impact goal is illustrative sample data.')}><MoreHorizontal size={18} /></button></div>
            <h2>Reach 2,000 people<br />with digital skills</h2>
            <div className="admin-impact-progress-label"><span>1,284 <small>reached so far</small></span><strong>64%</strong></div>
            <div className="admin-impact-progress"><i /></div>
            <div className="admin-impact-footer"><span>FY 2026–27</span><span>716 to go</span></div>
            <button className="admin-impact-link" type="button" onClick={() => { setActiveNav('Campaigns'); notify('Campaigns use sample data in this preview.'); }}>Explore campaign <ArrowRight size={14} /></button>
          </article>
        </section>

        <footer className="admin-footer"><span>GSDD Foundation <b>·</b> Internal dashboard preview</span><span>Sample data only <i /> Built for better community outcomes</span></footer>
      </div>
    </main>
    {dialogOpen && <NewProgramDialog onClose={() => setDialogOpen(false)} onSave={createProgram} />}
    {toast && <div className="admin-toast" role="status"><span><Check size={15} /></span>{toast}</div>}
  </div>;
}

function ClipboardListIcon() {
  return <FileText size={17} />;
}
