'use client';

import { useState } from 'react';
import {
  Users, UserPlus, Edit2, Trash2, Phone, Mail, Award, Check,
  X, Search, Image as ImageIcon, Briefcase, Star, ArrowUpDown
} from 'lucide-react';
import { initialTeam } from './data/mock-admin-data';

export default function TeamManagement({ notify }) {
  const [team, setTeam] = useState(initialTeam);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit'
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    post: '',
    category: 'Core Team',
    bio: '',
    photo: '',
    phone: '',
    email: '',
    order: 1,
  });

  const categories = ['Core Team', 'Executive Member', 'Advisory Board'];

  const filteredTeam = team.filter((m) => {
    if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.post.toLowerCase().includes(q) ||
      m.bio.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      post: '',
      category: 'Core Team',
      bio: '',
      photo: '',
      phone: '',
      email: '',
      order: team.length + 1,
    });
    setModalMode('add');
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData({ ...m });
    setModalMode('edit');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.post.trim()) {
      notify?.('Please provide member Name and Designation / Post.');
      return;
    }

    if (modalMode === 'add') {
      const newMember = {
        ...formData,
        id: `team-${Date.now()}`,
      };
      setTeam([...team, newMember]);
      notify?.(`Team member ${newMember.name} added to ${newMember.category}!`);
    } else if (modalMode === 'edit' && selectedMember) {
      setTeam(team.map((m) => (m.id === selectedMember.id ? { ...m, ...formData } : m)));
      notify?.(`Team member details for ${formData.name} updated!`);
    }
    setModalMode(null);
  };

  const handleDelete = (m) => {
    if (window.confirm(`Are you sure you want to delete ${m.name} from the management team?`)) {
      setTeam(team.filter((item) => item.id !== m.id));
      notify?.(`Removed ${m.name} from team directory.`);
    }
  };

  return (
    <div className="adm-sec">
      {/* Header */}
      <div className="adm-sec-header">
        <div className="adm-sec-title-wrap">
          <h2>Management Body &amp; Team Management</h2>
          <p>Manage foundation leaders, executive board members, core volunteers, bios, and public photo profiles.</p>
        </div>
        <div className="adm-sec-actions">
          <button className="adm-btn adm-btn-primary" onClick={handleOpenAdd}>
            <UserPlus size={15} /> Add Team Member
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon"><Users size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{team.length}</span>
            <span className="adm-stat-label">Total Team Members</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon emerald"><Star size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{team.filter((m) => m.category === 'Core Team').length}</span>
            <span className="adm-stat-label">Core Team Leaders</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><Briefcase size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{team.filter((m) => m.category === 'Executive Member').length}</span>
            <span className="adm-stat-label">Executive Members</span>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon amber"><Award size={22} /></div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{team.filter((m) => m.category === 'Advisory Board').length}</span>
            <span className="adm-stat-label">Advisory Board</span>
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
            placeholder="Search team member by name, post, bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="adm-filters">
          <select
            className="adm-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="adm-team-grid">
        {filteredTeam.map((m) => (
          <div className="adm-team-card" key={m.id}>
            <div className="adm-team-avatar">
              {m.photo ? (
                <img src={m.photo} alt={m.name} />
              ) : (
                m.name.charAt(0)
              )}
            </div>
            <h3 className="adm-team-name">{m.name}</h3>
            <span className="adm-team-post">{m.post}</span>
            <div style={{ marginBottom: '10px' }}>
              <span
                className={`adm-badge ${
                  m.category === 'Core Team'
                    ? 'green'
                    : m.category === 'Executive Member'
                    ? 'purple'
                    : 'amber'
                }`}
              >
                {m.category}
              </span>
            </div>
            <p className="adm-team-bio">{m.bio}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#64748b', textAlign: 'left', marginBottom: '12px' }}>
              {m.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={12} /> {m.phone}
                </div>
              )}
              {m.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={12} /> {m.email}
                </div>
              )}
            </div>

            <div className="adm-team-actions">
              <button
                className="adm-btn adm-btn-sm adm-btn-outline"
                style={{ flex: 1 }}
                onClick={() => handleOpenEdit(m)}
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                className="adm-btn adm-btn-sm adm-btn-danger"
                onClick={() => handleDelete(m)}
                title="Remove Member"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Team Modal */}
      {modalMode && (
        <div className="adm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="adm-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{modalMode === 'add' ? 'Add Management Team Member' : `Edit: ${selectedMember?.name}`}</h3>
              <button className="adm-btn-icon" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave}>
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
                      placeholder="e.g. Jatin Rajpoot"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Designation / Post *</label>
                    <input
                      type="text"
                      required
                      className="adm-form-control"
                      value={formData.post}
                      onChange={(e) => setFormData({ ...formData, post: e.target.value })}
                      placeholder="e.g. Founder & President"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Category *</label>
                    <select
                      className="adm-form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      className="adm-form-control"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 95467 XXXXX"
                    />
                  </div>
                  <div className="adm-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="adm-form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="officer@gsddfoundation.org"
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Photo URL (Optional)</label>
                    <input
                      type="text"
                      className="adm-form-control"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="/images/... or https://..."
                    />
                  </div>
                  <div className="adm-form-group adm-form-col-full">
                    <label>Biography & Responsibilities *</label>
                    <textarea
                      required
                      rows={3}
                      className="adm-form-control"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Brief background, community service experience, and responsibilities at the foundation..."
                    />
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {modalMode === 'add' ? 'Add Member' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
