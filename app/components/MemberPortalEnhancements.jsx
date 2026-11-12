'use client';

import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function MemberPortalEnhancements() {
  const pathname = usePathname() || '/';
  const isDashboard = pathname.startsWith('/member/dashboard');
  const isLogin = pathname.startsWith('/member/login');

  const [member, setMember] = useState(null);
  const [ext, setExt] = useState({ referrals: [], activeReferrals: [], inactiveReferrals: [], notices: [] });
  const [theme, setTheme] = useState('light');
  const [search, setSearch] = useState('');
  const [activeDrawer, setActiveDrawer] = useState(null); // null | 'notices' | 'referrals' | 'share-id' | 'share-don' | 'donate' | 'receipt' | 'photo'
  const [refTab, setRefTab] = useState('all'); // 'all' | 'active' | 'inactive'
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
    try {
      const saved = localStorage.getItem('gsdd_member_theme') === 'dark' ? 'dark' : 'light';
      setTheme(saved);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('gsdd_member_theme', next);
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

  if (isLogin) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 16px 24px', background: '#f8f6f2' }}>
        <Link href="/forgot-password" style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>
          Forgot your Member Password? Reset via Email &amp; Mobile &rarr;
        </Link>
      </div>
    );
  }

  if (!isDashboard || !member) return null;

  const regNo = member.membershipId || member.regNo || 'NGO-2026-0032';
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

  const shareButtons = (label, url) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      <button type="button" onClick={() => copyLink(label, url)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {copiedKey === label ? <Check size={13} color="#059669" /> : <Copy size={13} />} Copy Link
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${label}: ${url}`)}`} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>WhatsApp</a>
      <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(label)}`} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: 8, background: '#0284c7', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Telegram</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: 8, background: '#1d4ed8', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Facebook</a>
    </div>
  );

  return (
    <div data-member-theme={theme} style={{ background: theme === 'dark' ? '#0b1220' : 'transparent', color: theme === 'dark' ? '#e2e8f0' : 'inherit' }}>
      {/* Top Member Quick Utility Chrome */}
      <div style={{ maxWidth: 1120, margin: '12px auto', padding: '10px 16px', background: theme === 'dark' ? '#111b2e' : '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px' }}>
          <Search size={15} color="#64748b" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick jump (notices, referrals, phonepe, receipt, photo)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = search.toLowerCase();
                if (q.includes('notice')) setActiveDrawer('notices');
                else if (q.includes('refer')) setActiveDrawer('referrals');
                else if (q.includes('phone') || q.includes('don')) setActiveDrawer('donate');
                else if (q.includes('receipt')) setActiveDrawer('receipt');
                else if (q.includes('photo')) setActiveDrawer('photo');
              }
            }}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => setActiveDrawer('referrals')} style={{ padding: '6px 11px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Users size={13} /> Referrals ({ext.activeReferrals.length} Active / {ext.inactiveReferrals.length} Pending)
          </button>
          <button type="button" onClick={() => setActiveDrawer('notices')} style={{ padding: '6px 11px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Bell size={13} /> Notices ({ext.notices.length})
          </button>
          <button type="button" onClick={() => setActiveDrawer('photo')} style={{ padding: '6px 11px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Upload size={13} /> Photo
          </button>
          <button type="button" onClick={toggleTheme} style={{ padding: '6px 11px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {theme === 'dark' ? <><Sun size={13} /> Light</> : <><Moon size={13} /> Dark</>}
          </button>
        </div>
      </div>

      {/* Bottom Sticky Member Quick-Access Bar */}
      <nav aria-label="Member Quick Access" style={{ position: 'sticky', bottom: 12, zIndex: 45, maxWidth: 680, margin: '12px auto', padding: '8px 12px', background: 'rgba(15,23,42,0.95)', color: '#fff', borderRadius: 14, display: 'flex', justifyContent: 'space-around', gap: 6, boxShadow: '0 14px 30px rgba(0,0,0,0.22)' }}>
        {[
          { id: 'share-id', label: 'ID CARD', icon: IdCard },
          { id: 'receipt', label: 'Appointment', icon: FileText },
          { id: 'referrals', label: 'Menu', icon: Menu },
          { id: 'notices', label: 'Certificate', icon: Award },
          { id: 'donate', label: 'Donation', icon: HandHeart },
        ].map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              type="button"
              onClick={() => setActiveDrawer(btn.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 0, background: 'transparent', color: '#e2e8f0', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
            >
              <Icon size={16} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Approval Pending Alert Modal */}
      {showPendingModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.7)', padding: 16 }}>
          <div style={{ width: 'min(440px, 100%)', background: '#fff', color: '#0f172a', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <AlertTriangle size={40} color="#d97706" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 8px' }}>Account Approval Under Review</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569' }}>
              Your membership registration ({regNo}) is currently <strong>{member.status}</strong>. Full ID Card and certificate downloads unlock automatically after Admin Verification.
            </p>
            <button type="button" className="button button-blue" onClick={() => setShowPendingModal(false)}>Dismiss Notice</button>
          </div>
        </div>
      )}

      {/* Active Feature Drawer Modal */}
      {activeDrawer && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.65)', padding: 16 }} onClick={() => setActiveDrawer(null)}>
          <div style={{ width: 'min(640px, 100%)', maxHeight: '88vh', overflowY: 'auto', background: '#fff', color: '#0f172a', borderRadius: 14, padding: 22 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <strong style={{ fontSize: 16 }}>
                {activeDrawer === 'referrals' && 'My Membership Referral Program'}
                {activeDrawer === 'notices' && 'My Notices Inbox'}
                {activeDrawer === 'share-id' && 'Share ID Card & Donation Link'}
                {activeDrawer === 'receipt' && 'Membership Receipt & Payment History'}
                {activeDrawer === 'photo' && 'Upload Member Profile Photo'}
                {activeDrawer === 'donate' && 'Donate Now (PhonePe test/test & Razorpay)'}
              </strong>
              <button type="button" onClick={() => setActiveDrawer(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {statusMsg && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#eff6ff', color: '#1e3a8a', fontSize: 13 }}>
                {statusMsg}
              </div>
            )}

            {activeDrawer === 'referrals' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8 }}><strong>Active Referrals:</strong> {ext.activeReferrals.length}</div>
                  <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}><strong>Inactive / Pending:</strong> {ext.inactiveReferrals.length}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                  <strong>Personal Referral Link:</strong> <code>{referralUrl}</code>
                  {shareButtons('Join GSDD Foundation via my referral', referralUrl)}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {['all', 'active', 'inactive'].map((t) => (
                    <button key={t} type="button" onClick={() => setRefTab(t)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: refTab === t ? '#2563eb' : '#fff', color: refTab === t ? '#fff' : '#0f172a', fontSize: 12, fontWeight: 700 }}>
                      {t[0].toUpperCase() + t.slice(1)} Referred ({t === 'active' ? ext.activeReferrals.length : t === 'inactive' ? ext.inactiveReferrals.length : ext.referrals.length})
                    </button>
                  ))}
                </div>
                {referredRows.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No referred members in this category yet.</p>
                ) : (
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><th>Reg No</th><th>Name</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {referredRows.map((r) => <tr key={r.id}><td>{r.regNo}</td><td>{r.name}</td><td>{r.accountStatus}</td><td>{r.joinedAt}</td></tr>)}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeDrawer === 'notices' && (
              <div style={{ display: 'grid', gap: 10 }}>
                {ext.notices.map((n) => (
                  <div key={n.id} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{n.message}</div>
                    <small style={{ color: '#64748b' }}>Sent: {String(n.sentAt).slice(0, 10)}</small>
                  </div>
                ))}
              </div>
            )}

            {activeDrawer === 'share-id' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Share2 size={15} /> Share Verified ID Card</div>
                  {shareButtons('Verify my GSDD Foundation Member ID', idCardShareUrl)}
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><HandHeart size={15} /> Share My Referral Donation Link</div>
                  {shareButtons('Support GSDD Foundation Programmes', donationShareUrl)}
                </div>
              </div>
            )}

            {activeDrawer === 'receipt' && (
              <div>
                <div style={{ padding: 16, border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: 14 }}>
                  <h4 style={{ margin: '0 0 8px' }}>OFFICIAL MEMBERSHIP FEE RECEIPT</h4>
                  <div style={{ fontSize: 13, display: 'grid', gap: 4 }}>
                    <div><strong>Member Name:</strong> {member.name}</div>
                    <div><strong>Registration No:</strong> {regNo}</div>
                    <div><strong>Status:</strong> {member.status}</div>
                  </div>
                </div>
                <button type="button" className="button button-blue" onClick={() => window.print()}>
                  <Printer size={15} /> Download / Print Receipt PDF
                </button>
              </div>
            )}

            {activeDrawer === 'photo' && (
              <div>
                {member.photoSrc && <img src={member.photoSrc} alt={member.name} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />}
                <p style={{ fontSize: 13, color: '#475569' }}>Upload JPG, PNG, GIF, or WebP photo (max 2 MB).</p>
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoUpload} disabled={busy} />
              </div>
            )}

            {activeDrawer === 'donate' && (
              <form onSubmit={handleMemberGatewayDonate} style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" onClick={() => setGateway('phonepe')} style={{ padding: 10, borderRadius: 8, border: gateway === 'phonepe' ? '2px solid #5f259f' : '1px solid #cbd5e1', fontWeight: 700 }}>PhonePe (test / test)</button>
                  <button type="button" onClick={() => setGateway('razorpay')} style={{ padding: 10, borderRadius: 8, border: gateway === 'razorpay' ? '2px solid #2563eb' : '1px solid #cbd5e1', fontWeight: 700 }}>Razorpay Test</button>
                </div>
                <input required type="number" min="1" value={donAmount} onChange={(e) => setDonAmount(e.target.value)} placeholder="Amount Rs." style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={donPurpose} onChange={(e) => setDonPurpose(e.target.value)} placeholder="Purpose" style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input value={donPan} onChange={(e) => setDonPan(e.target.value.toUpperCase())} placeholder="Optional PAN" style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                {gateway === 'phonepe' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input required value={nbUser} onChange={(e) => setNbUser(e.target.value)} placeholder='Sandbox User ("test")' style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    <input required type="password" value={nbPass} onChange={(e) => setNbPass(e.target.value)} placeholder='Sandbox Pass ("test")' style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
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
    </div>
  );
}
