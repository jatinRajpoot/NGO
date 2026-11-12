'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Award,
  Bell,
  BadgeCheck,
  Shield,
  Plus,
  Trash2,
  Download,
  Edit2,
  CheckCircle2,
  Ban,
  Loader2,
  X,
} from 'lucide-react';

const CERT_DESIGNS = ['Classic Navy Emblem', 'Royal Gold Seal', 'Modern Minimal Crest'];

export default function MembershipSuiteSection({ notify }) {
  const [module, setModule] = useState('members'); // 'members' | 'designations' | 'notices' | 'certificates' | 'management'
  const [loading, setLoading] = useState(true);

  // Members
  const [memTab, setMemTab] = useState('all'); // 'all' | 'inactive' | 'active' | 'blocked'
  const [memSearch, setMemSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [memSelected, setMemSelected] = useState([]);
  const [memModal, setMemModal] = useState(false);
  const [memForm, setMemForm] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: 'Male',
    maritalStatus: 'Single',
    bloodGroup: 'O+',
    category: 'General',
    occupation: '',
    state: 'Bihar',
    district: 'Araria',
    designation: 'General Member',
    membershipFee: '500',
    paymentMode: 'Cash/UPI Received by Admin',
    accountStatus: 'Active',
  });

  // Designations
  const [desFilter, setDesFilter] = useState('all');
  const [designations, setDesignations] = useState([]);
  const [desSelected, setDesSelected] = useState([]);
  const [desModal, setDesModal] = useState(false);
  const [desForm, setDesForm] = useState({ title: '', feeRs: '500', validityYears: '1', renewalFeeRs: '300', benefitsSummary: '', status: 1 });

  // Notices
  const [noticeTab, setNoticeTab] = useState('send'); // 'send' | 'history'
  const [notices, setNotices] = useState([]);
  const [noticeSelected, setNoticeSelected] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', recipientIds: ['all'] });

  // Certificates
  const [certTab, setCertTab] = useState('active');
  const [certificates, setCertificates] = useState([]);
  const [certSelected, setCertSelected] = useState([]);
  const [certForm, setCertForm] = useState({
    kind: 'Visitor',
    recipientName: '',
    memberRegNo: '',
    program: '',
    design: CERT_DESIGNS[0],
  });

  // Management Body
  const [mgmtTab, setMgmtTab] = useState('all');
  const [mgmtList, setMgmtList] = useState([]);
  const [mgmtSelected, setMgmtSelected] = useState([]);
  const [mgmtModal, setMgmtModal] = useState(false);
  const [mgmtForm, setMgmtForm] = useState({ name: '', designation: '', about: '', displayOrder: '1', status: 'Active' });

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    try {
      if (module === 'members') {
        const res = await fetch(
          `/api/admin/membership-suite/members/?tab=${encodeURIComponent(memTab)}&search=${encodeURIComponent(memSearch)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setMembers(j.members || []);
          setMemSelected([]);
        }
      } else if (module === 'designations') {
        const res = await fetch(
          `/api/admin/membership-suite/designations/?status=${encodeURIComponent(desFilter)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setDesignations(j.designations || []);
          setDesSelected([]);
        }
      } else if (module === 'notices') {
        const [nRes, mRes] = await Promise.all([
          fetch('/api/admin/membership-suite/notices/', { cache: 'no-store' }),
          fetch('/api/admin/membership-suite/members/?tab=active', { cache: 'no-store' }),
        ]);
        const nJson = await nRes.json();
        const mJson = await mRes.json();
        if (nJson.ok) {
          setNotices(nJson.notices || []);
          setNoticeSelected([]);
        }
        if (mJson.ok) setMembers(mJson.members || []);
      } else if (module === 'certificates') {
        const res = await fetch('/api/admin/membership-suite/certificates/', { cache: 'no-store' });
        const j = await res.json();
        if (j.ok) {
          setCertificates(j.certificates || []);
          setCertSelected([]);
        }
      } else if (module === 'management') {
        const res = await fetch(
          `/api/admin/membership-suite/management-body/?tab=${encodeURIComponent(mgmtTab)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setMgmtList(j.members || []);
          setMgmtSelected([]);
        }
      }
    } catch {}
    setLoading(false);
  }, [module, memTab, memSearch, desFilter, mgmtTab]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

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
    await loadCurrent();
    return j;
  };

  const toggleNoticeRecipient = (id) => {
    if (id === 'all') {
      setNoticeForm((f) => ({ ...f, recipientIds: ['all'] }));
      return;
    }
    setNoticeForm((f) => {
      const withoutAll = f.recipientIds.filter((x) => x !== 'all');
      const next = withoutAll.includes(id) ? withoutAll.filter((x) => x !== id) : [...withoutAll, id];
      return { ...f, recipientIds: next.length ? next : ['all'] };
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Membership, Certificates &amp; Governance Suite</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Full member lifecycle &amp; referrals, designations with renewal fees, multi-select notices, certificate templates, and management body directory.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[
          { id: 'members', label: 'Members Directory', icon: Users },
          { id: 'designations', label: 'Designations', icon: BadgeCheck },
          { id: 'notices', label: 'Member Notices', icon: Bell },
          { id: 'certificates', label: 'Member & Visitor Certificates', icon: Award },
          { id: 'management', label: 'Management Body', icon: Shield },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`adm-btn adm-btn-sm ${module === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
              onClick={() => setModule(t.id)}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        {/* MEMBERS */}
        {module === 'members' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Members' },
                  { id: 'inactive', label: 'Pending Approval' },
                  { id: 'active', label: 'Active Members' },
                  { id: 'blocked', label: 'Blocked Members' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`adm-btn adm-btn-sm ${memTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                    onClick={() => setMemTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {memSelected.length > 0 && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-sm"
                    style={{ background: '#dc2626', color: '#fff' }}
                    onClick={() => jsonReq('/api/admin/membership-suite/members/', 'DELETE', { ids: memSelected }, 'Members deleted.')}
                  >
                    <Trash2 size={13} /> Bulk Delete ({memSelected.length})
                  </button>
                )}
                <a
                  href={`/api/admin/membership-suite/members/?tab=${encodeURIComponent(memTab)}&export=csv`}
                  className="adm-btn adm-btn-sm adm-btn-outline"
                >
                  <Download size={13} /> Export Members
                </a>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setMemModal(true)}>
                  <Plus size={14} /> Add Member
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                value={memSearch}
                onChange={(e) => setMemSearch(e.target.value)}
                placeholder="Search reg no, name, district, designation..."
                style={{ flex: '1 1 240px', maxWidth: 360, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
              {memSearch && (
                <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setMemSearch('')}>Clear Filters</button>
              )}
            </div>

            {loading ? (
              <div style={{ padding: 30, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}><input type="checkbox" checked={members.length > 0 && memSelected.length === members.length} onChange={(e) => setMemSelected(e.target.checked ? members.map((m) => m.id) : [])} /></th>
                      <th>Member &amp; Mobile</th>
                      <th>District / State</th>
                      <th>Designation &amp; Fee</th>
                      <th>Referrals</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td><input type="checkbox" checked={memSelected.includes(m.id)} onChange={() => setMemSelected((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} /></td>
                        <td>
                          <div><strong>{m.name}</strong> ({m.regNo})</div>
                          <small style={{ color: '#64748b' }}>{m.mobile} • {m.email}</small>
                        </td>
                        <td>{m.district}, {m.state}</td>
                        <td>
                          <div>{m.designation}</div>
                          <small style={{ color: '#64748b' }}>Rs. {m.membershipFee} ({m.paymentStatus})</small>
                        </td>
                        <td>{m.referredCount || 0} joined • Rs. {m.referredDonationsTotal || 0}</td>
                        <td>
                          <span className={`adm-badge ${m.accountStatus === 'Active' ? 'green' : m.accountStatus === 'Blocked' ? 'red' : 'amber'}`}>
                            {m.accountStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {m.accountStatus !== 'Active' && (
                              <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#059669' }} title="Verify & Activate" onClick={() => jsonReq('/api/admin/membership-suite/members/', 'PATCH', { id: m.id, accountStatus: 'Active', verified: true, paymentStatus: 'Paid' }, `${m.name} activated!`)}>
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                            <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" title={m.accountStatus === 'Blocked' ? 'Unblock' : 'Block'} onClick={() => jsonReq('/api/admin/membership-suite/members/', 'PATCH', { id: m.id, accountStatus: m.accountStatus === 'Blocked' ? 'Active' : 'Blocked' }, 'Member status updated.')}>
                              <Ban size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* DESIGNATIONS */}
        {module === 'designations' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'all', label: 'All Designations' },
                  { id: '1', label: 'Active' },
                  { id: '0', label: 'Inactive' },
                ].map((t) => (
                  <button key={t.id} type="button" className={`adm-btn adm-btn-sm ${desFilter === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setDesFilter(t.id)}>{t.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {desSelected.length > 0 && (
                  <button type="button" className="adm-btn adm-btn-sm" style={{ background: '#dc2626', color: '#fff' }} onClick={() => jsonReq('/api/admin/membership-suite/designations/', 'DELETE', { ids: desSelected }, 'Designations deleted.')}>
                    <Trash2 size={13} /> Bulk Delete ({desSelected.length})
                  </button>
                )}
                <a href="/api/admin/membership-suite/designations/?export=csv" className="adm-btn adm-btn-sm adm-btn-outline"><Download size={13} /> Export</a>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setDesModal(true)}><Plus size={14} /> Add Designation</button>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}><input type="checkbox" checked={designations.length > 0 && desSelected.length === designations.length} onChange={(e) => setDesSelected(e.target.checked ? designations.map((d) => d.id) : [])} /></th>
                    <th>Title</th><th>Fee (Rs.)</th><th>Validity</th><th>Renewal Fee</th><th>Status</th><th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map((d) => (
                    <tr key={d.id}>
                      <td><input type="checkbox" checked={desSelected.includes(d.id)} onChange={() => setDesSelected((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))} /></td>
                      <td><strong>{d.title}</strong><div><small style={{ color: '#64748b' }}>{d.benefitsSummary}</small></div></td>
                      <td>Rs. {d.feeRs}</td>
                      <td>{d.validityYears} Year(s)</td>
                      <td>Rs. {d.renewalFeeRs}</td>
                      <td><span className={`adm-badge ${Number(d.status) === 1 ? 'green' : 'gray'}`}>{Number(d.status) === 1 ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => { setDesForm(d); setDesModal(true); }}><Edit2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* NOTICES */}
        {module === 'notices' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className={`adm-btn adm-btn-sm ${noticeTab === 'send' ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setNoticeTab('send')}>Send To Users</button>
                <button type="button" className={`adm-btn adm-btn-sm ${noticeTab === 'history' ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setNoticeTab('history')}>Previous Notices ({notices.length})</button>
              </div>
              {noticeSelected.length > 0 && (
                <button type="button" className="adm-btn adm-btn-sm" style={{ background: '#dc2626', color: '#fff' }} onClick={() => jsonReq('/api/admin/membership-suite/notices/', 'DELETE', { ids: noticeSelected }, 'Notices deleted.')}>
                  <Trash2 size={13} /> Delete Selected
                </button>
              )}
            </div>
            {noticeTab === 'send' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const names = noticeForm.recipientIds.includes('all')
                    ? ['All Members']
                    : members.filter((m) => noticeForm.recipientIds.includes(m.id)).map((m) => m.name);
                  if (await jsonReq('/api/admin/membership-suite/notices/', 'POST', { ...noticeForm, recipientNames: names }, 'Notice dispatched!')) {
                    setNoticeForm({ title: '', message: '', recipientIds: ['all'] });
                  }
                }}
                style={{ display: 'grid', gap: 12, maxWidth: 640 }}
              >
                <div>
                  <strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Select Recipient Members</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="checkbox" checked={noticeForm.recipientIds.includes('all')} onChange={() => toggleNoticeRecipient('all')} /> All Members
                    </label>
                    {members.map((m) => (
                      <label key={m.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={noticeForm.recipientIds.includes(m.id)} onChange={() => toggleNoticeRecipient(m.id)} /> {m.name}
                      </label>
                    ))}
                  </div>
                </div>
                <input required placeholder="Notice Title *" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <textarea required rows={3} placeholder="Notice Message *" value={noticeForm.message} onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <button type="submit" className="adm-btn adm-btn-primary" style={{ justifySelf: 'start' }}>Dispatch Notice</button>
              </form>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th style={{ width: 34 }} /><th>Title</th><th>Recipients</th><th>Sent Date</th></tr></thead>
                  <tbody>
                    {notices.map((n) => (
                      <tr key={n.id}>
                        <td><input type="checkbox" checked={noticeSelected.includes(n.id)} onChange={() => setNoticeSelected((p) => (p.includes(n.id) ? p.filter((x) => x !== n.id) : [...p, n.id]))} /></td>
                        <td><strong>{n.title}</strong><div><small style={{ color: '#64748b' }}>{n.message}</small></div></td>
                        <td>{(n.recipientNames || []).join(', ')}</td>
                        <td>{String(n.sentAt || '').slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* CERTIFICATES */}
        {module === 'certificates' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className={`adm-btn adm-btn-sm ${certTab === 'active' ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setCertTab('active')}>Active Certificates ({certificates.length})</button>
                <button type="button" className={`adm-btn adm-btn-sm ${certTab === 'issue' ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setCertTab('issue')}>Issue Certificate</button>
              </div>
              {certSelected.length > 0 && (
                <button type="button" className="adm-btn adm-btn-sm" style={{ background: '#dc2626', color: '#fff' }} onClick={() => jsonReq('/api/admin/membership-suite/certificates/', 'DELETE', { ids: certSelected }, 'Certificates deleted.')}>
                  <Trash2 size={13} /> Delete Selected
                </button>
              )}
            </div>
            {certTab === 'issue' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await jsonReq('/api/admin/membership-suite/certificates/', 'POST', certForm, 'Certificate generated!')) {
                    setCertForm({ kind: 'Visitor', recipientName: '', memberRegNo: '', program: '', design: CERT_DESIGNS[0] });
                    setCertTab('active');
                  }
                }}
                style={{ display: 'grid', gap: 10, maxWidth: 520 }}
              >
                <select value={certForm.kind} onChange={(e) => setCertForm({ ...certForm, kind: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <option value="Visitor">Visitor Certificate</option>
                  <option value="Member">Member Certificate</option>
                </select>
                <input required placeholder="Recipient Name *" value={certForm.recipientName} onChange={(e) => setCertForm({ ...certForm, recipientName: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <input placeholder="Program / Event Title *" required value={certForm.program} onChange={(e) => setCertForm({ ...certForm, program: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <label style={{ fontSize: 12, fontWeight: 700 }}>Choose Your Preferred Certificate Design</label>
                <select value={certForm.design} onChange={(e) => setCertForm({ ...certForm, design: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  {CERT_DESIGNS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" className="adm-btn adm-btn-primary">Generate Certificate</button>
              </form>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th style={{ width: 34 }} /><th>Cert No</th><th>Kind &amp; Recipient</th><th>Program / Event</th><th>Template Design</th><th>Issued</th></tr></thead>
                  <tbody>
                    {certificates.map((c) => (
                      <tr key={c.id}>
                        <td><input type="checkbox" checked={certSelected.includes(c.id)} onChange={() => setCertSelected((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} /></td>
                        <td><strong>{c.certNo}</strong></td>
                        <td><div>{c.recipientName}</div><small style={{ color: '#64748b' }}>{c.kind}</small></td>
                        <td>{c.program}</td>
                        <td><span className="adm-badge blue">{c.design}</span></td>
                        <td>{c.issuedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* MANAGEMENT BODY */}
        {module === 'management' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'active', 'inactive'].map((t) => (
                  <button key={t} type="button" className={`adm-btn adm-btn-sm ${mgmtTab === t ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setMgmtTab(t)}>
                    {t === 'all' ? 'All Members' : `${t[0].toUpperCase() + t.slice(1)} Members`}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {mgmtSelected.length > 0 && (
                  <button type="button" className="adm-btn adm-btn-sm" style={{ background: '#dc2626', color: '#fff' }} onClick={() => jsonReq('/api/admin/membership-suite/management-body/', 'DELETE', { ids: mgmtSelected }, 'Deleted selected.')}>
                    <Trash2 size={13} /> Bulk Delete
                  </button>
                )}
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => { setMgmtForm({ name: '', designation: '', about: '', displayOrder: '1', status: 'Active' }); setMgmtModal(true); }}>
                  <Plus size={14} /> Add Leader
                </button>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th style={{ width: 34 }} /><th>Order</th><th>Name</th><th>Designation</th><th>About</th><th>Status</th></tr></thead>
                <tbody>
                  {mgmtList.map((m) => (
                    <tr key={m.id}>
                      <td><input type="checkbox" checked={mgmtSelected.includes(m.id)} onChange={() => setMgmtSelected((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))} /></td>
                      <td>#{m.displayOrder}</td>
                      <td><strong>{m.name}</strong></td>
                      <td>{m.designation}</td>
                      <td><small>{m.about}</small></td>
                      <td><span className={`adm-badge ${m.status === 'Active' ? 'green' : 'gray'}`}>{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      {memModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setMemModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/membership-suite/members/', 'POST', memForm, 'Member enrolled!')) setMemModal(false);
            }}
            style={{ width: 'min(540px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Enroll Member (Full Demographics)</h3>
            <input required placeholder="Full Name *" value={memForm.name} onChange={(e) => setMemForm({ ...memForm, name: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required type="email" placeholder="Email *" value={memForm.email} onChange={(e) => setMemForm({ ...memForm, email: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input required placeholder="Mobile *" value={memForm.mobile} onChange={(e) => setMemForm({ ...memForm, mobile: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <select value={memForm.gender} onChange={(e) => setMemForm({ ...memForm, gender: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Male</option><option>Female</option><option>Other</option></select>
              <select value={memForm.maritalStatus} onChange={(e) => setMemForm({ ...memForm, maritalStatus: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}><option>Single</option><option>Married</option></select>
              <input placeholder="Blood Group" value={memForm.bloodGroup} onChange={(e) => setMemForm({ ...memForm, bloodGroup: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="Designation" value={memForm.designation} onChange={(e) => setMemForm({ ...memForm, designation: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={memForm.paymentMode} onChange={(e) => setMemForm({ ...memForm, paymentMode: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option>Cash/UPI Received by Admin</option>
                <option>Online Payment Gateway</option>
                <option>Free Membership</option>
              </select>
            </div>
            <button type="submit" className="adm-btn adm-btn-primary">Create Member</button>
          </form>
        </div>
      )}

      {/* Designation Modal */}
      {desModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setDesModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/membership-suite/designations/', 'POST', desForm, 'Designation saved.')) setDesModal(false);
            }}
            style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Designation Settings</h3>
            <input required placeholder="Designation Title *" value={desForm.title} onChange={(e) => setDesForm({ ...desForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input type="number" placeholder="Fee Rs." value={desForm.feeRs} onChange={(e) => setDesForm({ ...desForm, feeRs: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="number" placeholder="Years" value={desForm.validityYears} onChange={(e) => setDesForm({ ...desForm, validityYears: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="number" placeholder="Renewal Rs." value={desForm.renewalFeeRs} onChange={(e) => setDesForm({ ...desForm, renewalFeeRs: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <button type="submit" className="adm-btn adm-btn-primary">Save Designation</button>
          </form>
        </div>
      )}

      {/* Management Body Modal */}
      {mgmtModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setMgmtModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await jsonReq('/api/admin/membership-suite/management-body/', 'POST', mgmtForm, 'Management member saved.')) setMgmtModal(false);
            }}
            style={{ width: 'min(460px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Add Management Leader</h3>
            <input required placeholder="Full Name *" value={mgmtForm.name} onChange={(e) => setMgmtForm({ ...mgmtForm, name: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="Designation *" value={mgmtForm.designation} onChange={(e) => setMgmtForm({ ...mgmtForm, designation: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input type="number" min="1" placeholder="Display Order" value={mgmtForm.displayOrder} onChange={(e) => setMgmtForm({ ...mgmtForm, displayOrder: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <textarea rows={2} placeholder="About / Role" value={mgmtForm.about} onChange={(e) => setMgmtForm({ ...mgmtForm, about: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <button type="submit" className="adm-btn adm-btn-primary">Save Leader</button>
          </form>
        </div>
      )}
    </div>
  );
}
