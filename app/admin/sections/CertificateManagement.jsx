'use client';

import { useState } from 'react';
import {
  Award, Plus, Search, Eye, Edit2, Trash2, Printer, Download,
  CheckCircle2, FileText, X, Sparkles, UserCheck
} from 'lucide-react';
import { initialCertificates, initialTemplates } from './data/mock-admin-data';

export default function CertificateManagement({ notify }) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates', 'templates'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'issue', 'preview', 'templateEdit'
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [issueData, setIssueData] = useState({
    recipientName: '',
    recipientRole: '',
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
    const defaultTemplate = templates.find((t) => t.id === (type.includes('Visitor') ? 'tmpl-visitor' : 'tmpl-achievement')) || templates[0];
    setIssueData({
      recipientName: '',
      recipientRole: type.includes('Visitor') ? 'Distinguished Guest' : 'Volunteer / Contributor',
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
    notify?.(`Certificate ${newCertNo} issued to ${newCert.recipientName}!`);
    setModalMode(null);
  };

  const handleOpenPreview = (cert) => {
    setSelectedCert(cert);
    setModalMode('preview');
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

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Certificate Management</h2>
          <p>Create, customize, issue, and print official Achievement and Visitor Appreciation certificates.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={() => handleOpenIssue('Visitor Certificate')}>
            <UserCheck size={15} /> Issue Visitor Certificate
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => handleOpenIssue('Achievement Certificate')}>
            <Award size={15} /> Issue Achievement Certificate
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Award size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{certificates.length}</span>
            <span className="adm-stat-label">Total Issued</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><Sparkles size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {certificates.filter((c) => c.certificateType === 'Achievement Certificate').length}
            </span>
            <span className="adm-stat-label">Achievement Certificates</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><UserCheck size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {certificates.filter((c) => c.certificateType === 'Visitor Certificate').length}
            </span>
            <span className="adm-stat-label">Visitor / Guest Certificates</span>
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
          Issued Certificates <span className="adm-tab-badge">{certificates.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'templates' ? ' active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Certificate Templates <span className="adm-tab-badge">{templates.length}</span>
        </button>
      </div>

      {activeTab === 'certificates' ? (
        <>
          {/* Controls Bar */}
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search recipient name, certificate number, event..."
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
                <option value="ALL">All Types</option>
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
                    <th>Certificate No</th>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Purpose / Citation</th>
                    <th>Issued By</th>
                    <th>Date</th>
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
                          <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{c.certNo}</strong>
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
                        <td style={{ maxWidth: '280px' }}>
                          <span style={{ fontSize: '12px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.purpose}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{c.issuedBy}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{c.issueDate}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              onClick={() => handleOpenPreview(c)}
                              title="Preview & Print Certificate"
                            >
                              <Printer size={13} /> View &amp; Print
                            </button>
                            <button
                              className="adm-btn-icon adm-btn-danger"
                              onClick={() => handleDeleteCert(c)}
                              title="Delete Certificate"
                            >
                              <Trash2 size={13} />
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
      ) : (
        /* Templates tab */
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
                <span>Left Sign: <strong>{tmpl.signatoryLeft}</strong></span>
                <span>Right Sign: <strong>{tmpl.signatoryRight}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal */}
      {modalMode === 'issue' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Issue New Official Certificate</h3>
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
                      placeholder="e.g. Kavita Kumari / Shri Anand Prakash"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Recipient Designation / Role</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={issueData.recipientRole}
                      onChange={(e) => setIssueData({ ...issueData, recipientRole: e.target.value })}
                      placeholder="e.g. Volunteer Instructor, Dignitary, Donor..."
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Certificate Title Headline</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={issueData.title}
                      onChange={(e) => setIssueData({ ...issueData, title: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Citation / Specific Achievement or Purpose *</label>
                    <textarea
                      required
                      rows={3}
                      className="adm-form-control"
                      value={issueData.purpose}
                      onChange={(e) => setIssueData({ ...issueData, purpose: e.target.value })}
                      placeholder="e.g. In recognition of outstanding volunteer contribution in organizing 60 days of digital literacy training in Raniganj..."
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Issued By</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={issueData.issuedBy}
                      onChange={(e) => setIssueData({ ...issueData, issuedBy: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Generate &amp; Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Live Preview & Print Modal */}
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
              {/* Formal Ornate Certificate Canvas */}
              {(() => {
                const tmpl = templates.find((t) => t.id === selectedCert.templateId) || templates[0];
                return (
                  <div className={`adm-cert-frame ${tmpl.borderStyle}`}>
                    <div className="adm-cert-org">GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</div>
                    <div className="adm-cert-suborg">CIN: U88900BR2026NPL086114 · Section 8 Non-Profit · Raniganj, Bihar</div>
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
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#64748b', display: 'block' }}>
                          CERTIFICATE ID
                        </strong>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>
                          {selectedCert.certNo}
                        </span>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
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
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={14} /> Print Certificate
              </button>
              <button className="adm-btn adm-btn-primary" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
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
