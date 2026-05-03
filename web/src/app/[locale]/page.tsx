'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Crown, Globe, Zap, Shield, ChevronRight, Bell } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations, useLocale } from 'next-intl';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations('home');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col pb-32">
      {/* Header */}
      <header className="glass-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Crown size={20} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>WorldModels&Jobs</h1>
            <p className="text-gold" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Premium Intelligence</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '100px 24px 40px', textAlign: 'center' }}>
        <div className="badge" style={{ marginBottom: '24px' }}>
          <Zap size={14} style={{ marginRight: '6px' }} />
          <span>{t('badge')}</span>
        </div>

        <h2 style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px' }}>
          {t('headline1')}<br />
          <span className="text-gold" style={{ fontStyle: 'italic' }}>{t('headline2')}</span>
        </h2>

        <p className="text-muted" style={{ maxWidth: '300px', margin: '0 auto 40px', fontSize: '1rem' }}>
          {t('subheadline')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!mounted ? (
            <div style={{ height: '60px' }} />
          ) : user ? (
            <Link href={`/${locale}/feed`} className="btn-primary flex items-center justify-center gap-2" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t('openFeed')} <ChevronRight size={18} />
            </Link>
          ) : (
            <>
              <Link href={`/${locale}/auth/login?mode=signup`} className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {t('ctaPrimary')} <ChevronRight size={18} />
              </Link>
              <Link href={`/${locale}/auth/login`} className="text-muted" style={{ textDecoration: 'none', marginTop: '12px', fontWeight: 700 }}>
                {t('ctaSecondary')}
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      <section style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="listing-card" style={{ padding: '20px', marginBottom: 0 }}>
          <Globe size={20} color="#c9a84c" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cities</p>
          <h3 style={{ fontSize: '1.25rem' }}>50+ <span className="text-gold" style={{ fontSize: '10px' }}>Global</span></h3>
        </div>
        <div className="listing-card" style={{ padding: '20px', marginBottom: 0 }}>
          <Zap size={20} color="#c9a84c" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Latency</p>
          <h3 style={{ fontSize: '1.25rem' }}>1.2s <span className="text-gold" style={{ fontSize: '10px' }}>Fast</span></h3>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '48px 24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Exclusive Experience</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="listing-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 0 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#c9a84c" />
             </div>
             <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('feature3Title')}</h4>
                <p className="text-muted" style={{ fontSize: '11px' }}>{t('feature3Desc')}</p>
             </div>
          </div>
          <div className="listing-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 0 }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={24} color="#c9a84c" />
             </div>
             <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('feature4Title')}</h4>
                <p className="text-muted" style={{ fontSize: '11px' }}>{t('feature4Desc')}</p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px 100px', textAlign: 'center' }}>
        <div className="divider"></div>
        <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>WorldModels&Jobs Intelligence</p>
        <p style={{ fontSize: '10px', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>© {new Date().getFullYear()} - Handcrafted for VIPs</p>
      </footer>
    </div>
  );
}
