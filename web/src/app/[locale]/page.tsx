'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { Crown, Globe, Zap, Shield, ChevronRight, Bell } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const { user } = useAuth();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('home');

  return (
    <div className="flex-1 flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-dark to-gold-light flex items-center justify-center shadow-lg shadow-gold/20">
            <Crown size={20} className="text-dark-900" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">WorldModels&Jobs</h1>
            <p className="text-[10px] text-gold font-bold uppercase tracking-widest leading-none">Premium Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href={`/${locale}/settings/notifications`} className="w-10 h-10 rounded-full glass-gold flex items-center justify-center relative tap-scale">
            <Bell size={20} className="text-gold" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gold rounded-full border-2 border-dark-900 shadow-[0_0_8px_#c9a84c]"></span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-12 pb-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border-gold/30">
          <Zap size={14} className="text-gold animate-pulse" />
          <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{t('badge')}</span>
        </div>

        <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
          {t('headline1')}<br />
          <span className="text-gold-gradient italic">{t('headline2')}</span>
        </h2>

        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[320px] mx-auto">
          {t('subheadline')}
        </p>

        <div className="flex flex-col gap-3 pt-4">
          {user ? (
            <Link href={`/${locale}/feed`} className="btn-premium shadow-xl shadow-gold/10 tap-scale">
              Open Activity Feed <ChevronRight size={18} />
            </Link>
          ) : (
            <>
              <Link href={`/${locale}/register`} className="btn-premium shadow-xl shadow-gold/10 tap-scale">
                {t('ctaPrimary')} <ChevronRight size={18} />
              </Link>
              <Link href={`/${locale}/login`} className="btn-premium !bg-transparent !border-white/10 !text-gray-400 tap-scale flex items-center justify-center gap-2 py-4 px-6">
                {t('ctaSecondary')}
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      <section className="px-6 grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Globe size={20} className="text-gold" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Cities</p>
            <h3 className="text-xl font-bold italic">50+ <span className="text-[10px] font-normal not-italic text-gold">Global</span></h3>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl space-y-3 border-gold/10">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Zap size={20} className="text-gold" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Latency</p>
            <h3 className="text-xl font-bold italic">1.2s <span className="text-[10px] font-normal not-italic text-gold">Fast</span></h3>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="px-6 pt-12 space-y-4">
        <h3 className="text-lg font-bold px-1">Exclusive Experience</h3>
        
        <div className="space-y-4">
          <div className="glass p-5 rounded-[28px] flex items-center gap-5 border-white/[0.03]">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5">
              <Shield size={24} className="text-gold-light" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t('feature3Title')}</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{t('feature3Desc')}</p>
            </div>
          </div>

          <div className="glass p-5 rounded-[28px] flex items-center gap-5 border-white/[0.03]">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5">
              <Crown size={24} className="text-gold-light" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t('feature4Title')}</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{t('feature4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 text-center">
        <div className="w-12 h-[1px] bg-gold/20 mx-auto mb-6"></div>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-2">WorldModels&Jobs Intelligence</p>
        <p className="text-[10px] text-gray-700 italic">© {new Date().getFullYear()} - Handcrafted for VIPs</p>
      </footer>
    </div>
  );
}
