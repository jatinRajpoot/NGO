'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, User, ShieldCheck, CreditCard, Receipt,
  QrCode, Award, Heart, Share2, Bell, MessageSquare, KeyRound,
  LogOut, CheckCircle2, Clock, Calendar, Edit3, Camera, MapPin, Mail, Phone,
  ExternalLink, ArrowRight, Download, Printer, Copy, Check, Send, AlertCircle
} from 'lucide-react';
import { defaultMembers } from '../member-data';
import { organization } from '../../data/site-data';
import QRCodeSvg from '../../components/QRCodeSvg';
import {
  MemberPortalProvider,
  MemberUtilityHeader,
  MemberBottomQuickBar,
  MemberPortalDrawers,
} from '../../components/MemberPortalEnhancements';
import '../member.css';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'details', label: 'Membership Details', icon: ShieldCheck },
  { id: 'fees', label: 'Membership Fees', icon: CreditCard },
  { id: 'receipts', label: 'Payment Receipts', icon: Receipt },
  { id: 'idcard', label: 'Membership ID Card', icon: QrCode },
  { id: 'certificates', label: 'My Certificates', icon: Award },
  { id: 'donations', label: 'My Donations', icon: Heart },
  { id: 'referral', label: 'Referral System', icon: Share2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'password', label: 'Change Password', icon: KeyRound },
];

export default function MemberDashboardPage() {
  const router = useRouter();
  const [member, setMember] = useState(defaultMembers[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [feeUtr, setFeeUtr] = useState('');
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [feeSubmittedPayment, setFeeSubmittedPayment] = useState(null);
  const [certSubtab, setCertSubtab] = useState('membership');
  const [donationAmount, setDonationAmount] = useState('1100');
  const [donationProgram, setDonationProgram] = useState('Rural Healthcare & Medical Camps');
  const [donationPan, setDonationPan] = useState('');
  const [donationUtr, setDonationUtr] = useState('');
  const [donationSubmitting, setDonationSubmitting] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [donationPendingRef, setDonationPendingRef] = useState(null);
  const [selectedDonationReceipt, setSelectedDonationReceipt] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [notificationsForm, setNotificationsForm] = useState({
    emailUpdates: true,
    whatsappUpdates: true,
    meetingAlerts: true,
    donationReceipts: true,
  });
  const [notifSaved, setNotifSaved] = useState('');
  const [notifError, setNotifError] = useState('');
  const [msgDept, setMsgDept] = useState('General Admin Office');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgStatusNotice, setMsgStatusNotice] = useState('');
  const [msgError, setMsgError] = useState('');
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: defaultMembers[0].name,
    phone: defaultMembers[0].phone,
    email: defaultMembers[0].email,
    address: defaultMembers[0].address,
    bio: defaultMembers[0].bio,
  });

  useEffect(() => {
    let active = true;
    fetch('/api/member/me/')
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.member) {
            setIsAuthenticated(true);
            setMember(data.member);
            if (data.member.notifications) {
              setNotificationsForm(data.member.notifications);
            }
            setProfileForm({
              name: data.member.name || '',
              phone: data.member.phone || '',
              email: data.member.email || '',
              address: data.member.address || '',
              bio: data.member.bio || '',
            });
            return;
          }
        }
        setIsAuthenticated(false);
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/member/logout/', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/member/login');
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setActionNotice('');
    if (!isAuthenticated) {
      setActionNotice('Sign in to your member account to save profile changes to the server.');
      return;
    }
    try {
      const res = await fetch('/api/member/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
          bio: profileForm.bio,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setActionNotice(data?.error || 'Could not update profile.');
        return;
      }
      setMember(data.member);
      setEditingProfile(false);
      setActionNotice('Profile saved to server.');
    } catch {
      setActionNotice('Network error saving profile.');
    }
  }

  if (!member) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading Member Portal...</div>;
  }

  const initials = member.name.split(' ').map((n) => n[0]).slice(0, 2).join('');

  return (
    <MemberPortalProvider member={member} activeTab={activeTab} onNavigateTab={setActiveTab}>
      <div className="member-dashboard-layout">
      {/* Sidebar matching handwritten sheet */}
      <aside className="member-sidebar" aria-label="Member Navigation">
        <div className="member-sidebar-header">
          <div className="member-avatar-mini">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFF' }}>
              {member.name}
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{member.designation}</span>
          </div>
        </div>

        <nav className="member-sidebar-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`member-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="member-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="member-nav-btn"
            style={{ color: '#F87171' }}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="member-content-main">
        {/* Top Member Quick Utility Search Bar */}
        <MemberUtilityHeader activeTab={activeTab} onNavigate={setActiveTab} />

        {/* Top Header Bar */}
        <div className="member-top-bar">
          <div className="member-greeting">
            <h1>Welcome, {member.name}!</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge-pill-active">
                <CheckCircle2 size={13} /> {member.status} Member
              </span>
              <span style={{ fontSize: '12px', color: 'var(--gsdd-text-muted)' }}>
                Member ID: <strong><code>{member.id}</code></strong> &bull; Category: <strong>{member.category}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button button-outline-blue"
              onClick={() => setActiveTab('profile')}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              <User size={15} /> My Profile
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }} role="status">
            <span><strong>Demo Preview Mode:</strong> Sign in with your member account to persist profile updates, payments, and messages on the server.</span>
            <Link href="/member/login" className="button button-blue" style={{ padding: '6px 14px', fontSize: '12px' }}>
              Sign In Now
            </Link>
          </div>
        )}

        {actionNotice && (
          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', marginBottom: '14px', fontSize: '13px', color: '#1E40AF' }} role="status">
            {actionNotice}
          </div>
        )}

        {/* Feature 3: Overview Tab (Apni Activities & Details Dekhna) */}
        {activeTab === 'overview' && (
          <div className="dashboard-tab-overview">
            <div className="member-stats-row">
              <div className="member-stat-card">
                <div className="stat-icon-wrap stat-icon-blue">
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{member.category}</span>
                  <span className="stat-lbl">{member.designation}</span>
                </div>
              </div>

              <div className="member-stat-card">
                <div className="stat-icon-wrap stat-icon-green">
                  <Calendar size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{member.activities?.length || 0}</span>
                  <span className="stat-lbl">Activities Attended</span>
                </div>
              </div>

              <div className="member-stat-card">
                <div className="stat-icon-wrap stat-icon-gold">
                  <Award size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">{member.certificates?.length || 0}</span>
                  <span className="stat-lbl">Official Certificates</span>
                </div>
              </div>

              <div className="member-stat-card">
                <div className="stat-icon-wrap stat-icon-purple">
                  <Heart size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-val">₹{(member.donations?.reduce((s, d) => s + d.amount, 0) || 0).toLocaleString('en-IN')}</span>
                  <span className="stat-lbl">Total Contributions</span>
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="member-dashboard-card">
              <div className="card-header-bar">
                <h2>My Community Activities &amp; Events</h2>
                <span style={{ fontSize: '12px', color: 'var(--gsdd-text-muted)' }}>Verified participation records</span>
              </div>
              <div className="activity-feed-list">
                {member.activities?.map((act) => (
                  <div className="activity-feed-item" key={act.id}>
                    <div>
                      <span className="act-title">{act.title}</span>
                      <div className="act-meta">
                        <span>Role: <strong>{act.role}</strong></span> &bull; <span>Date: {act.date}</span>
                      </div>
                    </div>
                    <span className="badge-pill-active" style={{ fontSize: '11px' }}>
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="member-dashboard-card" style={{ background: '#F8F7F4' }}>
              <div className="card-header-bar">
                <h3>Member Quick Access</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button type="button" onClick={() => setActiveTab('idcard')} className="button button-blue" style={{ fontSize: '13px' }}>
                  <QrCode size={15} /> Download ID Card
                </button>
                <button type="button" onClick={() => setActiveTab('certificates')} className="button button-outline-blue" style={{ fontSize: '13px' }}>
                  <Award size={15} /> My Certificates
                </button>
                <button type="button" onClick={() => setActiveTab('fees')} className="button button-outline-blue" style={{ fontSize: '13px' }}>
                  <CreditCard size={15} /> Pay Membership Fee
                </button>
                <button type="button" onClick={() => setActiveTab('messages')} className="button button-outline-blue" style={{ fontSize: '13px' }}>
                  <MessageSquare size={15} /> Message Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature 4: My Profile Tab (Name, photo, email, mobile) */}
        {activeTab === 'profile' && (
          <div className="dashboard-tab-profile">
            <div className="member-dashboard-card">
              <div className="card-header-bar">
                <h2>My Official Member Profile</h2>
                <button
                  type="button"
                  className="button button-outline-blue"
                  onClick={() => setEditingProfile(!editingProfile)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Edit3 size={14} /> {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>

              {!editingProfile ? (
                <div className="profile-overview-layout">
                  <div className="profile-avatar-card">
                    <div className="profile-avatar-large">{initials}</div>
                    <strong style={{ fontSize: '16px', color: 'var(--gsdd-navy-dark)' }}>{member.name}</strong>
                    <span className="tier-badge" style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                      {member.designation}
                    </span>
                    <small style={{ color: 'var(--gsdd-text-muted)' }}>{member.category}</small>
                  </div>

                  <div className="profile-details-grid">
                    <div className="prof-field">
                      <span className="prof-lbl">Member ID</span>
                      <span className="prof-val"><code>{member.id}</code></span>
                    </div>

                    <div className="prof-field">
                      <span className="prof-lbl">Father&apos;s / Spouse&apos;s Name</span>
                      <span className="prof-val">{member.fatherSpouse}</span>
                    </div>

                    <div className="prof-field">
                      <span className="prof-lbl">Email Address</span>
                      <span className="prof-val">
                        <a href={`mailto:${member.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {member.email}
                        </a>
                      </span>
                    </div>

                    <div className="prof-field">
                      <span className="prof-lbl">Mobile / WhatsApp</span>
                      <span className="prof-val">
                        <a href={`tel:${member.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {member.phone}
                        </a>
                      </span>
                    </div>

                    <div className="prof-field">
                      <span className="prof-lbl">Blood Group</span>
                      <span className="prof-val">{member.bloodGroup || 'Not specified'}</span>
                    </div>

                    <div className="prof-field">
                      <span className="prof-lbl">Membership Joining Date</span>
                      <span className="prof-val">{member.joinDate}</span>
                    </div>

                    <div className="prof-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="prof-lbl">Registered Address</span>
                      <span className="prof-val">{member.address}</span>
                    </div>

                    <div className="prof-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="prof-lbl">Official Biography / Notes</span>
                      <span className="prof-val">{member.bio || 'Active GSDD Foundation member.'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="member-form-grid">
                    <div className="member-form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="member-form-group">
                      <label>Mobile / WhatsApp</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="member-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="member-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Residential Address</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="member-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Biography / Roles</label>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="button button-blue">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="button-text"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Feature 5: Membership Details (Designation & membership status) */}
        {activeTab === 'details' && (
          <div className="dashboard-tab-details">
            <div className="member-dashboard-card">
              <div className="card-header-bar">
                <h2>Membership Affiliation &amp; Status</h2>
                <span className="badge-pill-active">
                  <CheckCircle2 size={13} /> {member.status}
                </span>
              </div>

              <p style={{ color: 'var(--gsdd-text-muted)', fontSize: '13px' }}>
                Your membership is registered under Section 8 of Companies Act 2013 with {organization.legalName}.
              </p>

              <div className="membership-meta-grid">
                <div className="meta-box">
                  <span className="lbl">Official Designation</span>
                  <span className="val" style={{ color: 'var(--gsdd-blue-primary)' }}>{member.designation}</span>
                </div>
                <div className="meta-box">
                  <span className="lbl">Membership Category</span>
                  <span className="val">{member.category}</span>
                </div>
                <div className="meta-box">
                  <span className="lbl">Membership ID</span>
                  <span className="val"><code>{member.id}</code></span>
                </div>
                <div className="meta-box">
                  <span className="lbl">Joining Date</span>
                  <span className="val">{member.joinDate}</span>
                </div>
                <div className="meta-box">
                  <span className="lbl">Validity Status</span>
                  <span className="val" style={{ color: '#15803D' }}>{member.validTill || 'Lifetime Active'}</span>
                </div>
                <div className="meta-box">
                  <span className="lbl">Voting &amp; Governance</span>
                  <span className="val">General Body Voting Right</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: '#F8F7F4', borderRadius: '8px', border: '1px solid #E2DED5' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--gsdd-navy-dark)' }}>
                  Committee &amp; Program Responsibilities
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)', lineHeight: 1.5 }}>
                  {member.notes || 'Authorized to facilitate digital literacy, healthcare camps, and youth workshops in district.'}
                </p>
                <div style={{ marginTop: '12px' }}>
                  <Link href={`/verify?code=${member.id}`} className="button button-outline-blue" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    <ShieldCheck size={14} /> Verify Registry Record
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature 6: Membership Fees (Pay fee via UPI QR & UTR) */}
        {activeTab === 'fees' && (
          <div className="dashboard-tab-fees">
            <div className="fee-payment-card">
              <div className="card-header-bar">
                <h2>Membership Subscription &amp; Fee Status</h2>
              </div>

              <div className={`fee-status-banner ${member.feeStatus === 'Paid' ? 'paid' : 'due'}`}>
                <div>
                  <strong style={{ fontSize: '15px' }}>
                    Current Status: {member.feeStatus}
                  </strong>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.9 }}>
                    Subscription Plan: <strong>{member.feeType}</strong> ({member.category})
                  </p>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>
                  ₹{member.feeAmount?.toLocaleString('en-IN') || 1200}
                </span>
              </div>

              {member.feeStatus === 'Paid' ? (
                <div style={{ padding: '20px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                  <CheckCircle2 size={36} color="#15803D" style={{ margin: '0 auto 8px' }} />
                  <h3 style={{ margin: 0, color: '#166534', fontSize: '17px' }}>Fees Verified &amp; Paid</h3>
                  <p style={{ margin: '4px 0 16px', fontSize: '13px', color: '#15803D' }}>
                    Your subscription is reconciled and in good standing.
                  </p>
                  <button
                    type="button"
                    className="button button-blue"
                    onClick={() => setActiveTab('receipts')}
                  >
                    <Receipt size={16} /> View &amp; Download Receipt
                  </button>
                </div>
              ) : (
                <div className="upi-checkout-layout">
                  <div className="upi-qr-card">
                    <div className="visual-qr-box">
                      <QRCodeSvg
                        value={`upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20FOUNDATION&am=${member.feeAmount || 1200}&cu=INR&tn=${encodeURIComponent(`Membership Fee ${member.id}`)}`}
                        size={130}
                        label="Scan with UPI App"
                      />
                    </div>
                    <strong className="qr-amount-pill">₹{member.feeAmount?.toLocaleString('en-IN') || 1200}</strong>
                    <div className="upi-id-row">
                      <span>UPI: <code>foundationgsdd@okaxis</code></span>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFeeError('');
                      if (!isAuthenticated) {
                        setFeeError('Please sign in to submit a membership fee payment reference.');
                        return;
                      }
                      setFeeSubmitting(true);
                      try {
                        const res = await fetch('/api/member/fee-payment/', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ utr: feeUtr.trim(), paymentMode: 'UPI' }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.ok) {
                          setFeeError(data?.error || 'Could not submit fee payment UTR.');
                          return;
                        }
                        if (data.member) setMember(data.member);
                        setFeeSubmittedPayment(data.payment);
                        setFeeUtr('');
                      } catch {
                        setFeeError('Network error submitting payment reference.');
                      } finally {
                        setFeeSubmitting(false);
                      }
                    }}
                    className="payment-confirm-form"
                  >
                    {feeError && (
                      <p role="alert" style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '12px', background: '#FEF2F2', padding: '8px 10px', borderRadius: '6px' }}>
                        {feeError}
                      </p>
                    )}

                    {(feeSubmittedPayment || member.feeStatus === 'Pending Verification') && (
                      <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '12px', color: '#92400E' }} role="status">
                        <strong>Pending Verification:</strong> UTR {feeSubmittedPayment?.utr || member.feePayments?.[0]?.utr || ''} is recorded on the server. Receipt unlocks once reconciled with bank settlement.
                      </div>
                    )}

                    <label>
                      <span>UPI Ref / Transaction UTR Number *</span>
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="e.g. 606129482112"
                        value={feeUtr}
                        onChange={(e) => setFeeUtr(e.target.value)}
                      />
                    </label>

                    <button type="submit" disabled={feeSubmitting} className="button button-blue full-width">
                      <Clock size={16} /> {feeSubmitting ? 'Submitting...' : 'Submit UTR (Pending Reconciliation)'}
                    </button>

                    <p style={{ fontSize: '11px', color: 'var(--gsdd-text-muted)', margin: 0 }}>
                      Bank Transfer: SBI Raniganj A/C: 42890100982341 &bull; IFSC: SBIN0001234
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature 7: Payment Receipt (Only available after server reconciliation) */}
        {activeTab === 'receipts' && (
          <div className="dashboard-tab-receipts">
            <div className="member-dashboard-card">
              <div className="card-header-bar no-print">
                <h2>Official Membership Payment Receipt</h2>
                {member.feeStatus === 'Paid' && (
                  <button
                    type="button"
                    className="button button-blue"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} /> Print / Download Receipt
                  </button>
                )}
              </div>

              {member.feeStatus !== 'Paid' ? (
                <div style={{ padding: '20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', color: '#92400E' }} role="status">
                  <strong style={{ display: 'block', marginBottom: '6px' }}>
                    Official Receipt Not Issued (Status: {member.feeStatus})
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                    Membership receipts are generated only after your submitted UTR is verified and reconciled with bank settlement by the administration.
                  </p>
                </div>
              ) : (
                <div className="receipt-paper-frame">
                  <div className="receipt-header-row">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--gsdd-navy-dark)' }}>
                        {organization.legalName}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--gsdd-text-muted)' }}>
                        Section 8 Nonprofit &bull; CIN: {organization.cin} &bull; Darpan: {organization.darpan}
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--gsdd-text-muted)' }}>
                        12A: {organization.tax12a} &bull; 80G: {organization.tax80g}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="receipt-title-badge">MEMBERSHIP RECEIPT</span>
                      <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                        {member.feePayments?.find((p) => p.status === 'Verified')?.receiptNo || `GSDD-M-REC-2026-${member.id.slice(-3)}`}
                      </div>
                    </div>
                  </div>

                  <div className="receipt-table-list">
                    <div className="r-row-item">
                      <span className="r-lbl">Member Name:</span>
                      <span className="r-val">{member.name}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Member ID:</span>
                      <span className="r-val"><code>{member.id}</code></span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Category &amp; Designation:</span>
                      <span className="r-val">{member.category} ({member.designation})</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Fee Particulars:</span>
                      <span className="r-val">{member.feeType} Subscription</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Amount Paid:</span>
                      <span className="r-val" style={{ color: '#15803D', fontSize: '15px' }}>
                        ₹{member.feeAmount?.toLocaleString('en-IN') || 1200}
                      </span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Payment Status:</span>
                      <span className="r-val">Verified &amp; Reconciled</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Receipt Date:</span>
                      <span className="r-val">{member.joinDate}</span>
                    </div>
                  </div>

                  <div className="receipt-sign-row">
                    <div>
                      <small style={{ fontSize: '10px', color: '#64748B' }}>
                        Head Office: {organization.address}
                      </small>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid #0F172A', width: '120px', paddingBottom: '2px', fontSize: '11px', fontWeight: '700' }}>
                        Authorized Signatory
                      </div>
                      <small style={{ fontSize: '9px', color: '#64748B' }}>GSDD Foundation</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature 8: Membership ID card (QR code wala ID card download) */}
        {activeTab === 'idcard' && (
          <div className="dashboard-tab-idcard">
            <div className="member-dashboard-card">
              <div className="card-header-bar no-print">
                <h2>Official Membership Photo ID Card</h2>
                <button
                  type="button"
                  className="button button-blue"
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> Print / Save ID Card
                </button>
              </div>

              <p className="no-print" style={{ color: 'var(--gsdd-text-muted)', fontSize: '13px' }}>
                Official photo identity card with live verification QR code verifiable across all administrative centers.
              </p>

              {/* ID Card Front & Back Printable */}
              <div className="id-card-container">
                {/* Front Side */}
                <div className="id-card-frame">
                  <div className="id-card-header">
                    <h4>GSDD FOUNDATION</h4>
                    <small>{organization.legalName}</small>
                  </div>

                  <div className="id-card-body">
                    <div className="id-photo-placeholder">{initials}</div>
                    <h3 className="id-member-name">{member.name}</h3>
                    <span className="id-designation-badge">{member.designation}</span>

                    <div className="id-details-table">
                      <div className="id-detail-row">
                        <span className="k">MEMBER ID:</span>
                        <span className="v"><code>{member.id}</code></span>
                      </div>
                      <div className="id-detail-row">
                        <span className="k">CATEGORY:</span>
                        <span className="v">{member.category}</span>
                      </div>
                      <div className="id-detail-row">
                        <span className="k">BLOOD GROUP:</span>
                        <span className="v">{member.bloodGroup || 'O+'}</span>
                      </div>
                      <div className="id-detail-row">
                        <span className="k">JOINED:</span>
                        <span className="v">{member.joinDate}</span>
                      </div>
                      <div className="id-detail-row">
                        <span className="k">VALIDITY:</span>
                        <span className="v" style={{ color: '#15803D' }}>{member.validTill || 'Lifetime'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="id-card-footer">
                    <span>Govt. of India Section 8 Registered &bull; CIN: {organization.cin}</span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="id-card-frame id-card-back">
                  <div className="id-card-header" style={{ background: '#0F172A' }}>
                    <h4>OFFICIAL VERIFICATION</h4>
                    <small>Scan QR code below to verify identity</small>
                  </div>

                  <div className="id-card-body">
                    <div className="id-back-qr">
                      <QRCodeSvg
                        value={`https://gsddfoundation.org/verify/?code=${encodeURIComponent(member.id)}`}
                        size={96}
                        label=""
                      />
                    </div>
                    <code style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gsdd-navy-dark)' }}>
                      {member.id}
                    </code>

                    <div className="id-back-terms" style={{ marginTop: '14px' }}>
                      <p style={{ margin: '0 0 6px' }}><strong>Registered Address:</strong> {organization.address}</p>
                      <p style={{ margin: '0 0 6px' }}><strong>Helpline:</strong> {organization.phone}</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#64748B' }}>This card is non-transferable and remains property of GSDD Foundation.</p>
                    </div>
                  </div>

                  <div className="id-card-footer">
                    <span>Verify online at: gsddfoundation.org/verify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: My Certificates & Letters (Features 9, 10, 11) */}
        {activeTab === 'certificates' && (
          <div className="member-dashboard-card">
            <div className="card-header-bar">
              <div>
                <h2>Certificates & Letters</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                  Download and print your official membership certificate, appointment letter, and achievement certificates.
                </p>
              </div>
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                <span>Print / Download PDF</span>
              </button>
            </div>

            <div className="subtab-switcher">
              <button
                type="button"
                className={`subtab-btn ${certSubtab === 'membership' ? 'active' : ''}`}
                onClick={() => setCertSubtab('membership')}
              >
                1. Membership Certificate
              </button>
              <button
                type="button"
                className={`subtab-btn ${certSubtab === 'appointment' ? 'active' : ''}`}
                onClick={() => setCertSubtab('appointment')}
              >
                2. Appointment Letter
              </button>
              <button
                type="button"
                className={`subtab-btn ${certSubtab === 'achievement' ? 'active' : ''}`}
                onClick={() => setCertSubtab('achievement')}
              >
                3. Achievement Certificate
              </button>
            </div>

            {/* Feature 9: Membership Certificate */}
            {certSubtab === 'membership' && (
              <div className="cert-paper-frame">
                <div className="cert-inner-border">
                  <div className="cert-badge-icon">
                    <Award size={32} />
                  </div>
                  <h3 className="cert-org-title">{organization.name}</h3>
                  <div className="cert-org-subtitle">
                    Registered Section 8 Non-Profit &bull; CIN: {organization.cin} &bull; Reg: {organization.registrationNumber}
                  </div>

                  <div className="cert-main-heading">Certificate of Membership</div>
                  <div className="cert-presentation-text">This official certificate is proudly presented to</div>

                  <div className="cert-recipient-name">{member.name}</div>

                  <div className="cert-body-text">
                    Having duly fulfilled all enrollment qualifications under the foundation charter, is hereby certified and admitted as an esteemed <strong>{member.category}</strong> with portfolio designation of <strong>{member.designation}</strong> in Gurudev Shree Dhyanyogi Sharanam Foundation, entitled to all official privileges and representation rights.
                  </div>

                  <div className="cert-meta-grid">
                    <div className="cert-meta-item">
                      <span>MEMBER ID</span>
                      <strong>{member.id}</strong>
                    </div>
                    <div className="cert-meta-item">
                      <span>INDUCTION DATE</span>
                      <strong>{member.joinDate}</strong>
                    </div>
                    <div className="cert-meta-item">
                      <span>VALIDITY</span>
                      <strong>{member.validTill || 'Lifetime'}</strong>
                    </div>
                  </div>

                  <div className="cert-footer-row">
                    <div className="cert-sign-box">
                      <div className="cert-sign-line" />
                      <div className="cert-sign-label">General Secretary</div>
                      <div className="cert-sign-sub">GSDD Foundation</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <QrCode size={48} color="#D97706" />
                      <div style={{ fontSize: '9px', color: '#92400E', marginTop: '2px' }}>VERIFIED SEAL</div>
                    </div>
                    <div className="cert-sign-box">
                      <div className="cert-sign-line" />
                      <div className="cert-sign-label">National President</div>
                      <div className="cert-sign-sub">GSDD Foundation</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 10: Appointment Letter */}
            {certSubtab === 'appointment' && (
              <div className="appointment-letter-paper">
                <div className="apt-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--gsdd-navy-dark)', fontFamily: 'var(--display)' }}>
                      {organization.name}
                    </h3>
                    <small style={{ color: '#64748B' }}>
                      Section 8 Not-For-Profit Enterprise &bull; CIN: {organization.cin}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748B' }}>
                    <div>{organization.email}</div>
                    <div>{organization.phone}</div>
                  </div>
                </div>

                <div className="apt-ref-row">
                  <span><strong>Ref:</strong> GSDD/APT/{member.id}/{new Date().getFullYear()}</span>
                  <span><strong>Date:</strong> {member.joinDate}</span>
                </div>

                <div className="apt-recipient">
                  <div><strong>To,</strong></div>
                  <div><strong>{member.name}</strong></div>
                  <div>{member.address}</div>
                  <div>Phone: {member.phone}</div>
                </div>

                <div className="apt-subject">
                  Subject: Letter of Appointment as {member.designation} ({member.category})
                </div>

                <div className="apt-body">
                  <p>Dear {member.name},</p>
                  <p>
                    On behalf of the Governing Board of <strong>Gurudev Shree Dhyanyogi Sharanam Foundation</strong>, we are delighted to officially convey your appointment as <strong>{member.designation}</strong> within our <strong>{member.category}</strong> cadre, effective from {member.joinDate}.
                  </p>
                  <p>
                    As an appointed office-bearer, your key portfolio responsibilities and duties include:
                  </p>
                  <ul className="apt-duties-list">
                    <li>Steering grassroots community empowerment initiatives in health, education, and social welfare.</li>
                    <li>Representing the foundation at governmental, CSR, and inter-organizational conferences.</li>
                    <li>Ensuring strict adherence to Section 8 statutory guidelines, ethics, and transparent operations.</li>
                    <li>Mentoring new members, mobilizing voluntary resources, and driving district-level outreach.</li>
                  </ul>
                  <p>
                    This appointment is subject to the Constitution and bylaws of the Foundation. We are confident that your distinguished expertise and dedication will steer our shared vision of holistic upliftment.
                  </p>
                </div>

                <div className="apt-sign-row">
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Official Seal of Foundation</div>
                    <div style={{ marginTop: '8px', padding: '6px 14px', border: '1px dashed #94A3B8', display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#0F172A', borderRadius: '4px' }}>
                      GSDD ARARIA OFFICE
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '160px', borderTop: '1px solid #0F172A', marginBottom: '6px' }} />
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>National President</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Gurudev Shree Dhyanyogi Sharanam Foundation</div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 11: Achievement Certificate */}
            {certSubtab === 'achievement' && (
              <div className="cert-paper-frame">
                <div className="cert-inner-border">
                  <div className="cert-badge-icon">
                    <Award size={32} />
                  </div>
                  <h3 className="cert-org-title">{organization.name}</h3>
                  <div className="cert-org-subtitle">
                    Recognizing Selfless Public Service &bull; Registered Section 8 NGO
                  </div>

                  <div className="cert-main-heading">Certificate of Achievement</div>
                  <div className="cert-presentation-text">Awarded in recognition of outstanding humanitarian contribution to</div>

                  <div className="cert-recipient-name">{member.name}</div>

                  <div className="cert-body-text">
                    For exemplary leadership, relentless commitment, and exceptional contribution in social service, rural outreach camps, and community welfare programs conducted under Gurudev Shree Dhyanyogi Sharanam Foundation.
                  </div>

                  <div className="cert-meta-grid">
                    <div className="cert-meta-item">
                      <span>AWARD REF</span>
                      <strong>{member.certificates?.find((c) => c.type === 'Achievement Certificate')?.certNo || 'GSDD-ACH-2026-081'}</strong>
                    </div>
                    <div className="cert-meta-item">
                      <span>AWARDED ON</span>
                      <strong>{member.certificates?.find((c) => c.type === 'Achievement Certificate')?.date || '2026-02-28'}</strong>
                    </div>
                    <div className="cert-meta-item">
                      <span>CADRE</span>
                      <strong>{member.designation}</strong>
                    </div>
                  </div>

                  <div className="cert-footer-row">
                    <div className="cert-sign-box">
                      <div className="cert-sign-line" />
                      <div className="cert-sign-label">Governing Patron</div>
                      <div className="cert-sign-sub">GSDD Foundation</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <QrCode size={48} color="#D97706" />
                      <div style={{ fontSize: '9px', color: '#92400E', marginTop: '2px' }}>MERIT VERIFIED</div>
                    </div>
                    <div className="cert-sign-box">
                      <div className="cert-sign-line" />
                      <div className="cert-sign-label">National President</div>
                      <div className="cert-sign-sub">GSDD Foundation</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 8: My Donations & Donation History (Features 12 & 13) */}
        {activeTab === 'donations' && (
          <div>
            {/* If a donation receipt is being viewed */}
            {selectedDonationReceipt ? (
              <div className="member-dashboard-card">
                <div className="card-header-bar">
                  <div>
                    <h2>Donation Receipt #{selectedDonationReceipt.receiptNo}</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                      Official 80G Tax Exemption Certificate for Donation
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setSelectedDonationReceipt(null)}
                    >
                      Back to Donations
                    </button>
                    <button
                      type="button"
                      className="btn-action-primary"
                      onClick={() => window.print()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={16} />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>

                <div className="receipt-paper-frame">
                  <div className="receipt-header-row">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--gsdd-navy-dark)', fontFamily: 'var(--display)' }}>
                        {organization.name}
                      </h3>
                      <small style={{ color: '#64748B', display: 'block', marginTop: '2px' }}>
                        Registered Section 8 NGO &bull; 80G Tax Exemption Certified
                      </small>
                      <small style={{ color: '#64748B' }}>CIN: {organization.cin}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '800' }}>
                        DONATION RECEIPT
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        Receipt No: <strong>{selectedDonationReceipt.receiptNo}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="receipt-table-list">
                    <div className="r-row-item">
                      <span className="r-lbl">Donor Name</span>
                      <span className="r-val">{member.name}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Member ID</span>
                      <span className="r-val">{member.id}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Donation Program / Cause</span>
                      <span className="r-val">{selectedDonationReceipt.program}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Payment Mode & UTR</span>
                      <span className="r-val">{selectedDonationReceipt.utr || 'UPI'}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Donation Date</span>
                      <span className="r-val">{selectedDonationReceipt.date}</span>
                    </div>
                    <div className="r-row-item">
                      <span className="r-lbl">Tax Benefit</span>
                      <span className="r-val" style={{ color: '#15803D' }}>Eligible for 50% deduction under Section 80G of Income Tax Act</span>
                    </div>
                    <div className="r-row-item" style={{ borderBottom: '2px solid #0F172A', paddingTop: '10px' }}>
                      <span className="r-lbl" style={{ fontSize: '15px', color: '#0F172A' }}>Total Amount Donated</span>
                      <span className="r-val" style={{ fontSize: '18px', color: '#1E3A8A' }}>₹{Number(selectedDonationReceipt.amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="receipt-sign-row">
                    <div>
                      <QRCodeSvg
                        value={`https://gsddfoundation.org/verify/?code=${encodeURIComponent(selectedDonationReceipt.receiptNo || selectedDonationReceipt.trackingId || selectedDonationReceipt.id)}`}
                        size={72}
                        label="Verify 80G"
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ width: '150px', borderTop: '1px solid #0F172A', marginBottom: '4px' }} />
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Authorized Signatory</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Finance & Accounts, GSDD Foundation</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="member-dashboard-card">
                <div className="card-header-bar">
                  <div>
                    <h2>My Donations &amp; Contributions</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                      Submit a donation transfer reference for server verification. Official 80G receipts are generated only after settlement.
                    </p>
                  </div>
                </div>

                <div className="donation-grid-layout">
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--gsdd-navy-dark)' }}>
                      Contribute to a Cause
                    </h3>

                    {donationError && (
                      <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }} role="alert">
                        {donationError}
                      </div>
                    )}

                    {donationPendingRef && (
                      <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '6px', fontSize: '12px' }} role="status">
                        <Clock size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        <span>
                          <strong>Recorded as Pending Verification:</strong> Tracking ID <code>{donationPendingRef.trackingId}</code> (UTR: <code>{donationPendingRef.utr}</code>). An 80G tax receipt will be issued after bank settlement verification.
                        </span>
                      </div>
                    )}

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setDonationError('');
                        setDonationPendingRef(null);
                        if (!isAuthenticated) {
                          setDonationError('Please sign in to submit a donation verification record.');
                          return;
                        }
                        if (!donationAmount || Number(donationAmount) < 100) {
                          setDonationError('Donation amount must be at least ₹100.');
                          return;
                        }
                        if (donationUtr.trim().length < 6) {
                          setDonationError('Please enter a valid UPI / bank UTR reference (at least 6 characters).');
                          return;
                        }
                        setDonationSubmitting(true);
                        try {
                          const res = await fetch('/api/member/donations/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: Number(donationAmount),
                              program: donationProgram,
                              pan: donationPan.trim().toUpperCase(),
                              utr: donationUtr.trim(),
                              method: 'UPI',
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.ok) {
                            setDonationError(data?.error || 'Could not record donation submission.');
                            return;
                          }
                          if (data.member) setMember(data.member);
                          setDonationPendingRef(data.donation);
                          setDonationUtr('');
                        } catch {
                          setDonationError('Network error submitting donation reference.');
                        } finally {
                          setDonationSubmitting(false);
                        }
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Select Welfare Program</label>
                        <select
                          className="form-control"
                          value={donationProgram}
                          onChange={(e) => setDonationProgram(e.target.value)}
                        >
                          <option>Rural Healthcare &amp; Medical Camps</option>
                          <option>Free Girl Child Education Fund</option>
                          <option>Women Self-Help &amp; Vocational Livelihood</option>
                          <option>Environmental Tree Plantation &amp; Cleanliness</option>
                          <option>General Welfare Corpus Fund</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Select Amount (₹)</label>
                        <div className="quick-amount-chips">
                          {['500', '1100', '2100', '5100', '11000'].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className={`chip-btn ${donationAmount === amt ? 'active' : ''}`}
                              onClick={() => setDonationAmount(amt)}
                            >
                              ₹{Number(amt).toLocaleString('en-IN')}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Or enter custom amount in ₹"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          min="100"
                          required
                        />
                      </div>

                      <div className="donation-qr-box">
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                          Scan UPI QR to Donate ₹{Number(donationAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ display: 'inline-block', background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                          <QRCodeSvg
                            value={`upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20FOUNDATION&am=${Number(donationAmount) || 1100}&cu=INR&tn=${encodeURIComponent(`Member Donation ${donationProgram}`)}`}
                            size={120}
                            label="Scan UPI QR"
                          />
                        </div>
                        <div>
                          <div className="upi-string-badge">
                            <span>foundationgsdd@okaxis</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Supports Google Pay, PhonePe, Paytm, BHIM &amp; all UPI apps
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '14px', marginBottom: '12px' }}>
                        <label className="form-label">PAN Number (Optional, for 80G tax benefit claim)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. ABCDE1234F"
                          value={donationPan}
                          onChange={(e) => setDonationPan(e.target.value.toUpperCase())}
                          maxLength={10}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">UPI Reference / UTR Number *</label>
                        <input
                          type="text"
                          required
                          minLength={6}
                          className="form-control"
                          placeholder="e.g. 604123891024"
                          value={donationUtr}
                          onChange={(e) => setDonationUtr(e.target.value)}
                        />
                      </div>

                      <button type="submit" disabled={donationSubmitting} className="btn-action-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        {donationSubmitting ? 'Submitting UTR...' : 'Submit Donation Reference (Pending Verification)'}
                      </button>
                    </form>
                  </div>

                  {/* Feature 13: Donation History */}
                  <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--gsdd-navy-dark)' }}>
                      Donation History &amp; Verified Receipts
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '700' }}>VERIFIED DONATIONS</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1E3A8A' }}>
                          ₹{(member.donations || []).filter((d) => d.status === 'Verified').reduce((acc, d) => acc + Number(d.amount), 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>80G URN (VERIFY STATUS)</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#15803D' }}>
                          {organization.tax80g}
                        </div>
                      </div>
                    </div>

                    <div className="donation-table-wrapper">
                      <table className="donation-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Program</th>
                            <th>Amount</th>
                            <th>Status / Receipt</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(member.donations || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>
                                No donation records found yet.
                              </td>
                            </tr>
                          ) : (
                            member.donations.map((don) => {
                              const isVerified = don.status === 'Verified' && Boolean(don.receiptNo);
                              return (
                                <tr key={don.id}>
                                  <td>{don.date}</td>
                                  <td>
                                    <strong>{don.program}</strong>
                                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                                      {don.utr}{(!isAuthenticated || don.isDemoSample) ? ' • Demo Sample' : ''}
                                    </div>
                                  </td>
                                  <td>
                                    <strong>₹{Number(don.amount).toLocaleString('en-IN')}</strong>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '11px', background: isVerified ? '#DCFCE7' : '#FEF3C7', color: isVerified ? '#166534' : '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                      {isVerified ? don.receiptNo : (don.status || 'Pending Verification')}
                                    </span>
                                  </td>
                                  <td>
                                    {isVerified ? (
                                      <button
                                        type="button"
                                        className="btn-outline"
                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                        onClick={() => setSelectedDonationReceipt(don)}
                                      >
                                        View Receipt
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: '#64748B' }}>Awaiting reconciliation</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Referral System (Feature 14) */}
        {activeTab === 'referral' && (
          <div className="member-dashboard-card">
            <div className="card-header-bar">
              <div>
                <h2>Advocacy & Referral System</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                  Invite friends and community members to join GSDD Foundation and track your advocacy outreach.
                </p>
              </div>
            </div>

            {/* Share Card */}
            <div className="referral-share-card">
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1E3A8A' }}>
                Your Unique Member Referral Link
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                Share this link with potential members. When they register, your advocacy score increases!
              </p>

              <div className="referral-link-input-group">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/member/register?ref=${member.referralCode || member.id}`
                      : `https://gsddfoundation.org/member/register?ref=${member.referralCode || member.id}`
                  }
                />
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => {
                    const link = typeof window !== 'undefined'
                      ? `${window.location.origin}/member/register?ref=${member.referralCode || member.id}`
                      : `https://gsddfoundation.org/member/register?ref=${member.referralCode || member.id}`;
                    navigator.clipboard?.writeText(link);
                    setReferralCopied(true);
                    setTimeout(() => setReferralCopied(false), 2500);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {referralCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{referralCopied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Namaste! Join me as an active member of Gurudev Shree Dhyanyogi Sharanam Foundation. Register here: ${
                      typeof window !== 'undefined' ? window.location.origin : 'https://gsddfoundation.org'
                    }/member/register?ref=${member.referralCode || member.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-share"
                >
                  <Share2 size={16} />
                  <span>Share on WhatsApp</span>
                </a>
              </div>

              <div style={{ display: 'inline-block', fontSize: '12px', color: '#475569' }}>
                Referral Code: <strong style={{ letterSpacing: '0.05em', color: '#1E3A8A' }}>{member.referralCode || member.id}</strong>
              </div>
            </div>

            {/* Statistics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>MEMBERS ENROLLED VIA YOU</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
                  {member.referralCount || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px' }}>+2 this month</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>ADVOCATE BADGE TIER</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>
                  {(member.referralCount || 0) >= 10 ? 'Gold Ambassador' : (member.referralCount || 0) >= 5 ? 'Silver Advocate' : 'Bronze Supporter'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Level 3 Verified</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>COMMUNITY SOCIAL KARMA</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#1E3A8A', marginTop: '4px' }}>
                  {((member.referralCount || 0) * 100).toLocaleString('en-IN')} pts
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>100 pts per verified member</div>
              </div>
            </div>

            {/* How it works info */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#0F172A' }}>How the Member Advocacy Program Works</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '12px', color: '#475569' }}>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '6px' }}>
                  <strong>1. Share Your Link:</strong> Send your personal referral link via WhatsApp, Email, or Social Media to like-minded social workers.
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '6px' }}>
                  <strong>2. Member Registers:</strong> Your referral code is automatically attached when they apply and pay their membership fee.
                </div>
                <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '6px' }}>
                  <strong>3. Honor & Recognition:</strong> Top advocates are awarded the National Social Leadership Merit Trophy during the Annual Foundation Day.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: Notifications & Alerts (Feature 15) */}
        {activeTab === 'notifications' && (
          <div className="member-dashboard-card">
            <div className="card-header-bar">
              <div>
                <h2>Notifications & Communication Alerts</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                  Manage how GSDD Foundation reaches you for updates, emergency campaigns, and meeting invites.
                </p>
              </div>
            </div>

            {notifError && (
              <div className="fee-status-banner due" style={{ marginBottom: '18px' }} role="alert">
                <AlertCircle size={16} />
                <span>{notifError}</span>
              </div>
            )}

            {notifSaved && (
              <div className="fee-status-banner paid" style={{ marginBottom: '18px' }} role="status">
                <CheckCircle2 size={16} />
                <span>{notifSaved}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--gsdd-navy-dark)' }}>
                  Delivery Channels & Preferences
                </h3>

                <div className="settings-list">
                  <div className="setting-item-row">
                    <div className="setting-info">
                      <h4>Email Bulletins & Newsletters</h4>
                      <p>Receive monthly reports, AGM agendas, and financial disclosures.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationsForm.emailUpdates}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, emailUpdates: e.target.checked })}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="setting-item-row">
                    <div className="setting-info">
                      <h4>WhatsApp Emergency & Camp Alerts</h4>
                      <p>Direct WhatsApp alerts for disaster relief and free medical camp drives.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationsForm.whatsappUpdates}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, whatsappUpdates: e.target.checked })}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="setting-item-row">
                    <div className="setting-info">
                      <h4>Governing Board Meeting Alerts</h4>
                      <p>SMS & Email notifications for quarterly committee assemblies and votes.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationsForm.meetingAlerts}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, meetingAlerts: e.target.checked })}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="setting-item-row">
                    <div className="setting-info">
                      <h4>Tax Receipts & Contribution Alerts</h4>
                      <p>Instant alerts when your 80G tax exemption receipts are issued.</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationsForm.donationReceipts}
                        onChange={(e) => setNotificationsForm({ ...notificationsForm, donationReceipts: e.target.checked })}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    className="btn-action-primary"
                    onClick={async () => {
                      setNotifError('');
                      setNotifSaved('');
                      if (!isAuthenticated) {
                        setNotifError('Please sign in to save notification preferences on the server.');
                        return;
                      }
                      try {
                        const res = await fetch('/api/member/notifications/', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(notificationsForm),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.ok) {
                          setNotifError(data?.error || 'Could not save notification preferences.');
                          return;
                        }
                        setMember({ ...member, notifications: data.notifications });
                        setNotifSaved('Your notification preferences have been persisted to the server.');
                      } catch {
                        setNotifError('Network error saving preferences.');
                      }
                    }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              {/* Recent Notifications Feed */}
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--gsdd-navy-dark)' }}>
                  Recent System Notifications
                </h3>

                <div className="messages-container">
                  <div className="message-card unread">
                    <div className="message-header">
                      <div className="message-sender">
                        <Bell size={14} color="#2563EB" />
                        <span>Executive Board Notice</span>
                      </div>
                      <span className="message-date">2 hours ago</span>
                    </div>
                    <p className="message-text">
                      Quarterly General Meeting scheduled for March 25, 2026. Please confirm your physical or virtual attendance in Araria district hall.
                    </p>
                  </div>

                  <div className="message-card">
                    <div className="message-header">
                      <div className="message-sender">
                        <CheckCircle2 size={14} color="#15803D" />
                        <span>Finance Department</span>
                      </div>
                      <span className="message-date">Yesterday</span>
                    </div>
                    <p className="message-text">
                      Annual audited accounts and 80G tax summaries have been uploaded to your receipts portal.
                    </p>
                  </div>

                  <div className="message-card">
                    <div className="message-header">
                      <div className="message-sender">
                        <Award size={14} color="#D97706" />
                        <span>Community Welfare Team</span>
                      </div>
                      <span className="message-date">3 days ago</span>
                    </div>
                    <p className="message-text">
                      Congratulations! You have received the 2026 Humanitarian Service Excellence Certificate for community healthcare leadership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 11: Messages (Feature 16) */}
        {activeTab === 'messages' && (
          <div className="member-dashboard-card">
            <div className="card-header-bar">
              <div>
                <h2>Messages & Board Communications</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                  Send direct inquiries, project suggestions, and messages to the NGO administration.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
              {/* Compose Form */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--gsdd-navy-dark)' }}>
                  Compose Message to Administration
                </h3>

                {msgError && (
                  <div className="fee-status-banner due" style={{ marginBottom: '14px' }} role="alert">
                    <AlertCircle size={16} />
                    <span>{msgError}</span>
                  </div>
                )}

                {msgStatusNotice && (
                  <div className="fee-status-banner paid" style={{ marginBottom: '14px' }} role="status">
                    <CheckCircle2 size={16} />
                    <span>{msgStatusNotice}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setMsgError('');
                    setMsgStatusNotice('');
                    if (!isAuthenticated) {
                      setMsgError('Please sign in to send messages to foundation administration.');
                      return;
                    }
                    if (!msgSubject.trim() || !msgContent.trim()) return;
                    setMsgSubmitting(true);
                    try {
                      const res = await fetch('/api/member/messages/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          department: msgDept,
                          subject: msgSubject.trim(),
                          text: msgContent.trim(),
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) {
                        setMsgError(data?.error || 'Could not save message.');
                        return;
                      }
                      if (data.member) setMember(data.member);
                      const delivered = Boolean(data.delivery?.delivered);
                      setMsgStatusNotice(
                        delivered
                          ? 'Your message was saved and delivered to the admin notification channel.'
                          : 'Message saved to your server thread for staff review. (External email relay is not configured on this server, so no external email was dispatched.)'
                      );
                      setMsgSubject('');
                      setMsgContent('');
                    } catch {
                      setMsgError('Network error sending message.');
                    } finally {
                      setMsgSubmitting(false);
                    }
                  }}
                >
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Recipient Committee / Department</label>
                    <select
                      className="form-control"
                      value={msgDept}
                      onChange={(e) => setMsgDept(e.target.value)}
                    >
                      <option>General Admin Office</option>
                      <option>National President & Governing Board</option>
                      <option>Finance & Accounts Committee</option>
                      <option>Rural Health & Medical Camps Division</option>
                      <option>Women Empowerment Wing</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Health camp proposal for Raniganj village"
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Message Content</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      placeholder="Type your message, proposal, or inquiry here..."
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={msgSubmitting}
                    className="btn-action-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Send size={15} />
                    <span>{msgSubmitting ? 'Saving...' : 'Submit Message'}</span>
                  </button>
                </form>
              </div>

              {/* Inbox / Sent Thread History */}
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: 'var(--gsdd-navy-dark)' }}>
                  Message History & Responses
                </h3>

                <div className="messages-container">
                  {(member.messages || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                      No messages in your thread yet. Send a message to the Admin office using the form on the left.
                    </div>
                  ) : (
                    member.messages.map((m) => (
                      <div key={m.id} className="message-card">
                        <div className="message-header">
                          <div className="message-sender">
                            <MessageSquare size={14} color="#1E3A8A" />
                            <span>{m.sender}</span>
                          </div>
                          <span className="message-date">{m.date}</span>
                        </div>
                        {m.subject && (
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                            Subject: {m.subject}
                          </div>
                        )}
                        <p className="message-text">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 12: Password Management (Feature 17) */}
        {activeTab === 'password' && (
          <div className="member-dashboard-card">
            <div className="card-header-bar">
              <div>
                <h2>Password Management & Security</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gsdd-text-muted)' }}>
                  Update your member portal password to keep your account secure.
                </p>
              </div>
            </div>

            <div className="password-box">
              {passwordError && (
                <div className="fee-status-banner due" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="fee-status-banner paid" style={{ marginBottom: '16px' }}>
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPasswordError('');
                  setPasswordSuccess('');

                  if (!isAuthenticated) {
                    setPasswordError('Please sign in to your member account to change your password.');
                    return;
                  }
                  if (newPassword.length < 8) {
                    setPasswordError('New password must be at least 8 characters long.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError('New passwords do not match. Please re-enter.');
                    return;
                  }

                  setPasswordSubmitting(true);
                  try {
                    const res = await fetch('/api/member/change-password/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        currentPassword,
                        newPassword,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) {
                      setPasswordError(data?.error || 'Could not update password.');
                      return;
                    }
                    setPasswordSuccess('Your password has been updated on the server with a fresh cryptographic hash.');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  } catch {
                    setPasswordError('Network error updating password.');
                  } finally {
                    setPasswordSubmitting(false);
                  }
                }}
              >
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new password (min. 8 characters)"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter new password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#64748B', marginBottom: '18px' }}>
                  <strong>Password Requirements:</strong> Minimum 8 characters. Verified and hashed server-side using scrypt.
                </div>

                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="btn-action-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <KeyRound size={16} />
                  <span>{passwordSubmitting ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
        <MemberBottomQuickBar activeTab={activeTab} onNavigate={setActiveTab} />
      </main>
    </div>
    <MemberPortalDrawers />
  </MemberPortalProvider>
);
}
