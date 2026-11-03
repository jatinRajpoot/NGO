'use client';

import { useState, useEffect } from 'react';
import {
  User, ShieldCheck, Mail, Phone, Building, Calendar, Edit2,
  Save, CheckCircle2, KeyRound, ArrowRight, X
} from 'lucide-react';

export default function AdminProfileSection({ notify, onGoToSecurity }) {
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

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({ ...editData });
    setIsEditing(false);
    notify?.('Administrator profile details updated successfully.');
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Administrator Profile</h2>
          <p>Super Administrator identity, authorized contact credentials, and foundation operational settings.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={onGoToSecurity}>
            <KeyRound size={15} /> Security &amp; Password
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => setIsEditing(true)}>
            <Edit2 size={15} /> Edit Profile Details
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: '20px' }}>
        {/* Left Profile Avatar Card */}
        <div className="adm-card" style={{ padding: '28px', textAlign: 'center' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '32px',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
              border: '3px solid #ffffff',
            }}
          >
            FA
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
          </div>
        </div>

        {/* Right Info Details Card */}
        <div className="adm-card" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '16px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Foundation &amp; Contact Information
          </h3>

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
              Want to update portal password or review authentication logs?
            </span>
            <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={onGoToSecurity}>
              Security Settings <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
                  <div className="adm-form-group adm-form-col-full">
                    <label>Office Address</label>
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
                  <Save size={14} /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
