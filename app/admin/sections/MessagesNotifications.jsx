'use client';

import { useState } from 'react';
import {
  MessageSquare, Bell, Search, Send, Plus, Eye, Trash2, CheckCircle2,
  Mail, Megaphone, AlertCircle, X, Users, User, Smartphone, History,
  ExternalLink, Filter, Check
} from 'lucide-react';
import { initialEnquiries, initialAnnouncements, initialSentMessages, initialMembers } from './data/mock-admin-data';

export default function MessagesNotifications({ notify }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [sentMessages, setSentMessages] = useState(initialSentMessages);
  const [members] = useState(initialMembers);
  const [activeTab, setActiveTab] = useState('compose'); // 'compose', 'enquiries', 'history'
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'reply', 'viewHistory'
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Compose State (Single / Bulk Message)
  const [composeType, setComposeType] = useState('single'); // 'single', 'bulk'
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [channel, setChannel] = useState('both'); // 'whatsapp', 'email', 'both'
  const [bulkGroup, setBulkGroup] = useState('All Registered Members');
  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const unreadCount = enquiries.filter((e) => e.status === 'New').length;

  const handleMemberSelect = (e) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    const found = members.find((m) => m.id === memId);
    if (found) {
      setFormData({
        ...formData,
        recipientName: found.name,
        phone: found.phone,
        email: found.email,
      });
    }
  };

  const handleApplyTemplate = (type) => {
    if (type === 'meeting') {
      setFormData({
        ...formData,
        subject: 'Official Foundation Meeting Notice - GSDD Foundation',
        message: 'Dear Member, you are cordially invited to attend the upcoming Executive Board & Community Progress review meeting at GSDD Foundation Raniganj Head Office. Kindly confirm your attendance.',
      });
    } else if (type === 'fee') {
      setFormData({
        ...formData,
        subject: 'Annual Membership Renewal Reminder - GSDD Foundation',
        message: 'Dear Member, this is a gentle reminder regarding your annual foundation membership renewal fee. You may pay online via UPI or at the head office to renew your active membership card.',
      });
    } else if (type === 'volunteer') {
      setFormData({
        ...formData,
        subject: 'Call for Volunteers: Free Health & Digital Literacy Drive',
        message: 'Dear Team, we are organizing a free community service and digital awareness camp this week. Volunteers are requested to assemble at Raniganj center at 09:00 AM.',
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      notify?.('Please provide subject and message content.');
      return;
    }

    const newRecord = {
      id: `msg-sent-${Date.now()}`,
      title: formData.subject,
      recipientType: composeType === 'single' ? `Single Member (${formData.recipientName || 'Member'})` : `Bulk (${bulkGroup})`,
      channel: channel === 'both' ? 'WhatsApp & Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Email',
      targetCount: composeType === 'single' ? 1 : bulkGroup === 'All Registered Members' ? members.length : 18,
      date: 'Just now',
      content: formData.message,
      status: 'Delivered',
    };

    setSentMessages([newRecord, ...sentMessages]);

    // If WhatsApp channel is chosen and single recipient, provide direct wa.me link
    if ((channel === 'whatsapp' || channel === 'both') && composeType === 'single' && formData.phone) {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(`*${formData.subject}*\n\n${formData.message}\n\n- GSDD Foundation Operations`);
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
      }
    }

    notify?.(`Message sent successfully via ${newRecord.channel}!`);
    setFormData({
      recipientName: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
    });
    setSelectedMemberId('');
  };

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

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Communication Management</h2>
          <p>
            Send single and bulk messages to foundation members via Email &amp; WhatsApp, manage public website enquiries, and inspect message history.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'compose' ? ' active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <Send size={14} /> Send Message to Members
        </button>
        <button
          className={`adm-tab${activeTab === 'enquiries' ? ' active' : ''}`}
          onClick={() => setActiveTab('enquiries')}
        >
          <Mail size={14} /> Manage Enquiries <span className="adm-tab-badge">{unreadCount || enquiries.length}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'history' ? ' active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={14} /> Notification History <span className="adm-tab-badge">{sentMessages.length}</span>
        </button>
      </div>

      {/* Tab 1: Send Single / Bulk Message */}
      {activeTab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px' }}>
          <div className="adm-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${composeType === 'single' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setComposeType('single')}
              >
                <User size={13} /> Send to Single Member
              </button>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${composeType === 'bulk' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setComposeType('bulk')}
              >
                <Users size={13} /> Send Bulk Broadcast Message
              </button>
            </div>

            <form onSubmit={handleSendMessage}>
              <div className="adm-form-grid">
                {composeType === 'single' ? (
                  <>
                    <div className="adm-form-group adm-form-col-full">
                      <label>Select Registered Member (or enter custom details below)</label>
                      <select
                        className="adm-form-control"
                        value={selectedMemberId}
                        onChange={handleMemberSelect}
                      >
                        <option value="">-- Choose Member from Directory --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) - {m.designation} &bull; {m.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-form-group">
                      <label>Recipient Full Name *</label>
                      <input
                        type="text"
                        required
                        className="adm-form-control"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        placeholder="e.g. Dr. Ramesh Kumar Sharma"
                      />
                    </div>
                    <div className="adm-form-group">
                      <label>WhatsApp / Phone Number</label>
                      <input
                        type="text"
                        className="adm-form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98350 XXXXX"
                      />
                    </div>
                    <div className="adm-form-group adm-form-col-full">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="adm-form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="member@example.com"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="adm-form-group adm-form-col-full">
                      <label>Select Target Member Group *</label>
                      <select
                        className="adm-form-control"
                        value={bulkGroup}
                        onChange={(e) => setBulkGroup(e.target.value)}
                      >
                        <option value="All Registered Members">All Registered Members ({members.length} members)</option>
                        <option value="Core Team & Executive Leaders">Core Team &amp; Executive Leaders (18 members)</option>
                        <option value="Active Volunteers">Active Volunteers &amp; Community Ambassadors (54 members)</option>
                        <option value="Patrons & Life Members">Patrons &amp; Life Members (12 members)</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="adm-form-group adm-form-col-full">
                  <label>Delivery Channels *</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="channel"
                        value="both"
                        checked={channel === 'both'}
                        onChange={() => setChannel('both')}
                      />
                      WhatsApp &amp; Email
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="channel"
                        value="whatsapp"
                        checked={channel === 'whatsapp'}
                        onChange={() => setChannel('whatsapp')}
                      />
                      WhatsApp Only
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="channel"
                        value="email"
                        checked={channel === 'email'}
                        onChange={() => setChannel('email')}
                      />
                      Email Only
                    </label>
                  </div>
                </div>

                <div className="adm-form-group adm-form-col-full">
                  <label>Message Subject / Title *</label>
                  <input
                    type="text"
                    required
                    className="adm-form-control"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Official Meeting Notice / Membership Update"
                  />
                </div>

                <div className="adm-form-group adm-form-col-full">
                  <label>Message Content *</label>
                  <textarea
                    required
                    rows={5}
                    className="adm-form-control"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Type official communication message here..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="adm-btn adm-btn-primary">
                  <Send size={14} /> Send Message
                </button>
              </div>
            </form>
          </div>

          {/* Quick Templates Sidebar */}
          <div className="adm-card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Quick Templates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => handleApplyTemplate('meeting')}
              >
                Board Meeting Notice
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => handleApplyTemplate('fee')}
              >
                Annual Fee Renewal
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => handleApplyTemplate('volunteer')}
              >
                Volunteer Camp Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Subject</th>
                  <th>Contact Info</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.name}</strong>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{e.subject}</span>
                      <div style={{ fontSize: '11px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {e.message}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        <div>{e.phone}</div>
                        <div>{e.email}</div>
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
      )}

      {/* Tab 3: Notification History */}
      {activeTab === 'history' && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Title / Subject</th>
                  <th>Target Audience</th>
                  <th>Channel</th>
                  <th>Recipients</th>
                  <th>Date Sent</th>
                  <th>Delivery Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sentMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <strong>{msg.title}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>{msg.recipientType}</span>
                    </td>
                    <td>
                      <span className="adm-badge blue">{msg.channel}</span>
                    </td>
                    <td>
                      <strong>{msg.targetCount}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{msg.date}</span>
                    </td>
                    <td>
                      <span className="adm-badge green">
                        <Check size={12} /> {msg.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-outline"
                        onClick={() => {
                          setSelectedHistoryItem(msg);
                          setModalMode('viewHistory');
                        }}
                      >
                        <Eye size={13} /> View Content
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {modalMode === 'reply' && selectedEnquiry && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Enquiry from {selectedEnquiry.name}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                <strong>Subject: {selectedEnquiry.subject}</strong>
                <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 10px' }}>
                  From {selectedEnquiry.name} ({selectedEnquiry.email} &bull; {selectedEnquiry.phone}) on {selectedEnquiry.date}
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                  {selectedEnquiry.message}
                </p>
              </div>

              <form onSubmit={handleSendReply}>
                <div className="adm-form-group">
                  <label>Official Reply via Email</label>
                  <textarea
                    required
                    rows={4}
                    className="adm-form-control"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official response..."
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary">
                    <Send size={14} /> Send Official Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Sent Message Modal */}
      {modalMode === 'viewHistory' && selectedHistoryItem && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Sent Notification Details</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>{selectedHistoryItem.title}</strong>
              <div style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 14px' }}>
                Channel: {selectedHistoryItem.channel} &bull; Target: {selectedHistoryItem.recipientType} &bull; {selectedHistoryItem.date}
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                {selectedHistoryItem.content}
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-primary" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
