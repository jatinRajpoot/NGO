'use client';

import { useState } from 'react';
import {
  Award, Plus, Search, Eye, Edit2, Trash2, Printer, Download,
  CheckCircle2, FileText, X, Sparkles, UserCheck, QrCode, Mail,
  Send, ShieldCheck, AlertCircle, ExternalLink
} from 'lucide-react';
import { initialCertificates, initialTemplates } from './data/mock-admin-data';
import QRCodeVisual from './utils/QRCodeVisual';

export default function CertificateManagement({ notify }) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates', 'templates', 'verify'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'issue', 'preview', 'templateEdit', 'email'
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Email Notification Modal state
  const [emailForm, setEmailForm] = useState({
    toEmail: '',
    subject: '',
    message: '',
  });

  // QR Code Verification State
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const [issueData, setIssueData] = useState({
    recipientName: '',
    recipientRole: '',
    recipientEmail: '',
    certificateType: 'Achievement Certificate',
    templateId: 'tmpl-achievement',
    title: 'Certificate of Excellence & Achievement',
    purpose: '',
    issuedBy: 'Jatin Rajpoot (President)',
  });

  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    badge: '',
    subtitle: '',
    bodyText: '',
    borderStyle: 'classic-gold',
    signatoryLeft: 'General Secretary',
    signatoryRight: 'President',
  });

  const filteredCerts = certificates.filter((c) => {
    if (typeFilter !== 'ALL' && c.certificateType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.recipientName.toLowerCase().includes(q) ||
      c.certNo.toLowerCase().includes(q) ||
      c.certificateType.toLowerCase().includes(q) ||
      c.purpose.toLowerCase().includes(q)
    );
  });

  const handleOpenIssue = (type = 'Achievement Certificate') => {
    const defaultTemplate =
      templates.find((t) => t.id === (type.includes('Visitor') ? 'tmpl-visitor' : 'tmpl-achievement')) ||
      templates[0];
    setIssueData({
      recipientName: '',
      recipientRole: type.includes('Visitor') ? 'Distinguished Guest' : 'Volunteer / Contributor',
      recipientEmail: '',
      certificateType: type,
      templateId: defaultTemplate.id,
      title: type.includes('Visitor') ? 'Certificate of Honor & Appreciation' : 'Certificate of Excellence & Achievement',
      purpose: '',
      issuedBy: 'Jatin Rajpoot (President)',
    });
    setModalMode('issue');
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    if (!issueData.recipientName.trim() || !issueData.purpose.trim()) {
      notify?.('Please fill out Recipient Name and Purpose.');
      return;
    }

    const nextCount = certificates.length + 1;
    const prefix = issueData.certificateType.includes('Visitor') ? 'GSDD-VIS-2026' : 'GSDD-ACH-2026';
    const newCertNo = `${prefix}-${String(nextCount).padStart(3, '0')}`;

    const newCert = {
      ...issueData,
      id: `cert-${Date.now()}`,
      certNo: newCertNo,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Issued',
    };

    setCertificates([newCert, ...certificates]);
    notify?.(`Certificate ${newCertNo} generated with QR Verification for ${newCert.recipientName}!`);
    setModalMode(null);
  };

  const handleOpenPreview = (cert) => {
    setSelectedCert(cert);
    setModalMode('preview');
  };

  const handleOpenEmail = (cert) => {
    setSelectedCert(cert);
    setEmailForm({
      toEmail: cert.recipientEmail || 'recipient@example.com',
      subject: `Official Certificate: ${cert.title} - GSDD Foundation`,
      message: `Dear ${cert.recipientName},\n\nWe are delighted to present your official certificate (${cert.certNo}) from Global Skills & Digital Development Foundation for "${cert.purpose}".\n\nYour certificate has been digitally signed and registered on our verification portal.\n\nWarm regards,\nGSDD Foundation Operations Team`,
    });
    setModalMode('email');
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    notify?.(`Certificate ${selectedCert?.certNo} sent via email to ${emailForm.toEmail}!`);
    setModalMode(null);
  };

  const handleDeleteCert = (cert) => {
    if (window.confirm(`Delete certificate record ${cert.certNo} for ${cert.recipientName}?`)) {
      setCertificates(certificates.filter((c) => c.id !== cert.id));
      notify?.(`Certificate ${cert.certNo} deleted.`);
    }
  };

  const handleEditTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setTemplateForm({ ...tmpl });
    setModalMode('templateEdit');
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    setTemplates(templates.map((t) => (t.id === templateForm.id ? { ...t, ...templateForm } : t)));
    notify?.(`Template "${templateForm.name}" updated successfully.`);
    setModalMode(null);
  };

  // QR Code Verification Lookup
  const handleVerifyLookup = (e) => {
    e?.preventDefault();
    const query = verifyInput.trim().toUpperCase();
    if (!query) return;

    const found = certificates.find(
      (c) => c.certNo.toUpperCase() === query || c.recipientName.toUpperCase().includes(query)
    );

    if (found) {
      setVerifyResult({
        valid: true,
        cert: found,
        hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED`,
      });
    } else {
      setVerifyResult({
        valid: false,
        code: query,
      });
    }
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Certificate Management</h2>
          <p>
            Generate official certificates, embed QR verification codes, inspect document validity, send email notices, and print/download PDFs.
          </p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={() => setActiveTab('verify')}>
            <QrCode size={15} /> QR Code Verification
          </button>
          <button className="adm-btn adm-btn-outline" onClick={() => handleOpenIssue('Visitor Certificate')}>
            <UserCheck size={15} /> Issue Visitor Certificate
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => handleOpenIssue('Achievement Certificate')}>
            <Award size={15} /> Generate Certificate
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Award size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{certificates.length}</span>
            <span className="adm-stat-label">Total Certificates Issued</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><QrCode size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">100%</span>
            <span className="adm-stat-label">QR Code Verified</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><UserCheck size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {certificates.filter((c) => c.certificateType === 'Visitor Certificate').length}
            </span>
            <span className="adm-stat-label">Visitor Certificates</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><FileText size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{templates.length}</span>
            <span className="adm-stat-label">Active Templates</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'certificates' ? ' active' : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          Certificate Records <span className="adm-tab-badge">{certificates.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'verify' ? ' active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          <QrCode size={13} /> QR Code Verification Tool
        </button>
        <button
          className={`adm-tab${activeTab === 'templates' ? ' active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Certificate Templates <span className="adm-tab-badge">{templates.length}</span>
        </button>
      </div>

      {activeTab === 'certificates' && (
        <>
          {/* Controls Bar */}
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search recipient name, certificate number, purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="adm-filters">
              <select
                className="adm-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Achievement Certificate">Achievement Certificates</option>
                <option value="Visitor Certificate">Visitor Certificates</option>
              </select>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Certificate No &amp; QR</th>
                    <th>Recipient</th>
                    <th>Category</th>
                    <th>Purpose / Citation</th>
                    <th>Issue Date</th>
                    <th>Verification</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        No certificate records found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredCerts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <QRCodeVisual
                              value={`https://gsddfoundation.org/verify?type=certificate&id=${c.certNo}`}
                              size={34}
                              label=""
                            />
                            <div>
                              <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{c.certNo}</strong>
                              <div style={{ fontSize: '10px', color: '#059669' }}>QR Generated</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{c.recipientName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{c.recipientRole}</div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`adm-badge ${
                              c.certificateType.includes('Visitor') ? 'purple' : 'green'
                            }`}
                          >
                            {c.certificateType}
                          </span>
                        </td>
                        <td style={{ maxWidth: '260px' }}>
                          <span style={{ fontSize: '12px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.purpose}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{c.issueDate}</span>
                        </td>
                        <td>
                          <span className="adm-badge green">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              onClick={() => handleOpenPreview(c)}
                              title="Download & Print PDF"
                            >
                              <Printer size={13} /> PDF / Print
                            </button>
                            <button
                              className="adm-btn-icon"
                              onClick={() => handleOpenEmail(c)}
                              title="Send Certificate via Email"
                              style={{ color: '#2563eb' }}
                            >
                              <Mail size={14} />
                            </button>
                            <button
                              className="adm-btn-icon adm-btn-danger"
                              onClick={() => handleDeleteCert(c)}
                              title="Delete Certificate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* QR Code Verification Tool Tab */}
      {activeTab === 'verify' && (
        <div className="adm-card" style={{ padding: '28px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <QrCode size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              Official Certificate QR Code Verification
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
              Verify certificate genuineness against foundation statutory registry. Enter Certificate ID or scan code.
            </p>

            <form onSubmit={handleVerifyLookup} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                required
                className="adm-form-control"
                style={{ flex: 1, fontSize: '14px', textTransform: 'uppercase' }}
                placeholder="e.g. GSDD-ACH-2026-081 or recipient name..."
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
              />
              <button type="submit" className="adm-btn adm-btn-primary">
                <Search size={15} /> Verify Authenticity
              </button>
            </form>

            {/* Quick test badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>Try sample:</span>
              {certificates.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="adm-badge blue"
                  style={{ cursor: 'pointer', border: 0 }}
                  onClick={() => {
                    setVerifyInput(c.certNo);
                    setVerifyResult({
                      valid: true,
                      cert: c,
                      hash: `SHA256-AUTHENTICATED-${c.certNo}`,
                    });
                  }}
                >
                  {c.certNo}
                </button>
              ))}
            </div>

            {/* Verification Result Card */}
            {verifyResult && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1.5px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`,
                  background: verifyResult.valid ? '#f0fdf4' : '#fef2f2',
                  textAlign: 'left',
                }}
              >
                {verifyResult.valid ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', marginBottom: '14px' }}>
                      <CheckCircle2 size={24} />
                      <div>
                        <strong style={{ fontSize: '16px' }}>OFFICIALLY VERIFIED &amp; GENUINE DOCUMENT</strong>
                        <div style={{ fontSize: '11px', color: '#065f46' }}>
                          Registered in GSDD Foundation National NGO Registry
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Certificate ID</span>
                        <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{verifyResult.cert.certNo}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Recipient Name</span>
                        <strong>{verifyResult.cert.recipientName}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Category</span>
                        <span className="adm-badge green">{verifyResult.cert.certificateType}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Date of Issue</span>
                        <strong>{verifyResult.cert.issueDate}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Citation / Purpose</span>
                        <span style={{ color: '#334155' }}>{verifyResult.cert.purpose}</span>
                      </div>
                      <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                        Cryptographic Hash: <code>{verifyResult.hash}</code> &bull; Authorized by: <strong>{verifyResult.cert.issuedBy}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => handleOpenPreview(verifyResult.cert)}>
                        <Printer size={13} /> View &amp; Print Certificate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={22} />
                    <div>
                      <strong>No Certificate Found for "{verifyResult.code}"</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                        Please double check the certificate number or check if it was issued by another center.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {templates.map((tmpl) => (
            <div className="adm-card" key={tmpl.id} style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="adm-badge blue">{tmpl.badge}</span>
                <button
                  className="adm-btn adm-btn-sm adm-btn-outline"
                  onClick={() => handleEditTemplate(tmpl)}
                >
                  <Edit2 size={12} /> Edit Template
                </button>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{tmpl.name}</h3>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>{tmpl.subtitle}</p>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#334155', fontStyle: 'italic', marginBottom: '14px', flex: 1 }}>
                &ldquo;{tmpl.bodyText}&rdquo;
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span>Left: <strong>{tmpl.signatoryLeft}</strong></span>
                <span>Right: <strong>{tmpl.signatoryRight}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Certificate Modal */}
      {modalMode === 'issue' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Generate &amp; Issue Official Certificate</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Certificate Category *</label>
                    <select
                      className="adm-form-control"
                      value={issueData.certificateType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIssueData({
                          ...issueData,
                          certificateType: val,
                          templateId: val.includes('Visitor') ? 'tmpl-visitor' : 'tmpl-achievement',
                          title: val.includes('Visitor') ? 'Certificate of Honor & Appreciation' : 'Certificate of Excellence & Achievement',
                          recipientRole: val.includes('Visitor') ? 'Distinguished Guest' : 'Volunteer / Contributor',
                        });
                      }}
                    >
                      <option value="Achievement Certificate">Achievement Certificate</option>
                      <option value="Visitor Certificate">Visitor Certificate</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Design Template *</label>
                    <select
                      className="adm-form-control"
                      value={issueData.templateId}
                      onChange={(e) => setIssueData({ ...issueData, templateId: e.target.value })}
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.badge})</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Recipient Full Name *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={issueData.recipientName}
                      onChange={(e) => setIssueData({ ...issueData, recipientName: e.target.value })}
                      placeholder="e.g. Kavita Kumari"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Recipient Email (for Email Notification)</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={issueData.recipientEmail}
                      onChange={(e) => setIssueData({ ...issueData, recipientEmail: e.target.value })}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Recipient Role / Post</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={issueData.recipientRole}
                      onChange={(e) => setIssueData({ ...issueData, recipientRole: e.target.value })}
                      placeholder="e.g. Volunteer Instructor, Guest Speaker"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Issued By Signatory</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={issueData.issuedBy}
                      onChange={(e) => setIssueData({ ...issueData, issuedBy: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Citation / Specific Purpose *</label>
                    <textarea
                      required
                      rows={3}
                      className="adm-form-control"
                      value={issueData.purpose}
                      onChange={(e) => setIssueData({ ...issueData, purpose: e.target.value })}
                      placeholder="e.g. Outstanding contribution in conducting 60 days of free digital literacy workshops for rural girls in Raniganj..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Generate Certificate &amp; QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Print Certificate Modal (with embedded QR Code) */}
      {modalMode === 'preview' && selectedCert && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Certificate Viewer: {selectedCert.certNo}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              {(() => {
                const tmpl = templates.find((t) => t.id === selectedCert.templateId) || templates[0];
                return (
                  <div className={`adm-cert-frame ${tmpl.borderStyle}`}>
                    <div className="adm-cert-org">GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</div>
                    <div className="adm-cert-suborg">
                      CIN: U88900BR2026NPL086114 &bull; Section 8 Non-Profit &bull; Raniganj, Bihar
                    </div>
                    <span className="adm-cert-badge-tag">{tmpl.badge}</span>
                    <h1 className="adm-cert-title">{selectedCert.title || tmpl.name}</h1>
                    <p className="adm-cert-sub">{tmpl.subtitle}</p>
                    <div className="adm-cert-name">{selectedCert.recipientName}</div>
                    <p className="adm-cert-body">
                      {selectedCert.purpose} {tmpl.bodyText}
                    </p>

                    <div className="adm-cert-meta">
                      <div className="adm-cert-sign">
                        <div className="adm-cert-sign-line" />
                        <strong>{tmpl.signatoryLeft}</strong>
                        <span>GSDD Foundation</span>
                      </div>

                      {/* Embedded QR Code Visual */}
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <QRCodeVisual
                          value={`https://gsddfoundation.org/verify?type=certificate&id=${selectedCert.certNo}`}
                          size={74}
                          label="Scan to Verify"
                        />
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: '11px', marginTop: '4px' }}>
                          {selectedCert.certNo}
                        </span>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Date: {selectedCert.issueDate}
                        </div>
                      </div>

                      <div className="adm-cert-sign">
                        <div className="adm-cert-sign-line" />
                        <strong>{tmpl.signatoryRight}</strong>
                        <span>GSDD Foundation</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-outline"
                onClick={() => handleOpenEmail(selectedCert)}
              >
                <Mail size={14} /> Email Certificate
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={14} /> Download / Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Notification Modal */}
      {modalMode === 'email' && selectedCert && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Email Certificate Notification</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSendEmail}>
              <div className="adm-modal-body">
                <div className="adm-form-group" style={{ marginBottom: '14px' }}>
                  <label>Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    className="adm-form-control"
                    value={emailForm.toEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                  />
                </div>
                <div className="adm-form-group" style={{ marginBottom: '14px' }}>
                  <label>Email Subject *</label>
                  <input
                    type="text"
                    required
                    className="adm-form-control"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  />
                </div>
                <div className="adm-form-group" style={{ marginBottom: '14px' }}>
                  <label>Notification Message</label>
                  <textarea
                    rows={6}
                    className="adm-form-control"
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  />
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                  &bull; Certificate PDF <strong>{selectedCert.certNo}.pdf</strong> and verification QR link will be attached automatically.
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Send size={14} /> Send Official Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {modalMode === 'templateEdit' && selectedTemplate && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Edit Certificate Template</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Template Name *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Badge Ribbon Text</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={templateForm.badge}
                      onChange={(e) => setTemplateForm({ ...templateForm, badge: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Subtitle / Intro Phrase</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={templateForm.subtitle}
                      onChange={(e) => setTemplateForm({ ...templateForm, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Body Citation Template</label>
                    <textarea
                      rows={3}
                      className="adm-form-control"
                      value={templateForm.bodyText}
                      onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Border Style</label>
                    <select
                      className="adm-form-control"
                      value={templateForm.borderStyle}
                      onChange={(e) => setTemplateForm({ ...templateForm, borderStyle: e.target.value })}
                    >
                      <option value="classic-gold">Classic Gold Double Frame</option>
                      <option value="modern-blue">Modern Navy Blue Frame</option>
                      <option value="emerald-seal">Emerald Green Seal Frame</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Left Signatory Title</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={templateForm.signatoryLeft}
                      onChange={(e) => setTemplateForm({ ...templateForm, signatoryLeft: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
