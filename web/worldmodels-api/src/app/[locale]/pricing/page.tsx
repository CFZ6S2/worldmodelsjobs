'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, ShieldCheck, Zap, Globe, MessageSquare, Loader2, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const params = useParams();
  const locale = params?.locale || 'en';
  const { user, isProAgency } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = `/${locale}/auth/login`;
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        console.error('Checkout error:', data.error);
        alert('Error initiating checkout. Please try again.');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Globe, label: t('features.unlimited') },
    { icon: ShieldCheck, label: t('features.verified') },
    { icon: Zap, label: t('features.priority') },
    { icon: MessageSquare, label: t('features.alerts') },
    { icon: Crown, label: t('features.support') },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-32 px-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-gold/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-[420px] mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="text-center flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[2px] mx-auto"
          >
            <Crown size={12} /> {t('badge')}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black font-playfair tracking-tight leading-tight uppercase"
          >
            {t('headline')} <span className="text-gold block">{t('headlineGold')}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium leading-relaxed max-w-[280px] mx-auto text-white/60"
          >
            {t('subheadline')}
          </motion.p>
        </div>

        {/* Pricing Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          {/* Most Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-gold via-gold-dark to-gold text-black text-[9px] font-black px-4 py-1 rounded-full shadow-gold uppercase tracking-wider">
            {t('mostPopular')}
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center gap-8 shadow-2xl overflow-hidden group-hover:border-gold/30 transition-colors duration-700">
            {/* Price section */}
            <div className="text-center flex flex-col gap-1">
              <span className="text-[11px] font-black tracking-[4px] text-gold uppercase opacity-80">{t('tierName')}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black font-mono">€{t('price')}</span>
                <span className="text-sm font-medium text-white/40">{t('monthSuffix')}</span>
              </div>
            </div>

            {/* Features list */}
            <div className="w-full flex flex-col gap-4 border-y border-white/5 py-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-1.5 bg-gold/10 rounded-lg border border-gold/10">
                    <feature.icon size={14} className="text-gold" />
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">{feature.label}</span>
                  <Check size={14} className="ml-auto text-gold opacity-40" />
                </div>
              ))}
            </div>

            {/* Action button */}
            <button 
              onClick={handleCheckout}
              disabled={loading || isProAgency}
              className="btn-premium w-full py-5 flex items-center justify-center gap-3 text-[12px] shadow-gold/20 disabled:grayscale disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isProAgency ? (
                <><ShieldCheck size={18} /> {t('currentPlan')}</>
              ) : (
                <><CreditCard size={18} /> {t('getStarted')}</>
              )}
            </button>
            
            {loading && (
              <p className="text-[9px] font-black tracking-[2px] text-gold animate-pulse uppercase">
                {t('redirecting')}
              </p>
            )}
          </div>
        </motion.div>

        {/* Trust Footer */}
        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex items-center gap-4 opacity-20 grayscale">
            <Globe size={24} />
            <ShieldCheck size={24} />
            <MessageSquare size={24} />
          </div>
          <p className="text-[8px] font-black tracking-[3px] text-white/20 uppercase text-center max-w-[200px]">
            ENCRYPTED SESSION | SECURE STRIPE GATEWAY | 256-BIT SSL
          </p>
        </div>
      </div>
    </div>
  );
}
