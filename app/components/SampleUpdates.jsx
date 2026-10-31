import { sampleUpdates } from '../data/site-data';

const labels = {
  en: {
    note: 'Dummy news and updates for the layout preview. Replace these examples with verified stories before publishing.',
    badge: 'DUMMY UPDATE',
  },
  hi: {
    note: 'लेआउट पूर्वावलोकन के लिए नमूना समाचार और अपडेट। प्रकाशित करने से पहले इन्हें सत्यापित जानकारी से बदलें।',
    badge: 'नमूना अपडेट',
  },
};

export default function SampleUpdates({ language = 'en', compact = false }) {
  const selectedLanguage = language === 'hi' ? 'hi' : 'en';
  const copy = labels[selectedLanguage];

  return <div className={`sample-updates ${compact ? 'sample-updates-compact' : ''}`} lang={selectedLanguage}>
    <p className="sample-updates-note" role="note">{copy.note}</p>
    <div className="sample-updates-grid">
      {sampleUpdates.map((item) => <article className="sample-update-card" key={item.id}>
        <div
          className="sample-update-image"
          role="img"
          aria-label={item.imageAlt[selectedLanguage]}
          style={{ backgroundImage: `url("${item.image}")` }}
        />
        <div className="sample-update-copy">
          <div className="sample-update-meta">
            <span className="sample-update-category">{item.category[selectedLanguage]}</span>
            <span className="sample-update-badge">{copy.badge}</span>
          </div>
          <h3>{item.title[selectedLanguage]}</h3>
          <p>{item.summary[selectedLanguage]}</p>
        </div>
      </article>)}
    </div>
  </div>;
}
