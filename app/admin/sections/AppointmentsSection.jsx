'use client';

import { useState } from 'react';
import {
  CalendarCheck, Plus, Search, Check, X, Clock, MapPin, Building,
  CheckCircle2, AlertCircle, Phone
} from 'lucide-react';
import { initialAppointments } from './data/mock-admin-data';

export default function AppointmentsSection({ notify }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    visitorName: '',
    organization: '',
    phone: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: 'GSDD Raniganj Head Office',
  });

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.visitorName.toLowerCase().includes(q) ||
      a.organization.toLowerCase().includes(q) ||
      a.purpose.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q)
    );
  });

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!formData.visitorName.trim() || !formData.purpose.trim()) {
      notify?.('Please fill out visitor name and meeting purpose.');
      return;
    }

    const newApt = {
      ...formData,
      id: `apt-${Date.now()}`,
      status: 'Confirmed',
    };

    setAppointments([newApt, ...appointments]);
    notify?.(`Appointment scheduled with ${newApt.visitorName} for ${newApt.date} at ${newApt.time}!`);
    setModalOpen(false);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    notify?.(`Appointment status updated to ${newStatus}.`);
  };

  return (
    <div className="adm-sec">
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Appointments &amp; Meeting Schedule</h2>
          <p>Schedule and review dignitary visits, stakeholder meetings, block officer appointments, and CSR consultations.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setModalOpen(true)}>
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
            placeholder="Search visitor, organization, purpose..."
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
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Visitor &amp; Entity</th>
                <th>Meeting Purpose</th>
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
                      {a.status === 'Pending' && (
                        <button
                          className="adm-btn adm-btn-sm adm-btn-primary"
                          onClick={() => handleUpdateStatus(a.id, 'Confirmed')}
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === 'Confirmed' && (
                        <button
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          onClick={() => handleUpdateStatus(a.id, 'Completed')}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {modalOpen && (
        <div className="adm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Schedule New Foundation Appointment</h3>
              <button className="adm-btn-icon" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Visitor / Delegate Name *</label>
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
                    <label>Organization / Department</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="e.g. HDFC CSR / NYKS / Block Council"
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
                    <label>Date *</label>
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
                      placeholder="e.g. 11:30 AM / 03:00 PM"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Location / Venue</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Purpose of Discussion *</label>
                    <textarea
                      required
                      rows={3}
                      className="adm-form-control"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Describe meeting agenda, points for discussion..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Confirm &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
