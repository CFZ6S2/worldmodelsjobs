'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Crown, Mail, Lock, Eye, EyeOff, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push(`/${locale}/feed`);
    } catch {
      setError('Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 justify-center">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-gold-dark to-gold-light flex items-center justify-center mx-auto shadow-2xl shadow-gold/30 tap-scale">
            <Crown size={32} className="text-dark-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">WorldModels&Jobs</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Premium Intelligence</p>
          </div>
        </div>

        {/* Identity Section */}
        <div className="card-glass border-gold/10 p-8 space-y-6 shadow-2xl shadow-gold/5">
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Identity Access</h2>
            <p className="text-xs text-gray-500 font-medium italic mt-1">Sign in to your private vault</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Encrypted Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-gold" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@exclusive.com"
                  required
                  className="input-dark !pl-12 !bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Access Token</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-gold" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-dark !pl-12 !pr-12 !bg-white/5"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gold transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] font-bold text-red-500 animate-pulse text-center">
                {error}
              </div>
            )}

            <button type="submit" className="btn-premium w-full py-4 text-base tap-scale !mt-6" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Unlock Access'}
            </button>
          </form>

          <div className="pt-4 text-center">
             <Link href={`/${locale}/register`} className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-gold transition-colors inline-flex items-center gap-2">
                Create New Identity <ChevronRight size={14} />
             </Link>
          </div>
        </div>

        {/* Secure Footer */}
        <div className="flex items-center justify-center gap-2 text-gray-700">
           <ShieldCheck size={14} />
           <span className="text-[9px] font-bold uppercase tracking-widest">SSL Encrypted 256-bit</span>
        </div>
      </div>
    </div>
  );
}
