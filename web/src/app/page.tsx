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
    // If we are already on a localized page (e.g. /es/), do not redirect
    const path = window.location.pathname;
    if (path.startsWith('/es') || path.startsWith('/en') || path.startsWith('/pt') || path.startsWith('/ru')) {
      return;
    }

    const saved = (localStorage.getItem('wm_locale') || '').toLowerCase();
    const locale = SUPPORTED_LOCALES.has(saved) ? saved : pickLocaleFromBrowser();
    window.location.replace(`/${locale}/`);
  }, []);

  return null;
}

