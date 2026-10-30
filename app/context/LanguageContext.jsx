'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  lang: 'hi',
  setLang: () => {},
  toggleLang: () => {},
  t: (hi, en) => hi,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('hi');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gsdd_portal_lang');
      if (saved === 'hi' || saved === 'en') {
        setLang(saved);
      }
    } catch (e) {
      // ignore storage error
    }
  }, []);

  const changeLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('gsdd_portal_lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  const toggleLang = () => {
    changeLang(lang === 'hi' ? 'en' : 'hi');
  };

  const t = (hi, en) => (lang === 'hi' ? hi : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="gov-lang-switcher" role="group" aria-label="Select Language / भाषा चुनें">
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`gov-lang-btn ${lang === 'hi' ? 'is-active' : ''}`}
        aria-pressed={lang === 'hi'}
        title="हिन्दी में वेबसाइट देखें"
      >
        हिन्दी
      </button>
      <span className="gov-lang-divider">|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`gov-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
        aria-pressed={lang === 'en'}
        title="View website in English"
      >
        English
      </button>
    </div>
  );
}
