'use client';

import { useState, useEffect } from 'react';
import {
  User, ShieldCheck, Mail, Phone, Building, Calendar, Edit2,
  Save, CheckCircle2, KeyRound, ArrowRight, X, Shield, Users,
  UserCheck, UserX, Plus, Search, Lock, AlertCircle, RefreshCw
} from 'lucide-react';
import { initialAdminUsers } from './data/mock-admin-data';

export default function AdminProfileSection({ notify, onGoToSecurity }) {
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile' | 'access'
  const [profile, setProfile] = useState({
    name: 'Foundation Administrator',
    username: 'admin',
    role: 'Super Administrator',
    organization: 'Global Skills & Digital Development Foundation',
    email: 'foundationgsdd@gmail.com',
    phone: '+91 95467 52915',
    address: 'Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, NH 327E, Araria, Bihar',
    cin: 'U88900BR2026NPL086114',
    lastLogin: 'Today, 05:30 PM (Active Session)',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...profile });

  // Admin Access Management State
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);
  const [userSearch, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Program Editor',
    permissions: 'Website Content, Gallery, Certificates, Announcements',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/auth/profile/');
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            setProfile((prev) => ({
              ...prev,
              ...data.profile,
            }));
            setEditData((prev) => ({
              ...prev,
              ...data.profile,
            }));
          }
        }
      } catch {}
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/auth/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          phone: editData.phone,
          address: editData.address,
          cin: editData.cin,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
        setEditData((prev) => ({ ...prev, ...data.profile }));
        setIsEditing(false);
        notify?.('Administrator profile details updated successfully.');
        return;
      }
      notify?.(data?.error || 'Could not update profile.');
    } catch {
      notify?.('Network error saving profile.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await fetch('/api/admin/profile/photo/', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data?.ok && data.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
        notify?.('Admin profile photo updated.');
      } else {
        notify?.(data?.error || 'Could not upload photo.');
      }
    } catch {
      notify?.('Network error uploading photo.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch('/api/admin/profile/photo/', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data?.ok && data.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
        notify?.('Admin profile photo removed.');
      } else {
        notify?.(data?.error || 'Could not remove photo.');
      }
    } catch {
      notify?.('Network error removing photo.');
    }
  };

  const handleToggleUserStatus = (id) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          if (u.role === 'Super Administrator') {
            notify?.('Super Administrator account cannot be suspended.');
            return u;
          }
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          notify?.(`Admin account ${u.username} status changed to ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleCreateAdminUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.email) {
      notify?.('Please fill out all required admin account fields.');
      return;
    }
    const created = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      username: newUser.username.toLowerCase().trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      permissions: newUser.permissions,
      status: 'Active',
      lastActive: 'Invitation Sent',
    };
    setAdminUsers((prev) => [created, ...prev]);
    setIsAddUserModalOpen(false);
    setNewUser({
      name: '',
      username: '',
      email: '',
      role: 'Program Editor',
      permissions: 'Website Content, Gallery, Certificates, Announcements',
    });
    notify?.(`New admin operator @${created.username} provisioned successfully.`);
  };

  const filteredUsers = adminUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Admin Profile &amp; Security Controls</h2>
          <p>Super Administrator identity, authorized staff credentials, and role-based access management.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={onGoToSecurity}>
            <KeyRound size={15} /> Change / Reset Password
          </button>
          {activeSubTab === 'profile' ? (
            <button className="adm-btn adm-btn-primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={15} /> Edit Profile Details
            </button>
          ) : (
            <button className="adm-btn adm-btn-primary" onClick={() => setIsAddUserModalOpen(true)}>
              <Plus size={15} /> Add Authorized Admin
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeSubTab === 'profile' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
          onClick={() => setActiveSubTab('profile')}
        >
          <User size={14} /> Admin Identity &amp; Profile
        </button>
        <button
          type="button"
          className={`adm-btn adm-btn-sm ${activeSubTab === 'access' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
          onClick={() => setActiveSubTab('access')}
        >
          <ShieldCheck size={14} /> Authentication &amp; Admin Access ({adminUsers.length})
        </button>
      </div>

      {activeSubTab === 'profile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: '20px' }}>
          {/* Left Profile Avatar Card */}
          <div className="adm-card" style={{ padding: '28px', textAlign: 'center' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                margin: '0 auto 12px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '32px',
                fontWeight: 800,
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                border: '3px solid #ffffff',
              }}
            >
              {profile.photoSrc ? (
                <img
                  src={profile.photoSrc}
                  alt={profile.name || 'Admin avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                'FA'
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
              <label
                className="adm-btn adm-btn-sm adm-btn-outline"
                style={{ cursor: 'pointer' }}
              >
                Upload Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {profile.photoSrc && (
                <button
                  type="button"
                  className="adm-btn adm-btn-sm adm-btn-outline"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={handleRemovePhoto}
                >
                  Remove Photo
                </button>
              )}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {profile.name}
            </h3>
            <span className="adm-badge blue" style={{ marginBottom: '16px' }}>
              {profile.role}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#64748b', textAlign: 'left', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <div>
                Username: <strong style={{ color: '#0f172a' }}>{profile.username}</strong>
              </div>
              <div>
                Status: <strong style={{ color: '#059669' }}>Active &amp; Authenticated</strong>
              </div>
              <div>
                Session: <span style={{ color: '#0f172a' }}>{profile.lastLogin}</span>
              </div>
              <div>
                Authorization: <span style={{ color: '#1e40af', fontWeight: 600 }}>Level 0 (Full Control)</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                className="adm-btn adm-btn-sm adm-btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onGoToSecurity}
              >
                <Lock size={13} /> Reset Password Using Old Password
              </button>
            </div>
          </div>

          {/* Right Info Details Card */}
          <div className="adm-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Foundation &amp; Contact Information
              </h3>
              <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setIsEditing(true)}>
                <Edit2 size={13} /> Update
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Legal Organization
                </span>
                <strong style={{ color: '#0f172a' }}>{profile.organization}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Corporate CIN
                </span>
                <strong style={{ fontFamily: 'monospace', color: '#1e40af' }}>{profile.cin}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Primary Official Email
                </span>
                <strong style={{ color: '#0f172a' }}>{profile.email}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Official Phone
                </span>
                <strong style={{ color: '#0f172a' }}>{profile.phone}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Registered Head Office
                </span>
                <span style={{ color: '#334155' }}>{profile.address}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Cryptographic session window: <strong>8 Hours</strong> &bull; Scrypt key verification
              </span>
              <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={onGoToSecurity}>
                Security Settings <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Access Management & Authorization View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Roles & Permissions Matrix Card */}
          <div className="adm-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#2563eb" /> Role-Based Access Control (RBAC) &amp; Authorization Matrix
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#1e40af' }}>Super Administrator</strong>
                  <span className="adm-badge blue">Level 0</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  Unrestricted access: Member management, financial ledgers, system credentials, security policies, and sub-admin provisioning.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#059669' }}>Finance Manager</strong>
                  <span className="adm-badge green">Level 1</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  Authorized to verify payments, issue 80G tax receipts, manage recurring donor subscriptions, and export financial audit reports.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#d97706' }}>Program &amp; Media Editor</strong>
                  <span className="adm-badge yellow">Level 2</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  Content management, photo gallery, announcement publishing, generating volunteer and visitor certificates, and member notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Authorized Admin Operators Table Card */}
          <div className="adm-card">
            <div className="adm-filter-bar" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="adm-search-box" style={{ maxWidth: '340px' }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search administrators by name, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setIsAddUserModalOpen(true)}>
                  <Plus size={14} /> Provision New Admin
                </button>
              </div>
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Role &amp; Auth Scope</th>
                    <th>Permissions Scope</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: u.role.includes('Super') ? '#1e40af' : '#475569',
                              color: '#fff',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '13px',
                              fontWeight: 700,
                            }}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              @{u.username} &bull; {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-badge ${u.role.includes('Super') ? 'blue' : u.role.includes('Finance') ? 'green' : 'yellow'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#475569', maxWidth: '240px', display: 'inline-block' }}>
                          {u.permissions}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${u.status === 'Active' ? 'green' : 'red'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{u.lastActive}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role !== 'Super Administrator' && (
                          <button
                            type="button"
                            className={`adm-btn adm-btn-sm ${u.status === 'Active' ? 'adm-btn-outline' : 'adm-btn-primary'}`}
                            onClick={() => handleToggleUserStatus(u.id)}
                            title={u.status === 'Active' ? 'Suspend Access' : 'Activate Access'}
                          >
                            {u.status === 'Active' ? (
                              <>
                                <UserX size={13} /> Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} /> Activate
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No admin operators found matching &quot;{userSearch}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Details Modal */}
      {isEditing && (
        <div className="adm-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Edit Profile Details</h3>
              <button className="adm-btn-icon" onClick={() => setIsEditing(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Administrator Display Name</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Official Email</label>
                    <input
                      type="email"
                      required
                      className="adm-form-control"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Official Phone Number</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Corporate CIN / Reg ID</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={editData.cin}
                      onChange={(e) => setEditData({ ...editData, cin: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Registered Head Office Address</label>
                    <textarea
                      rows={2}
                      className="adm-form-control"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Save size={14} /> Save Profile Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision New Admin Modal */}
      {isAddUserModalOpen && (
        <div className="adm-modal-overlay" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Provision Authorized Admin Operator</h3>
              <button className="adm-btn-icon" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateAdminUser}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Full Operator Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="adm-form-control"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Portal Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul_ops"
                      className="adm-form-control"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Official Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@gsddfoundation.org"
                      className="adm-form-control"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Role Assignment *</label>
                    <select
                      className="adm-form-control"
                      value={newUser.role}
                      onChange={(e) => {
                        const r = e.target.value;
                        let perm = 'Website Content, Gallery, Certificates, Announcements';
                        if (r === 'Finance Manager') perm = 'Donations Ledger, 80G Receipts, Member Fees, Payment Verification';
                        if (r === 'Super Administrator') perm = 'Full Control (All Modules, Security, Deletions)';
                        setNewUser({ ...newUser, role: r, permissions: perm });
                      }}
                    >
                      <option value="Program Editor">Program &amp; Media Editor</option>
                      <option value="Finance Manager">Finance &amp; Compliance Officer</option>
                      <option value="Super Administrator">Super Administrator</option>
                    </select>
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Assigned Permission Scope</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={newUser.permissions}
                      onChange={(e) => setNewUser({ ...newUser, permissions: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setIsAddUserModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <UserCheck size={14} /> Provision Operator Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
