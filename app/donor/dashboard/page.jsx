'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, User, Heart, Receipt, Repeat, Award,
  FileText, Bell, KeyRound, LogOut, ShieldCheck, CheckCircle2,
  Calendar, MapPin, Mail, Phone, ExternalLink, ArrowRight,
  Download, Printer, Copy, Check, Send, AlertCircle, Menu, X,
  Building2, QrCode, Sparkles, TrendingUp, HelpCircle, Clock
} from 'lucide-react';
import { defaultDonors, donorPrograms, donorTaxDetails, donorImpactStories } from '../donor-data';
import { organization } from '../../data/site-data';
import QRCodeSvg from '../../components/QRCodeSvg';
import '../donor.css';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'donate', label: 'Make donation', icon: Heart },
  { id: 'receipts', label: 'Download Receipt', icon: Receipt },
  { id: 'subscriptions', label: 'Manage Subscription', icon: Repeat },
  { id: 'profile', label: 'Donor profile', icon: User },
  { id: 'password', label: 'Change password', icon: KeyRound },
  { id: 'history', label: 'Donation History', icon: Receipt },
  { id: 'recurring', label: 'Monthly Donation', icon: Repeat },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tax', label: 'Donation Certificate', icon: Award },
];

export default function DonorDashboardPage() {
  const router = useRouter();
  const [donor, setDonor] = useState(defaultDonors[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: defaultDonors[0].name,
    phone: defaultDonors[0].phone,
    email: defaultDonors[0].email,
    pan: defaultDonors[0].pan,
    address: defaultDonors[0].address,
    city: defaultDonors[0].city,
    state: defaultDonors[0].state,
    pin: defaultDonors[0].pin,
    profileBio: defaultDonors[0].profileBio,
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Donate Form State
  const [selectedProgram, setSelectedProgram] = useState(donorPrograms[0].name);
  const [frequency, setFrequency] = useState('one-time'); // 'one-time' or 'monthly'
  const [amount, setAmount] = useState('2500');
  const [paymentMode, setPaymentMode] = useState('upi'); // 'upi', 'bank', 'card', 'cash'
  const [donateUtr, setDonateUtr] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [donateSubmitting, setDonateSubmitting] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState(null);

  // View Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Subscriptions management
  const [subs, setSubs] = useState(defaultDonors[0].subscriptions);

  // Recurring Donation Setup State (Feature 10 & 11)
  const [recProgram, setRecProgram] = useState(donorPrograms[0]?.name || 'Rural Healthcare & Mobile Health Units');
  const [recAmount, setRecAmount] = useState('1000');
  const [recDay, setRecDay] = useState('1st of every month');
  const [recMethod, setRecMethod] = useState('UPI Autopay (GPay/PhonePe)');
  const [recSuccess, setRecSuccess] = useState(false);

  // Auto Deduction Simulation (Feature 12)
  const [autoDebitSuccess, setAutoDebitSuccess] = useState('');
  const [subError, setSubError] = useState('');

  // Pause & Cancel Subscription (Feature 13 & 14)
  const [cancelModalSubId, setCancelModalSubId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Temporary financial budget');

  // History Filter & Search State (Feature 9)
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  // Notifications Form State
  const [notifState, setNotifState] = useState({
    emailReceipts: true,
    whatsappAlerts: true,
    monthlyReminders: true,
    quarterlyReports: true,
  });
  const [notifSaved, setNotifSaved] = useState('');
  const [notifError, setNotifError] = useState('');
  const [dispatchBusy, setDispatchBusy] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Copy helper
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/donor/me/')
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.donor) {
            setIsAuthenticated(true);
            setDonor(data.donor);
            setSubs(data.donor.subscriptions || []);
            if (data.donor.notifications) {
              setNotifState(data.donor.notifications);
            }
            setProfileForm({
              name: data.donor.name || '',
              phone: data.donor.phone || '',
              email: data.donor.email || '',
              pan: data.donor.pan || '',
              address: data.donor.address || '',
              city: data.donor.city || '',
              state: data.donor.state || '',
              pin: data.donor.pin || '',
              profileBio: data.donor.profileBio || '',
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
      await fetch('/api/donor/logout/', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/donor/login');
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError('');
    if (!isAuthenticated) {
      setProfileError('Sign in with your donor account to save profile changes to the server.');
      return;
    }
    try {
      const res = await fetch('/api/donor/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          pan: profileForm.pan.trim().toUpperCase(),
          address: profileForm.address.trim(),
          city: profileForm.city.trim(),
          state: profileForm.state.trim(),
          pin: profileForm.pin.trim(),
          profileBio: profileForm.profileBio.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setProfileError(data?.error || 'Could not update profile.');
        return;
      }
      setDonor(data.donor);
      setEditingProfile(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
    } catch {
      setProfileError('Network error saving profile.');
    }
  }

  async function handleMakeDonation(e) {
    e.preventDefault();
    setDonateError('');
    setPendingSubmission(null);
    if (!isAuthenticated) {
      setDonateError('Please sign in with your donor account to submit a payment verification record.');
      return;
    }

    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setDonateError('Please enter a valid donation amount of at least ₹100.');
      return;
    }

    if (paymentMode === 'cash') {
      if (cashNote.trim().length < 4) {
        setDonateError('Please enter the office counter or executive name for cash deposit verification.');
        return;
      }
    } else if (donateUtr.trim().length < 6) {
      setDonateError('Please enter a valid UPI / Bank / Card transaction reference (minimum 6 characters).');
      return;
    }

    const methodLabel =
      paymentMode === 'cash'
        ? 'Cash Pledge (Counter Verification Required)'
        : paymentMode === 'bank'
          ? 'Bank Transfer (NEFT/RTGS)'
          : paymentMode === 'card'
            ? 'Card / Netbanking'
            : 'UPI QR Payment';

    setDonateSubmitting(true);
    try {
      const res = await fetch('/api/donor/donations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          program: selectedProgram,
          frequency,
          method: methodLabel,
          utr: paymentMode === 'cash' ? '' : donateUtr.trim(),
          cashNote: paymentMode === 'cash' ? cashNote.trim() : '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDonateError(data?.error || 'Could not submit donation verification record.');
        return;
      }
      if (data.donor) setDonor(data.donor);
      setPendingSubmission(data.donation);
      setDonateUtr('');
      setCashNote('');
    } catch {
      setDonateError('Network error submitting donation reference.');
    } finally {
      setDonateSubmitting(false);
    }
  }

  async function handleToggleSub(id) {
    setSubError('');
    if (!isAuthenticated) {
      setSubError('Please sign in with your donor account to pause or resume a mandate.');
      return;
    }
    const target = subs.find((s) => s.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Paused' : 'Active';

    try {
      const res = await fetch(`/api/donor/subscriptions/${encodeURIComponent(id)}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubError(data?.error || 'Could not update subscription status on server.');
        return;
      }
      if (data.donor) {
        setDonor(data.donor);
        setSubs(data.donor.subscriptions || []);
      }
    } catch {
      setSubError('Network error updating subscription status.');
    }
  }

  async function handleCancelSub(id) {
    setSubError('');
    if (!isAuthenticated) {
      setSubError('Please sign in with your donor account to cancel a mandate.');
      setCancelModalSubId(null);
      return;
    }

    try {
      const res = await fetch(`/api/donor/subscriptions/${encodeURIComponent(id)}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubError(data?.error || 'Could not cancel subscription on server.');
        return;
      }
      if (data.donor) {
        setDonor(data.donor);
        setSubs(data.donor.subscriptions || []);
      }
      setCancelModalSubId(null);
    } catch {
      setSubError('Network error cancelling subscription.');
    }
  }

  async function handleSetupRecurring(e) {
    e.preventDefault();
    setSubError('');
    if (!isAuthenticated) {
      setSubError('Please sign in with your donor account to create a server-backed demo mandate.');
      return;
    }
    const numeric = parseInt(recAmount, 10);
    if (!numeric || numeric < 500) {
      setSubError('Monthly pledge amount must be at least ₹500.');
      return;
    }

    try {
      const res = await fetch('/api/donor/subscriptions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: recProgram,
          amount: numeric,
          billingDay: recDay,
          paymentMethod: `${recMethod} (Demo Mandate)`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubError(data?.error || 'Could not create recurring mandate.');
        return;
      }
      if (data.donor) {
        setDonor(data.donor);
        setSubs(data.donor.subscriptions || []);
      }
      setRecSuccess(true);
      setTimeout(() => setRecSuccess(false), 5000);
    } catch {
      setSubError('Network error creating mandate.');
    }
  }

  async function handleSimulateAutoDebit(subId) {
    setSubError('');
    setAutoDebitSuccess('');
    if (!isAuthenticated) {
      setSubError('Please sign in to trigger a simulated deduction cycle.');
      return;
    }
    const sub = subs.find((s) => s.id === subId);
    if (!sub || sub.status !== 'Active') return;
    const nextCycle = (sub.deductionCycles || []).length + 1;
    const idempotencyKey = `cycle-${subId}-${nextCycle}`;

    try {
      const res = await fetch(`/api/donor/subscriptions/${encodeURIComponent(subId)}/deduct/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubError(data?.error || 'Could not process demo deduction cycle.');
        return;
      }
      if (data.donor) {
        setDonor(data.donor);
        setSubs(data.donor.subscriptions || []);
      }
      setAutoDebitSuccess(
        `Demo cycle #${data.cycle.cycleNumber} recorded under tracking ID ${data.cycle.trackingId} (Status: ${data.cycle.status}). 80G receipt is withheld until payment settlement.`
      );
      setTimeout(() => setAutoDebitSuccess(''), 7000);
    } catch {
      setSubError('Network error processing demo deduction cycle.');
    }
  }

  async function handleSaveNotifs() {
    setNotifError('');
    setNotifSaved('');
    if (!isAuthenticated) {
      setNotifError('Please sign in with your donor account to persist notification preferences.');
      return;
    }
    try {
      const res = await fetch('/api/donor/notifications/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifState),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotifError(data?.error || 'Could not save notification preferences.');
        return;
      }
      setDonor({ ...donor, notifications: data.notifications });
      setNotifSaved('Notification preferences saved on the server.');
      setTimeout(() => setNotifSaved(''), 4000);
    } catch {
      setNotifError('Network error saving notification preferences.');
    }
  }

  async function handleTestDispatch(channel) {
    setNotifError('');
    setNotifSaved('');
    if (!isAuthenticated) {
      setNotifError('Please sign in with your donor account to test notification dispatch.');
      return;
    }
    setDispatchBusy(true);
    try {
      const res = await fetch('/api/donor/notifications/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotifError(data?.error || 'Dispatch request failed.');
        return;
      }
      if (data.donor) setDonor(data.donor);
      if (data.delivery?.delivered) {
        setNotifSaved(`Delivered via ${data.delivery.provider}: ${data.delivery.detail}`);
      } else {
        setNotifError(data.delivery?.detail || 'External delivery provider is not configured; event logged on server without external send.');
      }
    } catch {
      setNotifError('Network error checking notification delivery.');
    } finally {
      setDispatchBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      setPasswordMsg({ text: 'Please sign in to your donor account to update your password.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/donor/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPasswordMsg({ text: data?.error || 'Could not update password.', type: 'error' });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ text: 'Password updated on server with scrypt hashing.', type: 'success' });
      setTimeout(() => setPasswordMsg({ text: '', type: '' }), 4000);
    } catch {
      setPasswordMsg({ text: 'Network error updating password.', type: 'error' });
    }
  }

  function copyToClipboard(text, key) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    }

    return num ? `Rupees ${inWords(num)} Only` : 'Rupees Zero Only';
  }

  const donations = donor.donations || [];
  const verifiedDonations = donations.filter((d) => d.status === 'Verified' && (d.receiptNo || d.id?.startsWith('GSDD-REC-')));
  const upiPaymentUri = `upi://pay?pa=${donorTaxDetails.bankAccount.upiId}&pn=GSDD%20FOUNDATION&am=${parseInt(amount, 10) || 2500}&cu=INR&tn=${encodeURIComponent(`Donation ${selectedProgram}`)}`;

  return (
    <div className="donor-dashboard-layout">
      {/* Mobile Top Bar */}
      <div
        style={{
          display: 'none',
          padding: '12px 16px',
          background: '#0F172A',
          color: '#FFF',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
        className="mobile-header-bar"
      >
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />} Menu
        </button>
        <span style={{ fontSize: '13px', fontWeight: '700' }}>Donor Portal</span>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`donor-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="donor-sidebar-header">
          <div className="donor-avatar-circle">
            {(donor.name || 'D').charAt(0)}
          </div>
          <div className="donor-header-meta">
            <h3>{donor.name || 'Valued Donor'}</h3>
            <span>{donor.id || 'GSDD-D-2026'}</span>
            <span
              className={`donor-tier-pill ${
                (donor.tier || '').includes('Gold')
                  ? 'tier-gold'
                  : (donor.tier || '').includes('Silver')
                  ? 'tier-silver'
                  : 'tier-bronze'
              }`}
            >
              {donor.tier || 'Silver Donor'}
            </span>
          </div>
        </div>

        <nav className="donor-sidebar-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`donor-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="donor-sidebar-footer">
          <button type="button" className="donor-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="donor-content-main">
        {/* Top greeting bar */}
        <div className="donor-top-bar">
          <div className="donor-greeting">
            <h1>Namaste, {donor.name?.split(' ')[0] || 'Patron'}! 🙏</h1>
            <p>Welcome to your GSDD Foundation Philanthropy & 80G Tax Exemption Portal.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="tax-badge-80g">
              <ShieldCheck size={16} /> 50% Tax Relief (Sec 80G)
            </span>
            <button
              type="button"
              className="button button-gold"
              onClick={() => setActiveTab('donate')}
              style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}
            >
              <Heart size={15} /> Donate Now
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }} role="status">
            <span><strong>Demo Preview Mode:</strong> Sign in with your donor account to save profile changes, submit donations, or manage pledges on the server.</span>
            <Link href="/donor/login" className="button button-blue" style={{ padding: '6px 14px', fontSize: '12px' }}>
              Sign In Now
            </Link>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="donor-stats-grid">
              <div className="donor-stat-box">
                <div className="donor-stat-icon stat-icon-gold">
                  <Heart size={24} />
                </div>
                <div className="donor-stat-info">
                  <span className="stat-amount">₹{(donor.totalDonated || 0).toLocaleString('en-IN')}</span>
                  <span className="stat-title">Lifetime Contribution</span>
                </div>
              </div>

              <div className="donor-stat-box">
                <div className="donor-stat-icon stat-icon-blue">
                  <Receipt size={24} />
                </div>
                <div className="donor-stat-info">
                  <span className="stat-amount">{donor.donationCount || 0}</span>
                  <span className="stat-title">Tax Receipts Issued</span>
                </div>
              </div>

              <div className="donor-stat-box">
                <div className="donor-stat-icon stat-icon-green">
                  <ShieldCheck size={24} />
                </div>
                <div className="donor-stat-info">
                  <span className="stat-amount">
                    ₹{Math.round((donor.totalDonated || 0) * 0.5).toLocaleString('en-IN')}
                  </span>
                  <span className="stat-title">80G Tax Deductible Amount</span>
                </div>
              </div>

              <div className="donor-stat-box">
                <div className="donor-stat-icon stat-icon-purple">
                  <Repeat size={24} />
                </div>
                <div className="donor-stat-info">
                  <span className="stat-amount">{donor.activeSubscriptions || 0}</span>
                  <span className="stat-title">Active Recurring Pledges</span>
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFF',
                borderRadius: '10px',
                padding: '24px 28px',
                marginBottom: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '18px',
              }}
            >
              <div>
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  Priority Campaign
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '18px', color: '#FFF' }}>
                  Support Free Mobile Healthcare in Flood-Prone Araria & Kishanganj
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1' }}>
                  ₹2,500 covers essential medicines and complete diagnostic tests for 5 rural families.
                </p>
              </div>

              <button
                type="button"
                className="button button-gold"
                onClick={() => {
                  setSelectedProgram('Rural Healthcare & Mobile Health Units');
                  setAmount('2500');
                  setActiveTab('donate');
                }}
                style={{ padding: '10px 20px', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                Sponsor Mobile Camp <ArrowRight size={16} />
              </button>
            </div>

            {/* Recent Donations Table */}
            <div className="donor-card">
              <div className="donor-card-header">
                <div>
                  <h2>
                    <Receipt size={20} color="#2563EB" /> Recent Contributions & Tax Receipts
                  </h2>
                  <p>All donations are MCA Section 8 verified and eligible for 50% deduction under Section 80G.</p>
                </div>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setActiveTab('history')}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  View All Receipts
                </button>
              </div>

              <div className="donor-table-container">
                <table className="donor-table">
                  <thead>
                    <tr>
                      <th>Receipt ID</th>
                      <th>Date</th>
                      <th>Cause / Program</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(donor.donations || []).slice(0, 4).map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{d.id}</td>
                        <td>{d.date}</td>
                        <td style={{ fontWeight: '600' }}>{d.program}</td>
                        <td style={{ fontWeight: '800', color: '#0F172A' }}>₹{d.amount.toLocaleString('en-IN')}</td>
                        <td>{d.method}</td>
                        <td>
                          <span className="status-verified">
                            <CheckCircle2 size={12} /> {d.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="donor-chip-btn"
                            onClick={() => setSelectedReceipt(d)}
                            style={{ margin: 0, padding: '4px 8px', fontSize: '11px' }}
                          >
                            <Printer size={12} /> 80G Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 80G Tax Details Summary Card */}
            <div className="donor-card">
              <div className="donor-card-header">
                <div>
                  <h2>
                    <Building2 size={20} color="#D97706" /> Foundation Statutory & 80G Credentials
                  </h2>
                  <p>Official registration credentials for filing Indian Income Tax returns (ITR).</p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>MCA COMPANY REGISTRATION</span>
                  <strong style={{ color: '#0F172A' }}>{donorTaxDetails.mcaRegNumber}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>FOUNDATION PAN</span>
                  <strong style={{ color: '#0F172A' }}>{donorTaxDetails.panNumber}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>SECTION 80G APPROVAL NO.</span>
                  <strong style={{ color: '#0F172A' }}>{donorTaxDetails.section80GNumber}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>NGO DARPAN UNIQUE ID</span>
                  <strong style={{ color: '#0F172A' }}>{donorTaxDetails.ngoDarpanId}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE & 80G DETAILS */}
        {activeTab === 'profile' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <User size={20} color="#2563EB" /> Donor Profile & 80G Tax Identity
                </h2>
                <p>Ensure your PAN and residential address are up-to-date for Form 10BE IT return filing.</p>
              </div>

              {!editingProfile && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setEditingProfile(true)}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Edit Information
                </button>
              )}
            </div>

            {profileSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#DCFCE7',
                  color: '#15803D',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>Profile and 80G tax details updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
                role="alert"
              >
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div className="donor-form-grid">
                  <div className="donor-form-group">
                    <label>Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>PAN Number (Mandatory for 80G)</label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      value={profileForm.pan}
                      onChange={(e) => setProfileForm({ ...profileForm, pan: e.target.value.toUpperCase() })}
                      style={{ textTransform: 'uppercase', fontWeight: '700' }}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      required
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>State</label>
                    <input
                      type="text"
                      required
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      required
                      value={profileForm.pin}
                      onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group span-all">
                    <label>Postal Address for Tax Receipt Records</label>
                    <textarea
                      rows={2}
                      required
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>

                  <div className="donor-form-group span-all">
                    <label>Donor Statement / Philanthropic Goal</label>
                    <textarea
                      rows={3}
                      value={profileForm.profileBio}
                      onChange={(e) => setProfileForm({ ...profileForm, profileBio: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="button button-blue" style={{ padding: '10px 20px' }}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setEditingProfile(false)}
                    style={{ padding: '10px 20px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    fontSize: '14px',
                    marginBottom: '24px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>DONOR NAME</span>
                    <strong style={{ color: '#0F172A', fontSize: '16px' }}>{donor.name}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>INCOME TAX PAN</span>
                    <strong style={{ color: '#2563EB', fontSize: '16px', letterSpacing: '0.05em' }}>
                      {donor.pan || 'NOT PROVIDED'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>REGISTERED EMAIL</span>
                    <strong style={{ color: '#0F172A' }}>{donor.email}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>CONTACT PHONE</span>
                    <strong style={{ color: '#0F172A' }}>{donor.phone}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>LOCATION</span>
                    <strong style={{ color: '#0F172A' }}>{donor.city}, {donor.state} - {donor.pin}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>DONOR PATRON TIER</span>
                    <span className="donor-tier-pill tier-gold">{donor.tier}</span>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>BILLING ADDRESS</span>
                    <p style={{ margin: '4px 0 0', color: '#334155' }}>{donor.address}</p>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>PHILANTHROPIC STATEMENT</span>
                    <p style={{ margin: '4px 0 0', color: '#334155', fontStyle: 'italic' }}>
                      "{donor.profileBio}"
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#1E40AF',
                  }}
                >
                  <ShieldCheck size={20} />
                  <span>
                    <strong>80G Compliance Verified:</strong> Your PAN ({donor.pan}) is synced with the foundation's annual Form 10BD electronic return filed with the Income Tax Department.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAKE A DONATION */}
        {activeTab === 'donate' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Heart size={20} color="#DC2626" /> Make a Tax-Deductible Contribution
                </h2>
                <p>Support an initiative of your choice. All contributions qualify for 50% deduction under Section 80G.</p>
              </div>
            </div>

            {donateError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }} role="alert">
                <AlertCircle size={18} />
                <span>{donateError}</span>
              </div>
            )}

            {pendingSubmission && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '2px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '24px',
                  marginBottom: '24px',
                }}
                role="status"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <Clock size={24} color="#B45309" />
                  <h3 style={{ margin: 0, color: '#92400E', fontSize: '18px' }}>
                    Donation Submitted — {pendingSubmission.status}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 12px' }}>
                  Your contribution reference of <strong>₹{Number(pendingSubmission.amount).toLocaleString('en-IN')}</strong> towards{' '}
                  <strong>{pendingSubmission.program}</strong> has been persisted on the server under tracking ID{' '}
                  <code>{pendingSubmission.trackingId}</code> (Reference: <code>{pendingSubmission.utr}</code>).
                </p>
                <p style={{ fontSize: '12px', color: '#92400E', margin: '0 0 16px' }}>
                  No 80G tax receipt has been issued yet. An official receipt will be issued only after bank settlement and server-side verification.
                </p>

                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setPendingSubmission(null)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Submit Another Reference
                </button>
              </div>
            )}

            <form onSubmit={handleMakeDonation}>
              {/* Step 1: Select Program */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
                  1. Select Cause / Program
                </label>
                <div className="cause-selector-grid">
                  {donorPrograms.map((p) => {
                    const isSelected = selectedProgram === p.name;
                    return (
                      <div
                        key={p.id}
                        className={`cause-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedProgram(p.name)}
                      >
                        <h4>{p.name}</h4>
                        <p>{p.description}</p>
                        <span className="cause-metric">{p.impactMetric}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Frequency Toggle */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  2. Contribution Frequency
                </label>
                <div className="frequency-toggle">
                  <button
                    type="button"
                    className={`frequency-btn ${frequency === 'one-time' ? 'active' : ''}`}
                    onClick={() => setFrequency('one-time')}
                  >
                    One-Time Gift
                  </button>
                  <button
                    type="button"
                    className={`frequency-btn ${frequency === 'monthly' ? 'active' : ''}`}
                    onClick={() => setFrequency('monthly')}
                  >
                    Monthly Pledge (SIP for Good)
                  </button>
                </div>
              </div>

              {/* Step 3: Amount Chips & Custom Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  3. Select Amount (₹)
                </label>
                <div className="amount-chips-row">
                  {['500', '1000', '2500', '5000', '10000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`amount-chip ${amount === val ? 'active' : ''}`}
                      onClick={() => setAmount(val)}
                    >
                      ₹{parseInt(val, 10).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="donor-form-group" style={{ maxWidth: '300px' }}>
                  <label>Or enter custom amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* 80G Live Tax Calculation Benefit */}
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '14px',
                    fontSize: '13px',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>
                    Tax Deduction Benefit: <strong>₹{Math.round((parseInt(amount, 10) || 0) * 0.5).toLocaleString('en-IN')}</strong> will be 50% deductible under Section 80G for FY 2025-26.
                  </span>
                </div>
              </div>

              {/* Step 4: Payment Mode Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
                  4. Choose Payment Method
                </label>
                <div className="payment-mode-tabs">
                  <button
                    type="button"
                    className={`payment-mode-tab ${paymentMode === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('upi')}
                  >
                    UPI QR / App
                  </button>
                  <button
                    type="button"
                    className={`payment-mode-tab ${paymentMode === 'bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('bank')}
                  >
                    Bank NEFT / RTGS
                  </button>
                  <button
                    type="button"
                    className={`payment-mode-tab ${paymentMode === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('card')}
                  >
                    Cards / Net Banking
                  </button>
                  <button
                    type="button"
                    className={`payment-mode-tab ${paymentMode === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('cash')}
                  >
                    Cash Donation (Admin Desk)
                  </button>
                </div>

                {paymentMode === 'upi' && (
                  <div className="upi-scan-panel">
                    <div className="qr-code-placeholder">
                      <QRCodeSvg
                        value={upiPaymentUri}
                        size={135}
                        label="Scan with GPay / PhonePe / Paytm"
                      />
                    </div>
                    <span
                      style={{
                        background: '#E2E8F0',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {donorTaxDetails.bankAccount.upiId}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(donorTaxDetails.bankAccount.upiId, 'upi')}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      >
                        {copiedKey === 'upi' ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                      </button>
                    </span>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
                      After scanning and paying ₹{amount}, enter your UPI Ref / UTR number below to confirm.
                    </p>
                  </div>
                )}

                {paymentMode === 'bank' && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '18px', marginBottom: '20px', fontSize: '13px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#0F172A' }}>Official Foundation Bank Account:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>BENEFICIARY</span>
                        <strong>{donorTaxDetails.bankAccount.accountName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>BANK & BRANCH</span>
                        <strong>{donorTaxDetails.bankAccount.bankName}, {donorTaxDetails.bankAccount.branch}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>ACCOUNT NUMBER</span>
                        <strong style={{ fontFamily: 'monospace' }}>{donorTaxDetails.bankAccount.accountNumber}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>IFSC CODE</span>
                        <strong style={{ fontFamily: 'monospace' }}>{donorTaxDetails.bankAccount.ifsc}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMode === 'card' && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '18px', marginBottom: '20px', fontSize: '13px' }}>
                    <p style={{ margin: 0, color: '#334155' }}>
                      Online debit card, credit card, and net-banking transactions are processed via secure Razorpay / SBI e-Pay payment gateway with 128-bit encryption.
                    </p>
                  </div>
                )}

                {paymentMode === 'cash' && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '18px', marginBottom: '20px', fontSize: '13px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} /> Direct Cash Donation (Recorded via Admin Counter Entry)
                    </h4>
                    <p style={{ color: '#78350F', marginBottom: '12px' }}>
                      Donors making in-person cash contributions can deposit funds at the GSDD Foundation Raniganj Central Office or through an authorized GSDD Executive. Cash donations are officially logged in the Central Accounts Ledger and receive an authenticated 80G tax receipt.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#FEF3C7', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#92400E', display: 'block' }}>AUTHORIZED CASH DESK</span>
                        <strong style={{ color: '#78350F' }}>GSDD Foundation HQ, Raniganj Bazar, Araria, Bihar</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#92400E', display: 'block' }}>DESK IN-CHARGE</span>
                        <strong style={{ color: '#78350F' }}>Finance & Accounts Admin</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#92400E', display: 'block' }}>MAX CASH LIMIT (IT SEC 40A)</span>
                        <strong style={{ color: '#78350F' }}>Up to ₹2,000 for 80G Tax Exemption</strong>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMode === 'cash' ? (
                  <div className="donor-form-group" style={{ maxWidth: '460px', marginTop: '16px' }}>
                    <label>Office Counter / Authorized Executive Name (for verification) *</label>
                    <input
                      type="text"
                      required
                      minLength={4}
                      placeholder="e.g. Raniganj Central Office Desk — Cash Pledge"
                      value={cashNote}
                      onChange={(e) => setCashNote(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="donor-form-group" style={{ maxWidth: '420px', marginTop: '16px' }}>
                    <label>Transaction UTR / Reference ID *</label>
                    <input
                      type="text"
                      required
                      minLength={6}
                      placeholder="e.g. UPI/382910482019 or TXN/CARD992817"
                      value={donateUtr}
                      onChange={(e) => setDonateUtr(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={donateSubmitting}
                className="button button-gold"
                style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '800' }}
              >
                {donateSubmitting ? 'Submitting for Verification...' : `Submit Payment Reference (₹${parseInt(amount, 10) || 0}) — Pending Verification`}
              </button>
            </form>
          </div>
        )}

        {/* TAB: DOWNLOAD RECEIPT */}
        {activeTab === 'receipts' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Receipt size={20} color="#2563EB" /> Download 80G Donation Receipts
                </h2>
                <p>Instant access to official signed receipts for all contributions with Section 80G tax deduction details.</p>
              </div>

              <button
                type="button"
                className="button button-blue"
                onClick={() => window.print()}
                style={{ fontSize: '13px', padding: '8px 16px', fontWeight: '700' }}
              >
                <Printer size={15} /> Print All Receipts
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>VERIFIED 80G RECEIPTS ISSUED</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{verifiedDonations.length} Receipts</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>VERIFIED CONTRIBUTION TOTAL</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A' }}>
                    ₹{(donor.totalDonated || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>DONOR PAN</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'monospace', color: '#0F172A' }}>{donor.pan}</div>
                </div>
              </div>
            </div>

            <div className="donor-table-container">
              <table className="donor-table">
                <thead>
                  <tr>
                    <th>Receipt / Tracking ID</th>
                    <th>Date</th>
                    <th>Program / Cause</th>
                    <th>Amount</th>
                    <th>Mode &amp; UTR</th>
                    <th>Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => {
                    const isVerified = d.status === 'Verified' && (d.receiptNo || d.id?.startsWith('GSDD-REC-'));
                    const displayCode = d.receiptNo || d.trackingId || d.id;
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong style={{ fontFamily: 'monospace', color: isVerified ? '#1E40AF' : '#92400E' }}>{displayCode}</strong>
                        </td>
                        <td>{d.date}</td>
                        <td>{d.program}</td>
                        <td>
                          <strong style={{ color: '#0F172A' }}>₹{d.amount.toLocaleString('en-IN')}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', display: 'block' }}>{d.method}</span>
                          <code style={{ fontSize: '11px', color: '#64748B' }}>{d.utr}</code>
                        </td>
                        <td>
                          {isVerified ? (
                            <button
                              type="button"
                              className="button button-outline"
                              onClick={() => setSelectedReceipt({ ...d, id: displayCode })}
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Download size={13} /> Download Receipt
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px' }}>
                              {d.status || 'Pending Verification'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DONATION HISTORY */}
        {activeTab === 'history' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Receipt size={20} color="#2563EB" /> Donation History & Official 80G Receipts
                </h2>
                <p>Download or print official receipts stamped for Section 80G income tax claims.</p>
              </div>

              <button
                type="button"
                className="button button-blue"
                onClick={() => setActiveTab('donate')}
                style={{ fontSize: '13px', padding: '8px 16px', fontWeight: '700' }}
              >
                <Heart size={14} /> New Donation
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'One-Time', 'Recurring', 'Cash'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setHistoryFilter(f)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: historyFilter === f ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: historyFilter === f ? '#EFF6FF' : '#FFF',
                      color: historyFilter === f ? '#1D4ED8' : '#334155',
                      fontWeight: historyFilter === f ? '700' : '500',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {f === 'all' ? 'All Contributions' : f}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search by receipt ID or cause..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', width: '100%', maxWidth: '260px' }}
              />
            </div>

            <div className="donor-table-container">
              <table className="donor-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Contribution Type</th>
                    <th>Program / Initiative</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>UTR / Ref</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(donor.donations || [])
                    .filter((d) => {
                      if (historyFilter === 'One-Time' && !d.type?.includes('One-Time')) return false;
                      if (historyFilter === 'Recurring' && !d.type?.includes('Recurring')) return false;
                      if (historyFilter === 'Cash' && !d.type?.includes('Cash')) return false;
                      if (historySearch) {
                        const q = historySearch.toLowerCase();
                        const code = (d.receiptNo || d.trackingId || d.id || '').toLowerCase();
                        return (
                          code.includes(q) ||
                          (d.program || '').toLowerCase().includes(q) ||
                          (d.method || '').toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((d) => {
                      const isVerified = d.status === 'Verified' && (d.receiptNo || d.id?.startsWith('GSDD-REC-'));
                      const displayCode = d.receiptNo || d.trackingId || d.id;
                      return (
                        <tr key={d.id}>
                          <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{displayCode}</td>
                          <td>{d.date}</td>
                          <td>
                            <span
                              style={{
                                background: d.type?.includes('Recurring') ? '#FEF3C7' : '#EFF6FF',
                                color: d.type?.includes('Recurring') ? '#92400E' : '#1D4ED8',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                              }}
                            >
                              {d.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>{d.program}</td>
                          <td style={{ fontWeight: '800', color: '#0F172A' }}>₹{d.amount.toLocaleString('en-IN')}</td>
                          <td>{d.method}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>{d.utr}</td>
                          <td>
                            {isVerified ? (
                              <button
                                type="button"
                                className="donor-chip-btn"
                                onClick={() => setSelectedReceipt({ ...d, id: displayCode })}
                                style={{ margin: 0, padding: '5px 10px', fontSize: '12px' }}
                              >
                                <Printer size={13} /> View 80G Receipt
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px' }}>
                                {d.status || 'Pending Settlement'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RECURRING PLEDGES / SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Repeat size={20} color="#D97706" /> Manage Recurring Subscriptions & Mandates
                </h2>
                <p>Manage continuous monthly support pledges for rural healthcare, girls education, and food security.</p>
              </div>

              <button
                type="button"
                className="button button-gold"
                onClick={() => {
                  setActiveTab('recurring');
                }}
                style={{ fontSize: '13px', padding: '8px 16px', fontWeight: '700' }}
              >
                Start New Monthly Pledge
              </button>
            </div>

            {subError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991B1B', fontSize: '13px' }} role="alert">
                {subError}
              </div>
            )}

            {autoDebitSuccess && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#92400E', fontSize: '13px' }} role="status">
                <Clock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                <strong>{autoDebitSuccess}</strong>
              </div>
            )}

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px 20px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <AlertCircle size={20} color="#B45309" />
                <h4 style={{ margin: 0, color: '#92400E', fontSize: '15px' }}>
                  Demo / Mandate Simulation Notice (No Live Payment Gateway Connected)
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#78350F' }}>
                Recurring mandates and deduction cycles here run in server-backed demo mode with idempotency protection. Simulated cycles stay in <strong>Pending Settlement</strong> status and do not charge a bank account or issue an 80G receipt until settled.
              </p>
            </div>

            {subs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '8px' }}>
                <Repeat size={36} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Active Monthly Subscriptions</h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
                  Set up a recurring monthly donation to provide consistent, sustained care for children and rural families.
                </p>
                <button
                  type="button"
                  className="button button-blue"
                  onClick={() => {
                    setActiveTab('recurring');
                  }}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Create Monthly Pledge
                </button>
              </div>
            ) : (
              <div>
                {subs.map((s) => (
                  <div key={s.id} className="sub-card">
                    <div className="sub-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h4>{s.program}</h4>
                        <span
                          style={{
                            background: s.status === 'Active' ? '#DCFCE7' : s.status === 'Paused' ? '#FEF3C7' : '#F1F5F9',
                            color: s.status === 'Active' ? '#15803D' : s.status === 'Paused' ? '#92400E' : '#64748B',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                          }}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p>
                        Pledge ID: <strong style={{ fontFamily: 'monospace' }}>{s.id}</strong> • Next Deduction:{' '}
                        <strong>{s.status === 'Active' ? s.nextDeduction : 'Paused / On Hold'}</strong> • Method: <strong>{s.paymentMethod}</strong>
                      </p>
                      <p style={{ marginTop: '4px', fontSize: '12px', color: '#0F172A' }}>
                        Total Recurring Contributed to Date: <strong>₹{(s.totalRecurringPaid || 0).toLocaleString('en-IN')}</strong> ({s.completedDeductions || 0} cycles completed)
                      </p>
                      {s.cancelReason && (
                        <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>
                          Cancellation reason: {s.cancelReason}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                        ₹{s.amount.toLocaleString('en-IN')}/mo
                      </span>

                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleSimulateAutoDebit(s.id)}
                        disabled={s.status !== 'Active'}
                        style={{ fontSize: '12px', padding: '6px 12px', background: s.status === 'Active' ? '#FFFBEB' : '#F8FAFC', borderColor: s.status === 'Active' ? '#FDE68A' : '#E2E8F0', color: s.status === 'Active' ? '#92400E' : '#94A3B8' }}
                      >
                        Demo: Simulate Cycle (Pending Settlement)
                      </button>

                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleToggleSub(s.id)}
                        disabled={s.status === 'Cancelled'}
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        {s.status === 'Active' ? 'Pause Subscription' : 'Resume Subscription'}
                      </button>

                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setCancelModalSubId(s.id)}
                        disabled={s.status === 'Cancelled'}
                        style={{ fontSize: '12px', padding: '6px 14px', color: s.status === 'Cancelled' ? '#94A3B8' : '#DC2626', borderColor: s.status === 'Cancelled' ? '#E2E8F0' : '#FCA5A5' }}
                      >
                        {s.status === 'Cancelled' ? 'Cancelled' : 'Cancel Plan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MONTHLY DONATION SETUP (Feature 10) */}
        {activeTab === 'recurring' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Repeat size={20} color="#D97706" /> Set Up a Monthly Recurring Pledge (Demo Mandate)
                </h2>
                <p>Demo simulation mode: mandates are stored on the server for testing; no live payment provider or bank auto-debit is connected.</p>
              </div>
            </div>

            {subError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991B1B', fontSize: '13px' }} role="alert">
                {subError}
              </div>
            )}

            {recSuccess && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#166534' }}>
                <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
                <strong>Demo Recurring Pledge Created on Server!</strong> Simulated deduction cycles remain Pending Settlement until reconciled.
              </div>
            )}

            <form onSubmit={handleSetupRecurring}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  1. Select Focus Initiative for Monthly Giving
                </label>
                <select
                  value={recProgram}
                  onChange={(e) => setRecProgram(e.target.value)}
                  style={{ width: '100%', maxWidth: '500px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                >
                  {donorPrograms.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (Min ₹{p.minAmount}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  2. Choose Monthly Pledge Amount (₹)
                </label>
                <div className="amount-chips-row">
                  {['500', '1000', '2500', '5000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`amount-chip ${recAmount === val ? 'active' : ''}`}
                      onClick={() => setRecAmount(val)}
                    >
                      ₹{parseInt(val, 10).toLocaleString('en-IN')}/mo
                    </button>
                  ))}
                </div>
                <div className="donor-form-group" style={{ maxWidth: '300px', marginTop: '10px' }}>
                  <label>Or custom monthly amount (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  3. Monthly Deduction Day
                </label>
                <select
                  value={recDay}
                  onChange={(e) => setRecDay(e.target.value)}
                  style={{ width: '100%', maxWidth: '300px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                >
                  <option value="1st of every month">1st of every month</option>
                  <option value="5th of every month">5th of every month</option>
                  <option value="10th of every month">10th of every month</option>
                  <option value="15th of every month">15th of every month</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  4. Automated Mandate Channel (Auto-Deduction)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', maxWidth: '600px' }}>
                  {['UPI Autopay (GPay/PhonePe)', 'Bank e-NACH Mandate', 'Debit/Credit Card Mandate'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRecMethod(m)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: recMethod === m ? '2px solid #2563EB' : '1px solid #CBD5E1',
                        background: recMethod === m ? '#EFF6FF' : '#FFF',
                        fontWeight: recMethod === m ? '700' : '500',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="button button-gold"
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '800' }}
              >
                Set Up Monthly Recurring Pledge (₹{recAmount}/mo)
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: 80G TAX CERTIFICATES */}
        {activeTab === 'tax' && (
          <div>
            <div className="donor-card">
              <div className="donor-card-header">
                <div>
                  <h2>
                    <Award size={20} color="#D97706" /> Section 80G Annual Tax Statement & Form 10BE
                  </h2>
                  <p>Consolidated certificate of donations for filing your Income Tax Return with the IT Department.</p>
                </div>

                <button
                  type="button"
                  className="button button-blue"
                  onClick={() => window.print()}
                  style={{ fontSize: '13px', padding: '8px 16px', fontWeight: '700' }}
                >
                  <Printer size={15} /> Print Annual Certificate
                </button>
              </div>

              {/* Annual Statement Paper */}
              <div className="receipt-paper-frame">
                <div className="receipt-header-box">
                  <h2 className="receipt-org-title">{donorTaxDetails.bankAccount.accountName}</h2>
                  <p className="receipt-org-sub">
                    A Registered Section 8 Non-Profit Organization • MCA Govt of India • Reg: {donorTaxDetails.mcaRegNumber}
                  </p>
                  <p className="receipt-org-sub">
                    Head Office: 24 Netaji Subhash Road, Fairley Place, Kolkata, West Bengal - 700001
                  </p>
                  <span className="receipt-title-badge">ANNUAL SECTION 80G DONATION CERTIFICATE (FY 2025-26)</span>
                </div>

                <div className="receipt-statutory-row">
                  <span><strong>NGO PAN:</strong> {donorTaxDetails.panNumber}</span>
                  <span><strong>80G Approval No:</strong> {donorTaxDetails.section80GNumber}</span>
                  <span><strong>Assessment Year:</strong> 2026-27</span>
                </div>

                <div className="receipt-detail-grid">
                  <div>
                    <strong>Donor Name:</strong> {donor.name}
                  </div>
                  <div>
                    <strong>Donor ID:</strong> {donor.id}
                  </div>
                  <div>
                    <strong>Donor PAN:</strong> <span style={{ color: '#2563EB', fontWeight: '700' }}>{donor.pan || 'PAN PENDING'}</span>
                  </div>
                  <div>
                    <strong>Donor Contact:</strong> {donor.phone} • {donor.email}
                  </div>
                  <div className="full-span">
                    <strong>Donor Address:</strong> {donor.address}
                  </div>
                </div>

                <table className="receipt-table-box">
                  <thead>
                    <tr>
                      <th>Financial Year</th>
                      <th>Total Verified Donations</th>
                      <th>Eligible u/s 80G (50%)</th>
                      <th>Statutory IT Filing Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: '700' }}>FY 2025 - 2026</td>
                      <td style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                        ₹{(donor.totalDonated || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: '800', color: '#15803D', fontSize: '14px' }}>
                        ₹{Math.round((donor.totalDonated || 0) * 0.5).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className="status-verified">
                          <CheckCircle2 size={12} /> Form 10BD Uploaded
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="receipt-statutory-notice">
                  <strong>Statutory Declaration:</strong> This is to certify that the above donations were received exclusively as voluntary philanthropic contributions for educational, healthcare, and humanitarian social welfare projects. The donor is entitled to claim income tax deduction under Section 80G of the Indian Income Tax Act, 1961.
                </div>

                <div className="receipt-footer-signatures">
                  <div className="signature-box">
                    <div style={{ width: '100px', height: '60px', border: '1px dashed #94A3B8', margin: '0 auto 6px', display: 'grid', placeItems: 'center', fontSize: '10px', color: '#64748B' }}>
                      [ OFFICIAL SEAL ]
                    </div>
                    <span>GSDD Foundation Trust Seal</span>
                  </div>

                  <div className="signature-box">
                    <div className="signature-line" />
                    <strong>Authorized Signatory & Trustee</strong>
                    <span style={{ display: 'block' }}>Global Skills & Digital Development Foundation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patron Recognition Certificate */}
            {(donor.certificates || []).map((c) => (
              <div key={c.id} className="donor-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0F172A', fontSize: '16px' }}>Official Affiliation & Appreciation Certificate</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Issued under the authority of the Board of Trustees, GSDD Foundation.</p>
                  </div>
                  <button
                    type="button"
                    className="button button-gold"
                    onClick={() => window.print()}
                    style={{ fontSize: '12px', padding: '6px 14px', fontWeight: '700' }}
                  >
                    <Printer size={13} /> Print / Download Certificate
                  </button>
                </div>

                <div className="cert-paper-gold-frame">
                  <div className="cert-emblem">
                    <Award size={32} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D97706', display: 'block', marginBottom: '8px' }}>
                    {c.category}
                  </span>
                  <h2>{c.title}</h2>
                  <p style={{ maxWidth: '640px', margin: '14px auto 20px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                    Presented with profound gratitude to <strong>{donor.name}</strong> for altruistic devotion and patronage towards rural healthcare, women skilling, and youth education.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '12px', color: '#64748B', marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1', flexWrap: 'wrap' }}>
                    <span><strong>Certificate ID:</strong> {c.id}</span>
                    <span><strong>Date:</strong> {c.issueDate}</span>
                    <span><strong>Authorized By:</strong> {c.authorizedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: IMPACT & FIELD REPORTS */}
        {activeTab === 'impact' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <FileText size={20} color="#2563EB" /> Grassroots Impact & Fund Utilization
                </h2>
                <p>Transparent documentation of real social outcomes driven by your contributions.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {donorImpactStories.map((story) => (
                <div
                  key={story.id}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {story.category}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{story.date}</span>
                    </div>
                    <h3 style={{ fontSize: '16px', color: '#0F172A', margin: '0 0 10px' }}>{story.title}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                      {story.summary}
                    </p>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{story.readTime}</span>
                    <Link href="/activities" style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', textDecoration: 'none' }}>
                      Explore Gallery <ArrowRight size={13} style={{ display: 'inline' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: COMMUNICATION SETTINGS */}
        {activeTab === 'notifications' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <Bell size={20} color="#2563EB" /> Communication & Alert Preferences
                </h2>
                <p>Manage how and when you receive tax receipts, WhatsApp transaction alerts, and quarterly impact digests.</p>
              </div>
            </div>

            {notifError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
                role="alert"
              >
                <AlertCircle size={18} />
                <span>{notifError}</span>
              </div>
            )}

            {notifSaved && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#DCFCE7',
                  color: '#15803D',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
                role="status"
              >
                <CheckCircle2 size={18} />
                <span>{notifSaved}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '650px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0F172A' }}>Instant 80G Receipts via Email</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Receive digitally signed PDF receipts immediately after every donation.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.emailReceipts}
                  onChange={(e) => setNotifState({ ...notifState, emailReceipts: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0F172A' }}>WhatsApp Donation Confirmations</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Get quick receipt links and UTR confirmations directly on your phone.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.whatsappAlerts}
                  onChange={(e) => setNotifState({ ...notifState, whatsappAlerts: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0F172A' }}>Monthly Recurring Pledge Reminders</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Gentle reminders before scheduled monthly autopay deductions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.monthlyReminders}
                  onChange={(e) => setNotifState({ ...notifState, monthlyReminders: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0F172A' }}>Quarterly Field Impact Digest</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Detailed photo reports on school kits, health camps, and women SHGs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.quarterlyReports}
                  onChange={(e) => setNotifState({ ...notifState, quarterlyReports: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-blue"
                  onClick={handleSaveNotifs}
                  style={{ padding: '10px 20px', fontWeight: '700' }}
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  disabled={dispatchBusy}
                  onClick={() => handleTestDispatch('email')}
                  style={{ padding: '10px 16px', fontWeight: '600' }}
                >
                  Test Email Dispatch
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  disabled={dispatchBusy}
                  onClick={() => handleTestDispatch('whatsapp')}
                  style={{ padding: '10px 16px', fontWeight: '600' }}
                >
                  Test WhatsApp Dispatch
                </button>
              </div>
            </div>

            <div style={{ marginTop: '28px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#0F172A', marginBottom: '12px' }}>
                Server Notification Dispatch Log
              </h3>
              {(donor.dispatchLog || []).length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748B', background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  No external notification dispatches have been triggered for this session yet. Use the Test Dispatch buttons above to inspect live transport status.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(donor.dispatchLog || []).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '12px 14px',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${entry.delivered ? '#16A34A' : '#D97706'}`,
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: entry.delivered ? '#166534' : '#92400E' }}>
                          {entry.channel} — {entry.delivered ? 'Delivered' : 'Not Dispatched (No Provider Configured)'}
                        </strong>
                        <span style={{ color: '#64748B' }}>{entry.timestamp}</span>
                      </div>
                      <p style={{ margin: 0, color: '#334155' }}>
                        Target: <strong>{entry.recipient}</strong> &bull; {entry.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <div className="donor-card">
            <div className="donor-card-header">
              <div>
                <h2>
                  <KeyRound size={20} color="#2563EB" /> Security & Account Password
                </h2>
                <p>Update your donor portal login password for enhanced security.</p>
              </div>
            </div>

            {passwordMsg.text && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: passwordMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                  color: passwordMsg.type === 'success' ? '#15803D' : '#991B1B',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  maxWidth: '460px',
                }}
              >
                {passwordMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ maxWidth: '460px' }}>
              <div className="donor-form-group" style={{ marginBottom: '14px' }}>
                <label>Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter existing password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="donor-form-group" style={{ marginBottom: '14px' }}>
                <label>New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="donor-form-group" style={{ marginBottom: '20px' }}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="button button-blue" style={{ padding: '12px 24px', fontWeight: '700' }}>
                Update Password
              </button>
            </form>
          </div>
        )}
      </main>

      {/* CANCEL SUBSCRIPTION MODAL */}
      {cancelModalSubId && (
        <div
          className="modal-overlay"
          onClick={() => setCancelModalSubId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', color: '#DC2626', fontSize: '18px' }}>
              Cancel Recurring Pledge ({cancelModalSubId})
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Are you sure you want to cancel your monthly recurring donation pledge? You can pause it anytime instead without losing your recurring donation history.
            </p>
            <div className="donor-form-group">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                Reason for cancellation (Optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                <option value="Temporary financial budget">Temporary financial budget</option>
                <option value="Prefer one-time donations">Prefer one-time donations</option>
                <option value="Want to change cause/amount">Want to change cause/amount</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setCancelModalSubId(null)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Keep Active
              </button>
              <button
                type="button"
                className="button"
                style={{ background: '#DC2626', color: '#FFF', padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}
                onClick={() => handleCancelSub(cancelModalSubId)}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL 80G RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-topbar">
              <span style={{ fontSize: '13px', fontWeight: '700' }}>
                Official Section 80G Donation Receipt ({selectedReceipt.id})
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-gold"
                  onClick={() => window.print()}
                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '700' }}
                >
                  <Printer size={13} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="receipt-paper-frame">
              <div className="receipt-header-box">
                <h2 className="receipt-org-title">{donorTaxDetails.bankAccount.accountName}</h2>
                <p className="receipt-org-sub">
                  A Statutory Section 8 Non-Profit Organization • Ministry of Corporate Affairs, Govt. of India
                </p>
                <p className="receipt-org-sub">
                  MCA Reg: {donorTaxDetails.mcaRegNumber} • PAN: {donorTaxDetails.panNumber} • 12A Reg: {donorTaxDetails.section12ANumber}
                </p>
                <p className="receipt-org-sub">
                  Head Office: {organization.address}
                </p>
                <span className="receipt-title-badge">OFFICIAL DONATION RECEIPT (UNDER SECTION 80G)</span>
              </div>

              <div className="receipt-statutory-row">
                <span><strong>Receipt No:</strong> {selectedReceipt.id}</span>
                <span><strong>Date:</strong> {selectedReceipt.date}</span>
                <span><strong>80G Approval:</strong> {donorTaxDetails.section80GNumber}</span>
              </div>

              <div className="receipt-detail-grid">
                <div>
                  <strong>Received with thanks from:</strong> {donor.name}
                </div>
                <div>
                  <strong>Donor ID:</strong> {donor.id}
                </div>
                <div>
                  <strong>Donor PAN:</strong> <span style={{ color: '#2563EB', fontWeight: '700' }}>{donor.pan || 'PAN PENDING'}</span>
                </div>
                <div>
                  <strong>Payment Mode:</strong> {selectedReceipt.method}
                </div>
                <div>
                  <strong>Bank Ref / UTR:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedReceipt.utr}</span>
                </div>
                <div>
                  <strong>Contribution Type:</strong> {selectedReceipt.type}
                </div>
                <div className="full-span">
                  <strong>Residential / Office Address:</strong> {donor.address}
                </div>
              </div>

              <table className="receipt-table-box">
                <thead>
                  <tr>
                    <th>Allocation / Purpose of Donation</th>
                    <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{selectedReceipt.program}</strong>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>
                        Voluntary contribution for non-profit charitable social empowerment programs
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '15px' }}>
                      ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ background: '#F8FAFC', fontWeight: '700' }}>
                      In Words: {numberToWords(selectedReceipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-statutory-notice">
                <strong>Tax Exemption Note:</strong> Donations to Global Skills & Digital Development Foundation are eligible for 50% tax deduction under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Order No. {donorTaxDetails.section80GNumber}. Donor PAN is required to file Form 10BD with the Income Tax portal.
              </div>

              <div className="receipt-footer-signatures">
                <div className="signature-box">
                  <QRCodeSvg
                    value={`https://gsddfoundation.org/verify/?code=${encodeURIComponent(selectedReceipt.receiptNo || selectedReceipt.id)}`}
                    size={76}
                    label="Verify Receipt"
                  />
                </div>

                <div className="signature-box">
                  <div className="signature-line" />
                  <strong>Authorized Treasurer / Secretary</strong>
                  <span style={{ display: 'block' }}>GSDD Foundation Board of Trustees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
