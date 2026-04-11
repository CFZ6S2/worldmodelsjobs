'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AccountRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';

  useEffect(() => {
    // Redirect /account to the profile page
    router.replace(`/${locale}/profile`);
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white font-playfair">
      <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[4px] opacity-40">Accediendo a tu cuenta...</p>
    </div>
  );
}
