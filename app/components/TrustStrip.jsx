'use client';
import { ShieldCheck, FileCheck, Building2, CheckCircle2, Award } from 'lucide-react';
import { organization } from '../data/site-data';
import { useLanguage } from '../context/LanguageContext';

export default function TrustStrip() {
  const { lang, t } = useLanguage();

  const govItemsHi = [
    { label: 'निगमन प्रकार', value: 'धारा 8 गैर-लाभकारी कंपनी (MCA)', icon: Building2 },
    { label: 'सीआईएन संख्या', value: organization.cin, icon: ShieldCheck },
    { label: 'नीति आयोग दर्पण', value: organization.darpan, icon: Award },
    { label: 'आयकर धारा 12A', value: organization.tax12a, icon: FileCheck },
    { label: 'आयकर 80G कर छूट', value: organization.tax80g, icon: CheckCircle2 },
    { label: 'एमएसएमई उद्यम', value: organization.udyam, icon: Building2 },
  ];

  const govItemsEn = [
    { label: 'Entity Type', value: 'Section 8 Non-Profit Co. (MCA)', icon: Building2 },
    { label: 'Corporate CIN', value: organization.cin, icon: ShieldCheck },
    { label: 'NITI Aayog Darpan', value: organization.darpan, icon: Award },
    { label: 'Income Tax 12A', value: organization.tax12a, icon: FileCheck },
    { label: '80G Tax Exemption', value: organization.tax80g, icon: CheckCircle2 },
    { label: 'MSME Udyam Reg.', value: organization.udyam, icon: Building2 },
  ];

  const items = lang === 'hi' ? govItemsHi : govItemsEn;

  return (
    <section className="gov-trust-strip" aria-label="Official Government & Statutory Registrations">
      <div className="container">
        <div className="gov-trust-header">
          <span className="gov-trust-seal">
            ✓ {t('वैधानिक मान्यता एवं प्रमाणन विवरण', 'STATUTORY CREDENTIALS & COMPLIANCE')}
          </span>
          <span className="gov-trust-sub">
            {t(
              'सभी प्रमाणपत्र भारत सरकार एवं संबंधित सांविधिक विभागों द्वारा विधिवत सत्यापित हैं।',
              'All registrations and tax certificates are duly approved by the Government of India.'
            )}
          </span>
        </div>
        <div className="gov-trust-grid">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div className="gov-trust-card" key={item.label}>
                <div className="gov-trust-icon-box">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div className="gov-trust-content">
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
