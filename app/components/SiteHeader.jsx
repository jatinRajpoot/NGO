'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, Heart, Home, Phone, ShieldCheck, Award } from 'lucide-react';
import { organization } from '../data/site-data';
import MobileNavigation from './MobileNavigation';
import GovNoticeTicker from './GovNoticeTicker';
import { useLanguage, LanguageToggle } from '../context/LanguageContext';

export default function SiteHeader() {
  const { lang, t } = useLanguage();

  const navItems = [
    { labelHi: 'मुख्य पृष्ठ', labelEn: 'Home', href: '/', isHome: true },
    {
      labelHi: 'संस्था परिचय', labelEn: 'About Us', href: '/about', children: [
        ['संस्था का विवरण', 'Our Foundation', '/about#foundation'],
        ['उद्देश्य व संकल्प', 'Mission, Vision & Goal', '/about#mission'],
        ['13 प्रमुख लक्ष्य', '13 Key Aims', '/about#aims'],
        ['प्रबंधन व नेतृत्व', 'Board & Leadership', '/about#leadership'],
      ],
    },
    {
      labelHi: 'प्रमुख क्षेत्र', labelEn: 'Core Areas', href: '/core-areas', children: [
        ['स्वास्थ्य जागरूकता', 'Health Awareness', '/core-areas#health-awareness'],
        ['शिक्षा व कौशल विकास', 'Education & Skills', '/core-areas#education-skills'],
        ['डिजिटल सशक्तिकरण', 'Digital Empowerment', '/core-areas#digital-empowerment'],
        ['सामुदायिक कल्याण', 'Community Welfare', '/core-areas#community-development'],
        ['महिला सशक्तिकरण', 'Women Empowerment', '/core-areas#women-empowerment'],
      ],
    },
    { labelHi: 'कार्य क्षेत्र', labelEn: 'Work Sectors', href: '/work-sectors' },
    { labelHi: 'परियोजनाएं', labelEn: 'Projects', href: '/projects' },
    {
      labelHi: 'सहभागिता', labelEn: 'Get Involved', href: '/get-involved', children: [
        ['स्वयंसेवक पंजीकरण', 'Volunteer with Us', '/get-involved#volunteer'],
        ['सीएसआर व साझेदारी', 'CSR Partnerships', '/get-involved#partnerships'],
        ['डिजिटल समुदाय', 'Digital Community', '/get-involved#community'],
      ],
    },
    { labelHi: 'पारदर्शिता', labelEn: 'Transparency', href: '/transparency' },
    { labelHi: 'संपर्क', labelEn: 'Contact Us', href: '/contact' },
  ];

  function renderNavItems() {
    return navItems.map((item) => (
      <div className={item.children ? 'gov-nav-item gov-nav-dropdown' : 'gov-nav-item'} key={item.href}>
        <Link className="gov-nav-link" href={item.href}>
          {item.isHome && <Home size={14} aria-hidden="true" className="gov-nav-home-icon" />}
          <span>{lang === 'hi' ? item.labelHi : item.labelEn}</span>
          {item.children && <ArrowDown size={11} strokeWidth={2.5} aria-hidden="true" className="gov-dropdown-arrow" />}
        </Link>
        {item.children && (
          <div className="gov-nav-dropdown-menu">
            {item.children.map(([hi, en, href]) => (
              <Link href={href} key={href} className="gov-dropdown-link">
                {lang === 'hi' ? hi : en}
              </Link>
            ))}
          </div>
        )}
      </div>
    ));
  }

  return (
    <header className="gov-site-header">
      {/* 1. Indian National Flag Tricolor Strip */}
      <div className="gov-tricolor-band" aria-hidden="true">
        <span className="tricolor-saffron" />
        <span className="tricolor-white" />
        <span className="tricolor-green" />
      </div>

      {/* 2. Official Authority Recognition & Language Switcher Bar */}
      <div className="gov-utility-bar">
        <div className="container gov-utility-inner">
          <div className="gov-auth-recognition">
            <span className="gov-india-emblem-text">
              {t('भारत सरकार अनुमोदित', 'Government of India Approved')}
            </span>
            <span className="gov-auth-divider">|</span>
            <span>
              {t(
                'पंजीकृत धारा 8 गैर-लाभकारी संस्था (MCA)',
                'Registered Section 8 Non-Profit (MCA, Govt. of India)'
              )}
            </span>
            <span className="gov-auth-divider">|</span>
            <span className="gov-darpan-badge">
              {t('नीति आयोग दर्पण', 'NITI Aayog Darpan')}: <strong>{organization.darpan}</strong>
            </span>
          </div>

          {/* Clean English / Hindi Toggle Button */}
          <LanguageToggle />
        </div>
      </div>

      {/* 3. Main Official Government Header */}
      <div className="gov-main-header">
        <div className="container gov-main-header-inner">
          <Link className="gov-brand" href="/" aria-label={`${organization.legalName} home`}>
            <div className="gov-emblem-wrapper">
              <Image className="gov-emblem-img" src="/logo.png" alt="GSDD Foundation Emblem" width={52} height={52} priority />
            </div>
            <div className="gov-brand-titles">
              {lang === 'hi' ? (
                <>
                  <strong className="gov-title-hindi">ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन</strong>
                  <span className="gov-subtitle">
                    कारपोरेट कार्य मंत्रालय, भारत सरकार के अधीन पंजीकृत धारा 8 गैर-लाभकारी संस्था
                  </span>
                </>
              ) : (
                <>
                  <strong className="gov-title-english-main">GLOBAL SKILLS &amp; DIGITAL DEVELOPMENT FOUNDATION</strong>
                  <span className="gov-subtitle">
                    A Registered Section 8 Non-Profit Organization · Ministry of Corporate Affairs, Govt. of India
                  </span>
                </>
              )}
              <div className="gov-reg-chips">
                <span>CIN: <strong>{organization.cin}</strong></span>
                <span className="chip-sep">•</span>
                <span>{t('नीति आयोग दर्पण', 'NITI Aayog Darpan')}: <strong>{organization.darpan}</strong></span>
                <span className="chip-sep">•</span>
                <span>{t('12A व 80G कर छूट प्रमाणित', '12A & 80G Tax Certified')}</span>
              </div>
            </div>
          </Link>

          {/* Official Verification Badges on Right */}
          <div className="gov-verification-badges">
            <div className="gov-cert-badge">
              <ShieldCheck size={17} className="badge-icon-green" aria-hidden="true" />
              <div className="badge-text">
                <strong>{t('80G प्रमाणित', '80G CERTIFIED')}</strong>
                <small>{t('50% कर छूट', '50% Tax Exemption')}</small>
              </div>
            </div>
            <div className="gov-cert-badge">
              <Award size={17} className="badge-icon-gold" aria-hidden="true" />
              <div className="badge-text">
                <strong>{t('नीति आयोग', 'NITI AAYOG')}</strong>
                <small>{t('दर्पण सूचीबद्ध', 'Darpan Listed')}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Primary Government Navigation Bar */}
      <div className="gov-navbar">
        <div className="container gov-navbar-inner">
          <nav className="gov-desktop-nav" aria-label="Main official portal navigation">
            {renderNavItems()}
          </nav>
          
          <div className="gov-nav-actions">
            <a href={`tel:${organization.phoneHref}`} className="gov-nav-helpline" title="Citizen Helpline">
              <Phone size={13} aria-hidden="true" />
              <span>{t('हेल्पलाइन', 'Helpline')}: <strong>{organization.phone}</strong></span>
            </a>
            <Link className="gov-btn-donate" href="/donate">
              <Heart size={14} fill="currentColor" aria-hidden="true" />
              <span>{t('दान करें (80G)', 'Donate (80G)')}</span>
            </Link>
          </div>

          <MobileNavigation>
            {renderNavItems()}
            <div className="gov-mobile-actions">
              <a href={`tel:${organization.phoneHref}`} className="gov-mobile-helpline">
                <Phone size={14} aria-hidden="true" /> {t('हेल्पलाइन', 'Helpline')}: {organization.phone}
              </a>
              <Link className="gov-btn-donate mobile-donate" href="/donate">
                <Heart size={15} fill="currentColor" aria-hidden="true" /> {t('दान करें (80G लाभ)', 'Donate (80G Benefit)')}
              </Link>
            </div>
          </MobileNavigation>
        </div>
      </div>

      {/* 5. Official Announcements / Notices Ticker */}
      <GovNoticeTicker />
    </header>
  );
}
