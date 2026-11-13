'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Share2,
  Copy,
  Check,
  IdCard,
  Award,
  FileText,
  HandHeart,
  Menu,
  Users,
  Printer,
  Upload,
  AlertTriangle,
  X,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';

const MemberPortalContext = createContext(null);

export function useMemberPortal() {
  return useContext(MemberPortalContext);
}

const MEMBER_SEARCH_COMMANDS = [
  { id: 'overview', label: 'Overview & Recent Activities', category: 'Dashboard', key: 'overview' },
  { id: 'profile', label: 'My Profile & Contact Details', category: 'Account', key: 'profile' },
  { id: 'details', label: 'Membership Status & Card Details', category: 'Membership', key: 'details' },
  { id: 'fees', label: 'Membership Annual Fees & UPI Pay', category: 'Finance', key: 'fees' },
  { id: 'receipts', label: 'Payment Receipts & 80G Certificates', category: 'Finance', key: 'receipts' },
  { id: 'idcard', label: 'Digital Membership ID Card & QR', category: 'Membership', key: 'idcard' },
  { id: 'certificates', label: 'My Official NGO Certificates', category: 'Membership', key: 'certificates' },
  { id: 'donations', label: 'My Donations & Contributions', category: 'Contributions', key: 'donations' },
  { id: 'referral', label: 'Referral System & Tracking', category: 'Referrals', key: 'referral' },
  { id: 'notifications', label: 'Notification & Alert Settings', category: 'Account', key: 'notifications' },
  { id: 'messages', label: 'Messages & Admin Enquiries', category: 'Support', key: 'messages' },
  { id: 'password', label: 'Change Account Password', category: 'Security', key: 'password' },
  { id: 'drawer-notices', label: 'Notices Inbox (View Announcements)', category: 'Quick Action', drawer: 'notices' },
  { id: 'drawer-referrals', label: 'Referral Roster (Active & Pending)', category: 'Quick Action', drawer: 'referrals' },
  { id: 'drawer-photo', label: 'Upload Member Profile Photo', category: 'Quick Action', drawer: 'photo' },
  { id: 'drawer-donate', label: 'Quick Donate (PhonePe / Razorpay)', category: 'Quick Action', drawer: 'donate' },
  { id: 'drawer-receipt', label: 'Print Membership Fee Receipt', category: 'Quick Action', drawer: 'receipt' },
  { id: 'drawer-share', label: 'Share Verified ID Card & Links', category: 'Quick Action', drawer: 'share-id' },
];

export function MemberPortalProvider({ children, member: initialMember, activeTab, onNavigateTab }) {
  const pathname = usePathname() || '/';
  const isDashboard = pathname.startsWith('/member/dashboard');

  const [member, setMember] = useState(initialMember || null);
  const [ext, setExt] = useState({ referrals: [], activeReferrals: [], inactiveReferrals: [], notices: [] });
  const [theme, setTheme] = useState('light');
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [refTab, setRefTab] = useState('all');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // PhonePe / Razorpay Member Donate state
  const [gateway, setGateway] = useState('phonepe');
  const [donAmount, setDonAmount] = useState('500');
  const [donPurpose, setDonPurpose] = useState('Education Support');
  const [donPan, setDonPan] = useState('');
  const [nbUser, setNbUser] = useState('');
  const [nbPass, setNbPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (initialMember) {
      setMember(initialMember);
      if (String(initialMember.status || '').toLowerCase() !== 'active') {
        setShowPendingModal(true);
      }
    }
  }, [initialMember]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gsdd_member_theme') === 'dark' ? 'dark' : 'light';
      setTheme(saved);
      const root = document.querySelector('.member-dashboard-layout') || document.body;
      if (root) root.setAttribute('data-member-theme', saved);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('gsdd_member_theme', next);
      const root = document.querySelector('.member-dashboard-layout') || document.body;
      if (root) root.setAttribute('data-member-theme', next);
    } catch {}
  };

  const loadMemberContext = useCallback(async () => {
    if (!isDashboard) return;
    try {
      const [meRes, extRes] = await Promise.all([
        fetch('/api/member/me/', { cache: 'no-store' }),
        fetch('/api/member/extensions/', { cache: 'no-store' }),
      ]);
      if (meRes.ok) {
        const mData = await meRes.json();
        if (mData?.member) {
          setMember(mData.member);
          if (String(mData.member.status || '').toLowerCase() !== 'active') {
            setShowPendingModal(true);
          }
        }
      }
      if (extRes.ok) {
        const eData = await extRes.json();
        if (eData.ok) setExt(eData);
      }
    } catch {}
  }, [isDashboard]);

  useEffect(() => {
    loadMemberContext();
  }, [loadMemberContext]);

  const copyLink = async (label, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {}
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatusMsg('');
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await fetch('/api/member/extensions/', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMember((m) => (m ? { ...m, photoSrc: data.photoSrc } : m));
        setStatusMsg('Profile photo uploaded successfully!');
      } else {
        setStatusMsg(data?.error || 'Could not upload photo.');
      }
    } catch {
      setStatusMsg('Network error uploading photo.');
    } finally {
      setBusy(false);
    }
  };

  const handleMemberGatewayDonate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/member/extensions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gateway_donate',
          gateway,
          username: nbUser,
          password: nbPass,
          amount: Number(donAmount),
          purpose: donPurpose,
          pan: donPan,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatusMsg(data?.error || 'Gateway payment failed.');
        return;
      }
      setStatusMsg(`Payment recorded cleanly! Ref: ${data.txRef}`);
      setNbUser('');
      setNbPass('');
    } catch {
      setStatusMsg('Network error processing donation.');
    } finally {
      setBusy(false);
    }
  };

  const regNo = member?.membershipId || member?.regNo || member?.id || 'NGO-2026-0032';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gsddfoundation.org';
  const referralUrl = `${originUrl}/membership/?ref=${encodeURIComponent(regNo)}`;
  const idCardShareUrl = `${originUrl}/verify/?code=${encodeURIComponent(regNo)}`;
  const donationShareUrl = `${originUrl}/donate/?ref=${encodeURIComponent(regNo)}`;

  const referredRows =
    refTab === 'active'
      ? ext.activeReferrals
      : refTab === 'inactive'
      ? ext.inactiveReferrals
      : ext.referrals;

  const value = {
    member,
    ext,
    theme,
    toggleTheme,
    activeDrawer,
    setActiveDrawer,
    refTab,
    setRefTab,
    showPendingModal,
    setShowPendingModal,
    copiedKey,
    copyLink,
    handlePhotoUpload,
    handleMemberGatewayDonate,
    regNo,
    referralUrl,
    idCardShareUrl,
    donationShareUrl,
    referredRows,
    gateway,
    setGateway,
    donAmount,
    setDonAmount,
    donPurpose,
    setDonPurpose,
    donPan,
    setDonPan,
    nbUser,
    setNbUser,
    nbPass,
    setNbPass,
    busy,
    statusMsg,
    activeTab,
    onNavigateTab,
  };

  return (
    <MemberPortalContext.Provider value={value}>
      {children}
    </MemberPortalContext.Provider>
  );
}

/**
 * Top Member Utility Header / Search Bar:
 * Rendered at the TOP of the member dashboard content area, matching AdminUtilityHeader.
 */
export function MemberUtilityHeader({ activeTab, onNavigate }) {
  const ctx = useMemberPortal();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const theme = ctx?.theme || 'light';
  const toggleTheme = ctx?.toggleTheme || (() => {});
  const ext = ctx?.ext || { activeReferrals: [], inactiveReferrals: [], notices: [] };
  const setActiveDrawer = ctx?.setActiveDrawer || (() => {});
  const navigateTab = onNavigate || ctx?.onNavigateTab || (() => {});

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
    const q = search.trim().toLowerCase();
    if (!q) return MEMBER_SEARCH_COMMANDS.slice(0, 8);
    return MEMBER_SEARCH_COMMANDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.key && item.key.toLowerCase().includes(q)) ||
        (item.drawer && item.drawer.toLowerCase().includes(q))
    );
  }, [search]);

  const handleSelectItem = (item) => {
    if (!item) return;
    if (item.key) {
      navigateTab(item.key);
    } else if (item.drawer) {
      setActiveDrawer(item.drawer);
    }
    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e) => {
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && matches[highlightIdx]) {
        handleSelectItem(matches[highlightIdx]);
      } else {
        const q = search.toLowerCase();
        if (q.includes('notice')) setActiveDrawer('notices');
        else if (q.includes('refer')) setActiveDrawer('referrals');
        else if (q.includes('phone') || q.includes('don')) setActiveDrawer('donate');
        else if (q.includes('receipt')) setActiveDrawer('receipt');
        else if (q.includes('photo')) setActiveDrawer('photo');
        else if (q.includes('card') || q.includes('id')) navigateTab('idcard');
        else if (q.includes('cert')) navigateTab('certificates');
        else if (q.includes('fee')) navigateTab('fees');
        else if (q.includes('prof')) navigateTab('profile');
        else if (q.includes('pass')) navigateTab('password');
        else if (q.includes('msg') || q.includes('mess')) navigateTab('messages');
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={wrapRef}
      className="member-utility-strip no-print"
      style={{
        width: '100%',
        margin: '0 0 18px 0',
        padding: '10px 16px',
        background: isDark ? '#111b2e' : '#ffffff',
        border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        borderRadius: 12,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        zIndex: 40,
      }}
    >
      {/* Search Input Box */}
      <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Search
            size={15}
            color={isDark ? '#94a3b8' : '#64748b'}
            style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightIdx(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Quick jump (notices, referrals, phonepe, receipt, photo)..."
            aria-label="Member quick search"
            style={{
              width: '100%',
              height: 38,
              padding: '0 62px 0 36px',
              borderRadius: 8,
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              background: isDark ? '#0b1220' : '#f8fafc',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 10,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 700,
              color: isDark ? '#94a3b8' : '#64748b',
              background: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: 4,
              pointerEvents: 'none',
            }}
          >
            Ctrl+K
          </span>
        </div>

        {/* Dropdown Results */}
        {open && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: isDark ? '#111b2e' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: 10,
              boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              zIndex: 100,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {matches.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                No matching member sections found.
              </div>
            ) : (
              matches.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={idx === highlightIdx}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 0,
                    borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                    background:
                      idx === highlightIdx
                        ? isDark
                          ? '#1e293b'
                          : '#eff6ff'
                        : 'transparent',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: isDark ? '#0b1220' : '#e2e8f0',
                        color: isDark ? '#94a3b8' : '#475569',
                      }}
                    >
                      {item.category}
                    </span>
                  </span>
                  <CornerDownLeft size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Shortcut Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setActiveDrawer('referrals')}
          style={{
            padding: '6px 11px',
            borderRadius: 8,
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            background: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={13} /> Referrals ({ext.activeReferrals.length} Active / {ext.inactiveReferrals.length} Pending)
        </button>

        <button
          type="button"
          onClick={() => setActiveDrawer('notices')}
          style={{
            padding: '6px 11px',
            borderRadius: 8,
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            background: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Bell size={13} /> Notices ({ext.notices.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveDrawer('photo')}
          style={{
            padding: '6px 11px',
            borderRadius: 8,
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            background: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Upload size={13} /> Photo
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: '6px 11px',
            borderRadius: 8,
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            background: isDark ? '#1e293b' : '#f8fafc',
            color: isDark ? '#e2e8f0' : '#0f172a',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isDark ? (
            <>
              <Sun size={13} /> Light
            </>
          ) : (
            <>
              <Moon size={13} /> Dark
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Bottom Sticky Quick-Access Navigation Bar
 */
export function MemberBottomQuickBar({ activeTab, onNavigate }) {
  const ctx = useMemberPortal();
  const setActiveDrawer = ctx?.setActiveDrawer || (() => {});
  const navigateTab = onNavigate || ctx?.onNavigateTab || (() => {});

  const buttons = [
    { id: 'share-id', label: 'ID CARD', icon: IdCard, action: () => navigateTab('idcard') },
    { id: 'receipt', label: 'Appointment', icon: FileText, action: () => setActiveDrawer('receipt') },
    { id: 'referrals', label: 'Menu', icon: Menu, action: () => setActiveDrawer('referrals') },
    { id: 'notices', label: 'Certificate', icon: Award, action: () => navigateTab('certificates') },
    { id: 'donate', label: 'Donation', icon: HandHeart, action: () => navigateTab('donations') },
  ];

  return (
    <nav
      aria-label="Member Quick Access"
      className="no-print"
      style={{
        position: 'sticky',
        bottom: 12,
        zIndex: 45,
        maxWidth: 680,
        margin: '18px auto 8px',
        padding: '8px 12px',
        background: 'rgba(15,23,42,0.95)',
        color: '#fff',
        borderRadius: 14,
        display: 'flex',
        justifyContent: 'space-around',
        gap: 6,
        boxShadow: '0 14px 30px rgba(0,0,0,0.22)',
      }}
    >
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              border: 0,
              background: 'transparent',
              color: '#e2e8f0',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <Icon size={16} />
            <span>{btn.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Member Portal Modals & Drawers
 */
export function MemberPortalDrawers() {
  const ctx = useMemberPortal();
  if (!ctx) return null;

  const {
    member,
    ext,
    activeDrawer,
    setActiveDrawer,
    refTab,
    setRefTab,
    showPendingModal,
    setShowPendingModal,
    copiedKey,
    copyLink,
    handlePhotoUpload,
    handleMemberGatewayDonate,
    regNo,
    referralUrl,
    idCardShareUrl,
    donationShareUrl,
    referredRows,
    gateway,
    setGateway,
    donAmount,
    setDonAmount,
    donPurpose,
    setDonPurpose,
    donPan,
    setDonPan,
    nbUser,
    setNbUser,
    nbPass,
    setNbPass,
    busy,
    statusMsg,
  } = ctx;

  const shareButtons = (label, url) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      <button
        type="button"
        onClick={() => copyLink(label, url)}
        style={{
          padding: '7px 12px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {copiedKey === label ? <Check size={13} color="#059669" /> : <Copy size={13} />} Copy Link
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${label}: ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        style={{ padding: '7px 12px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
      >
        WhatsApp
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(label)}`}
        target="_blank"
        rel="noreferrer"
        style={{ padding: '7px 12px', borderRadius: 8, background: '#0284c7', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
      >
        Telegram
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        style={{ padding: '7px 12px', borderRadius: 8, background: '#1d4ed8', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
      >
        Facebook
      </a>
    </div>
  );

  return (
    <>
      {/* Approval Pending Alert Modal */}
      {showPendingModal && member && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.7)',
            padding: 16,
          }}
        >
          <div style={{ width: 'min(440px, 100%)', background: '#fff', color: '#0f172a', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <AlertTriangle size={40} color="#d97706" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 8px' }}>Account Approval Under Review</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569' }}>
              Your membership registration ({regNo}) is currently <strong>{member.status}</strong>. Full ID Card and certificate downloads unlock automatically after Admin Verification.
            </p>
            <button type="button" className="button button-blue" onClick={() => setShowPendingModal(false)}>
              Dismiss Notice
            </button>
          </div>
        </div>
      )}

      {/* Active Feature Drawer Modal */}
      {activeDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.65)',
            padding: 16,
          }}
          onClick={() => setActiveDrawer(null)}
        >
          <div
            style={{
              width: 'min(640px, 100%)',
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#fff',
              color: '#0f172a',
              borderRadius: 14,
              padding: 22,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <strong style={{ fontSize: 16 }}>
                {activeDrawer === 'referrals' && 'My Membership Referral Program'}
                {activeDrawer === 'notices' && 'My Notices Inbox'}
                {activeDrawer === 'share-id' && 'Share ID Card & Donation Link'}
                {activeDrawer === 'receipt' && 'Membership Receipt & Payment History'}
                {activeDrawer === 'photo' && 'Upload Member Profile Photo'}
                {activeDrawer === 'donate' && 'Donate Now (PhonePe test/test & Razorpay)'}
              </strong>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {statusMsg && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#eff6ff', color: '#1e3a8a', fontSize: 13 }}>
                {statusMsg}
              </div>
            )}

            {activeDrawer === 'referrals' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8 }}>
                    <strong>Active Referrals:</strong> {ext.activeReferrals.length}
                  </div>
                  <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                    <strong>Inactive / Pending:</strong> {ext.inactiveReferrals.length}
                  </div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                  <strong>Personal Referral Link:</strong> <code>{referralUrl}</code>
                  {shareButtons('Join GSDD Foundation via my referral', referralUrl)}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {['all', 'active', 'inactive'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRefTab(t)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        background: refTab === t ? '#2563eb' : '#fff',
                        color: refTab === t ? '#fff' : '#0f172a',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {t[0].toUpperCase() + t.slice(1)} Referred (
                      {t === 'active' ? ext.activeReferrals.length : t === 'inactive' ? ext.inactiveReferrals.length : ext.referrals.length}
                      )
                    </button>
                  ))}
                </div>
                {referredRows.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No referred members in this category yet.</p>
                ) : (
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th>Reg No</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.regNo}</td>
                          <td>{r.name}</td>
                          <td>{r.accountStatus}</td>
                          <td>{r.joinedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeDrawer === 'notices' && (
              <div style={{ display: 'grid', gap: 10 }}>
                {ext.notices.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No announcements or notices at this time.</p>
                ) : (
                  ext.notices.map((n) => (
                    <div key={n.id} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                      <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{n.message}</div>
                      <small style={{ color: '#64748b' }}>Sent: {String(n.sentAt).slice(0, 10)}</small>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeDrawer === 'share-id' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Share2 size={15} /> Share Verified ID Card
                  </div>
                  {shareButtons('Verify my GSDD Foundation Member ID', idCardShareUrl)}
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <HandHeart size={15} /> Share My Referral Donation Link
                  </div>
                  {shareButtons('Support GSDD Foundation Programmes', donationShareUrl)}
                </div>
              </div>
            )}

            {activeDrawer === 'receipt' && (
              <div>
                <div style={{ padding: 16, border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: 14 }}>
                  <h4 style={{ margin: '0 0 8px' }}>OFFICIAL MEMBERSHIP FEE RECEIPT</h4>
                  <div style={{ fontSize: 13, display: 'grid', gap: 4 }}>
                    <div>
                      <strong>Member Name:</strong> {member?.name || 'Authorized Member'}
                    </div>
                    <div>
                      <strong>Registration No:</strong> {regNo}
                    </div>
                    <div>
                      <strong>Status:</strong> {member?.status || 'Active'}
                    </div>
                  </div>
                </div>
                <button type="button" className="button button-blue" onClick={() => window.print()}>
                  <Printer size={15} /> Download / Print Receipt PDF
                </button>
              </div>
            )}

            {activeDrawer === 'photo' && (
              <div>
                {member?.photoSrc && (
                  <img
                    src={member.photoSrc}
                    alt={member.name}
                    style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }}
                  />
                )}
                <p style={{ fontSize: 13, color: '#475569' }}>Upload JPG, PNG, GIF, or WebP photo (max 2 MB).</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={busy}
                />
              </div>
            )}

            {activeDrawer === 'donate' && (
              <form onSubmit={handleMemberGatewayDonate} style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setGateway('phonepe')}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: gateway === 'phonepe' ? '2px solid #5f259f' : '1px solid #cbd5e1',
                      fontWeight: 700,
                    }}
                  >
                    PhonePe (test / test)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway('razorpay')}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: gateway === 'razorpay' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      fontWeight: 700,
                    }}
                  >
                    Razorpay Test
                  </button>
                </div>
                <input
                  required
                  type="number"
                  min="1"
                  value={donAmount}
                  onChange={(e) => setDonAmount(e.target.value)}
                  placeholder="Amount Rs."
                  style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <input
                  value={donPurpose}
                  onChange={(e) => setDonPurpose(e.target.value)}
                  placeholder="Purpose"
                  style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <input
                  value={donPan}
                  onChange={(e) => setDonPan(e.target.value.toUpperCase())}
                  placeholder="Optional PAN"
                  style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                {gateway === 'phonepe' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      required
                      value={nbUser}
                      onChange={(e) => setNbUser(e.target.value)}
                      placeholder='Sandbox User ("test")'
                      style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                    <input
                      required
                      type="password"
                      value={nbPass}
                      onChange={(e) => setNbPass(e.target.value)}
                      placeholder='Sandbox Pass ("test")'
                      style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
                <button type="submit" disabled={busy} className="button button-blue" style={{ justifyContent: 'center' }}>
                  {busy ? <Loader2 size={15} className="spin" /> : null} Pay Now via {gateway === 'phonepe' ? 'PhonePe' : 'Razorpay'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Default Export: Full Self-Contained Member Portal Enhancements
 */
export default function MemberPortalEnhancements({ member, activeTab, onNavigate }) {
  const pathname = usePathname() || '/';
  const isLogin = pathname.startsWith('/member/login');

  if (isLogin) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 16px 24px', background: '#f8f6f2' }}>
        <Link href="/forgot-password" style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>
          Forgot your Member Password? Reset via Email &amp; Mobile &rarr;
        </Link>
      </div>
    );
  }

  return (
    <MemberPortalProvider member={member} activeTab={activeTab} onNavigateTab={onNavigate}>
      <MemberUtilityHeader activeTab={activeTab} onNavigate={onNavigate} />
      <MemberBottomQuickBar activeTab={activeTab} onNavigate={onNavigate} />
      <MemberPortalDrawers />
    </MemberPortalProvider>
  );
}
