'use client';

import { useState } from 'react';
import {
  CalendarCheck, Plus, Search, Check, X, Clock, MapPin, Building,
  CheckCircle2, AlertCircle, Phone, Printer, Download, QrCode,
  FileText, Mail, Edit2, Trash2
} from 'lucide-react';
import { initialAppointments } from './data/mock-admin-data';
import QRCodeVisual from './utils/QRCodeVisual';

export default function AppointmentsSection({ notify }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'letter'
  const [selectedApt, setSelectedApt] = useState(null);

  const [formData, setFormData] = useState({
    visitorName: '',
    designation: '',
    organization: '',
    phone: '',
    email: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: 'GSDD Raniganj Head Office, NH 327E, Araria, Bihar',
    hostSignatory: 'Jatin Rajpoot (President)',
  });

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.visitorName.toLowerCase().includes(q) ||
      (a.aptNo && a.aptNo.toLowerCase().includes(q)) ||
      (a.organization && a.organization.toLowerCase().includes(q)) ||
      a.purpose.toLowerCase().includes(q) ||
      (a.phone && a.phone.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setFormData({
      visitorName: '',
      designation: '',
      organization: '',
      phone: '',
      email: '',
      purpose: '',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      location: 'GSDD Raniganj Head Office, NH 327E, Araria, Bihar',
      hostSignatory: 'Jatin Rajpoot (President)',
    });
    setModalMode('create');
  };

  const handleOpenEdit = (apt) => {
    setSelectedApt(apt);
    setFormData({ ...apt });
    setModalMode('edit');
  };

  const handleOpenLetter = (apt) => {
    setSelectedApt(apt);
    setModalMode('letter');
  };

  const handleSaveAppointment = (e) => {
    e.preventDefault();
    if (!formData.visitorName.trim() || !formData.purpose.trim()) {
      notify?.('Please fill out visitor name and purpose.');
      return;
    }

    if (modalMode === 'create') {
      const nextNum = appointments.length + 1;
      const newAptNo = `GSDD-APT-2026-${String(nextNum).padStart(3, '0')}`;
      const newApt = {
        ...formData,
        id: `apt-${Date.now()}`,
        aptNo: newAptNo,
        status: 'Confirmed',
      };
      setAppointments([newApt, ...appointments]);
      notify?.(`Appointment ${newAptNo} booked with QR verification letter for ${newApt.visitorName}!`);
    } else if (modalMode === 'edit' && selectedApt) {
      setAppointments(
        appointments.map((a) => (a.id === selectedApt.id ? { ...a, ...formData } : a))
      );
      notify?.(`Appointment records for ${formData.visitorName} updated.`);
    }
    setModalMode(null);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    notify?.(`Appointment status changed to ${newStatus}.`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this appointment record?')) {
      setAppointments(appointments.filter((a) => a.id !== id));
      notify?.('Appointment deleted.');
    }
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Appointment Management</h2>
          <p>
            View visitor appointments, manage meeting records, generate official appointment letters with verification QR codes, and download PDFs.
          </p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={handleOpenCreate}>
            <Plus size={15} /> Book New Appointment
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><CalendarCheck size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{appointments.length}</span>
            <span className="adm-stat-label">Total Appointments</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><CheckCircle2 size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {appointments.filter((a) => a.status === 'Confirmed').length}
            </span>
            <span className="adm-stat-label">Upcoming Confirmed</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><Clock size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {appointments.filter((a) => a.status === 'Pending').length}
            </span>
            <span className="adm-stat-label">Pending Requests</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><Building size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">
              {appointments.filter((a) => a.status === 'Completed').length}
            </span>
            <span className="adm-stat-label">Completed Sessions</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="adm-control-bar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="adm-search-input"
            placeholder="Search visitor name, organization, appointment reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="adm-filters">
          <select
            className="adm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Records Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Appointment Ref &amp; QR</th>
                <th>Visitor &amp; Entity</th>
                <th>Meeting Agenda</th>
                <th>Date &amp; Time</th>
                <th>Venue / Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <QRCodeVisual
                        value={`https://gsddfoundation.org/verify?type=appointment&id=${a.aptNo || a.id}`}
                        size={32}
                        label=""
                      />
                      <div>
                        <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>
                          {a.aptNo || `GSDD-APT-2026-00${a.id.slice(-1)}`}
                        </strong>
                        <div style={{ fontSize: '10px', color: '#059669' }}>QR Generated</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{a.visitorName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {a.organization} &bull; {a.phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <span style={{ fontSize: '12px', color: '#334155' }}>{a.purpose}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{a.date}</strong>
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>{a.time}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{a.location}</span>
                  </td>
                  <td>
                    <span
                      className={`adm-badge ${
                        a.status === 'Confirmed' ? 'green' : a.status === 'Pending' ? 'amber' : 'gray'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-outline"
                        onClick={() => handleOpenLetter(a)}
                        title="Generate Official Appointment Letter"
                      >
                        <FileText size={13} /> Letter PDF
                      </button>
                      <button
                        className="adm-btn-icon"
                        onClick={() => handleOpenEdit(a)}
                        title="Edit Appointment"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="adm-btn-icon adm-btn-danger"
                        onClick={() => handleDelete(a.id)}
                        title="Delete Record"
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

      {/* Create / Edit Appointment Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{modalMode === 'create' ? 'Book & Schedule Appointment' : 'Edit Appointment Record'}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAppointment}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Visitor / Dignitary Full Name *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.visitorName}
                      onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                      placeholder="e.g. Mr. Arvind Saxena"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Designation / Title</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. CSR Director / Block Officer"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Organization / Department</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="e.g. HDFC Parivartan / Araria District Council"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98110 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Date of Meeting *</label>
                    <input
                      type="date"
                      required
                      className="adm-form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Time Slot</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="e.g. 11:30 AM"
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Venue / Location</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Meeting Purpose / Agenda *</label>
                    <textarea
                      required
                      rows={3}
                      className="adm-form-control"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Describe discussion topics, grant proposals, project visits..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {modalMode === 'create' ? 'Schedule Appointment' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Appointment Confirmation Letter Modal (with Letterhead & QR Code) */}
      {modalMode === 'letter' && selectedApt && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Appointment Letter: {selectedApt.aptNo || 'GSDD-APT-2026-001'}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              {/* Formal Letterhead Container */}
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '36px 40px',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {/* Letterhead Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.04em' }}>
                      GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'sans-serif', marginTop: '4px' }}>
                      Section 8 Non-Profit &bull; CIN: U88900BR2026NPL086114 &bull; NGO Darpan: BR/2026/1140209
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'sans-serif' }}>
                      Head Office: Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, NH 327E, Araria, Bihar - 854334
                    </div>
                  </div>

                  {/* QR Code on letterhead */}
                  <QRCodeVisual
                    value={`https://gsddfoundation.org/verify?type=appointment&id=${selectedApt.aptNo || selectedApt.id}`}
                    size={70}
                    label="Scan to Verify"
                  />
                </div>

                {/* Letter Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '20px', fontFamily: 'sans-serif' }}>
                  <div>
                    Ref No: <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{selectedApt.aptNo || 'GSDD-APT-2026-001'}</strong>
                  </div>
                  <div>
                    Date: <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </div>
                </div>

                {/* Addressee */}
                <div style={{ fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
                  <div>To,</div>
                  <div><strong>{selectedApt.visitorName}</strong></div>
                  {selectedApt.designation && <div>{selectedApt.designation}</div>}
                  {selectedApt.organization && <div>{selectedApt.organization}</div>}
                </div>

                {/* Subject */}
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '16px' }}>
                  Subject: Official Appointment Confirmation &amp; Consultation Schedule
                </div>

                {/* Letter Body */}
                <div style={{ fontSize: '13.5px', lineHeight: 1.8, color: '#1e293b', marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 12px' }}>
                    Dear {selectedApt.visitorName},
                  </p>
                  <p style={{ margin: '0 0 12px' }}>
                    We are pleased to confirm your scheduled appointment with the leadership and executive team of Global Skills &amp; Digital Development Foundation.
                  </p>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', margin: '14px 0', fontFamily: 'sans-serif', fontSize: '13px' }}>
                    <div style={{ marginBottom: '6px' }}><strong>Date of Meeting:</strong> {selectedApt.date}</div>
                    <div style={{ marginBottom: '6px' }}><strong>Scheduled Time:</strong> {selectedApt.time}</div>
                    <div style={{ marginBottom: '6px' }}><strong>Venue / Location:</strong> {selectedApt.location}</div>
                    <div><strong>Agenda / Objective:</strong> {selectedApt.purpose}</div>
                  </div>
                  <p style={{ margin: '0' }}>
                    Please present this official appointment letter along with the digital verification QR code upon arrival at our foundation secretariat. We look forward to a fruitful discussion.
                  </p>
                </div>

                {/* Signatory */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '36px', textAlign: 'center' }}>
                  <div>
                    <div style={{ width: '160px', borderBottom: '1px solid #000', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{selectedApt.hostSignatory || 'Jatin Rajpoot (President)'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'sans-serif' }}>Authorized Signatory, GSDD Foundation</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={14} /> Download / Print Appointment PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
