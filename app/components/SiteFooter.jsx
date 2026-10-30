'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, ShieldCheck, ExternalLink, Globe } from 'lucide-react';
import { organization, socialLinks } from '../data/site-data';
import { SocialIcon } from './SocialIcons';
import { useLanguage } from '../context/LanguageContext';

export default function SiteFooter() {
  const { lang, t } = useLanguage();

  return (
    <footer className="gov-site-footer">
      {/* 1. National & Institutional Portals Links Strip */}
      <div className="gov-portal-links-strip">
        <div className="container">
          <div className="gov-portals-heading">
            <Globe size={15} aria-hidden="true" />
            <span>
              {t(
                'प्रमुख सरकारी एवं राष्ट्रीय पोर्टल:',
                'IMPORTANT NATIONAL & GOVERNMENT PORTALS:'
              )}
            </span>
          </div>
          <div className="gov-portals-grid">
            <a href="https://ngodarpan.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('नीति आयोग दर्पण पोर्टल', 'NITI Aayog (NGO Darpan)')} <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://www.mca.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('कारपोरेट कार्य मंत्रालय (MCA21)', 'Ministry of Corporate Affairs (MCA21)')} <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://incometax.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('आयकर ई-फाइलिंग पोर्टल', 'Income Tax Department (e-Filing)')} <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('भारत का राष्ट्रीय पोर्टल (India.gov.in)', 'National Portal of India (India.gov.in)')} <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://digitalindia.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('डिजिटल इंडिया मिशन', 'Digital India Portal')} <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer" className="gov-portal-link">
              {t('एमएसएमई उद्यम पंजीकरण', 'MSME Udyam Portal')} <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Directory */}
      <div className="gov-footer-main container">
        <div className="gov-footer-column gov-footer-org-summary">
          <div className="gov-footer-crest">
            <Image src="/logo.png" alt="GSDD Foundation Crest" width={60} height={60} />
            <div>
              <strong>
                {t(
                  'ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन',
                  'GLOBAL SKILLS & DIGITAL DEVELOPMENT FOUNDATION'
                )}
              </strong>
              <small>
                {t(
                  'कारपोरेट कार्य मंत्रालय, भारत सरकार के अधीन पंजीकृत',
                  'Registered under Section 8, Ministry of Corporate Affairs, Govt. of India'
                )}
              </small>
            </div>
          </div>
          <p className="gov-org-mandate">
            {t(
              'कंपनी अधिनियम, 2013 की धारा 8 के तहत पंजीकृत एक राष्ट्रीय गैर-लाभकारी संगठन। शिक्षा, स्वास्थ्य जागरूकता, डिजिटल साक्षरता और महिला स्वावलंबन के माध्यम से वंचित समुदायों को सशक्त बनाने हेतु प्रतिबद्ध।',
              'A Section 8 Non-Profit Organization registered under the Companies Act, 2013, Ministry of Corporate Affairs, Government of India. Dedicated to advancing community welfare, education, digital literacy, and women empowerment.'
            )}
          </p>
          <div className="gov-statutory-summary">
            <div>CIN: <strong>{organization.cin}</strong></div>
            <div>{t('नीति आयोग दर्पण', 'NITI Aayog Darpan')}: <strong>{organization.darpan}</strong></div>
            <div>{t('धारा 12A एवं 80G कर छूट प्रमाणित', 'Section 12A & 80G Tax Certified')}</div>
          </div>
        </div>

        <div className="gov-footer-column">
          <h3>{t('त्वरित लिंक्स', 'Quick Links')}</h3>
          <ul className="gov-footer-list">
            <li><Link href="/about">{t('संस्था का परिचय', 'About Us')}</Link></li>
            <li><Link href="/core-areas">{t('5 प्रमुख कार्यक्षेत्र', '5 Core Domains')}</Link></li>
            <li><Link href="/work-sectors">{t('12 विकास क्षेत्र', '12 Work Sectors')}</Link></li>
            <li><Link href="/projects">{t('प्रस्तावित परियोजनाएं', 'Proposed Projects')}</Link></li>
            <li><Link href="/transparency">{t('वैधानिक पंजीकरण', 'Transparency & Registry')}</Link></li>
            <li><Link href="/donate">{t('दान करें', 'Donate Online')}</Link></li>
          </ul>
        </div>

        <div className="gov-footer-column">
          <h3>{t('नागरिक सेवाएं', 'Citizen Services')}</h3>
          <ul className="gov-footer-list">
            <li><Link href="/get-involved#volunteer">{t('स्वयंसेवक पंजीकरण', 'Volunteer Registration')}</Link></li>
            <li><Link href="/get-involved#partnerships">{t('सीएसआर व साझेदारी', 'CSR Partnerships')}</Link></li>
            <li><Link href="/get-involved#community">{t('डिजिटल समुदाय', 'Digital Community')}</Link></li>
            <li><Link href="/contact">{t('सहायता व शिकायत', 'Helpdesk & Grievance')}</Link></li>
            <li><Link href="/transparency">{t('वैधानिक दस्तावेज', 'Statutory Documents')}</Link></li>
          </ul>
        </div>

        <div className="gov-footer-column gov-footer-contact-block">
          <h3>{t('संपर्क एवं कार्यालय', 'Contact & Office')}</h3>
          <div className="gov-contact-detail">
            <MapPin size={15} aria-hidden="true" />
            <address>{organization.address}</address>
          </div>
          <div className="gov-contact-detail">
            <Phone size={14} aria-hidden="true" />
            <a href={`tel:${organization.phoneHref}`}>{organization.phone}</a>
          </div>
          <div className="gov-contact-detail">
            <Mail size={14} aria-hidden="true" />
            <a href={`mailto:${organization.email}`}>{organization.email}</a>
          </div>

          <div className="gov-footer-social-box">
            <span className="gov-footer-social-label">
              {t('आधिकारिक सोशल मीडिया चैनल:', 'Official Social Media Channels:')}
            </span>
            <div className="gov-footer-social-icons">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  title={social.label}
                  aria-label={social.label}
                  className={`gov-social-btn gov-social-${social.platform}`}
                  style={{ '--brand-color': social.color }}
                >
                  <SocialIcon platform={social.platform} size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mandatory Government Website Policies & Legal Strip */}
      <div className="gov-footer-policies">
        <div className="container gov-policies-inner">
          <nav aria-label="Official Website Policies">
            <Link href="/privacy-policy">{t('गोपनीयता नीति', 'Privacy Policy')}</Link>
            <span className="gov-sep">|</span>
            <Link href="/terms">{t('उपयोग की शर्तें', 'Terms & Conditions')}</Link>
            <span className="gov-sep">|</span>
            <Link href="/refund-policy">{t('वापसी नीति', 'Refund Policy')}</Link>
            <span className="gov-sep">|</span>
            <Link href="/transparency">{t('अधिकार व उत्तरदायित्व', 'Hyperlink & Disclaimer')}</Link>
          </nav>
        </div>
      </div>

      {/* 4. Bottom Government Ownership & Standards Disclaimer */}
      <div className="gov-footer-bottom">
        <div className="container gov-bottom-inner">
          <div className="gov-ownership-text">
            <span>
              {t(
                'यह वेबसाइट ग्लोबल स्किल्स एवं डिजिटल डेवलपमेंट फाउंडेशन द्वारा प्रबंधित एवं स्वामित्व में है।',
                'This website is owned and managed by Global Skills & Digital Development Foundation.'
              )}
            </span>
            <small>
              {t(
                'कंपनी अधिनियम, 2013 की धारा 8 के अधीन पंजीकृत, कारपोरेट कार्य मंत्रालय, भारत सरकार।',
                'Registered under Section 8 of the Companies Act, 2013, Ministry of Corporate Affairs, Government of India.'
              )}
            </small>
          </div>
          <div className="gov-standards-badge">
            <div className="gov-gigw-compliance">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>GIGW Compliant</span>
            </div>
            <div className="gov-visitor-count">
              {t('कुल आगंतुक:', 'Total Visitors:')} <strong>1,84,392</strong>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
