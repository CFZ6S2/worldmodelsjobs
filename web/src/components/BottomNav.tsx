'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Bell, User, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
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
    { label: t('alerts'), icon: LayoutDashboard, href: `/${locale}/settings/notifications` },
    { label: t('profile'), icon: User, href: `/${locale}/profile` },
  ];

  // Hide nav on specific pages if needed (e.g. public profile)
  const isPublicProfile = (pathname.startsWith(`/${locale}/profile/`) && pathname !== `/${locale}/profile`) || (pathname.startsWith('/profile/') && pathname !== '/profile');
  if (isPublicProfile) return null;

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] px-8 py-5 flex justify-between items-center blur-nav rounded-t-[32px] z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={twMerge(
              "flex flex-col items-center gap-1 transition-colors tap-scale",
              isActive ? "text-gold" : "text-gray-500 hover:text-gold-light"
            )}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 bg-gold rounded-full shadow-[0_0_8px_#c9a84c]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
