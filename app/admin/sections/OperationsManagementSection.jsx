'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Video,
  Calendar,
  GraduationCap,
  Receipt,
  Briefcase,
  FolderKanban,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Eye,
  Award,
  Loader2,
  X,
} from 'lucide-react';
import {
  EVENT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_MODES,
  INTERNSHIP_TYPES,
  PROJECT_CATEGORIES,
} from '../../lib/operations-constants';

const SUB_MODULES = [
  { id: 'events', label: 'Event Management', icon: Calendar },
  { id: 'internships', label: 'Internship Management', icon: GraduationCap },
  { id: 'expenses', label: 'Expense Management', icon: Receipt },
  { id: 'jobs', label: 'Job Management', icon: Briefcase },
  { id: 'projects', label: 'Project Management', icon: FolderKanban },
  { id: 'videos', label: 'Video Management', icon: Video },
];

export default function OperationsManagementSection({ notify }) {
  const [mod, setMod] = useState('events');
  const [loading, setLoading] = useState(false);

  // Videos
  const [videos, setVideos] = useState([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoStatus, setVideoStatus] = useState('all');
  const [videoModal, setVideoModal] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', videoUrl: '', category: 'Programs', description: '', status: 'Active' });

  // Events
  const [eventTab, setEventTab] = useState('all');
  const [events, setEvents] = useState([]);
  const [eventApplicants, setEventApplicants] = useState([]);
  const [eventModal, setEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    eventType: EVENT_TYPES[0],
    date: new Date().toISOString().slice(0, 10),
    time: '10:30 AM',
    venue: '',
    capacity: '60',
    fee: '0',
    status: 'Active',
    description: '',
  });

  // Internships
  const [internTab, setInternTab] = useState('all');
  const [internships, setInternships] = useState([]);
  const [internApps, setInternApps] = useState([]);
  const [internModal, setInternModal] = useState(false);
  const [internForm, setInternForm] = useState({
    title: '',
    type: 'Offline',
    country: 'India',
    state: 'Bihar',
    city: 'Araria',
    duration: '8 Weeks',
    fee: '0',
    seats: '15',
    stipend: 'No',
    minQualification: 'Undergraduate / Graduate',
    language: 'Hindi / English',
    status: 'Active',
    description: '',
  });

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [expCategory, setExpCategory] = useState('all');
  const [expPreset, setExpPreset] = useState('all');
  const [expSelected, setExpSelected] = useState([]);
  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    paymentMode: 'UPI',
    payee: '',
    projectTitle: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [expFile, setExpFile] = useState(null);

  // Jobs
  const [jobTab, setJobTab] = useState('Active');
  const [jobs, setJobs] = useState([]);
  const [jobApps, setJobApps] = useState([]);
  const [jobModal, setJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    jobType: 'Full-Time',
    experience: '1–3 Years',
    location: 'Araria, Bihar',
    fee: '0',
    status: 'Active',
    description: '',
  });

  // Projects
  const [prjTab, setPrjTab] = useState('all');
  const [projects, setProjects] = useState([]);
  const [prjModal, setPrjModal] = useState(false);
  const [prjForm, setPrjForm] = useState({
    title: '',
    category: 'Education',
    goalAmount: '200000',
    spentAmount: '0',
    status: 'Active',
    location: 'Araria, Bihar',
    description: '',
  });

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    try {
      if (mod === 'videos') {
        const res = await fetch(
          `/api/admin/operations/videos/?status=${encodeURIComponent(videoStatus)}&search=${encodeURIComponent(videoSearch)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) setVideos(j.videos || []);
      } else if (mod === 'events') {
        const res = await fetch(`/api/admin/operations/events/?tab=${encodeURIComponent(eventTab)}`, {
          cache: 'no-store',
        });
        const j = await res.json();
        if (j.ok) {
          if (eventTab === 'applicants') setEventApplicants(j.applicants || []);
          else setEvents(j.events || []);
        }
      } else if (mod === 'internships') {
        const res = await fetch(`/api/admin/operations/internships/?tab=${encodeURIComponent(internTab)}`, {
          cache: 'no-store',
        });
        const j = await res.json();
        if (j.ok) {
          if (internTab === 'applications') setInternApps(j.applications || []);
          else setInternships(j.internships || []);
        }
      } else if (mod === 'expenses') {
        const res = await fetch(
          `/api/admin/operations/expenses/?category=${encodeURIComponent(expCategory)}&preset=${encodeURIComponent(expPreset)}`,
          { cache: 'no-store' }
        );
        const j = await res.json();
        if (j.ok) {
          setExpenses(j.expenses || []);
          setExpSelected([]);
        }
      } else if (mod === 'jobs') {
        const res = await fetch(`/api/admin/operations/jobs/?tab=${encodeURIComponent(jobTab)}`, {
          cache: 'no-store',
        });
        const j = await res.json();
        if (j.ok) {
          if (jobTab === 'applications') setJobApps(j.applications || []);
          else setJobs(j.jobs || []);
        }
      } else if (mod === 'projects') {
        const res = await fetch(`/api/admin/operations/projects/?tab=${encodeURIComponent(prjTab)}`, {
          cache: 'no-store',
        });
        const j = await res.json();
        if (j.ok) setProjects(j.projects || []);
      }
    } catch {}
    setLoading(false);
  }, [mod, videoStatus, videoSearch, eventTab, internTab, expCategory, expPreset, jobTab, prjTab]);

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
      notify?.(j?.error || 'Action failed.');
      return false;
    }
    notify?.(successMsg);
    await loadCurrent();
    return true;
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(expForm).forEach(([k, v]) => fd.append(k, String(v)));
    if (expFile) fd.append('attachment', expFile);
    const res = await fetch('/api/admin/operations/expenses/', { method: 'POST', body: fd });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      notify?.(j?.error || 'Could not record expense.');
      return;
    }
    setExpModal(false);
    setExpFile(null);
    await loadCurrent();
    notify?.('Expense recorded.');
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Operations Suite</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Manage Foundation Events, Internships, Expenses, Job Openings, Projects &amp; Videos.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {SUB_MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              className={`adm-btn adm-btn-sm ${mod === m.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
              onClick={() => setMod(m.id)}
            >
              <Icon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        {/* EVENTS */}
        {mod === 'events' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'active', label: 'Active Events' },
                  { id: 'completed', label: 'Completed Events' },
                  { id: 'applicants', label: 'Event Applicants' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`adm-btn adm-btn-sm ${eventTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                    onClick={() => setEventTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setEventModal(true)}>
                <Plus size={14} /> Add Event
              </button>
            </div>
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
            ) : eventTab === 'applicants' ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Applicant</th><th>Event</th><th>Email / Phone</th><th>City</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {eventApplicants.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.name}</strong></td>
                        <td>{a.eventTitle}</td>
                        <td>{a.email} • {a.phone}</td>
                        <td>{a.city || '—'}</td>
                        <td><span className="adm-badge green">{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Event Title</th><th>Type</th><th>Date &amp; Venue</th><th>Capacity / Fee</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td><strong>{e.title}</strong></td>
                        <td>{e.eventType}</td>
                        <td><div>{e.date} • {e.time}</div><small style={{ color: '#64748b' }}>{e.venue}</small></td>
                        <td>{e.capacity} seats • Rs. {e.fee}</td>
                        <td><span className={`adm-badge ${e.status === 'Active' ? 'green' : 'blue'}`}>{e.status}</span></td>
                        <td>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => jsonReq('/api/admin/operations/events/', 'DELETE', { ids: [e.id] }, 'Event deleted.')}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* INTERNSHIPS */}
        {mod === 'internships' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Internships' },
                  { id: 'active', label: 'Active' },
                  { id: 'ongoing', label: 'Ongoing' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'applications', label: 'Applicants & Certificates' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`adm-btn adm-btn-sm ${internTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                    onClick={() => setInternTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/internships/verify-certificate" target="_blank" className="adm-btn adm-btn-sm adm-btn-outline">
                  <ExternalLink size={13} /> Verify Portal
                </Link>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setInternModal(true)}>
                  <Plus size={14} /> Add Internship
                </button>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center' }}><Loader2 size={22} className="spin" /></div>
            ) : internTab === 'applications' ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Applicant</th><th>Internship</th><th>Qualification</th><th>Certificate ID</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {internApps.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.applicantName}</strong><div><small>{a.email}</small></div></td>
                        <td>{a.internshipTitle}</td>
                        <td>{a.qualification}</td>
                        <td><code>{a.certificateId || 'Pending'}</code></td>
                        <td><span className={`adm-badge ${a.status === 'Approved' ? 'green' : 'amber'}`}>{a.status}</span></td>
                        <td>
                          {!a.certificateId && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-sm adm-btn-primary"
                              onClick={() => jsonReq('/api/admin/operations/internships/', 'PATCH', { applicationId: a.id, status: 'Approved' }, 'Internship certificate issued!')}
                            >
                              <Award size={13} /> Issue Cert
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Role</th><th>Mode &amp; Location</th><th>Duration &amp; Stipend</th><th>Seats</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {internships.map((i) => (
                      <tr key={i.id}>
                        <td><strong>{i.title}</strong></td>
                        <td>{i.type} • {i.city}, {i.state}</td>
                        <td>{i.duration} • Stipend: {i.stipend}</td>
                        <td>{i.seats}</td>
                        <td><span className="adm-badge green">{i.status}</span></td>
                        <td>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => jsonReq('/api/admin/operations/internships/', 'DELETE', { ids: [i.id] }, 'Internship deleted.')}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* EXPENSES */}
        {mod === 'expenses' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={expPreset} onChange={(e) => setExpPreset(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {expSelected.length > 0 && (
                  <button type="button" className="adm-btn adm-btn-sm" style={{ background: '#dc2626', color: '#fff' }} onClick={() => jsonReq('/api/admin/operations/expenses/', 'DELETE', { ids: expSelected }, 'Expenses deleted.')}>
                    <Trash2 size={13} /> Bulk Delete ({expSelected.length})
                  </button>
                )}
                <a href={`/api/admin/operations/expenses/?category=${encodeURIComponent(expCategory)}&preset=${encodeURIComponent(expPreset)}&export=csv`} className="adm-btn adm-btn-sm adm-btn-outline">
                  <Download size={13} /> Export CSV
                </a>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setExpModal(true)}>
                  <Plus size={14} /> Add Expense
                </button>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}><input type="checkbox" checked={expenses.length > 0 && expSelected.length === expenses.length} onChange={(e) => setExpSelected(e.target.checked ? expenses.map((x) => x.id) : [])} /></th>
                    <th>Title</th><th>Category</th><th>Amount</th><th>Mode</th><th>Attachment</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((x) => (
                    <tr key={x.id}>
                      <td><input type="checkbox" checked={expSelected.includes(x.id)} onChange={() => setExpSelected((p) => p.includes(x.id) ? p.filter((i) => i !== x.id) : [...p, x.id])} /></td>
                      <td><strong>{x.title}</strong><div><small style={{ color: '#64748b' }}>{x.payee}</small></div></td>
                      <td>{x.category}</td>
                      <td><strong>Rs. {Number(x.amount).toLocaleString('en-IN')}</strong></td>
                      <td>{x.paymentMode}</td>
                      <td>{x.attachmentSrc ? <a href={x.attachmentSrc} target="_blank" rel="noreferrer">View Bill</a> : '—'}</td>
                      <td>{x.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* JOBS */}
        {mod === 'jobs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'Active', label: 'Active Jobs' },
                  { id: 'Inactive', label: 'Inactive Jobs' },
                  { id: 'applications', label: 'Career Applications' },
                ].map((t) => (
                  <button key={t.id} type="button" className={`adm-btn adm-btn-sm ${jobTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setJobTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setJobModal(true)}>
                <Plus size={14} /> Add Job
              </button>
            </div>
            {jobTab === 'applications' ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Applicant</th><th>Job Title</th><th>Email / Phone</th><th>Experience</th></tr></thead>
                  <tbody>
                    {jobApps.map((a) => (
                      <tr key={a.id}><td><strong>{a.name}</strong></td><td>{a.jobTitle}</td><td>{a.email} • {a.phone}</td><td>{a.experience}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Role Title</th><th>Type &amp; Experience</th><th>Location</th><th>Applications</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id}>
                        <td><strong>{j.title}</strong></td>
                        <td>{j.jobType} • {j.experience}</td>
                        <td>{j.location}</td>
                        <td>{j.applicationsCount}</td>
                        <td><span className={`adm-badge ${j.status === 'Active' ? 'green' : 'gray'}`}>{j.status}</span></td>
                        <td><button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => jsonReq('/api/admin/operations/jobs/', 'DELETE', { ids: [j.id] }, 'Job removed.')}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PROJECTS */}
        {mod === 'projects' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'all', label: 'All Projects' },
                  { id: 'active', label: 'Active' },
                  { id: 'completed', label: 'Completed' },
                ].map((t) => (
                  <button key={t.id} type="button" className={`adm-btn adm-btn-sm ${prjTab === t.id ? 'adm-btn-primary' : 'adm-btn-outline'}`} onClick={() => setPrjTab(t.id)}>{t.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/projects" target="_blank" className="adm-btn adm-btn-sm adm-btn-outline"><ExternalLink size={13} /> Public Projects</Link>
                <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setPrjModal(true)}><Plus size={14} /> New Project</button>
              </div>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Project</th><th>Category</th><th>Goal vs Spent</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.title}</strong><div><small style={{ color: '#64748b' }}>{p.location}</small></div></td>
                      <td>{p.category}</td>
                      <td>Rs. {Number(p.spentAmount).toLocaleString('en-IN')} / Rs. {Number(p.goalAmount).toLocaleString('en-IN')}</td>
                      <td><strong>{p.progressPercent}%</strong></td>
                      <td><span className={`adm-badge ${p.status === 'Completed' ? 'blue' : 'green'}`}>{p.status}</span></td>
                      <td><button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => jsonReq('/api/admin/operations/projects/', 'DELETE', { ids: [p.id] }, 'Project removed.')}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* VIDEOS */}
        {mod === 'videos' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, flex: '1 1 280px' }}>
                <input value={videoSearch} onChange={(e) => setVideoSearch(e.target.value)} placeholder="Search videos by title, link..." style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                <select value={videoStatus} onChange={(e) => setVideoStatus(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setVideoModal(true)}><Plus size={14} /> Add Video</button>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Video Title</th><th>Category</th><th>Link</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {videos.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.title}</strong></td>
                      <td>{v.category}</td>
                      <td><small>{v.videoUrl}</small></td>
                      <td><span className="adm-badge green">{v.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setVideoPreview(v)}><Eye size={13} /></button>
                          <button type="button" className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: '#dc2626' }} onClick={() => jsonReq('/api/admin/operations/videos/', 'DELETE', { ids: [v.id] }, 'Video deleted.')}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Video Modal */}
      {videoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setVideoModal(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (await jsonReq('/api/admin/operations/videos/', 'POST', videoForm, 'Video added.')) setVideoModal(false); }} style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Add Video</h3>
            <input required placeholder="Video Title *" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required type="url" placeholder="HTTPS YouTube or Vimeo URL *" value={videoForm.videoUrl} onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input placeholder="Category" value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <textarea rows={2} placeholder="Description" value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setVideoModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Video</button>
            </div>
          </form>
        </div>
      )}

      {/* Video Preview Modal */}
      {videoPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.75)', padding: 16 }} onClick={() => setVideoPreview(null)}>
          <div style={{ width: 'min(680px, 100%)', background: '#0f172a', color: '#fff', borderRadius: 12, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong>{videoPreview.title}</strong>
              <button type="button" onClick={() => setVideoPreview(null)} style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <iframe src={videoPreview.embedUrl} title={videoPreview.title} style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 8 }} allowFullScreen />
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {eventModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setEventModal(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (await jsonReq('/api/admin/operations/events/', 'POST', eventForm, 'Event created.')) setEventModal(false); }} style={{ width: 'min(500px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Create Event</h3>
            <input required placeholder="Event Title *" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input placeholder="Time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <input required placeholder="Venue *" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input type="number" min="1" placeholder="Capacity" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="number" min="0" placeholder="Fee Rs." value={eventForm.fee} onChange={(e) => setEventForm({ ...eventForm, fee: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <textarea rows={2} placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setEventModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Event</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Internship Modal */}
      {internModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setInternModal(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (await jsonReq('/api/admin/operations/internships/', 'POST', internForm, 'Internship created.')) setInternModal(false); }} style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Add New Internship</h3>
            <input required placeholder="Internship Title *" value={internForm.title} onChange={(e) => setInternForm({ ...internForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={internForm.type} onChange={(e) => setInternForm({ ...internForm, type: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {INTERNSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input required placeholder="Duration *" value={internForm.duration} onChange={(e) => setInternForm({ ...internForm, duration: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="City" value={internForm.city} onChange={(e) => setInternForm({ ...internForm, city: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <select value={internForm.stipend} onChange={(e) => setInternForm({ ...internForm, stipend: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                <option value="No">Unpaid / Volunteer</option>
                <option value="Yes">Paid Stipend</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setInternModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Internship</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Expense Modal */}
      {expModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setExpModal(false)}>
          <form onSubmit={handleSaveExpense} style={{ width: 'min(500px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Record Expense &amp; Voucher</h3>
            <input required placeholder="Expense Title *" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={expForm.paymentMode} onChange={(e) => setExpForm({ ...expForm, paymentMode: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                {EXPENSE_PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required type="number" min="1" placeholder="Amount Rs. *" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <input placeholder="Payee / Vendor" value={expForm.payee} onChange={(e) => setExpForm({ ...expForm, payee: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setExpFile(e.target.files?.[0] || null)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setExpModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Expense</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Job Modal */}
      {jobModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setJobModal(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (await jsonReq('/api/admin/operations/jobs/', 'POST', jobForm, 'Job published.')) setJobModal(false); }} style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Post Career Opening</h3>
            <input required placeholder="Job Title *" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <input required placeholder="Location *" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="Job Type (Full-Time)" value={jobForm.jobType} onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input placeholder="Experience" value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <textarea rows={3} placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setJobModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Save Job</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Project Modal */}
      {prjModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', padding: 16 }} onClick={() => setPrjModal(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (await jsonReq('/api/admin/operations/projects/', 'POST', prjForm, 'Project created.')) setPrjModal(false); }} style={{ width: 'min(480px, 100%)', background: '#fff', borderRadius: 12, padding: 20, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Create Programme Project</h3>
            <input required placeholder="Project Title *" value={prjForm.title} onChange={(e) => setPrjForm({ ...prjForm, title: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <select value={prjForm.category} onChange={(e) => setPrjForm({ ...prjForm, category: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input required type="number" min="100" placeholder="Goal Rs. *" value={prjForm.goalAmount} onChange={(e) => setPrjForm({ ...prjForm, goalAmount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              <input type="number" min="0" placeholder="Spent Rs." value={prjForm.spentAmount} onChange={(e) => setPrjForm({ ...prjForm, spentAmount: e.target.value })} style={{ padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setPrjModal(false)}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Create Project</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
