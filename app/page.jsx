'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Heart,
  Laptop,
  HeartPulse,
  Users,
  Compass,
  FileCheck2,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import DonationChooser from './components/DonationChooser';
import TrustStrip from './components/TrustStrip';
import { coreAreas, organization, projects } from './data/site-data';
import { useLanguage } from './context/LanguageContext';

const citizenServicesHi = [
  {
    title: 'डिजिटल साक्षरता अभियान',
    desc: 'ग्रामीण व वंचित युवाओं हेतु बुनियादी कंप्यूटर, ऑनलाइन सेवाएं व डिजिटल कौशल प्रशिक्षण।',
    icon: Laptop,
    link: '/core-areas#digital-empowerment',
  },
  {
    title: 'स्वास्थ्य जागरूकता शिविर',
    desc: 'ग्रामीण क्षेत्रों में निःशुल्क स्वास्थ्य परामर्श, निवारक स्वास्थ्य शिक्षा व स्वास्थ्य कार्ड जागरूकता।',
    icon: HeartPulse,
    link: '/core-areas#health-awareness',
  },
  {
    title: 'महिला सशक्तिकरण व आजीविका',
    desc: 'कौशल विकास, हस्तशिल्प, स्वरोजगार व वित्तीय स्वावलंबन हेतु मार्गदर्शन एवं प्रशिक्षण।',
    icon: Users,
    link: '/core-areas#women-empowerment',
  },
  {
    title: 'सरकारी योजना मार्गदर्शन',
    desc: 'कल्याणकारी योजनाओं, छात्रवृत्तियों व सामाजिक सुरक्षा लाभों के बारे में पारदर्शी जानकारी।',
    icon: FileCheck2,
    link: '/work-sectors',
  },
  {
    title: 'सामुदायिक सर्वेक्षण व शोध',
    desc: 'जमीनी समस्याओं व विकास आवश्यकताओं की पहचान हेतु तथ्यपरक सर्वेक्षण एवं अध्ययन।',
    icon: Compass,
    link: '/core-areas#community-development',
  },
  {
    title: 'सीएसआर व संस्थागत सहभागिता',
    desc: 'कॉर्पोरेट पार्टनर्स, शैक्षणिक संस्थानों व विकास हितधारकों के साथ संयुक्त सामाजिक परियोजनाएं।',
    icon: Building2,
    link: '/get-involved#partnerships',
  },
];

const citizenServicesEn = [
  {
    title: 'Digital Literacy Mission',
    desc: 'Basic computer education, internet access, and practical digital skills for underserved rural youth.',
    icon: Laptop,
    link: '/core-areas#digital-empowerment',
  },
  {
    title: 'Preventive Health Camps',
    desc: 'Community wellness camps, preventive health education, and awareness of essential health schemes.',
    icon: HeartPulse,
    link: '/core-areas#health-awareness',
  },
  {
    title: 'Women Livelihood Program',
    desc: 'Skill development, vocational training, financial literacy, and self-reliance guidance for women.',
    icon: Users,
    link: '/core-areas#women-empowerment',
  },
  {
    title: 'Public Schemes Guidance',
    desc: 'Transparent information on public welfare schemes, scholarships, and social security entitlements.',
    icon: FileCheck2,
    link: '/work-sectors',
  },
  {
    title: 'Community Needs Survey',
    desc: 'Fact-based ground surveys and community assessments to identify local socio-economic priorities.',
    icon: Compass,
    link: '/core-areas#community-development',
  },
  {
    title: 'CSR & Institutional Alliances',
    desc: 'Collaborative projects with corporate partners, educational institutions, and development stakeholders.',
    icon: Building2,
    link: '/get-involved#partnerships',
  },
];

const noticesHi = [
  { date: '28/10/2026', title: 'नीति आयोग एनजीओ दर्पण पोर्टल पंजीकरण सत्यापन संख्या: BR/2026/1140209।', tag: 'वैधानिक' },
  { date: '24/10/2026', title: 'आयकर धारा 80G अनुमोदन संख्या AANCG1860EF20261 के तहत 50% कर छूट लाभ।', tag: 'आयकर' },
  { date: '18/10/2026', title: 'अररिया, बिहार के ग्रामीण अंचलों में निःशुल्क डिजिटल कौशल जागरूकता सत्र आयोजित।', tag: 'कार्यक्रम' },
  { date: '12/10/2026', title: 'निगमित सामाजिक उत्तरदायित्व (CSR) परियोजनाओं हेतु वार्षिक कार्ययोजना जारी।', tag: 'सीएसआर' },
];

const noticesEn = [
  { date: '28/10/2026', title: 'NITI Aayog NGO Darpan Portal verification confirmed: BR/2026/1140209.', tag: 'Statutory' },
  { date: '24/10/2026', title: '50% tax deduction benefit available under Section 80G Approval AANCG1860EF20261.', tag: 'Tax 80G' },
  { date: '18/10/2026', title: 'Free digital skills awareness and vocational sessions scheduled across rural Bihar.', tag: 'Field Event' },
  { date: '12/10/2026', title: 'Annual social impact blueprint published for CSR and institutional partnerships.', tag: 'CSR Plan' },
];

export default function Home() {
  const { lang, t } = useLanguage();
  const services = lang === 'hi' ? citizenServicesHi : citizenServicesEn;
  const notices = lang === 'hi' ? noticesHi : noticesEn;

  return (
    <>
      {/* 1. Official Government Portal Hero Banner with Background Image */}
      <section className="gov-home-hero">
        {/* Background Image layer */}
        <div className="gov-hero-bg-image-layer" aria-hidden="true">
          <Image
            src="/hero-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="gov-hero-bg-img"
          />
          <div className="gov-hero-bg-overlay" />
        </div>

        <div className="container gov-hero-grid">
          <div className="gov-hero-main-panel">
            <div className="gov-hero-badge-strip">
              <span className="gov-badge-emblem">
                <ShieldCheck size={14} aria-hidden="true" />
                {t('भारत सरकार पंजीकृत धारा 8 गैर-लाभकारी संस्था', 'Registered Section 8 Non-Profit · Govt. of India')}
              </span>
              <span className="gov-badge-id">
                {t('नीति आयोग दर्पण', 'NITI Aayog Darpan')}: {organization.darpan}
              </span>
            </div>

            <div className="gov-hero-headings">
              <h1 className="gov-hero-title">
                {lang === 'hi' ? (
                  <span className="gov-hero-title-single">जन सशक्तिकरण · कौशल संवर्धन · समग्र विकास</span>
                ) : (
                  <span className="gov-hero-title-single">Empowering People · Developing Skills · Transforming Communities</span>
                )}
              </h1>
              <p className="gov-hero-desc">
                {t(
                  'ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन भारत सरकार के कारपोरेट कार्य मंत्रालय के अधीन पंजीकृत एक राष्ट्रीय गैर-लाभकारी संस्था है। यह संस्था बिहार एवं देशभर के वंचित समुदायों में शिक्षा, डिजिटल साक्षरता, स्वास्थ्य जागरूकता, महिला सशक्तिकरण और आजीविका के अवसरों का विस्तार करने हेतु समर्पित है।',
                  'Global Skills & Digital Development Foundation is a registered Section 8 non-profit organization under the Ministry of Corporate Affairs, Government of India. The foundation is dedicated to expanding access to education, digital literacy, healthcare awareness, women empowerment, and sustainable livelihood opportunities across Bihar and India.'
                )}
              </p>
            </div>

            <div className="gov-hero-actions">
              <Link className="gov-btn-primary" href="/get-involved">
                {t('नागरिक पंजीकरण', 'Citizen Registration')} <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link className="gov-btn-secondary" href="/donate">
                {t('दान करें (80G कर छूट)', 'Donate (80G Tax Benefit)')} <Heart size={14} fill="currentColor" aria-hidden="true" />
              </Link>
              <Link className="gov-btn-outline" href="/transparency">
                {t('वैधानिक प्रमाणपत्र', 'Statutory Certificates')} <FileText size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="gov-hero-footer-bar">
              <div className="gov-hero-stat">
                <strong>{organization.cin}</strong>
                <small>{t('कॉर्पोरेट पहचान संख्या (CIN)', 'Corporate Identity (CIN)')}</small>
              </div>
              <div className="gov-hero-stat">
                <strong>{organization.darpan}</strong>
                <small>{t('नीति आयोग दर्पण आईडी', 'NITI Aayog Darpan ID')}</small>
              </div>
              <div className="gov-hero-stat">
                <strong>12A &amp; 80G</strong>
                <small>{t('आयकर छूट प्रमाणित', 'Income Tax Exempt Certified')}</small>
              </div>
              <div className="gov-hero-stat">
                <strong>{organization.udyam}</strong>
                <small>{t('एमएसएमई उद्यम पंजीकरण', 'MSME Udyam Registration')}</small>
              </div>
            </div>
          </div>

          <div className="gov-hero-side-widget">
            <DonationChooser compact />
          </div>
        </div>
      </section>

      {/* 2. Official Statutory Credentials Ribbon */}
      <TrustStrip />

      {/* 3. Citizen Services & Portal Directory Grid */}
      <section className="gov-section-services section-pad">
        <div className="container">
          <div className="gov-section-header">
            <div className="gov-section-title-wrap">
              <span className="gov-eyebrow">
                {t('नागरिक सेवाएं एवं प्रमुख कार्यक्रम', 'CITIZEN INITIATIVES & SERVICES')}
              </span>
              <h2>
                {t('नागरिक सेवाएं एवं विकास कार्यक्रम', 'CITIZEN SERVICES & DEVELOPMENT PROGRAMS')}
              </h2>
              <div className="gov-title-rule" />
            </div>
            <p className="gov-section-desc">
              {t(
                'संस्था द्वारा संचालित व प्रस्तावित जनकल्याणकारी कार्यक्रम, जिनका उद्देश्य ग्रामीण व पिछड़े समुदायों तक विकास के अवसरों को पहुंचाना है।',
                'Flagship development programs designed to connect rural and underserved communities with education, skills, and socio-economic opportunities.'
              )}
            </p>
          </div>

          <div className="gov-services-grid">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <article className="gov-service-card" key={idx}>
                  <div className="gov-service-card-top">
                    <div className="gov-service-icon-box">
                      <Icon size={24} aria-hidden="true" />
                    </div>
                    <span className="gov-service-number">0{idx + 1}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                  <Link href={service.link} className="gov-service-link">
                    {t('विवरण देखें', 'Learn More')} <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Three-Column Government Dashboard */}
      <section className="gov-section-dashboard section-pad">
        <div className="container">
          <div className="gov-dashboard-grid">
            {/* Column 1: Notice Board */}
            <div className="gov-dash-panel">
              <div className="gov-dash-panel-header gov-header-blue">
                <h3>{t('कार्यालय सूचनाएं व परिपत्र', 'Official Notices & Circulars')}</h3>
                <Link href="/transparency" className="gov-dash-view-all">
                  {t('सभी देखें', 'View All')}
                </Link>
              </div>
              <div className="gov-dash-panel-body">
                <ul className="gov-notice-list">
                  {notices.map((notice, idx) => (
                    <li key={idx} className="gov-notice-item">
                      <div className="gov-notice-meta">
                        <span className="gov-notice-date">{notice.date}</span>
                        <span className="gov-notice-tag">{notice.tag}</span>
                      </div>
                      <p>{notice.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2: Statutory Compliance Directory */}
            <div className="gov-dash-panel">
              <div className="gov-dash-panel-header gov-header-saffron">
                <h3>{t('वैधानिक अभिलेख व पंजीकरण', 'Statutory Records & Verification')}</h3>
                <Link href="/transparency" className="gov-dash-view-all">
                  {t('सत्यापन', 'Verify')}
                </Link>
              </div>
              <div className="gov-dash-panel-body">
                <div className="gov-compliance-table">
                  <div className="gov-compliance-row">
                    <span>{t('वैधानिक स्थिति', 'Legal Status')}</span>
                    <strong>{t('धारा 8 गैर-लाभकारी कंपनी (MCA)', 'Section 8 Non-Profit (MCA)')}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('CIN संख्या', 'Corporate CIN')}</span>
                    <strong>{organization.cin}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('नीति आयोग दर्पण ID', 'NITI Aayog Darpan ID')}</span>
                    <strong>{organization.darpan}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('धारा 12A प्रमाणन', 'Section 12A Tax Status')}</span>
                    <strong>{organization.tax12a}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('धारा 80G कर छूट', 'Section 80G Exemption')}</span>
                    <strong>{organization.tax80g}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('स्थायी खाता संख्या (PAN)', 'Permanent Account (PAN)')}</span>
                    <strong>{organization.pan}</strong>
                  </div>
                  <div className="gov-compliance-row">
                    <span>{t('उद्यम पंजीकरण संख्या', 'MSME Udyam Number')}</span>
                    <strong>{organization.udyam}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Citizen Helpdesk & Office */}
            <div className="gov-dash-panel">
              <div className="gov-dash-panel-header gov-header-green">
                <h3>{t('नागरिक सहायता व कार्यालय', 'Citizen Helpdesk & Office')}</h3>
                <Link href="/contact" className="gov-dash-view-all">
                  {t('संपर्क', 'Contact')}
                </Link>
              </div>
              <div className="gov-dash-panel-body gov-helpdesk-body">
                <div className="gov-helpdesk-item">
                  <PhoneCall size={18} className="gov-icon-green" aria-hidden="true" />
                  <div>
                    <small>{t('नागरिक पूछताछ दूरभाष', 'Citizen Helpline Telephone')}</small>
                    <a href={`tel:${organization.phoneHref}`} className="gov-helpline-number">
                      {organization.phone}
                    </a>
                  </div>
                </div>

                <div className="gov-helpdesk-item">
                  <FileText size={18} className="gov-icon-blue" aria-hidden="true" />
                  <div>
                    <small>{t('आधिकारिक ईमेल', 'Official Email Address')}</small>
                    <a href={`mailto:${organization.email}`}>{organization.email}</a>
                  </div>
                </div>

                <div className="gov-helpdesk-item">
                  <Building2 size={18} className="gov-icon-gold" aria-hidden="true" />
                  <div>
                    <small>{t('पंजीकृत कार्यालय पता', 'Registered Office Address')}</small>
                    <address>{organization.address}</address>
                  </div>
                </div>

                <div className="gov-helpdesk-leadership">
                  <small>{t('संस्थापक नेतृत्व:', 'Founding Leadership:')}</small>
                  <p>
                    {t(
                      'मनोज कुमार विश्वास (Founder / CEO) · अरविन्द कुमार (Founder / MD)',
                      'Manoj Kumar Bishwas (Founder / CEO) · Arvind Kumar (Founder / MD)'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Sectors in Government Format */}
      <section className="gov-section-core section-pad">
        <div className="container">
          <div className="gov-section-header">
            <div className="gov-section-title-wrap">
              <span className="gov-eyebrow">
                {t('प्राथमिकता वाले कार्यक्षेत्र', 'PRIORITY DOMAINS')}
              </span>
              <h2>
                {t('मुख्य कार्यक्षेत्र एवं उद्देश्य', 'CORE ACTION SECTORS & DOMAINS')}
              </h2>
              <div className="gov-title-rule" />
            </div>
            <p className="gov-section-desc">
              {t(
                'संस्था के पांच मुख्य स्तंभ जो सतत सामाजिक विकास, समानता और आत्मनिर्भरता को बढ़ावा देते हैं।',
                'Five core pillars advancing sustainable community welfare, equality, digital skills, and self-reliance.'
              )}
            </p>
          </div>

          <div className="gov-core-grid">
            {coreAreas.map((area) => (
              <article className="gov-core-card" key={area.number}>
                <div className="gov-core-img-wrap">
                  <Image src={area.image} alt={area.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
                  <span className="gov-core-tag">
                    {t(`क्षेत्र ${area.number}`, `Sector ${area.number}`)}
                  </span>
                </div>
                <div className="gov-core-copy">
                  <span className="gov-core-sub">{area.subtitle}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <Link href={`/core-areas#${area.slug}`} className="gov-text-link">
                    {t('क्षेत्र का विवरण देखें', 'Read Sector Details')} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="gov-center-action">
            <Link className="gov-btn-primary" href="/core-areas">
              {t('सभी 5 कार्यक्षेत्र देखें', 'Explore All 5 Core Areas')} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Planned Flagship Field Projects */}
      <section className="gov-section-projects section-pad">
        <div className="container">
          <div className="gov-section-header">
            <div className="gov-section-title-wrap">
              <span className="gov-eyebrow">
                {t('परियोजना रूपरेखा', 'FIELD INITIATIVES')}
              </span>
              <h2>
                {t('प्रस्तावित परियोजनाएं एवं गतिविधियां', 'PLANNED PROJECTS & INITIATIVES')}
              </h2>
              <div className="gov-title-rule" />
            </div>
            <p className="gov-section-desc">
              {t(
                'बिहार एवं संबंधित क्षेत्रों हेतु प्रस्तावित सामाजिक व कौशल विकास परियोजनाएं।',
                'Proposed community, digital empowerment, and livelihood programs across Bihar and India.'
              )}
            </p>
          </div>

          <div className="gov-projects-grid">
            {projects.slice(0, 3).map((project) => (
              <article className="gov-project-card" key={project.number}>
                <div className="gov-project-media">
                  <Image src={project.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
                  <span className="gov-proj-num">
                    {t(`कार्यक्रम ${project.number}`, `Program ${project.number}`)}
                  </span>
                </div>
                <div className="gov-project-body">
                  <span className="gov-proj-area">{project.area}</span>
                  <h3>{project.title}</h3>
                  <div className="gov-proj-loc">📍 {project.location}</div>
                  <p>{project.objective}</p>
                  <Link href="/projects" className="gov-service-link">
                    {t('परियोजना विवरण', 'Project Details')} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Official Citizen Mandate & Call to Action */}
      <section className="gov-mandate-cta">
        <div className="container gov-mandate-inner">
          <div className="gov-mandate-text">
            <span className="gov-mandate-eyebrow">
              {t('सामूहिक प्रयास · राष्ट्र निर्माण', 'COLLECTIVE EFFORT · NATION BUILDING')}
            </span>
            <h2>
              {t(
                'विकसित समाज के निर्माण में आपका सहयोग महत्वपूर्ण है',
                'Your Collaboration Strengthens Communities and Opens Opportunity'
              )}
            </h2>
            <p>
              {t(
                'स्वयंसेवक के रूप में समय दें, अपनी संस्था के साथ सीएसआर साझेदारी करें, या आयकर धारा 80G के अंतर्गत कर-मुक्त दान देकर इस सामाजिक अभियान को सशक्त बनाएं।',
                'Volunteer your time, initiate institutional CSR partnerships, or support the mission with a 50% tax-deductible donation under Section 80G.'
              )}
            </p>
          </div>
          <div className="gov-mandate-buttons">
            <Link className="gov-btn-saffron" href="/donate">
              {t('80G दान करें (50% कर छूट)', 'Donate Now (80G Tax Benefit)')}
            </Link>
            <Link className="gov-btn-white" href="/get-involved">
              {t('स्वयंसेवक / सीएसआर भागीदारी', 'Volunteer / CSR Partnership')}
            </Link>
            <Link className="gov-btn-outline-white" href="/transparency">
              {t('वैधानिक विवरण देखें', 'View Statutory Filings')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
