'use client';

import { useState } from 'react';
import {
  Users, UserPlus, Search, ShieldAlert, CheckCircle2, XCircle,
  Eye, Edit2, Trash2, Ban, Check, DollarSign, Download, Filter,
  Phone, Mail, MapPin, Award, CreditCard, X, AlertTriangle
} from 'lucide-react';
import { initialMembers, initialDesignations } from './data/mock-admin-data';

export default function MembershipManagement({ notify }) {
  const [members, setMembers] = useState(initialMembers);
  const [designations, setDesignations] = useState(initialDesignations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'fees', 'designations'

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'view', 'designations', 'feePayment'
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    fatherSpouse: '',
    phone: '',
    email: '',
    address: '',
    designation: 'Active Member',
    category: 'Active Member',
    feeType: 'Annual (₹1,200)',
    feeAmount: 1200,
    feeStatus: 'Paid',
    status: 'Active',
    bloodGroup: 'B+',
    notes: '',
  });
  const [newDesignation, setNewDesignation] = useState('');

  // Stats calculation
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'Active').length;
  const pendingCount = members.filter((m) => m.status === 'Pending Approval').length;
  const blockedCount = members.filter((m) => m.status === 'Blocked').length;
  const totalFees = members.reduce((sum, m) => (m.feeStatus === 'Paid' ? sum + Number(m.feeAmount || 0) : sum), 0);

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (activeTab === 'pending' && m.status !== 'Pending Approval') return false;
    if (activeTab === 'fees' && m.feeStatus === 'Paid') return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (designationFilter !== 'ALL' && m.designation !== designationFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.designation.toLowerCase().includes(q)
    );
  });

  // Actions
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      fatherSpouse: '',
      phone: '',
      email: '',
      address: '',
      designation: 'Active Member',
      category: 'Active Member',
      feeType: 'Annual (₹1,200)',
      feeAmount: 1200,
      feeStatus: 'Paid',
      status: 'Active',
      bloodGroup: 'B+',
      notes: '',
    });
    setModalMode('add');
  };

  const handleOpenEdit = (member) => {
    setSelectedMember(member);
    setFormData({ ...member });
    setModalMode('edit');
  };

  const handleOpenView = (member) => {
    setSelectedMember(member);
    setModalMode('view');
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      notify?.('Please fill out required fields (Name & Phone).');
      return;
    }

    if (modalMode === 'add') {
      const nextNum = members.length + 1;
      const newId = `GSDD-M-2026-${String(nextNum).padStart(3, '0')}`;
      const newMember = {
        ...formData,
        id: newId,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setMembers([newMember, ...members]);
      notify?.(`Member ${newMember.name} added successfully! (ID: ${newId})`);
    } else if (modalMode === 'edit' && selectedMember) {
      setMembers(members.map((m) => (m.id === selectedMember.id ? { ...m, ...formData } : m)));
      notify?.(`Member ${formData.name} updated successfully!`);
    }
    setModalMode(null);
  };

  const handleDeleteMember = (member) => {
    if (window.confirm(`Are you sure you want to remove ${member.name} (${member.id})?`)) {
      setMembers(members.filter((m) => m.id !== member.id));
      notify?.(`Member ${member.name} removed from foundation records.`);
    }
  };

  const handleToggleBlock = (member) => {
    const newStatus = member.status === 'Blocked' ? 'Active' : 'Blocked';
    setMembers(members.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m)));
    notify?.(`Member ${member.name} is now ${newStatus}.`);
  };

  const handleApprove = (member) => {
    setMembers(members.map((m) => (m.id === member.id ? { ...m, status: 'Active' } : m)));
    notify?.(`Membership approved for ${member.name}! Status is now Active.`);
  };

  const handleReject = (member) => {
    if (window.confirm(`Reject membership application for ${member.name}?`)) {
      setMembers(members.filter((m) => m.id !== member.id));
      notify?.(`Application for ${member.name} has been rejected.`);
    }
  };

  const handleFeePayment = (member) => {
    setSelectedMember(member);
    setModalMode('feePayment');
  };

  const handleConfirmFee = () => {
    if (!selectedMember) return;
    setMembers(members.map((m) => (m.id === selectedMember.id ? { ...m, feeStatus: 'Paid' } : m)));
    notify?.(`Fee payment of ₹${selectedMember.feeAmount} recorded for ${selectedMember.name}.`);
    setModalMode(null);
  };

  const handleAddDesignation = (e) => {
    e.preventDefault();
    if (!newDesignation.trim()) return;
    if (designations.includes(newDesignation.trim())) {
      notify?.('This designation already exists.');
      return;
    }
    setDesignations([...designations, newDesignation.trim()]);
    notify?.(`Designation "${newDesignation.trim()}" added successfully.`);
    setNewDesignation('');
  };

  const handleDeleteDesignation = (desig) => {
    if (designations.length <= 1) return;
    setDesignations(designations.filter((d) => d !== desig));
    notify?.(`Designation "${desig}" removed.`);
  };

  return (
    <div className="adm-sec">
      {/* Title & Actions */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Membership Management</h2>
          <p>Manage foundation members, approval workflows, official designations, and fee records.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-outline" onClick={() => setModalMode('designations')}>
            <Award size={15} /> Designations
          </button>
          <button className="adm-btn adm-btn-primary" onClick={handleOpenAdd}>
            <UserPlus size={15} /> Add New Member
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Users size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{totalCount}</span>
            <span className="adm-stat-label">Total Registered</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><CheckCircle2 size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{activeCount}</span>
            <span className="adm-stat-label">Active Members</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><ShieldAlert size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{pendingCount}</span>
            <span className="adm-stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><DollarSign size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">₹{totalFees.toLocaleString('en-IN')}</span>
            <span className="adm-stat-label">Total Fees Collected</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Members <span className="adm-tab-badge">{totalCount}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'pending' ? ' active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals <span className="adm-tab-badge">{pendingCount}</span>
        </button>
        <button
          className={`adm-tab${activeTab === 'fees' ? ' active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          Fee Due / Unpaid <span className="adm-tab-badge">{members.filter((m) => m.feeStatus !== 'Paid').length}</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="adm-control-bar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="adm-search-input"
            placeholder="Search by name, member ID, phone, designation..."
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
            <option value="Active">Active</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select
            className="adm-select"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
          >
            <option value="ALL">All Designations</option>
            {designations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Full Name</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Fee Status</th>
                <th>Status</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No membership records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: '#1e40af', fontFamily: 'monospace' }}>{m.id}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{m.name}</strong>
                        {m.fatherSpouse && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            S/W/D of: {m.fatherSpouse}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="adm-badge blue">{m.designation}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                        <span>{m.phone}</span>
                        <span style={{ color: '#64748b' }}>{m.email}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`adm-badge ${
                          m.feeStatus === 'Paid' ? 'green' : m.feeStatus === 'Due' ? 'amber' : 'red'
                        }`}
                      >
                        {m.feeStatus} ({m.feeType.split(' ')[0]})
                      </span>
                    </td>
                    <td>
                      <span
                        className={`adm-badge ${
                          m.status === 'Active' ? 'green' : m.status === 'Pending Approval' ? 'amber' : 'red'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{m.joinDate}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {m.status === 'Pending Approval' ? (
                          <>
                            <button
                              className="adm-btn adm-btn-sm adm-btn-primary"
                              onClick={() => handleApprove(m)}
                              title="Approve Member"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              className="adm-btn adm-btn-sm adm-btn-danger"
                              onClick={() => handleReject(m)}
                              title="Reject Application"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="adm-btn-icon"
                              onClick={() => handleOpenView(m)}
                              title="View Member Record & ID"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="adm-btn-icon"
                              onClick={() => handleOpenEdit(m)}
                              title="Edit Member Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            {m.feeStatus !== 'Paid' && (
                              <button
                                className="adm-btn-icon"
                                onClick={() => handleFeePayment(m)}
                                title="Record Fee Payment"
                                style={{ color: '#059669' }}
                              >
                                <CreditCard size={14} />
                              </button>
                            )}
                            <button
                              className="adm-btn-icon"
                              onClick={() => handleToggleBlock(m)}
                              title={m.status === 'Blocked' ? 'Unblock Member' : 'Block Member'}
                              style={{ color: m.status === 'Blocked' ? '#059669' : '#d97706' }}
                            >
                              <Ban size={14} />
                            </button>
                            <button
                              className="adm-btn-icon adm-btn-danger"
                              onClick={() => handleDeleteMember(m)}
                              title="Delete Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{modalMode === 'add' ? 'Add New Member' : `Edit Member: ${selectedMember?.id}`}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMember}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar Sharma"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Father / Spouse Name</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.fatherSpouse}
                      onChange={(e) => setFormData({ ...formData, fatherSpouse: e.target.value })}
                      placeholder="e.g. Late K. N. Sharma"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98350 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Designation *</label>
                    <select
                      className="adm-form-control"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    >
                      {designations.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Membership Fee Type</label>
                    <select
                      className="adm-form-control"
                      value={formData.feeType}
                      onChange={(e) => {
                        const val = e.target.value;
                        const amt = val.includes('11,000') ? 11000 : val.includes('1,200') ? 1200 : 100;
                        setFormData({ ...formData, feeType: val, feeAmount: amt });
                      }}
                    >
                      <option value="Annual (₹1,200)">Annual (₹1,200 / year)</option>
                      <option value="Life (₹11,000)">Life (₹11,000 one-time)</option>
                      <option value="Monthly (₹100)">Monthly (₹100 / month)</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Fee Status</label>
                    <select
                      className="adm-form-control"
                      value={formData.feeStatus}
                      onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Due">Due</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Membership Status</label>
                    <select
                      className="adm-form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Residential / Postal Address</label>
                    <textarea
                      className="adm-form-control"
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Village, Post, Block, District, PIN code..."
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Internal Notes & Background</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special duties, reference notes, skills..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {modalMode === 'add' ? 'Register Member' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details & ID Card Modal */}
      {modalMode === 'view' && selectedMember && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Member Record & ID Card</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              {/* ID Card Graphic */}
              <div className="adm-id-card">
                <div className="adm-id-card-head">
                  <span className="adm-id-card-brand">GSDD FOUNDATION</span>
                  <span className="adm-id-card-num">{selectedMember.id}</span>
                </div>
                <div className="adm-id-card-body">
                  <div className="adm-id-photo">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div className="adm-id-info">
                    <span className="adm-id-name">{selectedMember.name}</span>
                    <span className="adm-id-role">{selectedMember.designation}</span>
                    <span className="adm-id-detail">Phone: {selectedMember.phone}</span>
                    <span className="adm-id-detail">Join Date: {selectedMember.joinDate}</span>
                    <span className="adm-id-detail">Blood Group: {selectedMember.bloodGroup || 'B+'}</span>
                  </div>
                </div>
              </div>

              {/* Full details list */}
              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</strong>
                  <div>{selectedMember.name}</div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Parent / Spouse</strong>
                  <div>{selectedMember.fatherSpouse || '—'}</div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Designation</strong>
                  <div><span className="adm-badge blue">{selectedMember.designation}</span></div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Membership Status</strong>
                  <div>
                    <span className={`adm-badge ${selectedMember.status === 'Active' ? 'green' : 'amber'}`}>
                      {selectedMember.status}
                    </span>
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Fee Status</strong>
                  <div>{selectedMember.feeType} — <strong>{selectedMember.feeStatus}</strong></div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Address</strong>
                  <div>{selectedMember.address || '—'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Notes</strong>
                  <div style={{ color: '#475569' }}>{selectedMember.notes || 'No extra notes recorded.'}</div>
                </div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-outline"
                onClick={() => {
                  window.print();
                }}
              >
                <Download size={14} /> Print ID Card
              </button>
              <button className="adm-btn adm-btn-primary" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Designation Management Modal */}
      {modalMode === 'designations' && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Designation Management</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <form onSubmit={handleAddDesignation} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="text"
                  required
                  className="adm-form-control"
                  style={{ flex: 1 }}
                  placeholder="New designation title..."
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                />
                <button type="submit" className="adm-btn adm-btn-primary">
                  Add Designation
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {designations.map((d) => (
                  <div
                    key={d}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{d}</span>
                    <button
                      type="button"
                      className="adm-btn-icon adm-btn-danger"
                      onClick={() => handleDeleteDesignation(d)}
                      title="Remove Designation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-primary" onClick={() => setModalMode(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Fee Payment Modal */}
      {modalMode === 'feePayment' && selectedMember && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Record Membership Fee Payment</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '13px' }}>
                Confirm fee payment receipt for <strong>{selectedMember.name}</strong> ({selectedMember.id}).
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div>Membership Type: <strong>{selectedMember.feeType}</strong></div>
                <div>Amount Payable: <strong style={{ color: '#059669', fontSize: '16px' }}>₹{selectedMember.feeAmount}</strong></div>
                <div>Payment Mode: <strong>UPI / Bank Transfer / Cash</strong></div>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary" onClick={handleConfirmFee}>
                Confirm Payment & Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
