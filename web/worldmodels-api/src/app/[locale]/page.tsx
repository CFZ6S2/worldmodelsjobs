'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, ShieldCheck, Globe, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || 'es';
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#000] text-white overflow-x-hidden font-playfair relative selection:bg-gold selection:text-black">
      {/* Background Orbs (Global but subtle) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container 480px (Sync with App Look) */}
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#050505] to-[#000] flex flex-col">
        
        {/* Header */}
        <header className="sticky top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold rounded-xl text-black shadow-gold">
              <Crown size={20} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">WORLD<span className="text-gold">MODELS</span></span>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="flex-1 relative pt-24 pb-20 px-8 flex flex-col items-center text-center justify-center">
          
          {/* Elite Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-8"
          >
            <ShieldCheck size={14} className="text-gold" />
            <span className="text-[10px] font-black tracking-[3px] text-gold uppercase">{t('landing.heroBadge')}</span>
          </motion.div>

          {/* Hero Title (Scaled for 480px) */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95] mb-8 uppercase"
          >
            {t('landing.heroTitle1')} <span className="text-gold">{t('landing.heroTitleGold')}</span> {t('landing.heroTitle2')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[11px] text-white/40 leading-relaxed mb-12 uppercase tracking-[0.2em] font-medium"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col w-full gap-4"
          >
            {user ? (
              <button 
                onClick={() => router.push(`/${locale}/feed`)}
                className="w-full bg-gold text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 shadow-gold hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('landing.ctaFeed')} <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => router.push(`/${locale}/auth/login?mode=signup`)}
                  className="w-full bg-gold text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 shadow-gold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {t('landing.ctaRegister')} <UserPlus size={16} />
                </button>
                
                <button 
                  onClick={() => router.push(`/${locale}/auth/login?mode=signin`)}
                  className="w-full bg-white/5 border border-white/10 py-5 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-sans"
                >
                  {t('landing.ctaLogin')} <LogIn size={16} />
                </button>
              </>
            )}
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 mt-20 w-full pt-12 border-t border-white/5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black text-gold">4.2K+</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest leading-tight">{t('landing.statsJobs')}</span>
            </div>
            <div className="flex flex-col gap-1 border-x border-white/5 px-2">
              <span className="text-xl font-black text-white">40+</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest leading-tight">{t('landing.statsCities')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black text-white">24/7</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest leading-tight">{t('landing.statsIntelligence')}</span>
            </div>
          </motion.div>

        </main>

        {/* Footer Branding */}
        <footer className="pb-8 w-full text-center px-6 pointer-events-none">
          <p className="text-[9px] font-bold text-white/10 uppercase tracking-[8px]">{t('landing.footer')}</p>
        </footer>
      </div>
    </div>
  );
}
