export const organization = {
  legalName: 'GLOBAL SKILLS & DIGITAL DEVELOPMENT FOUNDATION',
  shortName: 'GSDD FOUNDATION',
  tagline: 'Empowering People. Developing Skills. Transforming Communities.',
  cin: 'U88900BR2026NPL086114',
  darpan: 'BR/2026/1140209',
  tax12a: 'AANCG1860EE20261',
  tax80g: 'AANCG1860EF20261',
  pan: 'AANCG1860E',
  tan: 'PTNG16847',
  udyam: 'UDYAM-BR-01-0061552',
  email: 'foundationgsdd@gmail.com',
  phone: '+91 9546752915',
  phoneHref: '+919546752915',
  address: 'Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, NH 327E, Araria, Bihar, India',
};

export const socialLinks = [
  { label: 'WhatsApp Channel', platform: 'whatsapp', href: 'https://whatsapp.com/channel/0029VbDI7zjElagzRp0vTp0t', color: '#25D366', handle: 'GSDD Channel' },
  { label: 'Telegram', platform: 'telegram', href: 'https://web.telegram.org/gsddfoundation/', color: '#229ED9', handle: '@gsddfoundation' },
  { label: 'YouTube', platform: 'youtube', href: 'https://www.youtube.com/@gsddfoundation', color: '#FF0000', handle: '@gsddfoundation' },
  { label: 'LinkedIn', platform: 'linkedin', href: 'https://www.linkedin.com/company/gsddfoundation/', color: '#0A66C2', handle: 'gsddfoundation' },
  { label: 'Facebook', platform: 'facebook', href: 'https://www.facebook.com/gsddfoundation', color: '#1877F2', handle: 'gsddfoundation' },
  { label: 'Instagram', platform: 'instagram', href: 'https://www.instagram.com/gsddfoundation', color: '#E4405F', handle: '@gsddfoundation' },
  { label: 'X', platform: 'x', href: 'https://x.com/gsddfoundation', color: '#0F1419', handle: '@gsddfoundation' },
  { label: 'Snapchat', platform: 'snapchat', href: 'https://www.snapchat.com/@gsddfoundation', color: '#FFFC00', handle: '@gsddfoundation' },
];

export const coreAreas = [
  {
    number: '01',
    slug: 'health-awareness',
    title: 'Health Awareness & Well-Being',
    subtitle: 'Promoting Healthier Communities Through Awareness',
    description: 'Promoting health awareness, preventive healthcare education, and access to essential health-related information to encourage informed decisions and improve community well-being.',
    image: '/images/health-check.jpg',
    alt: 'A doctor checking an older patient’s blood pressure',
  },
  {
    number: '02',
    slug: 'education-skills',
    title: 'Education & Skill Development',
    subtitle: 'Empowering Individuals Through Knowledge and Skills',
    description: 'Encouraging educational awareness, vocational skills, capacity building, and lifelong learning to enhance individual capabilities and improve access to personal and professional development opportunities.',
    image: '/hero-bg.jpg',
    alt: 'Children reading and learning together in a village',
  },
  {
    number: '03',
    slug: 'digital-empowerment',
    title: 'Digital Empowerment & Inclusion',
    subtitle: 'Bridging the Digital Divide Through Technology',
    description: 'Promoting digital literacy, awareness of digital services, and responsible technology adoption to help individuals and underserved communities access information and participate in the evolving digital ecosystem.',
    image: '/images/computer-lab.jpg',
    alt: 'Students working at computers in a school computer lab',
  },
  {
    number: '04',
    slug: 'community-development',
    title: 'Community Development & Social Welfare',
    subtitle: 'Strengthening Communities Through Collective Action',
    description: 'Supporting community participation, social awareness, grassroots initiatives, and inclusive development activities that address local needs and contribute to stronger, more resilient communities.',
    image: '/images/rural-community.jpg',
    alt: 'Women and children gathered in a rural community',
  },
  {
    number: '05',
    slug: 'women-empowerment',
    title: 'Women Empowerment & Livelihood Development',
    subtitle: 'Creating Opportunities. Enabling Independence.',
    description: 'Encouraging women’s participation in social and economic development through skill-building opportunities, livelihood awareness, capacity development, and initiatives that promote dignity, self-reliance, and financial independence.',
    image: '/images/rural-woman.jpg',
    alt: 'A woman in a sari with a child in a village',
  },
];

export const workSectors = [
  ['Healthcare Awareness & Community Well-Being', 'Promoting health education, preventive healthcare awareness, hygiene, sanitation, and access to essential health-related information to encourage healthier communities.', '/images/health-check.jpg'],
  ['Education & Literacy', 'Supporting educational awareness, literacy initiatives, learning opportunities, and access to knowledge for children, youth, and underserved communities.', '/hero-bg.jpg'],
  ['Skill Development & Vocational Training', 'Encouraging skill enhancement, vocational learning, capacity building, and employment-oriented training to improve individual capabilities and livelihood prospects.', '/images/rural-woman.jpg'],
  ['Digital Literacy & Digital Inclusion', 'Promoting digital awareness, digital literacy, responsible technology usage, and knowledge of relevant digital services to bridge the digital divide.', '/images/computer-lab.jpg'],
  ['Women Empowerment & Gender Inclusion', 'Encouraging women’s participation, leadership, skill development, equal opportunities, and social and economic empowerment.', '/images/rural-community.jpg'],
  ['Livelihood Generation & Employment Awareness', 'Promoting livelihood awareness, self-employment opportunities, career guidance, and access to information that supports economic independence.', '/images/rural-woman.jpg'],
  ['Rural Development & Community Welfare', 'Supporting grassroots initiatives that encourage rural development, community participation, social inclusion, and improved access to development opportunities.', '/images/rural-community.jpg'],
  ['Environmental Awareness & Sustainability', 'Promoting environmental education, conservation awareness, responsible resource use, cleanliness, and sustainable community practices.', '/images/rural-community.jpg'],
  ['Government Scheme Awareness & Public Services', 'Creating awareness about relevant government welfare schemes, public services, eligibility requirements, and application procedures to help communities make informed decisions.', '/hero-bg.jpg'],
  ['Survey, Research & Social Awareness', 'Supporting community-level surveys, data collection initiatives, and awareness programmes to help identify local needs and inform development-oriented activities, subject to applicable requirements.', '/images/computer-lab.jpg'],
  ['Youth Empowerment & Leadership Development', 'Encouraging youth participation, leadership skills, personal development, volunteering, and constructive involvement in community initiatives.', '/hero-bg.jpg'],
  ['Social Welfare & Inclusive Development', 'Promoting dignity, equal opportunity, community support, and initiatives aimed at improving the well-being of underserved and vulnerable groups.', '/images/rural-community.jpg'],
].map(([title, description, image], index) => ({
  number: String(index + 1).padStart(2, '0'),
  title,
  description,
  image,
}));

export const aims = [
  ['Education and Literacy Development', 'To promote education, literacy, learning opportunities, and educational awareness among children, youth, adults, and underserved communities.'],
  ['Healthcare Awareness and Well-Being', 'To encourage healthcare awareness, preventive health education, hygiene, sanitation, and access to reliable health-related information.'],
  ['Skill Development and Vocational Training', 'To promote vocational education, practical skills, capacity building, and employment-oriented learning to improve individual capabilities and livelihood prospects.'],
  ['Digital Literacy and Inclusion', 'To encourage digital literacy, awareness of digital services, responsible technology usage, and access to relevant digital opportunities.'],
  ['Women Empowerment', 'To support women’s empowerment through education, skill development, awareness, livelihood opportunities, and initiatives that encourage equality and independence.'],
  ['Livelihood and Employment Opportunities', 'To promote awareness of employment, entrepreneurship, self-employment, and income-generating opportunities that support economic independence.'],
  ['Rural and Community Development', 'To encourage grassroots development, community participation, social welfare, and initiatives that address the needs of rural and underserved populations.'],
  ['Environmental Protection and Sustainability', 'To promote environmental awareness, conservation, cleanliness, responsible resource use, and sustainable community practices.'],
  ['Government Welfare Scheme Awareness', 'To create awareness about applicable government welfare schemes, public services, eligibility criteria, and access procedures to help people make informed decisions.'],
  ['Youth Empowerment and Leadership', 'To encourage youth participation, leadership development, volunteering, life skills, and constructive involvement in community development.'],
  ['Social Welfare and Inclusion', 'To promote dignity, equality, social inclusion, and community support for underserved and vulnerable sections of society.'],
  ['Research, Surveys and Public Awareness', 'To support appropriate surveys, community assessments, information collection, and awareness initiatives that help identify social needs and inform development activities.'],
  ['Collaboration and Partnerships', 'To establish collaborative relationships with NGOs, educational institutions, healthcare organizations, CSR partners, companies, government bodies, and other development stakeholders for shared social objectives.'],
];

export const projects = [
  {
    number: '01',
    title: 'Gramin Digital Saksharta & Cyber Awareness Abhiyan',
    area: 'Digital Empowerment',
    location: 'Raniganj, Araria & adjoining rural blocks in Bihar',
    objective: 'Bridge the rural digital divide with basic computer skills, smartphone safety, UPI and digital banking literacy, and online public service awareness.',
    image: '/images/computer-lab.jpg',
    cta: 'Sponsor a rural digital literacy batch',
  },
  {
    number: '02',
    title: 'Nari Kaushal & Aajeevika Kendra',
    area: 'Women Empowerment',
    location: 'Underserved rural and semi-urban clusters',
    objective: 'Support tailoring, handicraft, digital entrepreneurship, and financial literacy skills that can promote self-employment and family dignity.',
    image: '/images/rural-woman.jpg',
    cta: 'Support women’s skill training',
  },
  {
    number: '03',
    title: 'Jan Kalyan & Sarkari Yojana Awareness Camps',
    area: 'Community & Public Services',
    location: 'Panchayat-level helpdesks across Araria & Bihar',
    objective: 'Share clear information about eligibility and application procedures for welfare schemes, scholarships, health cards, and social security benefits.',
    image: '/images/rural-community.jpg',
    cta: 'Partner for a village awareness camp',
  },
  {
    number: '04',
    title: 'Swasth Samaj Preventive Health & Hygiene Drives',
    area: 'Health Awareness',
    location: 'Rural schools and community centers',
    objective: 'Plan preventive health checkups, menstrual hygiene awareness, maternal nutrition guidance, and community sanitation activities.',
    image: '/images/health-check.jpg',
    cta: 'Fund a community health camp',
  },
];

export const credentials = [
  ['Corporate Identity Number (CIN)', organization.cin, 'Ministry of Corporate Affairs · Section 8 Company, Bihar'],
  ['NITI Aayog NGO Darpan ID', organization.darpan, 'NITI Aayog, Government of India'],
  ['Section 12A Registration', organization.tax12a, 'Income Tax Department of India'],
  ['Section 80G Tax Exemption', organization.tax80g, 'Income Tax Department of India · 50% deduction as stated by the foundation'],
  ['Permanent Account Number (PAN)', organization.pan, 'Income Tax Department of India'],
  ['Tax Deduction Account Number (TAN)', organization.tan, 'Income Tax Department of India'],
  ['MSME / Udyam Registration', organization.udyam, 'Ministry of Micro, Small & Medium Enterprises'],
];

export const visionPillars = [
  ['Empowerment', 'Enabling individuals and communities to realize their potential.'],
  ['Education', 'Encouraging knowledge, learning, and awareness.'],
  ['Equality', 'Promoting dignity, inclusion, and equal opportunities.'],
  ['Sustainability', 'Supporting responsible and long-term community development.'],
  ['Collective Progress', 'Inspiring collaboration for positive social transformation.'],
];
