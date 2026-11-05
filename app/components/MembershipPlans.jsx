'use client';

import { useState } from 'react';
import { Check, ShieldCheck, UserCheck, Star, Users, ArrowRight, Printer, CheckCircle2, Clock } from 'lucide-react';
import { organization } from '../data/site-data';

export const membershipTiers = [
  {
    id: 'life-member',
    name: 'Life Member & Patron',
    designation: 'Patron / Senior Advisor',
    fee: '₹11,000',
    tenure: 'Lifetime',
    badge: 'Premier',
    popular: false,
    color: '#84641D',
    bgColor: '#FCF8EC',
    borderColor: '#EFE1BD',
    description: 'For esteemed professionals, elders, and leaders wishing to steer the long-term vision of GSDD Foundation.',
    benefits: [
      'Lifetime voting and advisory board participation',
      'Official Gold Laminated Life Member Identity Card',
      'Permanent Framed Citation of Honor & Section 8 Recognition',
      'VIP invitation to Foundation annual dinners & state conclaves',
      'Exempt from all annual renewal charges',
    ],
  },
  {
    id: 'executive-member',
    name: 'Executive Member',
    designation: 'Vice President / Secretary / In-charge',
    fee: '₹1,200',
    tenure: 'Annual (₹100/mo)',
    badge: 'Most Active',
    popular: true,
    color: '#0D47A1',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    description: 'For passionate organizers leading specific verticals like education, health camps, or women empowerment.',
    benefits: [
      'Eligible to hold executive portfolio & lead program committees',
      'Official Executive Body Identity Card & appointment letter',
      'Direct voting rights in annual general body proceedings',
      'Authority to organize certified grassroots awareness camps',
      'Priority access to foundation project grants & resources',
    ],
  },
  {
    id: 'core-member',
    name: 'Core Member',
    designation: 'General Secretary / District Coordinator',
    fee: '₹1,200',
    tenure: 'Annual',
    badge: 'Core Team',
    popular: false,
    color: '#0F766E',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    description: 'For key district drivers managing volunteer cohorts, center administration, and survey projects.',
    benefits: [
      'Official Core Member ID Card with QR authenticity code',
      'Coordinating authority for block & panchayat level programs',
      'Monthly internal governance briefing & activity planning',
      'Representation in district administration stakeholder meetings',
      'Official recommendation letters for career & CSR opportunities',
    ],
  },
  {
    id: 'volunteer-member',
    name: 'Active Volunteer',
    designation: 'Community Volunteer / Ambassador',
    fee: '₹500 / yr',
    tenure: 'or ₹100 / month',
    badge: 'Youth & Students',
    popular: false,
    color: '#374151',
    bgColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    description: 'For students, youth, and community members contributing hands-on time to our digital labs and campaigns.',
    benefits: [
      'Official Volunteer Badge & digital membership profile',
      'Volunteer Service Certificates after completing projects',
      'Free training workshops in digital skills & leadership',
      'Skill endorsement for college credits & internships',
      'Networking with district leaders and social innovators',
    ],
  },
];

export default function MembershipPlans() {
  const [selectedTier, setSelectedTier] = useState('executive-member');
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'apply'
  
  // Registration Form States
  const [fullName, setFullName] = useState('');
  const [fatherSpouse, setFatherSpouse] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Araria');
  const [state, setState] = useState('Bihar');
  const [pincode, setPincode] = useState('854334');
  const [desiredDesignation, setDesiredDesignation] = useState('Executive Member');
  const [interestArea, setInterestArea] = useState('Digital Literacy & Skill Development');

  const [applicationResult, setApplicationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleApplySubmit(e) {
    e.preventDefault();
    setLoading(true);

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const appId = `GSDD-M-APP-2026-${randomId}`;

    setTimeout(() => {
      setApplicationResult({
        appId,
        name: fullName.trim(),
        fatherSpouse: fatherSpouse.trim(),
        phone: phone.trim(),
        email: email.trim(),
        tier: selectedTier,
        designation: desiredDesignation,
        address: `${address}, ${district}, ${state} - ${pincode}`,
        interest: interestArea,
        bloodGroup,
        appliedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
      setLoading(false);
    }, 500);
  }

  return (
    <div className="membership-portal-wrapper">
      <div className="membership-view-tabs" role="tablist">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <ShieldCheck size={16} aria-hidden="true" /> View Membership Plans &amp; Designations
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          <UserCheck size={16} aria-hidden="true" /> Apply for Membership (Online Registration)
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div className="membership-plans-view">
          <div className="plans-header">
            <span className="eyebrow"><span /> Available Plans &amp; Designations</span>
            <h2>Select the membership category that fits your journey.</h2>
            <p>Every member joins an active community striving for education, women empowerment, and digital literacy in Bihar and beyond.</p>
          </div>

          <div className="membership-tiers-grid">
            {membershipTiers.map((tier) => (
              <div
                key={tier.id}
                className={`membership-tier-card ${tier.popular ? 'is-popular' : ''}`}
                style={{ borderColor: tier.borderColor }}
              >
                {tier.popular && <span className="tier-ribbon">Most Popular</span>}
                <div className="tier-card-header" style={{ background: tier.bgColor }}>
                  <span className="tier-badge" style={{ color: tier.color }}>{tier.badge}</span>
                  <h3>{tier.name}</h3>
                  <div className="tier-fee">
                    <span className="fee-amount">{tier.fee}</span>
                    <span className="fee-tenure">/ {tier.tenure}</span>
                  </div>
                  <span className="tier-designation">Designation: <strong>{tier.designation}</strong></span>
                </div>

                <div className="tier-card-body">
                  <p className="tier-desc">{tier.description}</p>
                  <ul className="tier-benefits-list">
                    {tier.benefits.map((b, i) => (
                      <li key={i}>
                        <Check size={15} color="#15803D" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`button ${tier.popular ? 'button-blue' : 'button-outline-blue'} full-width`}
                    onClick={() => {
                      setSelectedTier(tier.id);
                      setDesiredDesignation(tier.designation);
                      setActiveTab('apply');
                    }}
                  >
                    Apply for this plan <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="membership-application-view">
          {!applicationResult ? (
            <form onSubmit={handleApplySubmit} className="membership-app-form card-surface">
              <div className="form-header">
                <span className="eyebrow"><span /> Membership Registration</span>
                <h2>Official Membership Application Form</h2>
                <p>Complete this form to apply for registration with Global Skills &amp; Digital Development Foundation. Your application will be processed by the Executive Committee.</p>
              </div>

              <div className="membership-selection-row">
                <label>
                  <span>Selected Membership Plan *</span>
                  <select
                    value={selectedTier}
                    onChange={(e) => {
                      setSelectedTier(e.target.value);
                      const t = membershipTiers.find((item) => item.id === e.target.value);
                      if (t) setDesiredDesignation(t.designation);
                    }}
                  >
                    {membershipTiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.fee} ({t.tenure})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Desired Foundation Designation *</span>
                  <input
                    type="text"
                    required
                    value={desiredDesignation}
                    onChange={(e) => setDesiredDesignation(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Applicant Full Name *</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Full Name as per Aadhaar / ID"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label>
                  <span>Father&apos;s / Spouse&apos;s Name *</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Father or Husband name"
                    value={fatherSpouse}
                    onChange={(e) => setFatherSpouse(e.target.value)}
                  />
                </label>

                <label>
                  <span>Mobile / WhatsApp Number *</span>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label>
                  <span>Email Address *</span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  <span>Date of Birth</span>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </label>

                <label>
                  <span>Blood Group</span>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </label>

                <label className="span-two">
                  <span>Postal Residential Address *</span>
                  <input
                    type="text"
                    required
                    placeholder="Village / Ward / Road / House Number"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>

                <label>
                  <span>District &amp; State *</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  <span>PIN Code *</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="854334"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </label>

                <label className="span-two">
                  <span>Area of Social Interest / Voluntary Contribution</span>
                  <select value={interestArea} onChange={(e) => setInterestArea(e.target.value)}>
                    <option value="Digital Literacy &amp; Skill Development">Digital Literacy &amp; Skill Development</option>
                    <option value="Healthcare, Hygiene &amp; Blood Camps">Healthcare, Hygiene &amp; Blood Camps</option>
                    <option value="Women Empowerment &amp; Self-Help Groups">Women Empowerment &amp; Self-Help Groups</option>
                    <option value="Free Education &amp; Student Coaching">Free Education &amp; Student Coaching</option>
                    <option value="Environmental Sanitation &amp; Rural Welfare">Environmental Sanitation &amp; Rural Welfare</option>
                  </select>
                </label>
              </div>

              <div className="form-action-row">
                <button type="submit" className="button button-blue" disabled={loading}>
                  <UserCheck size={18} aria-hidden="true" />
                  {loading ? 'Submitting Application...' : 'Submit Membership Application'}
                </button>
              </div>
            </form>
          ) : (
            <div className="application-success-card card-surface">
              <div className="success-banner">
                <CheckCircle2 size={36} color="#15803D" aria-hidden="true" />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--gsdd-navy-dark)' }}>Application Successfully Submitted!</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--gsdd-text-muted)' }}>
                    Your registration application has been received and logged in the foundation executive registry.
                  </p>
                </div>
              </div>

              <div className="app-summary-box">
                <div className="summary-row">
                  <span className="lbl">Application Reference Number:</span>
                  <span className="val highlight"><code>{applicationResult.appId}</code></span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Applicant Name:</span>
                  <span className="val">{applicationResult.name}</span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Father / Spouse Name:</span>
                  <span className="val">{applicationResult.fatherSpouse}</span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Applied Designation:</span>
                  <span className="val"><strong>{applicationResult.designation}</strong></span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Contact Phone:</span>
                  <span className="val">{applicationResult.phone}</span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Address:</span>
                  <span className="val">{applicationResult.address}</span>
                </div>
                <div className="summary-row">
                  <span className="lbl">Applied On:</span>
                  <span className="val">{applicationResult.appliedDate}</span>
                </div>
              </div>

              <div className="success-actions no-print">
                <button type="button" onClick={() => window.print()} className="button button-blue">
                  <Printer size={16} aria-hidden="true" /> Print Application Slip
                </button>
                <a
                  href={`https://wa.me/${organization.phoneHref.replace(/\+/g, '')}?text=${encodeURIComponent(`Hello GSDD Foundation, I have submitted my membership application with ID: ${applicationResult.appId} for ${applicationResult.designation}. Please review.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-outline-blue"
                >
                  Notify via WhatsApp
                </a>
                <button type="button" onClick={() => setApplicationResult(null)} className="button-text">
                  Submit another application
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
