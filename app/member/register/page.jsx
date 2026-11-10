'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import '../member.css';

export default function MemberRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    fatherSpouse: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    category: 'Executive Member',
    designation: 'Vice President',
    bloodGroup: 'B+',
    gender: 'Male',
    address: '',
    district: 'Araria',
    state: 'Bihar',
    pincode: '854334',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/member/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          fatherSpouse: formData.fatherSpouse.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          category: formData.category,
          designation: formData.designation,
          bloodGroup: formData.bloodGroup,
          gender: formData.gender,
          address: `${formData.address.trim()}, ${formData.district}, ${formData.state} - ${formData.pincode}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Registration failed. Please check your details.');
        return;
      }
      setSuccess(data.member);
    } catch {
      setError('Network error during registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="member-auth-page">
      <div className="member-auth-card member-reg-card">
        <div className="auth-logo-header">
          <span className="auth-badge">Member Portal Registration</span>
          <h1>Join GSDD Foundation</h1>
          <p>Create your official membership profile to access activities, ID card, certificates, and community projects.</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '22px', color: 'var(--gsdd-navy-dark)', margin: '0 0 6px' }}>
              Registration Successful!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gsdd-text-muted)' }}>
              Welcome, <strong>{success.name}</strong>! Your official Member ID is <code>{success.id}</code>.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="button button-blue"
                onClick={() => router.push('/member/dashboard')}
              >
                Go to Member Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="member-form-grid">
              <div className="member-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Father&apos;s / Spouse&apos;s Name *</label>
                <input
                  type="text"
                  name="fatherSpouse"
                  required
                  placeholder="Father or Husband name"
                  value={formData.fatherSpouse}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Mobile Number (WhatsApp) *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Membership Category *</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Life Member">Life Member &amp; Patron (₹11,000)</option>
                  <option value="Executive Member">Executive Member (₹1,200/yr)</option>
                  <option value="Core Member">Core Member (₹1,200/yr)</option>
                  <option value="Volunteer">Active Volunteer (₹100/mo)</option>
                </select>
              </div>

              <div className="member-form-group">
                <label>Desired Designation *</label>
                <input
                  type="text"
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="member-form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="member-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Residential Postal Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Village / Ward / Road / House Number"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>District &amp; State</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="member-form-group">
                <label>PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Create Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="member-form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="button button-blue" style={{ width: '100%', padding: '12px' }}>
              <UserPlus size={18} /> {submitting ? 'Creating Account...' : 'Complete Member Registration'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gsdd-text-muted)', marginTop: '16px' }}>
              Already a registered member?{' '}
              <Link href="/member/login" style={{ color: 'var(--gsdd-blue-primary)', fontWeight: '700' }}>
                Log in to Member Portal
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
