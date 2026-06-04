'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const LOCALE_PREFIXES = ['en', 'pt', 'ru'];

function getCurrentLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (LOCALE_PREFIXES.includes(segments[0])) return segments[0];
  return 'es';
}

function buildLocalePath(pathname: string, newLocale: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Remove existing locale prefix if present
  if (['es', 'en', 'pt', 'ru'].includes(segments[0])) segments.shift();
  
  const rest = segments.join('/');
  // We always want the prefix since we have a root redirect to /es
  return `/${newLocale}${rest ? `/${rest}` : ''}`;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const locale = getCurrentLocale(pathname);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const handleChange = (newLocale: string) => {
    try {
      localStorage.setItem('wm_locale', newLocale);
    } catch {}

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const nextUrl = `${buildLocalePath(pathname, newLocale)}${search || ''}${hash || ''}`;
    router.push(nextUrl);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '8px 14px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 800,
          transition: 'all 0.3s ease'
        }}
        aria-label="Select language"
        id="language-switcher"
      >
        <Globe size={14} color="var(--accent)" />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{current.code}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: 0,
          background: 'rgba(15, 15, 15, 0.98)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 18,
          overflow: 'hidden',
          zIndex: 1000,
          minWidth: 160,
          padding: '8px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                background: locale === lang.code ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                border: 'none',
                borderRadius: 12,
                color: locale === lang.code ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                fontWeight: 800,
                transition: 'all 0.2s ease',
                marginBottom: '2px'
              }}
            >
              <span style={{ fontSize: '18px' }}>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
