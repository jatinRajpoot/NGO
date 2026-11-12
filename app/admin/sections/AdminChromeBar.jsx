'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  MessageSquare,
  Bell,
  Users,
  IdCard,
  Menu,
  Award,
  HandHeart,
  Settings,
  CornerDownLeft,
} from 'lucide-react';
import './admin-system.css';

const SEARCH_COMMANDS = [
  { id: 'overview', label: 'Dashboard Overview & KPIs', category: 'Section', key: 'overview' },
  { id: 'website', label: 'Website & Photo Gallery Management', category: 'Section', key: 'website' },
  { id: 'membership', label: 'Membership Management & Approvals', category: 'Members', key: 'membership' },
  { id: 'team', label: 'Team & Coordinator Management', category: 'Section', key: 'team' },
  { id: 'certificates', label: 'Certificate & ID Card Management', category: 'Members', key: 'certificates' },
  { id: 'birthday', label: 'Birthday Wishes (Today & Upcoming)', category: 'Members', key: 'birthday' },
  { id: 'donations', label: 'Donation Management & Receipts', category: 'Donations', key: 'donations' },
  { id: 'recurring', label: 'Recurring Donations & AutoPay', category: 'Donations', key: 'recurring' },
  { id: 'messages', label: 'New Enquiries & Notices Inbox', category: 'Operations', key: 'messages' },
  { id: 'appointments', label: 'Appointment Letters', category: 'Operations', key: 'appointments' },
  { id: 'reports', label: 'Reports & Financial Analytics', category: 'Analytics', key: 'reports' },
  { id: 'qr', label: 'Website QR Code Generator', category: 'System', key: 'qr' },
  { id: 'letterhead', label: 'Official NGO Letter Head Maker', category: 'System', key: 'letterhead' },
  { id: 'software', label: 'Software Update & API Settings (Protected)', category: 'System', key: 'software' },
  { id: 'profile', label: 'Admin Profile & Avatar Photo', category: 'Account', key: 'profile' },
  { id: 'security', label: 'Security & Change Password', category: 'Account', key: 'security' },
];

export function AdminUtilityHeader({ activeKey, onNavigate }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [theme, setTheme] = useState('light');
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gsdd_admin_theme') === 'dark' ? 'dark' : 'light';
      setTheme(saved);
      const root = wrapRef.current?.closest('.admin-root');
      if (root) root.setAttribute('data-admin-theme', saved);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('gsdd_admin_theme', next);
      const root = wrapRef.current?.closest('.admin-root');
      if (root) root.setAttribute('data-admin-theme', next);
    } catch {}
  };

  useEffect(() => {
    const onGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_COMMANDS.slice(0, 8);
    return SEARCH_COMMANDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelectItem = (item) => {
    if (!item) return;
    onNavigate(item.key);
    setOpen(false);
    setQuery('');
  };

  const onSearchKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (matches.length ? (i + 1) % matches.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0));
    } else if (e.key === 'Enter' && open && matches[highlightIdx]) {
      e.preventDefault();
      handleSelectItem(matches[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="admin-utility-strip no-print" ref={wrapRef}>
      <div className="admin-global-search-wrap">
        <div className="admin-global-search-input-box">
          <Search size={15} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="admin-global-search-input"
            placeholder="Search anything... (Ctrl+K)"
            aria-label="Search anything"
            aria-expanded={open}
            aria-controls="admin-global-search-results"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightIdx(0);
              setOpen(true);
            }}
            onKeyDown={onSearchKeyDown}
          />
          <span className="admin-search-kbd">Ctrl+K</span>
        </div>

        {open && (
          <div id="admin-global-search-results" className="admin-search-dropdown" role="listbox">
            {matches.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>
                No matching dashboard features found.
              </div>
            ) : (
              matches.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={idx === highlightIdx}
                  className={`admin-search-item ${idx === highlightIdx ? 'is-selected' : ''}`}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => handleSelectItem(item)}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <span className="admin-search-item-meta" style={{ marginLeft: 8 }}>
                      {item.category}
                    </span>
                  </span>
                  <CornerDownLeft size={13} aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="admin-utility-shortcuts">
        <button
          type="button"
          className="admin-shortcut-pill"
          onClick={() => onNavigate('messages')}
          title="Open New Enquiries"
        >
          <MessageSquare size={14} aria-hidden="true" /> New Enquiries
        </button>
        <button
          type="button"
          className="admin-shortcut-pill"
          onClick={() => onNavigate('messages')}
          title="Open Notice History"
        >
          <Bell size={14} aria-hidden="true" /> Notice History
        </button>
        <button
          type="button"
          className="admin-shortcut-pill"
          onClick={() => onNavigate('software')}
          title="Software Update & Protected Panel Settings"
        >
          <Settings size={14} aria-hidden="true" /> Software Update
        </button>
        <button
          type="button"
          className="admin-shortcut-pill"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} aria-hidden="true" /> Light Mode
            </>
          ) : (
            <>
              <Moon size={14} aria-hidden="true" /> Dark Mode
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminBottomQuickBar({ activeKey, onNavigate }) {
  const items = [
    { key: 'membership', label: 'Membership', icon: Users },
    { key: 'certificates', label: 'ID Card', icon: IdCard },
    { key: 'overview', label: 'Menu', icon: Menu },
    { key: 'letterhead', label: 'Certificate', icon: Award, target: 'certificates' },
    { key: 'donations', label: 'Donations', icon: HandHeart },
  ];

  return (
    <nav className="admin-bottom-quickbar no-print" aria-label="Bottom quick-access bar">
      {items.map((item) => {
        const Icon = item.icon;
        const navKey = item.target || item.key;
        const isCurrent = activeKey === navKey && item.label !== 'Certificate' ? true : activeKey === item.key;
        return (
          <button
            key={item.label}
            type="button"
            className={`admin-bottom-qb-btn ${isCurrent ? 'is-active' : ''}`}
            onClick={() => onNavigate(navKey)}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
