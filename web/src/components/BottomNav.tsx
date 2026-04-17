'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Bell, User, LayoutDashboard, PlusCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const { userData } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('nav');

  const navItems = [
    { label: t('home'), icon: Home, href: `/${locale}` },
    { label: t('feed'), icon: Bell, href: `/${locale}/feed` },
    { label: t('publish'), icon: PlusCircle, href: `/${locale}/publish`, center: true },
    { label: t('alerts'), icon: LayoutDashboard, href: `/${locale}/settings/notifications` },
    { label: t('profile'), icon: User, href: `/${locale}/profile` },
  ].filter(item => {
    // Hide publish button specifically for male users
    if (item.href.includes('/publish') && userData?.gender === 'male') {
      return false;
    }
    return true;
  });

  // Hide nav on specific pages if needed (e.g. public profile)
  const isPublicProfile = (pathname.startsWith(`/${locale}/profile/`) && pathname !== `/${locale}/profile`) || (pathname.startsWith('/profile/') && pathname !== '/profile');
  if (isPublicProfile) return null;

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] px-6 py-5 flex justify-between items-center blur-nav rounded-t-[32px] z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.center) {
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative -top-8 w-14 h-14 rounded-full bg-gradient-to-tr from-gold-dark to-gold-light flex items-center justify-center shadow-xl shadow-gold/20 tap-scale group hover:scale-110 active:scale-95 transition-all"
            >
               <item.icon size={28} className="text-dark-900 group-hover:rotate-12 transition-transform" />
               <div className="absolute inset-0 rounded-full border-4 border-dark-bg/80 -z-10 bg-dark-bg" />
            </Link>
          );
        }

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={twMerge(
              "flex flex-col items-center gap-1 transition-colors tap-scale relative",
              isActive ? "text-gold" : "text-gray-500 hover:text-gold-light"
            )}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_8px_#c9a84c]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
