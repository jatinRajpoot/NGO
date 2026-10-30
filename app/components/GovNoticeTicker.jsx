'use client';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { organization } from '../data/site-data';
import { useLanguage } from '../context/LanguageContext';

const noticesHi = [
  { text: `पंजीकरण विवरण: नीति आयोग एनजीओ दर्पण पोर्टल पंजीकरण संख्या ${organization.darpan} सत्यापित।`, link: '/transparency' },
  { text: `आयकर अधिनियम 1961: धारा 80G के अंतर्गत सभी दानों पर 50% कर छूट उपलब्ध (मंजूरी: ${organization.tax80g})।`, link: '/donate' },
  { text: `कारपोरेट कार्य मंत्रालय, भारत सरकार: गैर-लाभकारी धारा 8 निगमन सीआईएन संख्या ${organization.cin}।`, link: '/transparency' },
  { text: `डिजिटल साक्षरता व आजीविका अभियान: बिहार एवं ग्रामीण क्षेत्रों में निःशुल्क युवा प्रशिक्षण पंजीकरण प्रारंभ।`, link: '/get-involved' },
  { text: `सीएसआर भागीदारी: संस्थागत विकास व सामुदायिक परियोजनाओं हेतु प्रस्ताव आमंत्रित।`, link: '/get-involved#partnerships' },
];

const noticesEn = [
  { text: `Registration Details: Verified on NITI Aayog NGO Darpan Portal with ID: ${organization.darpan}.`, link: '/transparency' },
  { text: `Income Tax Act, 1961: 50% tax exemption available for all donations under Section 80G (Approval: ${organization.tax80g}).`, link: '/donate' },
  { text: `Ministry of Corporate Affairs, Govt. of India: Registered Section 8 Non-Profit with CIN: ${organization.cin}.`, link: '/transparency' },
  { text: `Digital Literacy & Livelihood Mission: Free registration open for rural youth training programs across Bihar.`, link: '/get-involved' },
  { text: `CSR Partnerships: Proposals invited from institutional partners for high-impact grassroots initiatives.`, link: '/get-involved#partnerships' },
];

export default function GovNoticeTicker() {
  const { lang, t } = useLanguage();
  const currentNotices = lang === 'hi' ? noticesHi : noticesEn;

  return (
    <div className="gov-ticker-bar" role="region" aria-label="Official announcements ticker">
      <div className="container gov-ticker-inner">
        <div className="gov-ticker-badge">
          <Bell size={13} aria-hidden="true" />
          <span>{t('महत्वपूर्ण सूचना', 'LATEST ANNOUNCEMENTS')}</span>
        </div>
        <div className="gov-ticker-content">
          <div className="gov-ticker-track">
            {currentNotices.concat(currentNotices).map((notice, idx) => (
              <Link href={notice.link} key={idx} className="gov-ticker-item">
                <span className="gov-ticker-bullet">▪</span>
                <span>{notice.text}</span>
              </Link>
            ))}
          </div>
        </div>
        <Link href="/transparency" className="gov-ticker-all-link">
          {t('सभी देखें', 'View All')} <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
