'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Save,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import './admin-system.css';

const TABS = [
  { id: 'software-data', label: 'Software Data' },
  { id: 'payment-api', label: 'Payment API' },
  { id: 'email-data', label: 'Email Data' },
  { id: 'appointment-data', label: 'Appointment Data' },
  { id: 'access-settings', label: 'Access Settings' },
  { id: 'license-data', label: 'License Settings' },
  { id: 'recaptcha-data', label: 'reCAPTCHA Settings' },
  { id: 'reset-website', label: 'Reset Website Data' },
];

const FIELD_DEFINITIONS = {
  'software-data': [
    { key: 'orgName', label: 'Organization Name' },
    { key: 'shortName', label: 'Short Name' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'regNo', label: 'CIN / Registration No.' },
    { key: 'panNo', label: 'PAN Number' },
    { key: 'email', label: 'Official Email', type: 'email' },
    { key: 'phone', label: 'Helpline Phone' },
    { key: 'websiteUrl', label: 'Website URL', type: 'url' },
    { key: 'address', label: 'Registered Address' },
    { key: 'pan80gNote', label: '80G / Section 8 Note' },
    { key: 'footerText', label: 'Footer Attribution Text' },
  ],
  'payment-api': [
    { key: 'activeGateway', label: 'Default Active Gateway (phonepe / razorpay)' },
    { key: 'phonePeEnabled', label: 'Enable PhonePe Gateway', type: 'checkbox' },
    { key: 'phonePeMode', label: 'PhonePe Environment (sandbox / production)' },
    { key: 'phonePeMerchantId', label: 'PhonePe Merchant ID' },
    { key: 'phonePeSaltIndex', label: 'PhonePe Salt Index' },
    { key: 'razorpayEnabled', label: 'Enable Razorpay Gateway', type: 'checkbox' },
    { key: 'razorpayMode', label: 'Razorpay Mode (test / live)' },
    { key: 'razorpayKeyId', label: 'Razorpay Key ID' },
    { key: 'manualUpiEnabled', label: 'Enable Manual UPI / UTR Option', type: 'checkbox' },
    { key: 'upiId', label: 'Official Foundation UPI ID' },
  ],
  'email-data': [
    { key: 'notificationsEnabled', label: 'Enable Transactional Emails', type: 'checkbox' },
    { key: 'smtpHost', label: 'SMTP Host' },
    { key: 'smtpPort', label: 'SMTP Port' },
    { key: 'smtpEncryption', label: 'Encryption (tls / ssl / none)' },
    { key: 'fromName', label: 'From Name' },
    { key: 'fromEmail', label: 'From Email', type: 'email' },
    { key: 'replyTo', label: 'Reply-To Email', type: 'email' },
  ],
  'appointment-data': [
    { key: 'autoApproveLetters', label: 'Auto-Approve Member Appointment Letters', type: 'checkbox' },
    { key: 'defaultSignatoryName', label: 'Default Signatory Name' },
    { key: 'defaultSignatoryTitle', label: 'Default Signatory Title' },
    { key: 'officeLocation', label: 'Issuing Office Location' },
    { key: 'letterPrefix', label: 'Reference Prefix' },
    { key: 'validityMonths', label: 'Default Validity (Months)' },
  ],
  'access-settings': [
    { key: 'allowPublicRegistration', label: 'Allow Public Membership Registration', type: 'checkbox' },
    { key: 'requireAdminApproval', label: 'Require Admin Approval Before Activation', type: 'checkbox' },
    { key: 'allowVisitorDonations', label: 'Allow Public Visitor Donations', type: 'checkbox' },
    { key: 'allowMemberReferrals', label: 'Enable Member Referral Tracking', type: 'checkbox' },
    { key: 'maintenanceMode', label: 'Enable Maintenance Notice Banner', type: 'checkbox' },
    { key: 'defaultTheme', label: 'Default Portal Theme (light / dark)' },
  ],
  'license-data': [
    { key: 'licenseKey', label: 'Software License Key' },
    { key: 'licenseeName', label: 'Licensed Organization' },
    { key: 'plan', label: 'Subscription Plan' },
    { key: 'validUntil', label: 'Valid Until (YYYY-MM-DD)' },
    { key: 'supportEmail', label: 'Vendor Support Email', type: 'email' },
    { key: 'status', label: 'License Status' },
  ],
  'recaptcha-data': [
    { key: 'enabled', label: 'Enable Anti-Bot CAPTCHA Challenge', type: 'checkbox' },
    { key: 'version', label: 'Version (v2 / v3)' },
    { key: 'siteKey', label: 'Public Site Key' },
    { key: 'threshold', label: 'v3 Minimum Score Threshold (0.1 - 0.9)' },
  ],
};

export default function SoftwareUpdateSection({
  notify,
  initialSection = 'software-data',
  initialUnlocked = false,
  initialData = null,
}) {
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.id === initialSection) ? initialSection : 'software-data'
  );
  const [statusLoading, setStatusLoading] = useState(!initialUnlocked);
  const [unlocked, setUnlocked] = useState(Boolean(initialUnlocked));
  const [configured, setConfigured] = useState(true);

  const [panelPassword, setPanelPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [sectionData, setSectionData] = useState(initialData || {});
  const [sectionLoading, setSectionLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset website state
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetTargets, setResetTargets] = useState(['letterheads', 'birthdays']);

  const checkUnlockStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/software/unlock/', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setUnlocked(Boolean(json.unlocked));
        setConfigured(Boolean(json.configured));
      }
    } catch {}
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    checkUnlockStatus();
  }, [checkUnlockStatus]);

  const loadSectionData = useCallback(
    async (tabId) => {
      if (!unlocked) return;
      setSectionLoading(true);
      try {
        const res = await fetch(`/api/admin/software/${encodeURIComponent(tabId)}/`, {
          cache: 'no-store',
        });
        if (res.status === 403) {
          setUnlocked(false);
          return;
        }
        const json = await res.json();
        if (res.ok && json.ok) {
          setSectionData(json.data || {});
        }
      } catch {}
      setSectionLoading(false);
    },
    [unlocked]
  );

  useEffect(() => {
    if (unlocked) {
      loadSectionData(activeTab);
    }
  }, [unlocked, activeTab, loadSectionData]);

  const handleUnlockOrSetup = async (e) => {
    e.preventDefault();
    setUnlockError('');

    if (!configured && panelPassword !== confirmNewPassword) {
      setUnlockError('Panel passwords do not match.');
      return;
    }

    setUnlocking(true);
    try {
      const payload = configured
        ? { panelPassword }
        : { action: 'setup', newPassword: panelPassword };

      const res = await fetch('/api/admin/software/unlock/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setUnlockError(json?.error || 'Panel verification failed.');
        return;
      }
      setUnlocked(true);
      setConfigured(true);
      setPanelPassword('');
      setConfirmNewPassword('');
      notify?.('Software Update panel unlocked.');
    } catch {
      setUnlockError('Network error verifying panel password.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = async () => {
    await fetch('/api/admin/software/unlock/', { method: 'DELETE' }).catch(() => {});
    setUnlocked(false);
    notify?.('Software Update panel locked.');
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/software/${encodeURIComponent(activeTab)}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      });
      const json = await res.json();
      if (res.status === 403) {
        setUnlocked(false);
        notify?.('Panel unlock expired. Please re-enter panel password.');
        return;
      }
      if (!res.ok || !json.ok) {
        notify?.(json?.error || 'Failed to update settings.');
        return;
      }
      setSectionData(json.data || {});
      notify?.(`Saved ${TABS.find((t) => t.id === activeTab)?.label || 'settings'}.`);
    } catch {
      notify?.('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetWebsite = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/software/reset-website/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: resetPhrase, targets: resetTargets }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        notify?.(json?.error || 'Reset confirmation failed.');
        return;
      }
      setResetPhrase('');
      setSectionData({ lastResetAt: json.resetAt });
      notify?.(`Reset completed for: ${json.resetTargets.join(', ')}`);
    } catch {
      notify?.('Network error resetting data.');
    } finally {
      setSaving(false);
    }
  };

  const toggleResetTarget = (key) => {
    setResetTargets((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  if (statusLoading) {
    return (
      <div className="admin-card" style={{ padding: 48, textAlign: 'center' }}>
        <Loader2 size={26} className="spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h1>Software Update &amp; Core Settings</h1>
          <p>
            Protected configuration panel for payment APIs, SMTP email, license keys, reCAPTCHA,
            and system reset. Direct route access requires Panel Password verification (HTTP 403
            otherwise).
          </p>
        </div>
        {unlocked && (
          <div className="admin-header-actions">
            <Link
              href={`/admin/software/${activeTab}/`}
              className="admin-btn-ghost"
              target="_blank"
            >
              <ExternalLink size={14} /> Open Dedicated Route
            </Link>
            <button type="button" className="admin-btn-ghost" onClick={handleLock}>
              <Lock size={14} /> Lock Panel
            </button>
          </div>
        )}
      </div>

      {!unlocked ? (
        <div className="admin-card" style={{ maxWidth: 480, margin: '24px auto', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: '#fef3c7',
                color: '#b45309',
              }}
            >
              <ShieldAlert size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: 17 }}>
                {configured ? 'Panel Password Required' : 'Set Software Panel Password'}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                {configured
                  ? 'Verify separate software panel credentials to unlock settings.'
                  : 'Create an initial panel passcode (6+ characters) to lock this section.'}
              </p>
            </div>
          </div>

          {unlockError && (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {unlockError}
            </div>
          )}

          <form onSubmit={handleUnlockOrSetup}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              {configured ? 'Enter Panel Password' : 'New Panel Password'}
            </label>
            <input
              type="password"
              required
              minLength={configured ? 1 : 6}
              className="admin-input"
              value={panelPassword}
              onChange={(e) => setPanelPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
            />

            {!configured && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Confirm Panel Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="admin-input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                />
              </div>
            )}

            <button
              type="submit"
              className="admin-btn-primary"
              style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
              disabled={unlocking}
            >
              {unlocking ? <Loader2 size={15} className="spin" /> : <Unlock size={15} />}{' '}
              {configured ? 'Verify & Unlock Panel' : 'Set & Unlock Panel'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="admin-tabs" style={{ flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`admin-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="admin-card" style={{ padding: 24 }}>
            {sectionLoading ? (
              <div style={{ padding: 36, textAlign: 'center' }}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : activeTab === 'reset-website' ? (
              <form onSubmit={handleResetWebsite} style={{ maxWidth: 560 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: 14,
                    borderRadius: 10,
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    marginBottom: 18,
                  }}
                >
                  <AlertTriangle size={20} style={{ color: '#c2410c', flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#7c2d12' }}>
                    <strong>Selective Website Data Reset:</strong> Restores chosen demo modules to
                    clean initial state without modifying administrator login credentials.
                    {sectionData.lastResetAt && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        Last reset: {new Date(sectionData.lastResetAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {[
                    { id: 'letterheads', label: 'Reset Letter Head templates to initial samples' },
                    { id: 'birthdays', label: 'Reset Birthday Wishes log to initial records' },
                    { id: 'settings', label: 'Reset Software Update configuration fields' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                    >
                      <input
                        type="checkbox"
                        checked={resetTargets.includes(opt.id)}
                        onChange={() => toggleResetTarget(opt.id)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Type <code>RESET GSDD DATA</code> to confirm
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={resetPhrase}
                  onChange={(e) => setResetPhrase(e.target.value)}
                  placeholder="RESET GSDD DATA"
                  required
                />

                <button
                  type="submit"
                  className="admin-btn-danger"
                  style={{ marginTop: 16 }}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Execute
                  Selected Reset
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveSection}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {(FIELD_DEFINITIONS[activeTab] || []).map((field) => {
                    if (field.type === 'checkbox') {
                      return (
                        <label
                          key={field.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(sectionData[field.key])}
                            onChange={(e) =>
                              setSectionData((prev) => ({
                                ...prev,
                                [field.key]: e.target.checked,
                              }))
                            }
                          />
                          {field.label}
                        </label>
                      );
                    }
                    return (
                      <div key={field.key}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 6,
                          }}
                        >
                          {field.label}
                        </label>
                        <input
                          type={field.type || 'text'}
                          className="admin-input"
                          value={sectionData[field.key] ?? ''}
                          onChange={(e) =>
                            setSectionData((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="admin-btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save{' '}
                    {TABS.find((t) => t.id === activeTab)?.label}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
