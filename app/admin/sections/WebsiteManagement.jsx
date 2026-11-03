'use client';

import { useState } from 'react';
import {
  Globe, LayoutTemplate, Share2, Mail, DollarSign, Image as ImageIcon,
  Edit2, Save, ExternalLink, Check, Search, Eye, Trash2, ArrowUpRight,
  Send, Sparkles, MessageSquare, CheckCircle2, RefreshCw
} from 'lucide-react';
import GalleryManager from '../GalleryManager';
import { initialEnquiries, initialDonations } from './data/mock-admin-data';

export default function WebsiteManagement({ notify }) {
  const [activeTab, setActiveTab] = useState('pages'); // 'pages', 'social', 'enquiries', 'donations', 'gallery'

  // Page Content States
  const [pages, setPages] = useState([
    {
      id: 'home',
      name: 'Homepage (Home)',
      path: '/',
      headline: 'Empowering People. Developing Skills. Transforming Communities.',
      subtitle: 'Grassroots development, vocational education, and digital literacy in rural Bihar.',
      bannerNotice: 'Empowering rural youth through digital literacy and skill development.',
      bannerActive: true,
      status: 'Published',
    },
    {
      id: 'about',
      name: 'About Us',
      path: '/about/',
      headline: 'Dedicated to Dignity, Equal Opportunity, and Inclusive Growth',
      subtitle: 'Section 8 non-profit organization established in Raniganj, Araria, Bihar.',
      bannerNotice: 'Registered with Ministry of Corporate Affairs (CIN: U88900BR2026NPL086114).',
      bannerActive: true,
      status: 'Published',
    },
    {
      id: 'membership',
      name: 'Membership Page',
      path: '/membership/',
      headline: 'Join Our Mission as a Foundation Member or Volunteer',
      subtitle: 'Connect with community changemakers across Bihar and contribute your skills.',
      bannerNotice: 'New membership applications are open for 2026.',
      bannerActive: true,
      status: 'Published',
    },
    {
      id: 'donation',
      name: 'Donation Page',
      path: '/donate/',
      headline: 'Support Grassroots Community Programs',
      subtitle: 'Every contribution funds digital classrooms, women skill training, and health camps.',
      bannerNotice: 'Tax exemption available under Section 80G & 12A.',
      bannerActive: true,
      status: 'Published',
    },
  ]);

  const [selectedPage, setSelectedPage] = useState(pages[0]);
  const [pageFormData, setPageFormData] = useState({ ...pages[0] });

  // Social Links state
  const [socials, setSocials] = useState([
    { platform: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VbDI7zjElagzRp0vTp0t', active: true },
    { platform: 'YouTube', url: 'https://www.youtube.com/@gsddfoundation', active: true },
    { platform: 'Telegram', url: 'https://web.telegram.org/gsddfoundation/', active: true },
    { platform: 'Facebook', url: 'https://www.facebook.com/gsddfoundation', active: true },
    { platform: 'Instagram', url: 'https://www.instagram.com/gsddfoundation', active: true },
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/gsddfoundation/', active: true },
    { platform: 'X (Twitter)', url: 'https://x.com/gsddfoundation', active: true },
  ]);

  // Enquiries state
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Donations state
  const [donations] = useState(initialDonations);
  const [donationSearch, setDonationSearch] = useState('');

  // Page Content Handlers
  const handleSelectPage = (page) => {
    setSelectedPage(page);
    setPageFormData({ ...page });
  };

  const handleSavePageContent = (e) => {
    e.preventDefault();
    setPages(pages.map((p) => (p.id === pageFormData.id ? { ...pageFormData } : p)));
    setSelectedPage({ ...pageFormData });
    notify?.(`Content for "${pageFormData.name}" updated successfully!`);
  };

  const handleSocialChange = (index, newUrl) => {
    const updated = [...socials];
    updated[index].url = newUrl;
    setSocials(updated);
  };

  const handleSocialToggle = (index) => {
    const updated = [...socials];
    updated[index].active = !updated[index].active;
    setSocials(updated);
    notify?.(`${updated[index].platform} link is now ${updated[index].active ? 'Active' : 'Disabled'}.`);
  };

  const handleSaveSocials = () => {
    notify?.('Social media links saved successfully!');
  };

  // Enquiry Handlers
  const handleOpenEnquiry = (enq) => {
    setSelectedEnquiry(enq);
    setReplyText('');
    if (enq.status === 'New') {
      setEnquiries(enquiries.map((e) => (e.id === enq.id ? { ...e, status: 'Read' } : e)));
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setEnquiries(enquiries.map((enq) => (enq.id === selectedEnquiry.id ? { ...enq, status: 'Replied' } : enq)));
    notify?.(`Reply sent to ${selectedEnquiry.name} (${selectedEnquiry.email})!`);
    setSelectedEnquiry(null);
  };

  const handleDeleteEnquiry = (id) => {
    if (window.confirm('Delete this website enquiry?')) {
      setEnquiries(enquiries.filter((e) => e.id !== id));
      notify?.('Enquiry deleted.');
    }
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Website Management</h2>
          <p>Manage public portal content, page headlines, social media integrations, incoming visitor enquiries, and media gallery.</p>
        </div>
        <div className="adm-sec-actions">
          <a className="adm-btn adm-btn-outline" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Open Public Site
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'pages' ? ' active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          <LayoutTemplate size={14} /> Pages &amp; Content
        </button>
        <button
          className={`adm-tab${activeTab === 'social' ? ' active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <Share2 size={14} /> Social Media Links
        </button>
        <button
          className={`adm-tab${activeTab === 'enquiries' ? ' active' : ''}`}
          onClick={() => setActiveTab('enquiries')}
        >
          <Mail size={14} /> Website Enquiries
          <span className="adm-tab-badge">{enquiries.filter((e) => e.status === 'New').length || enquiries.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'donations' ? ' active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          <DollarSign size={14} /> Online Donation History
        </button>
        <button
          className={`adm-tab${activeTab === 'gallery' ? ' active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <ImageIcon size={14} /> Media Gallery Manager
        </button>
      </div>

      {/* Tab 1: Pages & Content */}
      {activeTab === 'pages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '20px' }}>
          {/* Page Picker Sidebar */}
          <div className="adm-card" style={{ padding: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '6px 10px', display: 'block' }}>
              Select Page
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPage(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedPage.id === p.id ? '#2563eb' : 'transparent',
                    background: selectedPage.id === p.id ? '#eff6ff' : 'transparent',
                    color: selectedPage.id === p.id ? '#1e40af' : '#334155',
                    fontWeight: selectedPage.id === p.id ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <span>{p.name}</span>
                  <span className="adm-badge green" style={{ fontSize: '9px' }}>{p.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Editor Form */}
          <div className="adm-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Edit {pageFormData.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Route: {pageFormData.path}</span>
              </div>
              <a href={pageFormData.path} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm adm-btn-outline">
                View on Site <ArrowUpRight size={13} />
              </a>
            </div>

            <form onSubmit={handleSavePageContent}>
              <div className="adm-form-grid">
                <div className="adm-form-group adm-form-col-full">
                  <label>Hero Headline Banner *</label>
                  <input
                    type="text"
                    required
                    className="adm-form-control"
                    value={pageFormData.headline}
                    onChange={(e) => setPageFormData({ ...pageFormData, headline: e.target.value })}
                  />
                </div>
                <div className="adm-form-group adm-form-col-full">
                  <label>Subtitle / Intro Paragraph</label>
                  <textarea
                    rows={2}
                    className="adm-form-control"
                    value={pageFormData.subtitle}
                    onChange={(e) => setPageFormData({ ...pageFormData, subtitle: e.target.value })}
                  />
                </div>
                <div className="adm-form-group adm-form-col-full">
                  <label>Important Announcement / Alert Bar</label>
                  <input
                    type="text"
                    className="adm-form-control"
                    value={pageFormData.bannerNotice}
                    onChange={(e) => setPageFormData({ ...pageFormData, bannerNotice: e.target.value })}
                  />
                </div>
                <div className="adm-form-group">
                  <label>Show Announcement Alert</label>
                  <select
                    className="adm-form-control"
                    value={pageFormData.bannerActive ? 'yes' : 'no'}
                    onChange={(e) => setPageFormData({ ...pageFormData, bannerActive: e.target.value === 'yes' })}
                  >
                    <option value="yes">Active (Visible)</option>
                    <option value="no">Disabled (Hidden)</option>
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Publish Status</label>
                  <select
                    className="adm-form-control"
                    value={pageFormData.status}
                    onChange={(e) => setPageFormData({ ...pageFormData, status: e.target.value })}
                  >
                    <option value="Published">Published (Live)</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Save size={14} /> Save Page Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Social Media Integration */}
      {activeTab === 'social' && (
        <div className="adm-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Social Media Channels &amp; Links
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              These official links appear in the website header, footer, contact page, and floating social widgets.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {socials.map((s, index) => (
              <div
                key={s.platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div style={{ width: '150px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                  {s.platform}
                </div>
                <input
                  type="url"
                  className="adm-form-control"
                  style={{ flex: 1 }}
                  value={s.url}
                  onChange={(e) => handleSocialChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className={`adm-badge ${s.active ? 'green' : 'gray'}`}
                  style={{ cursor: 'pointer', border: 0, padding: '6px 12px' }}
                  onClick={() => handleSocialToggle(index)}
                >
                  {s.active ? 'Active' : 'Disabled'}
                </button>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="adm-btn-icon"
                  title="Open Link"
                >
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="adm-btn adm-btn-primary" onClick={handleSaveSocials}>
              <Save size={14} /> Save All Social Links
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Website Enquiries */}
      {activeTab === 'enquiries' && (
        <>
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search inquiries by visitor name, email, subject..."
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Subject</th>
                    <th>Contact Info</th>
                    <th>Received Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries
                    .filter((e) => {
                      if (!enquirySearch.trim()) return true;
                      const q = enquirySearch.toLowerCase();
                      return (
                        e.name.toLowerCase().includes(q) ||
                        e.email.toLowerCase().includes(q) ||
                        e.subject.toLowerCase().includes(q) ||
                        e.message.toLowerCase().includes(q)
                      );
                    })
                    .map((enq) => (
                      <tr key={enq.id}>
                        <td>
                          <strong>{enq.name}</strong>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{enq.subject}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {enq.message}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '11px', color: '#475569' }}>
                            <div>{enq.email}</div>
                            <div>{enq.phone}</div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{enq.date}</span>
                        </td>
                        <td>
                          <span
                            className={`adm-badge ${
                              enq.status === 'New' ? 'amber' : enq.status === 'Replied' ? 'green' : 'blue'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              className="adm-btn adm-btn-sm adm-btn-outline"
                              onClick={() => handleOpenEnquiry(enq)}
                            >
                              <Eye size={13} /> View &amp; Reply
                            </button>
                            <button
                              className="adm-btn-icon adm-btn-danger"
                              onClick={() => handleDeleteEnquiry(enq.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enquiry View & Reply Modal */}
          {selectedEnquiry && (
            <div className="adm-modal-overlay" onClick={() => setSelectedEnquiry(null)}>
              <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
                <div className="adm-modal-header">
                  <h3>Website Visitor Enquiry</h3>
                  <button className="adm-btn-icon" onClick={() => setSelectedEnquiry(null)}>
                    &times;
                  </button>
                </div>
                <div className="adm-modal-body">
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>{selectedEnquiry.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedEnquiry.date}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                      Email: <strong>{selectedEnquiry.email}</strong> &bull; Phone: <strong>{selectedEnquiry.phone}</strong>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e40af', marginBottom: '6px' }}>
                      Subject: {selectedEnquiry.subject}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                      {selectedEnquiry.message}
                    </p>
                  </div>

                  <form onSubmit={handleSendReply}>
                    <div className="adm-form-group">
                      <label>Send Official Reply via Email to {selectedEnquiry.email}</label>
                      <textarea
                        required
                        rows={4}
                        className="adm-form-control"
                        placeholder="Type your response here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                      <button type="button" className="adm-btn adm-btn-outline" onClick={() => setSelectedEnquiry(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="adm-btn adm-btn-primary">
                        <Send size={14} /> Send Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 4: Donation History */}
      {activeTab === 'donations' && (
        <>
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search donations by receipt, donor name, PAN..."
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Donor Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Payment Mode</th>
                    <th>Program</th>
                    <th>80G Receipt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations
                    .filter((d) => {
                      if (!donationSearch.trim()) return true;
                      const q = donationSearch.toLowerCase();
                      return (
                        d.receiptNo.toLowerCase().includes(q) ||
                        d.donorName.toLowerCase().includes(q) ||
                        (d.pan && d.pan.toLowerCase().includes(q))
                      );
                    })
                    .map((d) => (
                      <tr key={d.id}>
                        <td>
                          <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{d.receiptNo}</strong>
                        </td>
                        <td>
                          <strong>{d.donorName}</strong>
                          {d.pan && <div style={{ fontSize: '10px', color: '#64748b' }}>PAN: {d.pan}</div>}
                        </td>
                        <td>
                          <strong style={{ color: '#059669', fontSize: '14px' }}>₹{d.amount.toLocaleString('en-IN')}</strong>
                        </td>
                        <td>{d.date}</td>
                        <td><span className="adm-badge blue">{d.mode}</span></td>
                        <td>{d.program}</td>
                        <td><span className="adm-badge green">{d.tax80g}</span></td>
                        <td><span className="adm-badge green">{d.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab 5: Media Gallery Manager (Existing live system) */}
      {activeTab === 'gallery' && (
        <div style={{ marginTop: '4px' }}>
          <GalleryManager />
        </div>
      )}
    </div>
  );
}
