'use client';

import { PLANS } from '@/lib/stripe';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Crown, Check, Zap, Star, ChevronLeft, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PricingPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('pricing');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!user) { router.push(`/${locale}/register`); return; }
    setLoadingPlan(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId, userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-32">
       {/* Minimal Header */}
       <header className="sticky top-0 z-50 glass border-b border-white/5 bg-dark-bg/80 px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 tap-scale">
             <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
             <Crown size={16} className="text-gold" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Select Access</span>
          </div>
          <div className="w-6"></div>
       </header>

       <main className="px-6 py-12 space-y-12">
          {/* Header */}
          <section className="text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border-gold/30">
                <Zap size={14} className="text-gold" />
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider">3-Day Free Trial Included</span>
             </div>
             <h1 className="text-3xl font-black tracking-tight leading-tight">
                 {t('headline')}<br />
                <span className="text-gold-gradient italic">{t('headlineGold')}</span>
             </h1>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-[320px] mx-auto leading-relaxed">
                {t('subheadline')}
             </p>
          </section>

          {/* Pricing Cards */}
          <section className="space-y-8">
             {PLANS.map((plan) => (
               <div 
                 key={plan.id} 
                 className={`card-glass relative overflow-hidden transition-all duration-500 hover:border-gold/30 tap-scale ${
                   plan.popular ? 'border-gold/40 shadow-2xl shadow-gold/5 bg-gold/[0.03]' : 'border-white/5'
                 }`}
               >
                 {plan.popular && (
                    <div className="absolute top-0 right-0 p-4">
                       <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-dark-900 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gold/20">
                          <Star size={10} fill="currentColor" /> {t('mostPopular')}
                       </div>
                    </div>
                 )}

                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{plan.name} Package</span>
                    <div className="flex items-baseline gap-1">
                       <span className="text-4xl font-black text-white">€{plan.price}</span>
                       <span className="text-xs font-bold text-gray-600">{t('monthSuffix')}</span>
                    </div>
                 </div>

                 <ul className="mt-8 space-y-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-400">
                         <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-gold" />
                         </div>
                         {f}
                      </li>
                    ))}
                 </ul>

                 <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan !== null}
                    className={cn(
                       "w-full mt-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2 tap-scale",
                       plan.popular ? "bg-gold text-dark-900 shadow-xl shadow-gold/20" : "bg-white/5 text-white hover:bg-white/10"
                    )}
                 >
                    {loadingPlan === plan.id ? (
                       <Loader2 className="animate-spin" size={20} />
                    ) : (
                       <>{plan.popular ? 'Select Premium Access' : 'Select Basic Access'} <ArrowRight size={18} /></>
                    )}
                 </button>
               </div>
             ))}
          </section>

          {/* Secure Footer */}
          <section className="text-center space-y-6 pb-12">
             <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-gray-700">
                   <ShieldCheck size={14} />
                   <span className="text-[9px] font-bold uppercase tracking-widest">Stripe Secure Payments</span>
                </div>
                <p className="text-[9px] text-gray-800 text-center max-w-[240px] leading-relaxed font-bold uppercase">
                   Cancel anytime via your Stripe Customer Portal.
                </p>
             </div>
             <div className="w-12 h-0.5 bg-gold/10 mx-auto"></div>
          </section>
       </main>
    </div>
  );
}
