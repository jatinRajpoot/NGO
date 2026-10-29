'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hindiTranslations } from '../data/language-translations';

const LanguageContext = createContext(null);
const textOriginals = new WeakMap();
const attributeOriginals = new WeakMap();
const translatedAttributes = ['alt', 'aria-label', 'aria-description', 'placeholder', 'title'];

function normalize(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function translateValue(value, language) {
  if (language !== 'hi') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const translated = hindiTranslations[normalize(trimmed)];
  if (!translated) return value;
  const start = value.indexOf(trimmed);
  return `${value.slice(0, start)}${translated}${value.slice(start + trimmed.length)}`;
}

function shouldSkip(node) {
  return Boolean(node.parentElement?.closest('script, style, noscript, textarea, code, pre, svg, [data-no-translate]'));
}

function translateTextNode(node, language) {
  if (!node.parentElement || shouldSkip(node)) return;

  const current = node.nodeValue ?? '';
  const previous = textOriginals.get(node);
  const original = previous && current === previous.applied ? previous.original : current;
  const translated = translateValue(original, language);
  textOriginals.set(node, { original, applied: translated });

  if (current !== translated) node.nodeValue = translated;
}

function translateElementAttributes(element, language) {
  if (element.closest('script, style, noscript, textarea, code, pre, svg, [data-no-translate]')) return;

  const currentState = attributeOriginals.get(element) ?? {};
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) {
      delete currentState[attribute];
      continue;
    }

    const previous = currentState[attribute];
    const original = previous && current === previous.applied ? previous.original : current;
    const translated = translateValue(original, language);
    currentState[attribute] = { original, applied: translated };
    if (current !== translated) element.setAttribute(attribute, translated);
  }
  attributeOriginals.set(element, currentState);
}

function translateTree(node, language) {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node, language);
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.matches('script, style, noscript, textarea, code, pre, svg, [data-no-translate]')) return;
    translateElementAttributes(node, language);
  }

  for (const child of node.childNodes ?? []) translateTree(child, language);
}

function translateAttributeMutation(element, language, attribute) {
  if (!element || element.closest('script, style, noscript, textarea, code, pre, svg, [data-no-translate]')) return;
  if (!translatedAttributes.includes(attribute)) return;
  translateElementAttributes(element, language);
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="site-language-toggle" role="group" aria-label="Choose language / भाषा चुनें" data-no-translate>
      <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
      <span aria-hidden="true">/</span>
      <button type="button" lang="hi" aria-pressed={language === 'hi'} onClick={() => setLanguage('hi')}>हिन्दी</button>
    </div>
  );
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  const setLanguage = useCallback((nextLanguage) => {
    if (nextLanguage !== 'en' && nextLanguage !== 'hi') return;
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem('gsdd-language', nextLanguage);
    } catch {
      // The selector still works when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem('gsdd-language') === 'hi') setLanguageState('hi');
    } catch {
      // Keep English as the default when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dataset.language = language;
    translateTree(root, language);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') {
          translateTextNode(record.target, language);
        } else if (record.type === 'attributes') {
          translateAttributeMutation(record.target, language, record.attributeName);
        } else {
          for (const node of record.addedNodes) translateTree(node, language);
        }
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: translatedAttributes,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const contextValue = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}
