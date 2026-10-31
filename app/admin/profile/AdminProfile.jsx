'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  User,
  Clock,
  Building2,
  Lock,
  X,
} from 'lucide-react';
import './admin-profile.css';

export default function AdminProfile({ onPasswordChanged } = {}) {
  const [profile, setProfile] = useState({
    username: 'admin',
    role: 'Super Administrator',
    organization: 'Global Skills & Digital Development Foundation',
    sessionMaxAgeHours: 8,
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Request state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch administrator profile details
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/admin/auth/profile/');
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            setProfile(data.profile);
          }
        }
      } catch {
        // Fallback to defaults
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Validation checks
  const isMinLength = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferent = newPassword.length > 0 && oldPassword.length > 0 && newPassword !== oldPassword;
  const canSubmit = oldPassword.length > 0 && isMinLength && isMatch && isDifferent && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!oldPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/auth/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setSuccessMessage('Your administrative password has been updated successfully.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (typeof onPasswordChanged === 'function') {
          onPasswordChanged();
        }
      } else {
        setErrorMessage(data?.message || data?.error || 'Failed to update password. Please check your credentials.');
      }
    } catch {
      setErrorMessage('Network error occurred while updating password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-profile-container" aria-label="Administrator profile and security settings">
      {/* Profile Overview Card */}
      <section className="admin-profile-card">
        <div className="admin-profile-card-header">
          <h2>Administrator Details</h2>
          <span className="admin-profile-badge admin-profile-badge-green">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Active Authenticated Session</span>
          </span>
        </div>

        <div className="admin-profile-card-body">
          <div className="admin-profile-hero">
            <div className="admin-profile-avatar-lg" aria-hidden="true">
              {profile.username ? profile.username.slice(0, 2).toUpperCase() : 'FA'}
            </div>
            <div className="admin-profile-info">
              <div className="admin-profile-name-row">
                <h3 className="admin-profile-name">
                  {profile.username === 'admin' ? 'Foundation Admin' : profile.username}
                </h3>
                <span className="admin-profile-badge">
                  <User size={13} aria-hidden="true" />
                  <span>{profile.role || 'Administrator'}</span>
                </span>
              </div>
              <p className="admin-profile-org">{profile.organization}</p>
            </div>
          </div>

          <div className="admin-profile-grid">
            <div className="admin-profile-detail-item">
              <span className="admin-profile-detail-label">Username</span>
              <span className="admin-profile-detail-value">
                <User size={15} aria-hidden="true" />
                <span>{profile.username}</span>
              </span>
            </div>

            <div className="admin-profile-detail-item">
              <span className="admin-profile-detail-label">Session Window</span>
              <span className="admin-profile-detail-value">
                <Clock size={15} aria-hidden="true" />
                <span>{profile.sessionMaxAgeHours || 8} Hours Stateless Session</span>
              </span>
            </div>

            <div className="admin-profile-detail-item">
              <span className="admin-profile-detail-label">Organization</span>
              <span className="admin-profile-detail-value">
                <Building2 size={15} aria-hidden="true" />
                <span>GSDD Foundation</span>
              </span>
            </div>

            <div className="admin-profile-detail-item">
              <span className="admin-profile-detail-label">Security Protocol</span>
              <span className="admin-profile-detail-value">
                <Lock size={15} aria-hidden="true" />
                <span>Scrypt 64B + HMAC-SHA256</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Password Reset Section */}
      <section className="admin-profile-card" aria-labelledby="reset-password-heading">
        <div className="admin-profile-card-header">
          <h2 id="reset-password-heading">Reset Password</h2>
          <span className="admin-profile-badge">
            <KeyRound size={14} aria-hidden="true" />
            <span>Old Password Verification Required</span>
          </span>
        </div>

        <div className="admin-profile-card-body">
          {successMessage && (
            <div className="admin-profile-alert admin-profile-alert-success" role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{successMessage}</span>
              <button
                type="button"
                className="admin-profile-alert-close"
                onClick={() => setSuccessMessage(null)}
                aria-label="Dismiss success message"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="admin-profile-alert admin-profile-alert-error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errorMessage}</span>
              <button
                type="button"
                className="admin-profile-alert-close"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error message"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-password-form">
            {/* Current (Old) Password */}
            <div className="admin-form-group">
              <label htmlFor="admin-old-password" className="admin-form-label">
                <span>
                  Current (Old) Password <span className="req" aria-hidden="true">*</span>
                </span>
              </label>
              <div className="admin-password-input-wrap">
                <input
                  id="admin-old-password"
                  name="oldPassword"
                  type={showOld ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  value={oldPassword}
                  disabled={submitting}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowOld((prev) => !prev)}
                  aria-label={showOld ? 'Hide current password' : 'Show current password'}
                  tabIndex={-1}
                >
                  {showOld ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="admin-form-group">
              <label htmlFor="admin-new-password" className="admin-form-label">
                <span>
                  New Password <span className="req" aria-hidden="true">*</span>
                </span>
              </label>
              <div className="admin-password-input-wrap">
                <input
                  id="admin-new-password"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Enter minimum 8 characters"
                  value={newPassword}
                  disabled={submitting}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowNew((prev) => !prev)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="admin-form-group">
              <label htmlFor="admin-confirm-password" className="admin-form-label">
                <span>
                  Confirm New Password <span className="req" aria-hidden="true">*</span>
                </span>
              </label>
              <div className="admin-password-input-wrap">
                <input
                  id="admin-confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  disabled={submitting}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            <div className="admin-password-hints" aria-live="polite">
              <div className={`admin-password-hint-item${isMinLength ? ' is-valid' : ''}`}>
                <Check size={14} aria-hidden="true" color={isMinLength ? '#166534' : '#94a3b8'} />
                <span>At least 8 characters long</span>
              </div>
              <div className={`admin-password-hint-item${isMatch ? ' is-valid' : ''}`}>
                <Check size={14} aria-hidden="true" color={isMatch ? '#166534' : '#94a3b8'} />
                <span>New password and confirmation match</span>
              </div>
              <div className={`admin-password-hint-item${isDifferent ? ' is-valid' : ''}`}>
                <Check size={14} aria-hidden="true" color={isDifferent ? '#166534' : '#94a3b8'} />
                <span>Different from current password</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="admin-profile-submit-btn"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="admin-gallery-spinner" aria-hidden="true" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} aria-hidden="true" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
