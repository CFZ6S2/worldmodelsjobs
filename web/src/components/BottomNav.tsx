'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, LayoutDashboard, PlusCircle, Zap } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const { userData } = useAuth();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: t('home'), icon: Home, href: `/${locale}` },
    { label: t('feed'), icon: Zap, href: `/${locale}/feed` },
    { label: t('publish'), icon: PlusCircle, href: `/${locale}/publish`, center: true },
    { label: t('alerts'), icon: Bell, href: `/${locale}/settings/notifications` },
    { label: t('profile'), icon: User, href: `/${locale}/profile` },
  ];

  if (!mounted) return null;

  const isPublicProfile = pathname.includes('/profile/view');
  if (isPublicProfile) return null;

  return (
    <nav className="glass-nav nav-bottom">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
        
        if (item.center) {
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="center-nav-btn"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '-40px',
                boxShadow: '0 8px 25px rgba(201, 168, 76, 0.4)',
                border: '4px solid #050505',
                transition: 'transform 0.2s ease'
              }}
            >
               <item.icon size={28} color="#000" />
            </Link>
          );
        }

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={24} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <style jsx>{`
        .center-nav-btn:active {
          transform: scale(0.9);
        }
      `}</style>
    </nav>
  );
}
