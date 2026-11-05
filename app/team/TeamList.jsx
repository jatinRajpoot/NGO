'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Phone, ShieldCheck, Award, Briefcase } from 'lucide-react';

export const teamMembers = [
  {
    initials: 'MB',
    name: 'Manoj Kumar Bishwas',
    role: 'Founder / Chief Executive Officer',
    category: 'Founders',
    badge: 'Founder / CEO',
    bio: 'Visionary co-founder driving strategic initiatives, governance, and institutional partnerships for rural empowerment.',
    email: 'ceo@gsddfoundation.org',
    phone: '+91 95467 52915',
  },
  {
    initials: 'AK',
    name: 'Arvind Kumar',
    role: 'Founder / Managing Director',
    category: 'Founders',
    badge: 'Founder / MD',
    bio: 'Co-founder overseeing operational strategy, digital transformation roadmaps, and community outreach infrastructure.',
    email: 'md@gsddfoundation.org',
    phone: '+91 95467 52915',
  },
  {
    initials: 'JR',
    name: 'Jatin Rajpoot',
    role: 'President',
    category: 'Executive Committee',
    badge: 'President',
    bio: 'Presides over executive meetings, spearheads youth digital empowerment campaigns, and coordinates district-level initiatives.',
    email: 'president@gsddfoundation.org',
    phone: '+91 95467 52915',
  },
  {
    initials: 'AS',
    name: 'Amit Kumar Singh',
    role: 'General Secretary',
    category: 'Executive Committee',
    badge: 'General Secretary',
    bio: 'Oversees day-to-day NGO administration, compliance documentation, membership coordination, and official reporting.',
    email: 'secretary@gsddfoundation.org',
    phone: '+91 91223 44556',
  },
  {
    initials: 'SD',
    name: 'Sunita Devi',
    role: 'Vice President & Women Empowerment Head',
    category: 'Executive Committee',
    badge: 'Vice President',
    bio: 'Leads community self-help groups, vocational skill centers for women, and grassroots awareness drives in Araria district.',
    email: 'sunita.devi@gsddfoundation.org',
    phone: '+91 94312 98765',
  },
  {
    initials: 'PK',
    name: 'Pooja Kumari',
    role: 'Executive Member & Education In-charge',
    category: 'Executive Committee',
    badge: 'Education In-charge',
    bio: 'Coordinates free tuition centers, student mentorship programs, and rural digital literacy workshops.',
    email: 'education@gsddfoundation.org',
    phone: '+91 82100 55678',
  },
  {
    initials: 'RS',
    name: 'Dr. Ramesh Kumar Sharma',
    role: 'Chief Medical Advisor',
    category: 'Advisory Board',
    badge: 'Advisory Board',
    bio: 'Senior physician advising on community health camps, preventive sanitation workshops, and rural medical outreach programs.',
    email: 'health.advisor@gsddfoundation.org',
    phone: '+91 98350 12345',
  },
  {
    initials: 'RV',
    name: 'Advocate R. K. Verma',
    role: 'Legal & Governance Counsel',
    category: 'Advisory Board',
    badge: 'Legal Advisory',
    bio: 'Practicing advocate advising on Section 8 compliance, statutory transparencies, CSR partnerships, and legal governance.',
    email: 'legal@gsddfoundation.org',
    phone: '+91 94300 11223',
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

      <div className="team-profile-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
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
