'use client';

import { useEffect } from 'react';

const SUPPORTED_LOCALES = new Set(['es', 'en', 'pt', 'ru']);

function pickLocaleFromBrowser(): string {
  if (typeof navigator === 'undefined') return 'es';
  const raw = (navigator.language || '').toLowerCase();
  const base = raw.split('-')[0];
  if (SUPPORTED_LOCALES.has(base)) return base;
  return 'es';
}

export default function RootPage() {
  useEffect(() => {
    const saved = (localStorage.getItem('wm_locale') || '').toLowerCase();
    const locale = SUPPORTED_LOCALES.has(saved) ? saved : pickLocaleFromBrowser();
    window.location.replace(`/${locale}/`);
  }, []);

  return null;
}
