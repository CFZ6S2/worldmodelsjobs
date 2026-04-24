'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Shield, ChevronRight, Star } from 'lucide-react';

const PLANS = [
  {
    name: 'Explorer',
    price: '0',
    description: 'Basic access to the intelligence feed with standard latency.',
    features: ['Standard Feed Access', 'Basic Search', 'Community Alerts'],
    accent: 'rgba(255,255,255,0.4)',
    popular: false
  },
  {
    name: 'VIP Intelligence',
    price: '49',
    description: 'Real-time ingestion and direct access to filtered leads.',
    features: ['Zero Latency Feed', 'Advanced Filters', 'Verified Source Data', 'Push Notifications', 'Support Priority'],
    accent: '#c9a84c',
    popular: true
  },
  {
    name: 'Crown Elite',
    price: '199',
    description: 'The ultimate tier for high-frequency operators and institutions.',
    features: ['All VIP Features', 'Private Concierge', 'Custom API Access', 'Unrestricted Exports', 'Identity Cloaking'],
    accent: '#f3e5ab',
    popular: false
  }
];

export default function PricingPage() {
  const router = useRouter();

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
            key={idx} 
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Get Started <ChevronRight size={16} />
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
