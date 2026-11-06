'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, HeartHandshake, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { defaultDonors, donorPrograms } from '../donor-data';
import '../donor.css';

export default function DonorRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pan: '',
    donorType: 'Individual Donor',
    preferredProgram: donorPrograms[0].name,
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pin: '700001',
    password: '',
    confirmPassword: '',
    whatsappConsent: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'pan' ? value.toUpperCase() : value,
    }));
    setError('');
  }

  function handleRegister(e) {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const cleanPan = formData.pan.trim().toUpperCase();
    if (cleanPan && cleanPan.length !== 10) {
      setError('Please provide a valid 10-character PAN number for Section 80G tax receipts.');
      return;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `GSDD-D-2026-${randomSuffix}`;

    const newDonor = {
      id: newId,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      pan: cleanPan,
      donorType: formData.donorType,
      preferredProgram: formData.preferredProgram,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pin: formData.pin.trim(),
      address: `${formData.address.trim()}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.pin.trim()}`,
      tier: 'Silver Donor',
      totalDonated: 0,
      donationCount: 0,
      activeSubscriptions: 0,
      joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      profileBio: `Dedicated philanthropist supporting ${formData.preferredProgram}.`,
      donations: [],
      subscriptions: [],
      notifications: {
        emailReceipts: true,
        whatsappAlerts: formData.whatsappConsent,
        monthlyReminders: true,
        quarterlyReports: true,
      },
      certificates: [],
    };

    try {
      const stored = JSON.parse(localStorage.getItem('gsdd_donors_db') || '[]');
      stored.push(newDonor);
      localStorage.setItem('gsdd_donors_db', JSON.stringify(stored));
      localStorage.setItem('gsdd_active_donor', JSON.stringify(newDonor));
    } catch {
      // Ignore
    }

    setSuccess(newDonor);
  }

  return (
    <div className="donor-auth-page">
      <div className="donor-auth-card donor-reg-card">
        <div className="donor-logo-header">
          <span className="donor-badge">
            <HeartHandshake size={14} /> GSDD Foundation Patron Network
          </span>
          <h1>Donor & Patron Registration</h1>
          <p>
            Join our nationwide mission to empower underserved youth, provide rural healthcare, and uplift communities with Section 80G tax exemption benefits.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div
            style={{
              background: '#F0FDF4',
              border: '2px solid #86EFAC',
              borderRadius: '10px',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={48} color="#16A34A" style={{ margin: '0 auto 14px' }} />
            <h2 style={{ fontSize: '22px', color: '#166534', margin: '0 0 8px' }}>
              Donor Registration Successful!
            </h2>
            <p style={{ fontSize: '14px', color: '#15803D', marginBottom: '18px' }}>
              Welcome, <strong>{success.name}</strong>! Your official Donor ID has been issued.
            </p>

            <div
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px dashed #16A34A',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>YOUR PERMANENT DONOR ID</span>
              <strong style={{ fontSize: '20px', color: '#0F172A', letterSpacing: '0.05em' }}>{success.id}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="button button-blue"
                onClick={() => router.push('/donor/dashboard')}
                style={{ padding: '12px 24px', fontWeight: '700' }}
              >
                Go to Donor Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="donor-form-grid">
              <div className="donor-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="vikram.s@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>Mobile Number (WhatsApp Preferred) *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98310 98765"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>
                  <span>PAN Card Number (for 80G Tax Exemption) *</span>
                </label>
                <input
                  type="text"
                  name="pan"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.pan}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}
                />
                <span className="pan-input-hint">Mandatory for Section 80G certificate & Form 10BE filing</span>
              </div>

              <div className="donor-form-group">
                <label>Donor Category</label>
                <select name="donorType" value={formData.donorType} onChange={handleChange}>
                  <option value="Individual Donor">Individual Philanthropist</option>
                  <option value="Corporate CSR">Corporate / CSR Sponsor</option>
                  <option value="Family Trust">Family Trust / Foundation</option>
                  <option value="NRI Donor">NRI Benefactor</option>
                </select>
              </div>

              <div className="donor-form-group">
                <label>Preferred Focus Area</label>
                <select name="preferredProgram" value={formData.preferredProgram} onChange={handleChange}>
                  {donorPrograms.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="donor-form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="Kolkata / Patna"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="West Bengal / Bihar"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pin"
                  required
                  placeholder="700001"
                  value={formData.pin}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group span-all">
                <label>Residential / Corporate Billing Address</label>
                <textarea
                  name="address"
                  rows={2}
                  required
                  placeholder="Enter complete street address for tax receipt dispatch"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>Create Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="donor-form-group span-all">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="whatsappConsent"
                    checked={formData.whatsappConsent}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '500', fontSize: '12px', color: '#475569' }}>
                    I agree to receive instant donation tax receipts, Form 10BE filing updates, and impact reports via WhatsApp & Email.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="button button-blue"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              <UserPlus size={18} /> Register as Foundation Patron
            </button>

            <div
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#64748B',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #E2DED5',
              }}
            >
              Already registered as a donor?{' '}
              <Link href="/donor/login" style={{ color: '#2563EB', fontWeight: '700' }}>
                Sign In to Donor Portal
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
