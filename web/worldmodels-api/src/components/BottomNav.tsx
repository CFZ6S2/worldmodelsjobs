'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Bell, User, LayoutDashboard, PlusSquare, ShieldAlert } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

import { useTranslations } from 'next-intl';

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('nav');

  const navItems = [
    { label: t('home'), icon: Home, href: `/${locale}` },
    { label: t('feed'), icon: Bell, href: `/${locale}/feed` },
    { label: t('publish'), icon: PlusSquare, href: `/${locale}/publish` },
    { label: t('blacklist'), icon: ShieldAlert, href: `/${locale}/blacklist` },
    { label: t('profile'), icon: User, href: `/${locale}/profile` },
  ];

  // Hide nav on specific pages if needed (e.g. auth pages or public profile)
  const isAuthPage = pathname.includes('/auth/');
  const isPublicProfile = pathname.startsWith('/profile/') && pathname !== `/${locale}/profile`;
  
  if (isAuthPage || isPublicProfile) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <nav className="bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-[28px] p-2 flex justify-between items-center shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === `/${locale}` && pathname === `/${locale}`);
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={twMerge(
                "relative flex flex-col items-center gap-1 py-3 px-4 rounded-2xl transition-all duration-500",
                isActive ? "text-gold bg-gold/5" : "text-white/30 hover:text-white/60"
              )}
            >
              <item.icon size={20} className={twMerge("transition-transform duration-500", isActive && "scale-110")} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-gold rounded-full shadow-[0_0_12px_#c9a84c]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
