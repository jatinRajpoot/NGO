'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

const moments = [
  { category: 'Skill & Digital Training', title: 'Digital literacy', image: '/images/computer-lab.jpg', alt: 'Students using computers in a classroom' },
  { category: 'Health & Hygiene Camps', title: 'Health awareness', image: '/images/health-check.jpg', alt: 'A doctor checking a patient’s blood pressure' },
  { category: 'Women Empowerment', title: 'Women and livelihoods', image: '/images/rural-woman.jpg', alt: 'A woman in a sari standing with a child in a village' },
  { category: 'Community & Environment', title: 'Community participation', image: '/images/rural-community.jpg', alt: 'Women and children in a rural community' },
  { category: 'Skill & Digital Training', title: 'Learning together', image: '/hero-bg.jpg', alt: 'Children reading together in a village' },
];
const filters = ['All moments', 'Skill & Digital Training', 'Health & Hygiene Camps', 'Women Empowerment', 'Community & Environment'];

export default function ProjectGallery() {
  const [filter, setFilter] = useState(filters[0]);
  const visibleMoments = filter === filters[0] ? moments : moments.filter((moment) => moment.category === filter);
  return <>
    <div className="gallery-filters" role="group" aria-label="Filter project images">
      {filters.map((item) => <button type="button" key={item} className={filter === item ? 'is-active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    <div className="gallery-grid">
      {visibleMoments.map((moment) => <article className="gallery-card" key={`${moment.title}-${moment.image}`}>
        <div className="gallery-media"><Image src={moment.image} alt={moment.alt} fill sizes="(max-width: 700px) 100vw, 25vw" /></div>
        <div className="gallery-card-copy"><span>{moment.category}</span><h3>{moment.title}</h3><small>Illustrative community image</small></div>
      </article>)}
    </div>
    <p className="gallery-note">These photographs illustrate the foundation’s focus areas and are not represented as GSDD Foundation field documentation. Follow official channels for organization updates.</p>
  </>;
}
