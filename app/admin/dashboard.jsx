'use client';

import { useEffect, useState } from 'react';
import {
  LayoutGrid, Globe, Users, UserCog, Award, HandHeart, CalendarClock,
  MessageSquare, CalendarCheck, TrendingUp, User, Lock, LogOut,
  Loader2, Menu, X, ArrowUpRight, Bell, ChevronRight, Check, FolderKanban
} from 'lucide-react';

import './sections/admin-sections.css';
import WebsiteManagement from './sections/WebsiteManagement';
import OperationsManagementSection from './sections/OperationsManagementSection';
import MembershipManagement from './sections/MembershipManagement';
import TeamManagement from './sections/TeamManagement';
import CertificateManagement from './sections/CertificateManagement';
import DonationManagement from './sections/DonationManagement';
import RecurringDonations from './sections/RecurringDonations';
import MessagesNotifications from './sections/MessagesNotifications';
import AppointmentsSection from './sections/AppointmentsSection';
import ReportsAnalytics from './sections/ReportsAnalytics';
import AdminProfileSection from './sections/AdminProfileSection';
import SecuritySection from './sections/SecuritySection';

const navItems = [
  { key: 'website', label: 'Website Management', icon: Globe },
  { key: 'operations', label: 'Operations Suite', icon: FolderKanban },
  { key: 'membership', label: 'Membership Management', icon: Users },
  { key: 'team', label: 'Team Management', icon: UserCog },
  { key: 'certificates', label: 'Certificate Management', icon: Award },
  { key: 'donations', label: 'Donation Management', icon: HandHeart },
  { key: 'recurring', label: 'Recurring Donations', icon: CalendarClock },
  { key: 'messages', label: 'Messages & Notifications', icon: MessageSquare },
  { key: 'appointments', label: 'Appointments', icon: CalendarCheck },
  { key: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
  { key: 'profile', label: 'Admin Profile', icon: User },
  { key: 'security', label: 'Security & Password', icon: Lock },
];

const itemByKey = Object.fromEntries(navItems.map((item) => [item.key, item]));

export default function AdminDashboard() {
  const [activeKey, setActiveKey] = useState('website');
  const [websiteSubTab, setWebsiteSubTab] = useState('pages');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const notify = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  // Support hash routing e.g. #membership, #gallery, #security, #website
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '');
    if (fromHash === 'gallery') {
      setActiveKey('website');
      setWebsiteSubTab('gallery');
    } else if (itemByKey[fromHash]) {
      setActiveKey(fromHash);
    }
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
        headers: { 'Content-Type': 'application/json' },
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
    } catch {
      const message = 'Unable to sign out. Check your connection and try again.';
      setLogoutError(message);
      notify(message);
    } finally {
      setLoggingOut(false);
    }
  };

  const currentNav = itemByKey[activeKey] || navItems[0];

  return (
    <div className="admin-root">
      {/* Mobile Backdrop */}
      {menuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Scrollable Sidebar Panel */}
      <aside className={`admin-sidebar${menuOpen ? ' admin-sidebar-open' : ''}`}>
        <div className="admin-sidebar-card">
          {/* Header matching Image 2 */}
          <div className="admin-sb-head">
            <span className="admin-sb-icon-wrap" aria-hidden="true">
              <LayoutGrid size={22} className="admin-sb-icon-grid" />
            </span>
            <span className="admin-sb-title">Admin Dashboard</span>
          </div>

          <hr className="admin-sb-divider" />

          {/* Navigation Items (11 items matching Image 2) */}
          <nav className="admin-sb-nav" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`admin-sb-item${isActive ? ' is-active' : ''}`}
                  onClick={() => selectSection(item.key)}
                >
                  <Icon size={18} strokeWidth={1.8} className="admin-sb-item-icon" />
                  <span className="admin-sb-item-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <hr className="admin-sb-divider" />

          {/* Workspace info & Logout */}
          <div className="admin-sb-user-box">
            <div className="admin-sb-user-main">
              <span className="admin-sb-avatar">GF</span>
              <div className="admin-sb-user-text">
                <strong>GSDD Foundation</strong>
                <small>Super Administrator</small>
              </div>
            </div>
            <button
              type="button"
              className="admin-sb-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out of Admin"
              aria-label="Sign out"
            >
              {loggingOut ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <LogOut size={16} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <h1 className="sr-only">Admin Dashboard</h1>

        {/* Top bar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="admin-icon-button admin-mobile-menu"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="admin-breadcrumb">
              <span>Admin Dashboard</span>
              <ChevronRight size={14} />
              <strong>{currentNav.label}</strong>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-notification-wrap">
              <button
                className="admin-icon-button admin-bell"
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((o) => !o)}
              >
                <Bell size={18} />
                <i />
              </button>
              {notificationsOpen && (
                <div className="admin-notification-popover">
                  <div>
                    <strong>System Notifications</strong>
                    <button type="button" onClick={() => setNotificationsOpen(false)}>
                      <X size={15} />
                    </button>
                  </div>
                  <p>
                    <span className="admin-notice-dot" />
                    <span>
                      <b>Admin Dashboard Active</b>
                      <small>All 11 modules operational and connected</small>
                    </span>
                  </p>
                  <p>
                    <span className="admin-notice-dot admin-notice-dot-gold" />
                    <span>
                      <b>Raniganj Center Workspace</b>
                      <small>Session active under GSDD Foundation</small>
                    </span>
                  </p>
                </div>
              )}
            </div>

            <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">
              <span>View website</span>
              <ArrowUpRight size={14} />
            </a>

            <button
              className="admin-button admin-button-outline"
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
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

        {/* Content Area */}
        <div className="admin-content">
          {logoutError && (
            <div
              className="admin-preview-banner"
              role="alert"
              style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b', marginBottom: 20 }}
            >
              <span className="admin-preview-symbol" style={{ background: '#ef4444', color: '#fff' }}>!</span>
              <p><strong>Sign out notice</strong><span>{logoutError}</span></p>
            </div>
          )}

          {activeKey === 'website' && <WebsiteManagement notify={notify} initialTab={websiteSubTab} />}
          {activeKey === 'operations' && <OperationsManagementSection notify={notify} />}
          {activeKey === 'membership' && <MembershipManagement notify={notify} />}
          {activeKey === 'team' && <TeamManagement notify={notify} />}
          {activeKey === 'certificates' && <CertificateManagement notify={notify} />}
          {activeKey === 'donations' && <DonationManagement notify={notify} />}
          {activeKey === 'recurring' && <RecurringDonations notify={notify} />}
          {activeKey === 'messages' && <MessagesNotifications notify={notify} />}
          {activeKey === 'appointments' && <AppointmentsSection notify={notify} />}
          {activeKey === 'reports' && <ReportsAnalytics notify={notify} />}
          {activeKey === 'profile' && (
            <AdminProfileSection notify={notify} onGoToSecurity={() => selectSection('security')} />
          )}
          {activeKey === 'security' && <SecuritySection notify={notify} />}

          <footer className="admin-footer" style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
            <span>GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION &bull; ADMIN DASHBOARD</span>
            <span>All operations secured with HTTP-only session tokens</span>
          </footer>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="admin-toast" role="status">
          <span><Check size={15} /></span>
          {toast}
        </div>
      )}
    </div>
  );
}
