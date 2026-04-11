'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setAuthMode('signup');
    } else {
      setAuthMode('signin');
    }
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signin') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.push(`/${locale}/feed`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError(t('unauthorized'));
      } else if (err.code === 'auth/wrong-password') {
        setError(t('failed'));
      } else {
        setError(t('failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-gold selection:text-black">
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#080808] to-[#000] flex flex-col">
        
        {/* Header */}
        <header className="px-8 pt-20 pb-12 text-center flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20 shadow-2xl mb-8 relative"
          >
            <ShieldCheck size={32} className="text-gold" />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-gold rounded-xl text-black shadow-lg">
              <Sparkles size={12} />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black tracking-tighter font-playfair uppercase leading-none mb-3">
            WorldModels<span className="text-gold">&Jobs</span>
          </h1>
          <p className="text-[10px] font-black text-gold tracking-[4px] uppercase opacity-70">
            {t('vipAccess')}
          </p>
        </header>

        {/* Auth Box */}
        <main className="px-10 flex-1">
          {/* Tabs */}
          <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/5 mb-10 overflow-hidden">
            <button
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-3.5 text-[11px] font-black tracking-widest transition-all duration-500 rounded-xl ${
                authMode === 'signin' ? 'bg-gold text-black shadow-gold' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t('loginTab')}
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3.5 text-[11px] font-black tracking-widest transition-all duration-500 rounded-xl ${
                authMode === 'signup' ? 'bg-gold text-black shadow-gold' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t('registerTab')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[2px] pl-1 flex items-center gap-2">
                <Mail size={10} /> {t('memberEmail')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@luxury.com"
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4.5 text-sm focus:border-gold/50 focus:bg-white/[0.04] outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[2px] pl-1 flex items-center gap-2">
                <Lock size={10} /> {t('accessKey')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4.5 text-sm focus:border-gold/50 focus:bg-white/[0.04] outline-none transition-all"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold py-3 px-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-5 text-[11px] font-black flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(212,175,55,0.2)] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> {t('authorizing')}</>
              ) : (
                authMode === 'signin' ? t('establishConnection') : t('createAccountBtn')
              )}
            </button>
          </form>

          <div className="text-center mt-12">
            <Link 
              href={`/${locale}`}
              className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-gold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={12} /> {t('returnToLobby')}
            </Link>
          </div>
        </main>

        <footer className="p-12 text-center">
          <p className="text-[8px] font-bold text-white/20 tracking-[2px] uppercase">
            {t('sessionEncrypted')}
          </p>
        </footer>

        <style jsx>{`
          .p-4\.5 { padding: 1.125rem; }
        `}</style>
      </div>
    </div>
  );
}
