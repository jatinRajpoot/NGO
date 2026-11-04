'use client';

import { useState } from 'react';
import {
  MessageSquare, Bell, Search, Send, Plus, Eye, Trash2, CheckCircle2,
  Mail, Megaphone, AlertCircle, X
} from 'lucide-react';
import { initialEnquiries, initialAnnouncements } from './data/mock-admin-data';

export default function MessagesNotifications({ notify }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'announcements'
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'reply', 'newAnnouncement'
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    target: 'All Website Visitors & Youth',
    priority: 'Normal',
    content: '',
  });

  const unreadCount = enquiries.filter((e) => e.status === 'New').length;

  const filteredEnquiries = enquiries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q)
    );
  });

  const handleOpenReply = (enq) => {
    setSelectedEnquiry(enq);
    setReplyText('');
    setModalMode('reply');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEnquiry) return;
    setEnquiries(
      enquiries.map((enq) => (enq.id === selectedEnquiry.id ? { ...enq, status: 'Replied' } : enq))
    );
    notify?.(`Official response emailed to ${selectedEnquiry.name}!`);
    setModalMode(null);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      notify?.('Please fill out announcement title and message content.');
      return;
    }

    const newAnn = {
      ...announcementForm,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    setAnnouncements([newAnn, ...announcements]);
    notify?.(`Notification "${newAnn.title}" broadcasted to ${newAnn.target}!`);
    setModalMode(null);
    setAnnouncementForm({
      title: '',
      target: 'All Website Visitors & Youth',
      priority: 'Normal',
      content: '',
    });
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Messages &amp; Notifications</h2>
          <p>Read incoming visitor inquiries, reply to contact requests, and broadcast foundation notices.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setModalMode('newAnnouncement')}>
            <Megaphone size={15} /> Post New Announcement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'inbox' ? ' active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <Mail size={14} /> Visitor Inbox <span className="adm-tab-badge">{unreadCount || enquiries.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'announcements' ? ' active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Megaphone size={14} /> Broadcast Announcements <span className="adm-tab-badge">{announcements.length}</span>
        </button>
      </div>

      {activeTab === 'inbox' ? (
        <>
          <div className="adm-control-bar">
            <div className="adm-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search visitor messages, sender name, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Sender Name</th>
                    <th>Subject &amp; Snippet</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.name}</strong>
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.subject}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {e.message}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          <div>{e.email}</div>
                          <div>{e.phone}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{e.date}</span>
                      </td>
                      <td>
                        <span className={`adm-badge ${e.status === 'New' ? 'amber' : e.status === 'Replied' ? 'green' : 'blue'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          onClick={() => handleOpenReply(e)}
                        >
                          <Eye size={13} /> View &amp; Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Announcements tab */
        <div style={{ display: 'grid', gap: '16px' }}>
          {announcements.map((a) => (
            <div className="adm-card" key={a.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span className={`adm-badge ${a.priority === 'High' ? 'red' : 'blue'}`} style={{ marginBottom: '6px' }}>
                    {a.priority} Priority
                  </span>
                  <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {a.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Target Audience: <strong>{a.target}</strong> &bull; Posted on {a.date}
                  </span>
                </div>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {modalMode === 'reply' && selectedEnquiry && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Message from {selectedEnquiry.name}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                  {selectedEnquiry.subject}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  From: {selectedEnquiry.name} ({selectedEnquiry.email} &bull; {selectedEnquiry.phone}) on {selectedEnquiry.date}
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                  {selectedEnquiry.message}
                </p>
              </div>

              <form onSubmit={handleSendReply}>
                <div className="adm-form-group">
                  <label>Official Foundation Response</label>
                  <textarea
                    required
                    rows={4}
                    className="adm-form-control"
                    placeholder="Type official response message to be sent to applicant..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary">
                    <Send size={14} /> Send Official Response
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {modalMode === 'newAnnouncement' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Create Broadcast Announcement</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group adm-form-col-full">
                    <label>Announcement Headline *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="e.g. Free Digital Literacy Batch 2026 Enrollment Open"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Target Audience</label>
                    <select
                      className="adm-form-control"
                      value={announcementForm.target}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, target: e.target.value })}
                    >
                      <option value="All Website Visitors & Youth">All Website Visitors &amp; Youth</option>
                      <option value="Core & Executive Members">Core &amp; Executive Members</option>
                      <option value="Volunteers & Field Team">Volunteers &amp; Field Team</option>
                      <option value="Donors & CSR Partners">Donors &amp; CSR Partners</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Priority Level</label>
                    <select
                      className="adm-form-control"
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High (Banner Alert)</option>
                    </select>
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Message Content *</label>
                    <textarea
                      required
                      rows={4}
                      className="adm-form-control"
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      placeholder="Provide full announcement details, venue, dates, or guidelines..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Megaphone size={14} /> Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
