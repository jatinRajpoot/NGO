'use client';
import { useState, useEffect } from 'react';

export default function GovAccessibility() {
  const [fontSize, setFontSize] = useState('normal');
  const [contrast, setContrast] = useState('normal');

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '17px';
    } else {
      root.style.fontSize = '15px';
    }
  }, [fontSize]);

  useEffect(() => {
    if (contrast === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [contrast]);

  return (
    <div className="gov-access-tools" aria-label="Accessibility controls">
      <a href="#main" className="gov-access-link">Skip to Main Content</a>
      <span className="gov-access-pipe">|</span>
      <span className="gov-access-label">Screen Reader</span>
      <span className="gov-access-pipe">|</span>
      <div className="gov-font-resizer" role="group" aria-label="Text size adjustment">
        <button
          type="button"
          onClick={() => setFontSize('small')}
          title="Decrease font size"
          aria-label="Decrease font size"
          className={fontSize === 'small' ? 'active' : ''}
        >
          A-
        </button>
        <button
          type="button"
          onClick={() => setFontSize('normal')}
          title="Normal font size"
          aria-label="Normal font size"
          className={fontSize === 'normal' ? 'active' : ''}
        >
          A
        </button>
        <button
          type="button"
          onClick={() => setFontSize('large')}
          title="Increase font size"
          aria-label="Increase font size"
          className={fontSize === 'large' ? 'active' : ''}
        >
          A+
        </button>
      </div>
      <span className="gov-access-pipe">|</span>
      <button
        type="button"
        className="gov-contrast-toggle"
        onClick={() => setContrast(contrast === 'normal' ? 'high' : 'normal')}
        title="Toggle High Contrast"
      >
        {contrast === 'normal' ? 'High Contrast' : 'Standard'}
      </button>
      <span className="gov-access-pipe">|</span>
      <span className="gov-lang-indicator" title="Bilingual Portal">English / हिन्दी</span>
    </div>
  );
}
