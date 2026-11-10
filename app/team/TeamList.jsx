'use client';

import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { organization } from '../data/site-data';

export const teamMembers = [
  {
    initials: 'MB',
    name: 'Manoj Kumar Bishwas',
    role: 'Founder / Chief Executive Officer',
    category: 'Founders',
    badge: 'Founder / CEO',
    bio: 'Founding leadership listed in public records supplied by Global Skills & Digital Development Foundation.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'AK',
    name: 'Arvind Kumar',
    role: 'Founder / Managing Director',
    category: 'Founders',
    badge: 'Founder / MD',
    bio: 'Founding leadership listed in public records supplied by Global Skills & Digital Development Foundation.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'JR',
    name: 'Jatin Rajpoot',
    role: 'President (Committee Directory)',
    category: 'Executive Committee',
    badge: 'President',
    bio: 'Presides over executive coordination, youth digital empowerment outreach, and district-level initiatives.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'AS',
    name: 'Amit Kumar Singh',
    role: 'General Secretary (Committee Directory)',
    category: 'Executive Committee',
    badge: 'General Secretary',
    bio: 'Supports foundation administration, compliance documentation, membership coordination, and official reporting.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'SD',
    name: 'Sunita Devi',
    role: 'Vice President & Women Empowerment Head',
    category: 'Executive Committee',
    badge: 'Vice President',
    bio: 'Coordinates community self-help groups, vocational skill centers for women, and grassroots awareness drives.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'PK',
    name: 'Pooja Kumari',
    role: 'Executive Member & Education In-charge',
    category: 'Executive Committee',
    badge: 'Education In-charge',
    bio: 'Coordinates tuition centers, student mentorship programs, and rural digital literacy workshops.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'RS',
    name: 'Dr. Ramesh Kumar Sharma',
    role: 'Medical Advisor',
    category: 'Advisory Board',
    badge: 'Advisory Board',
    bio: 'Advises on community health camps, preventive sanitation workshops, and rural medical outreach programs.',
    email: organization.email,
    phone: organization.phone,
  },
  {
    initials: 'RV',
    name: 'Advocate R. K. Verma',
    role: 'Legal & Governance Counsel',
    category: 'Advisory Board',
    badge: 'Legal Advisory',
    bio: 'Advises on Section 8 compliance, statutory transparency, CSR partnerships, and legal governance.',
    email: organization.email,
    phone: organization.phone,
  },
];

const categories = ['All Members', 'Founders', 'Executive Committee', 'Advisory Board'];

export default function TeamList() {
  const [selectedCategory, setSelectedCategory] = useState('All Members');

  const filteredMembers = selectedCategory === 'All Members'
    ? teamMembers
    : teamMembers.filter((m) => m.category === selectedCategory);

  return (
    <div>
      <div className="team-filter-tabs" role="tablist" aria-label="Team category filters">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat}
            className={`team-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat} ({cat === 'All Members' ? teamMembers.length : teamMembers.filter((m) => m.category === cat).length})
          </button>
        ))}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--gsdd-text-muted)', marginBottom: '16px' }}>
        Founding leadership is reproduced from public records supplied by GSDD Foundation. Executive committee and advisory entries are directory contacts routed through the foundation office.
      </p>

      <div className="team-profile-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
        {filteredMembers.map((member) => (
          <article className="team-card-expanded" key={member.name}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div className="team-profile-initials" aria-hidden="true">
                {member.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={`team-badge ${member.category === 'Founders' ? 'team-badge-patron' : member.category === 'Advisory Board' ? 'team-badge-advisory' : ''}`}>
                  {member.badge}
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '18px', color: 'var(--gsdd-navy-dark)' }}>
                  {member.name}
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#7B684B' }}>
                  {member.role}
                </span>
              </div>
            </div>

            <p className="team-bio">{member.bio}</p>

            <div className="team-card-footer">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={13} aria-hidden="true" />
                <a href={`mailto:${member.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {member.email}
                </a>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} aria-hidden="true" />
                <a href={`tel:${member.phone.replace(/\s+/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {member.phone}
                </a>
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
