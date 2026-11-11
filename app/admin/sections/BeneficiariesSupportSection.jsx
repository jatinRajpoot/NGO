'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HeartHandshake,
  AlertOctagon,
  MailQuestion,
  Plus,
  Trash2,
  Download,
  Eye,
  MessageSquare,
  Gift,
  Loader2,
  X,
} from 'lucide-react';

const BENEFICIARY_CATEGORIES = [
  'Education Support',
  'Healthcare Aid',
  'Women Livelihood',
  'Senior Citizen Care',
  'Child Nutrition',
  'Disaster Relief',
];

export default function BeneficiariesSupportSection({ notify }) {
  const [section, setSection] = useState('beneficiaries'); // 'beneficiaries' | 'complaints' | 'enquiries'
  const [loading, setLoading] = useState(true);

  // Beneficiaries
  const [benTab, setBenTab] = useState('all'); // 'all' | 'active' | 'inactive' | 'direct_request' | 'completed'
  const [benSearch, setBenSearch] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [benSelected, setBenSelected] = useState([]);
  const [benModal, setBenModal] = useState(false);
  const [benDetail, setBenDetail] = useState(null);
  const [benefitForm, setBenefitForm] = useState({ benefitTitle: '', benefitValue: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [benForm, setBenForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    email: '',
    category: BENEFICIARY_CATEGORIES[0],
    district: 'Araria',
    state: 'Bihar',
    address: '',
    idDocType1: 'Aadhaar',
    idDocNo1: '',
    idDocType2: 'Ration Card',
    idDocNo2: '',
    status: 'Active',
    needSummary: '',
  });

  // Complaints
  const [cmpTab, setCmpTab] = useState('all');
  const [complaints, setComplaints] = useState([]);
  const [cmpSelected, setCmpSelected] = useState([]);
  const [cmpModal, setCmpModal] = useState(null);
  const [cmpStatus, setCmpStatus] = useState('Pending');
  const [cmpRemark, setCmpRemark] = useState('');

  // Enquiries
  const [enqTab, setEnqTab] = useState('all'); // 'all' | 'new' | 'replied'
  const [enquiries, setEnquiries] = useState([]);
  const [enqSelected, setEnqSelected] = useState([]);
  const [enqModal, setEnqModal] = useState(null);
  const [enqReply, setEnqReply] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (section === 'beneficiaries') {
        const res = await fetch(
          `/api/admin/support/beneficiaries/?tab=${encodeURIComponent(benTab)}&search=${encodeURIComponent(benSearch)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setBeneficiaries(j.beneficiaries || []);
          setBenSelected([]);
        }
      } else if (section === 'complaints') {
        const res = await fetch(
          `/api/admin/support/complaints/?status=${encodeURIComponent(cmpTab)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setComplaints(j.complaints || []);
          setCmpSelected([]);
        }
      } else {
        const res = await fetch(
          `/api/admin/support/enquiries/?status=${encodeURIComponent(enqTab)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setEnquiries(j.enquiries || []);
          setEnqSelected([]);
        }
      }
    } catch {}
    setLoading(false);
  }, [section, benTab, benSearch, cmpTab, enqTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const jsonReq = async (url, method, body, successMsg) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      notify?.(j?.error || 'Request failed.');
      return null;
    }
    notify?.(successMsg);
    await loadData();
    return j;
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Beneficiaries, Grievances &amp; Enquiries</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Manage beneficiaries &amp; provided benefits, resolve public complaints with remarks, and reply to new enquiries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'beneficiaries', label: 'Beneficiaries', icon: HeartHandshake },
            { id: 'complaints', label: 'Complaints', icon: AlertOctagon },
            { id: 'enquiries', label: 'Enquiries', icon: MailQuestion },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                className={`adm-btn adm-btn-sm ${section === s.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                onClick={() => setSection(s.id)}
              >
                <Icon size={14} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BENEFICIARIES */}
      {section === 'beneficiaries' && (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
                { id: 'direct_request', label: 'Direct Requests' },
                { id: 'completed', label: 'Completed' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${benTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setBenTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {benSelected.length > 0 && (
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={() => jsonReq('/api/admin/support/beneficiaries/', 'DELETE', { ids: benSelected }, 'Beneficiaries deleted.')}
                >
                  <Trash2 size={13} /> Bulk Delete ({benSelected.length})
                </button>
              )}
              <a
                href={`/api/admin/support/beneficiaries/?tab=${encodeURIComponent(benTab)}&export=csv`}
                className="adm-btn adm-btn-sm adm-btn-outline"
              >
                <Download size={13} /> Export Benefits
              </a>
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setBenModal(true)}>
                <Plus size={14} /> Add Beneficiary
              </button>
            </div>
          </div>

          <input
            value={benSearch}
            onChange={(e) => setBenSearch(e.target.value)}
            placeholder="Search beneficiary name, tracking code, district..."
            style={{ width: '100%', maxWidth: 340, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 14, fontSize: 13 }}
          />

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        checked={beneficiaries.length > 0 && benSelected.length === beneficiaries.length}
                        onChange={(e) => setBenSelected(e.target.checked ? beneficiaries.map((b) => b.id) : [])}
                      />
                    </th>
                    <th>Tracking Code</th>
                    <th>Beneficiary &amp; Contact</th>
                    <th>Category &amp; District</th>
                    <th>Benefits</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={benSelected.includes(b.id)}
                          onChange={() => setBenSelected((p) => (p.includes(b.id) ? p.filter((x) => x !== b.id) : [...p, b.id]))}
                        />
                      </td>
                      <td><strong>{b.trackingCode}</strong></td>
                      <td>
                        <div><strong>{b.name}</strong> ({b.gender || '—'})</div>
                        <small style={{ color: '#64748b' }}>{b.phone} • {b.email}</small>
                      </td>
                      <td>
                        <div>{b.category}</div>
                        <small style={{ color: '#64748b' }}>{b.district}, {b.state}</small>
                      </td>
                      <td>{(b.benefits || []).length} provided</td>
                      <td>
                        <span className={`adm-badge ${b.status === 'Active' ? 'green' : b.status === 'Direct Request' ? 'amber' : 'blue'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setBenDetail(b)}>
                            <Gift size={13} /> Details / Add Benefit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COMPLAINTS */}
      {section === 'complaints' && (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'Pending', 'Active', 'Rejected', 'Resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`adm-btn adm-btn-sm ${cmpTab === st ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setCmpTab(st)}
                >
                  {st === 'all' ? 'All Complaints' : st}
                </button>
              ))}
            </div>
            {cmpSelected.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-sm"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={() => jsonReq('/api/admin/support/complaints/', 'DELETE', { ids: cmpSelected }, 'Complaints deleted.')}
              >
                <Trash2 size={13} /> Delete Selected ({cmpSelected.length})
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        checked={complaints.length > 0 && cmpSelected.length === complaints.length}
                        onChange={(e) => setCmpSelected(e.target.checked ? complaints.map((c) => c.id) : [])}
                      />
                    </th>
                    <th>Ticket No</th>
                    <th>Complainant</th>
                    <th>Subject &amp; Category</th>
                    <th>Status</th>
                    <th>Remark</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={cmpSelected.includes(c.id)}
                          onChange={() => setCmpSelected((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                        />
                      </td>
                      <td><strong>{c.ticketNo}</strong></td>
                      <td>
                        <div><strong>{c.complainantName}</strong></div>
                        <small style={{ color: '#64748b' }}>{c.email || c.phone}</small>
                      </td>
                      <td>
                        <div>{c.subject}</div>
                        <small style={{ color: '#64748b' }}>{c.category}</small>
                      </td>
                      <td>
                        <span className={`adm-badge ${c.status === 'Resolved' ? 'green' : c.status === 'Rejected' ? 'red' : 'amber'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}><small>{c.adminRemark || '—'}</small></td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          onClick={() => {
                            setCmpModal(c);
                            setCmpStatus(c.status);
                            setCmpRemark(c.adminRemark || '');
                          }}
                        >
                          <Eye size={13} /> Review &amp; Remark
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ENQUIRIES */}
      {section === 'enquiries' && (
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All Enquiries' },
                { id: 'new', label: 'New Enquiries (status=new)' },
                { id: 'replied', label: 'Replied' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`adm-btn adm-btn-sm ${enqTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  onClick={() => setEnqTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {enqSelected.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-sm"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={() => jsonReq('/api/admin/support/enquiries/', 'DELETE', { ids: enqSelected }, 'Enquiries deleted.')}
              >
                <Trash2 size={13} /> Delete Selected ({enqSelected.length})
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        checked={enquiries.length > 0 && enqSelected.length === enquiries.length}
                        onChange={(e) => setEnqSelected(e.target.checked ? enquiries.map((q) => q.id) : [])}
                      />
                    </th>
                    <th>Sender</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={enqSelected.includes(q.id)}
                          onChange={() => setEnqSelected((p) => (p.includes(q.id) ? p.filter((x) => x !== q.id) : [...p, q.id]))}
                        />
                      </td>
                      <td>
                        <div><strong>{q.name}</strong></div>
                        <small style={{ color: '#64748b' }}>{q.email} • {q.phone}</small>
                      </td>
                      <td>{q.subject}</td>
                      <td>
                        <span className={`adm-badge ${q.status === 'new' ? 'amber' : 'green'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          onClick={() => {
                            setEnqModal(q);
                            setEnqReply(q.adminReply || '');
                          }}
                        >
                          <MessageSquare size={13} /> View &amp; Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {benModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setBenModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/support/beneficiaries/', 'POST', benForm, 'Beneficiary saved.')) setBenModal(false);
            }}
            style={{ width: 'min(540px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Add Beneficiary</h3>
            <input required placeholder="Full Name *" value={benForm.name} onChange={(e) => setBenForm({ ...benForm, name: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input placeholder="Age" type="number" value={benForm.age} onChange={(e) => setBenForm({ ...benForm, age: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={benForm.gender} onChange={(e) => setBenForm({ ...benForm, gender: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Female</option><option>Male</option><option>Other</option></select>
              <select value={benForm.status} onChange={(e) => setBenForm({ ...benForm, status: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Active</option><option>Inactive</option><option>Direct Request</option><option>Completed</option></select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required placeholder="Mobile *" value={benForm.phone} onChange={(e) => setBenForm({ ...benForm, phone: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="email" placeholder="Email" value={benForm.email} onChange={(e) => setBenForm({ ...benForm, email: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={benForm.category} onChange={(e) => setBenForm({ ...benForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input required placeholder="District *" value={benForm.district} onChange={(e) => setBenForm({ ...benForm, district: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="ID Doc 1 (e.g. Aadhaar)" value={benForm.idDocNo1} onChange={(e) => setBenForm({ ...benForm, idDocNo1: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input placeholder="ID Doc 2 (e.g. Ration Card)" value={benForm.idDocNo2} onChange={(e) => setBenForm({ ...benForm, idDocNo2: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <textarea rows={2} placeholder="Assistance Need Summary" value={benForm.needSummary} onChange={(e) => setBenForm({ ...benForm, needSummary: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setBenModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Beneficiary</button>
            </div>
          </form>
        </div>
      )}

      {/* Beneficiary Details & Add Benefit Modal */}
      {benDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setBenDetail(null)}>
          <div style={{ width: 'min(540px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{benDetail.name} ({benDetail.trackingCode})</h3>
              <button type="button" onClick={() => setBenDetail(null)} style={{ background: 'transparent', border: 0 }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
              <div><strong>Category:</strong> {benDetail.category} • <strong>Location:</strong> {benDetail.district}, {benDetail.state}</div>
              <div><strong>Documents:</strong> {benDetail.idDocType1}: {benDetail.idDocNo1 || '—'} • {benDetail.idDocType2}: {benDetail.idDocNo2 || '—'}</div>
              <div><strong>Summary:</strong> {benDetail.needSummary || '—'}</div>
            </div>
            <strong style={{ fontSize: 13 }}>Benefits Provided ({(benDetail.benefits || []).length})</strong>
            <div style={{ display: 'grid', gap: 6, margin: '8px 0 16px' }}>
              {(benDetail.benefits || []).map((bf) => (
                <div key={bf.id} style={{ padding: 8, background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                  <strong>{bf.benefitTitle}</strong> ({bf.benefitValue || 'In-kind'}) — {bf.date}
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await jsonReq(
                  '/api/admin/support/beneficiaries/',
                  'PATCH',
                  { id: benDetail.id, status: 'Active', addBenefit: benefitForm },
                  'Benefit added to beneficiary!'
                );
                if (res?.beneficiary) {
                  setBenDetail(res.beneficiary);
                  setBenefitForm({ benefitTitle: '', benefitValue: '', date: new Date().toISOString().slice(0, 10), notes: '' });
                }
              }}
              style={{ display: 'grid', gap: 8, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}
            >
              <strong style={{ fontSize: 13 }}>Add Benefit Provided</strong>
              <input required placeholder="Benefit / Aid Provided *" value={benefitForm.benefitTitle} onChange={(e) => setBenefitForm({ ...benefitForm, benefitTitle: e.target.value })} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Value (e.g. Rs. 5,000 / Kit)" value={benefitForm.benefitValue} onChange={(e) => setBenefitForm({ ...benefitForm, benefitValue: e.target.value })} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input type="date" value={benefitForm.date} onChange={(e) => setBenefitForm({ ...benefitForm, date: e.target.value })} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">Record Benefit &amp; Approve</button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Review Modal */}
      {cmpModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setCmpModal(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/support/complaints/', 'PATCH', { id: cmpModal.id, status: cmpStatus, adminRemark: cmpRemark }, 'Complaint status & remark saved.')) setCmpModal(null);
            }}
            style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Review Complaint — {cmpModal.ticketNo}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{cmpModal.description}</p>
            <select value={cmpStatus} onChange={(e) => setCmpStatus(e.target.value)} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {['Pending', 'Active', 'Rejected', 'Resolved'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea rows={3} placeholder="Official Admin Remark..." value={cmpRemark} onChange={(e) => setCmpRemark(e.target.value)} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setCmpModal(null)}>Close</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Remark &amp; Status</button>
            </div>
          </form>
        </div>
      )}

      {/* Enquiry Reply Modal */}
      {enqModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setEnqModal(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/support/enquiries/', 'PATCH', { id: enqModal.id, adminReply: enqReply, status: 'replied' }, 'Enquiry reply recorded.')) setEnqModal(null);
            }}
            style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Enquiry from {enqModal.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{enqModal.message}</p>
            <textarea required rows={3} placeholder="Compose reply..." value={enqReply} onChange={(e) => setEnqReply(e.target.value)} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setEnqModal(null)}>Close</button>
              <button type="submit" className="adm-btn adm-btn-primary">Send Reply</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
