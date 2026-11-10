'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Edit3, Image as ImageIcon, Briefcase, FileText,
  Users, Bell, Award, LogOut, CheckCircle2, AlertCircle,
  Building2, Mail, Phone, MapPin, Calendar, ShieldCheck,
  UploadCloud, ArrowRight, Printer, Download, Eye
} from 'lucide-react';
import { defaultTeamMembers } from '../team-data';
import { apiClient } from '../../lib/api-client';

const sidebarTabs = [
  { id: 'profile', label: 'View Profile', icon: User },
  { id: 'designation', label: 'View Designation', icon: Briefcase },
  { id: 'update', label: 'Update Profile & Photo', icon: Edit3 },
  { id: 'bio', label: 'View Bio', icon: FileText },
  { id: 'team', label: 'View Team Members', icon: Users },
  { id: 'notifications', label: 'View Notifications', icon: Bell },
  { id: 'certificates', label: 'View Certificates', icon: Award },
];

export default function TeamMemberPortalPage() {
  const router = useRouter();
  const [member, setMember] = useState(defaultTeamMembers[0]);
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Edit Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formQualifications, setFormQualifications] = useState('');
  const [formBio, setFormBio] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Photo Update Request State
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoRequestSuccess, setPhotoRequestSuccess] = useState(false);

  // Selected Certificate for modal view
  const [selectedCert, setSelectedCert] = useState(null);

  // Team Directory Filter State
  const [teamDeptFilter, setTeamDeptFilter] = useState('all');

  // Session & Notifications State
  const [authenticated, setAuthenticated] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [notifList, setNotifList] = useState(defaultTeamMembers[0].notifications || []);
  const [teamList, setTeamList] = useState(defaultTeamMembers);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const res = await fetch('/api/team/me/', { credentials: 'same-origin', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!active) return;
          if (Array.isArray(data?.team) && data.team.length > 0) {
            setTeamList(data.team);
          }
          if (data?.authenticated && data?.member) {
            setAuthenticated(true);
            setMember(data.member);
            initForm(data.member);
            return;
          }
        }
      } catch {
        // Fallback to read-only sample directory preview below
      }
      if (!active) return;
      setAuthenticated(false);
      initForm(defaultTeamMembers[0]);
    }
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  function initForm(m) {
    setFormName(m.name || '');
    setFormPhone(m.phone || '');
    setFormEmail(m.email || '');
    setFormAddress(m.address || '');
    setFormQualifications(m.qualifications || '');
    setFormBio(m.bio || '');
    setNotifList(m.notifications || []);
  }

  async function handleMarkRead(id) {
    setAuthNotice('');
    if (!authenticated) {
      setAuthNotice('Sign in via Team Member Login to update notification state.');
      return;
    }
    try {
      const res = await fetch('/api/team/notifications/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json();
      if (res.ok && data?.member) {
        setMember(data.member);
        setNotifList(data.member.notifications || []);
      } else {
        setAuthNotice(data?.error || 'Could not update notification.');
      }
    } catch {
      setAuthNotice('Network error updating notification.');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/team/logout/', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Proceed to login page
    }
    setAuthenticated(false);
    router.push('/team/login');
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setAuthNotice('');
    if (!authenticated) {
      setAuthNotice('Read-Only Demo Preview: Sign in with executive credentials to save profile changes.');
      return;
    }
    try {
      const res = await fetch('/api/team/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          qualifications: formQualifications,
          bio: formBio,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.member) {
        setMember(data.member);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setAuthNotice(data?.error || 'Failed to save profile.');
      }
    } catch {
      setAuthNotice('Network error saving profile.');
    }
  }

  async function handlePhotoRequest(e) {
    e.preventDefault();
    if (!photoUrl.trim()) return;
    setAuthNotice('');
    if (!authenticated) {
      setAuthNotice('Read-Only Demo Preview: Sign in via Team Member Login to submit a photo review request.');
      return;
    }

    try {
      const res = await fetch('/api/team/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ photoUrl: photoUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.member) {
        setMember(data.member);
        setPhotoRequestSuccess(true);
        setTimeout(() => setPhotoRequestSuccess(false), 4000);
        return;
      }
      setAuthNotice(data?.error || 'Unable to submit photo update request.');
    } catch {
      setAuthNotice('Network error submitting photo review request.');
    }
  }

  const initials = (member.name || 'TM')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div style={{ minHeight: '90vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar */}
      <header style={{ background: '#0F172A', color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#2563EB', display: 'grid', placeItems: 'center', fontWeight: '800', color: '#FFF' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFF' }}>GSDD Foundation</span>
              <span style={{ background: '#1E293B', color: '#93C5FD', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                Management Portal
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              {authenticated ? (
                <>
                  Logged in as: <strong style={{ color: '#E2E8F0' }}>{member.name}</strong> ({member.role})
                </>
              ) : (
                <>
                  Read-Only Preview: <strong style={{ color: '#E2E8F0' }}>{member.name}</strong> ({member.role})
                </>
              )}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {authenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #475569', color: '#F87171', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          ) : (
            <Link
              href="/team/login"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', border: '1px solid #2563EB', color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: '700' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {!authenticated && (
        <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FCD34D', color: '#92400E', padding: '10px 24px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>
            <strong>Read-Only Demo Preview:</strong> Viewing public executive summary. Sign in via Team Member Login to save edits or update notifications.
          </span>
          <Link href="/team/login" style={{ color: '#1D4ED8', fontWeight: '700', textDecoration: 'underline' }}>
            Executive Sign In →
          </Link>
        </div>
      )}

      {authNotice && (
        <div style={{ background: '#FEE2E2', borderBottom: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>{authNotice}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px 16px', gap: '24px', boxSizing: 'border-box' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          
          {/* Member Card */}
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: member.photo ? `url(${member.photo}) center/cover` : '#2563EB', color: '#FFF', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: '800', margin: '0 auto 12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              {!member.photo && initials}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0F172A', fontWeight: '700' }}>{member.name}</h3>
            <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              {member.role}
            </span>
            <span style={{ fontSize: '11px', color: '#64748B', background: '#F8FAFC', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
              ID: <strong>{member.id}</strong>
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#1D4ED8' : '#334155',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isActive ? '#1D4ED8' : '#64748B'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          
          {/* TAB 1: VIEW PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={22} color="#2563EB" /> Official Management Profile
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                    Personal and official credentials within the GSDD Foundation leadership structure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('update')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <Edit3 size={14} /> Update Profile
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    FULL LEGAL NAME
                  </span>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>{member.name}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    OFFICIAL EMAIL
                  </span>
                  <strong style={{ fontSize: '15px', color: '#0F172A', fontFamily: 'monospace' }}>{member.email}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    CONTACT NUMBER
                  </span>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>{member.phone}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    TEAM MEMBER ID
                  </span>
                  <strong style={{ fontSize: '15px', color: '#1E40AF', fontFamily: 'monospace' }}>{member.id}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    JOINING DATE & TENURE
                  </span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>{member.joiningDate} ({member.tenure})</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    QUALIFICATIONS
                  </span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>{member.qualifications}</strong>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    REGISTERED ADDRESS / FIELD OFFICE
                  </span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>{member.address}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIEW DESIGNATION */}
          {activeTab === 'designation' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={22} color="#D97706" /> Designation & Executive Role
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Official post, department responsibility, and executive powers in GSDD Foundation.
                </p>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B45309', display: 'block', marginBottom: '6px' }}>
                  OFFICIAL POST
                </span>
                <h3 style={{ margin: '0 0 6px', fontSize: '20px', color: '#78350F' }}>{member.designation}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                  Department: <strong>{member.department}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', color: '#0F172A', marginBottom: '12px' }}>
                  Key Portfolio Responsibilities
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  {(member.responsibilities || []).map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  EXECUTIVE & STATUTORY POWERS
                </span>
                <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', fontWeight: '600' }}>
                  {member.executivePowers}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: UPDATE PROFILE & PROFILE PHOTO */}
          {activeTab === 'update' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit3 size={22} color="#16A34A" /> Update Profile & Request Photo Change
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Modify your contact coordinates or submit a high-resolution photo update request.
                </p>
              </div>

              {saveSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
                  <CheckCircle2 size={18} />
                  <span>Profile details successfully updated and synchronized!</span>
                </div>
              )}

              {photoRequestSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1E40AF', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
                  <CheckCircle2 size={18} />
                  <span>Profile photo update request submitted for administrative review!</span>
                </div>
              )}

              {/* Photo Update Section */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} color="#2563EB" /> Profile Photo & Change Request
                </h4>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: member.photo ? `url(${member.photo}) center/cover` : '#2563EB', color: '#FFF', display: 'grid', placeItems: 'center', fontSize: '26px', fontWeight: '800' }}>
                    {!member.photo && initials}
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <form onSubmit={handlePhotoRequest} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="url"
                        placeholder="Enter image URL or simulated path (e.g. https://.../photo.jpg)"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                      <button
                        type="submit"
                        style={{ padding: '9px 16px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Request Update
                      </button>
                    </form>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                      Recommended: High-resolution formal headshot (minimum 400x400px).
                    </span>
                  </div>
                </div>

                {member.photoPending && (
                  <div style={{ marginTop: '14px', padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
                    Photo Change Pending: <strong>{member.photoPending.status}</strong> (Requested on {member.photoPending.date}).
                  </div>
                )}
              </div>

              {/* General Details Update Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Educational & Professional Qualifications
                  </label>
                  <input
                    type="text"
                    value={formQualifications}
                    onChange={(e) => setFormQualifications(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Address / Station
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Professional Bio / Introduction
                  </label>
                  <textarea
                    rows={4}
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button
                    type="submit"
                    style={{ padding: '12px 24px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: VIEW BIO */}
          {activeTab === 'bio' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={22} color="#2563EB" /> Personal Bio & Background
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Public introduction and social impact summary published on foundation records.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '24px', lineHeight: '1.7', fontSize: '15px', color: '#334155', fontStyle: 'italic' }}>
                &ldquo;{member.bio}&rdquo;
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('update')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <Edit3 size={14} /> Edit Bio Text
                </button>
                <Link href="/team" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}>
                  View Public Management Directory →
                </Link>
              </div>
            </div>
          )}

          {/* TAB 5: VIEW TEAM MEMBERS */}
          {activeTab === 'team' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={22} color="#7C3AED" /> Management Team Directory
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Details and portfolio channels of fellow executive and governing council members.
                </p>
              </div>

              {/* Department Filter Bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {['all', 'Governing Board', 'Community Healthcare', 'Digital Inclusion'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setTeamDeptFilter(dept)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: teamDeptFilter === dept ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                      background: teamDeptFilter === dept ? '#F5F3FF' : '#FFF',
                      color: teamDeptFilter === dept ? '#6D28D9' : '#334155',
                      fontWeight: teamDeptFilter === dept ? '700' : '500',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {dept === 'all' ? 'All Leadership & Staff' : dept}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {teamList
                  .filter((tm) => {
                    if (teamDeptFilter === 'all') return true;
                    return tm.department.toLowerCase().includes(teamDeptFilter.toLowerCase());
                  })
                  .map((tm) => {
                  const tmInitials = tm.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
                  const isCurrent = tm.id === member.id;
                  return (
                    <div
                      key={tm.id}
                      style={{
                        background: isCurrent ? '#EFF6FF' : '#F8FAFC',
                        border: isCurrent ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '18px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '16px' }}>
                          {tmInitials}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>{tm.name}</h4>
                          <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700' }}>{tm.role}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        <div><strong>Dept:</strong> {tm.department}</div>
                        <div><strong>Email:</strong> {tm.email}</div>
                        <div><strong>Phone:</strong> {tm.phone}</div>
                        <div><strong>Tenure:</strong> {tm.tenure}</div>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                        {tm.bio}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: VIEW NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={22} color="#DC2626" /> Admin Notifications & Announcements
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Official notices, board resolutions, and operational updates dispatched by the central office.
                </p>
              </div>

              {notifList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  No new announcements or notifications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifList.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        background: n.unread ? '#FEF2F2' : '#F8FAFC',
                        border: n.unread ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#0F172A' }}>{n.title}</strong>
                          {n.priority === 'High' && (
                            <span style={{ fontSize: '10px', background: '#DC2626', color: '#FFF', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              HIGH PRIORITY
                            </span>
                          )}
                          {n.unread && (
                            <span style={{ fontSize: '10px', background: '#2563EB', color: '#FFF', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{n.date}</span>
                          {n.unread && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(n.id)}
                              style={{ border: 'none', background: 'transparent', color: '#2563EB', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        From: <strong>{n.sender}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: VIEW CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={22} color="#D97706" /> Issued Executive Certificates & Appointments
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Official letters of appointment, affiliation credentials, and leadership awards issued to you.
                </p>
              </div>

              {(member.certificates || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  No certificates or appointment letters on record.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {member.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '10px',
                        padding: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <span style={{ fontSize: '11px', background: '#F59E0B', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          {cert.type}
                        </span>
                        <h4 style={{ margin: '6px 0 4px', fontSize: '16px', color: '#78350F' }}>{cert.title}</h4>
                        <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#92400E' }}>
                          {cert.summary}
                        </p>
                        <div style={{ fontSize: '11px', color: '#78350F', display: 'flex', gap: '16px' }}>
                          <span>ID: <strong style={{ fontFamily: 'monospace' }}>{cert.id}</strong></span>
                          <span>Issue Date: <strong>{cert.issueDate}</strong></span>
                          <span>Authority: <strong>{cert.authority}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCert(cert)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#D97706', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <Eye size={14} /> View Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF', color: '#78350F', border: '1px solid #D97706', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <Printer size={14} /> Print / Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div
          onClick={() => setSelectedCert(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFF',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              padding: '30px',
              border: '8px double #D97706',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309', display: 'block', marginBottom: '8px' }}>
              GLOBAL SKILLS & DIGITAL DEVELOPMENT WELFARE FOUNDATION
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '14px' }}>
              Registered Section 8 Non-Profit Organization • MCA Govt of India • {selectedCert.regNo || 'CIN: U88900BR2026NPL086114'}
            </span>

            <h2 style={{ fontSize: '20px', color: '#78350F', margin: '0 0 16px' }}>{selectedCert.title}</h2>

            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 20px' }}>
              This certifies that <strong>{member.name}</strong> holds the official appointment of <strong>{member.designation}</strong> in GSDD Foundation.
            </p>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '20px', textAlign: 'left', lineHeight: '1.6' }}>
              {selectedCert.summary}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #CBD5E1', paddingTop: '16px', fontSize: '12px', color: '#64748B' }}>
              <div>
                <span>Certificate ID: <strong>{selectedCert.id}</strong></span><br />
                <span>Date: <strong>{selectedCert.issueDate}</strong></span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '700', color: '#0F172A', display: 'block' }}>Governing Council</span>
                <span>GSDD Welfare Foundation</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 18px', background: '#D97706', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Print / Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                style={{ padding: '8px 18px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
