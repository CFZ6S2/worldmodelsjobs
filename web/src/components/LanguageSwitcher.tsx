'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
];

const LOCALE_PREFIXES = ['es', 'fr', 'ru', 'pt-BR'];

function getCurrentLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (LOCALE_PREFIXES.includes(segments[0])) return segments[0];
  return 'en';
}

function buildLocalePath(pathname: string, newLocale: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (LOCALE_PREFIXES.includes(segments[0])) segments.shift();
  const rest = segments.join('/');
  if (newLocale === 'en') return `/${rest}`;
  return `/${newLocale}${rest ? `/${rest}` : ''}`;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const locale = getCurrentLocale(pathname);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const handleChange = (newLocale: string) => {
    router.push(buildLocalePath(pathname, newLocale));
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 8,
          padding: '6px 12px',
          color: '#c9a84c',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
        aria-label="Select language"
        id="language-switcher"
      >
        <Globe size={14} />
        <span>{current.flag} {current.label}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          background: '#1a1a26',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 10,
          overflow: 'hidden',
          zIndex: 200,
          minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: locale === lang.code ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(201,168,76,0.08)',
                color: locale === lang.code ? '#c9a84c' : '#c0c0d0',
                cursor: 'pointer',
                fontSize: 14,
                textAlign: 'left',
                fontWeight: locale === lang.code ? 700 : 400,
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
