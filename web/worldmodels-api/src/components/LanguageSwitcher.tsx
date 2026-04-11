'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const LOCALE_PREFIXES = ['en', 'es', 'ru', 'pt'];

function getCurrentLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (LOCALE_PREFIXES.includes(segments[0])) return segments[0];
  return 'es';
}

function buildLocalePath(pathname: string, newLocale: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (LOCALE_PREFIXES.includes(segments[0])) segments.shift();
  const rest = segments.join('/');
  return `/${newLocale}${rest ? `/${rest}` : ''}`;
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locale = getCurrentLocale(pathname);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (newLocale: string) => {
    router.push(buildLocalePath(pathname, newLocale));
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-wider tap-scale"
      >
        <span className="text-lg">{current.flag}</span>
        <span>{current.code}</span>
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
          <div className="p-2 flex flex-col gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                  locale === lang.code 
                    ? 'bg-gold/10 text-gold shadow-inner' 
                    : 'text-white/50 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-[11px] font-black uppercase tracking-tight">{lang.label}</span>
                </div>
                {locale === lang.code && <Check size={14} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
