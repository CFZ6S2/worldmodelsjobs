'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Crown, Zap, Shield, ChevronRight, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: '0',
    description: '7-Day Full Intelligence Trial. Experience the power of WorldModels before upgrading.',
    features: ['7 Days Full Access', 'Standard Feed Access', 'Community Alerts', 'Mandatory VIP Upgrade After Trial'],
    accent: 'rgba(255,255,255,0.4)',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPLORER || ''
  },
  {
    id: 'vip',
    name: 'VIP Intelligence',
    price: '49',
    description: 'Real-time ingestion and direct access to filtered leads.',
    features: ['Zero Latency Feed', 'Advanced Filters', 'Verified Source Data', 'Push Notifications', 'Support Priority'],
    accent: '#c9a84c',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP || ''
  },
  {
    id: 'elite',
    name: 'Crown Elite',
    price: '199',
    description: 'The ultimate tier for high-frequency operators and institutions.',
    features: ['All VIP Features', 'Private Concierge', 'Custom API Access', 'Unrestricted Exports', 'Identity Cloaking'],
    accent: '#f3e5ab',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || ''
  }
];

export default function PricingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!user) { 
      router.push(`/${locale}/auth/login`); 
      return; 
    }
    
    // For free explorer plan
    if (plan.price === '0') {
      router.push(`/${locale}/feed`);
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId, userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert('Payment setup is incomplete. Please contact support.');
      }
    } catch (e) {
      console.error('Checkout failed:', e);
      alert('Checkout failed. Please try again later.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', padding: '0 20px 100px 20px' }}>
      {/* Header */}
      <div style={{ paddingTop: '60px', paddingBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>MEMBERSHIP TIERS</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '300px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
          Select your level of intelligence access and operational priority.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
        {PLANS.map((plan, idx) => (
          <div 
            key={plan.id} 
            className="listing-card" 
            style={{ 
              position: 'relative', 
              border: plan.popular ? '2px solid rgba(201, 168, 76, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: plan.popular ? 'rgba(201, 168, 76, 0.03)' : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              padding: '32px'
            }}
          >
            {plan.popular && (
              <div style={{ 
                position: 'absolute', 
                top: '-12px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)',
                padding: '4px 12px',
                borderRadius: '8px',
                color: '#000',
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Recommended
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
               <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: plan.accent }}>{plan.name}</h3>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{plan.description}</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>€{plan.price}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Per Month</div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {plan.features.map((feat, fIdx) => (
                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Check size={14} style={{ color: plan.accent }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{feat}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleSubscribe(plan)}
              disabled={loadingPlan !== null}
              className={plan.popular ? 'btn-primary' : ''}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                background: plan.popular ? 'linear-gradient(135deg, #c9a84c, #f3e5ab)' : 'rgba(255,255,255,0.05)',
                border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: plan.popular ? '#000' : '#fff',
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: loadingPlan !== null ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loadingPlan === plan.id ? 0.7 : 1
              }}
            >
              {loadingPlan === plan.id ? (
                <><Loader2 className="animate-spin" size={16} /> Processing...</>
              ) : (
                <>Get Started <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        ))}

        {/* Security Info */}
        <div style={{ marginTop: '20px', textAlign: 'center', opacity: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
           <Shield size={14} />
           <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Encrypted Transactions</span>
        </div>
      </div>
    </div>
  );
}
