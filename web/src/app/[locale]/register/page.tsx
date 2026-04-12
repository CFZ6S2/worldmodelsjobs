'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Mail, Lock, ChevronRight, UserPlus, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Access Token must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      router.push('/pricing');
    } catch {
      setError('Identity registration failed. Try another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 justify-center">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-[24px] glass-gold flex items-center justify-center mx-auto shadow-2xl shadow-gold/20 tap-scale border-gold/40">
            <UserPlus size={32} className="text-gold" />
          </div>
          <div>
             <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Registration</h1>
             <div className="flex items-center justify-center gap-2 opacity-50">
                <Sparkles size={12} className="text-gold" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">New VIP Identity</p>
             </div>
          </div>
        </div>

        {/* Identity Form */}
        <div className="card-glass border-white/5 p-8 space-y-6 shadow-2xl shadow-black/40">
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Create Identity</h2>
            <p className="text-[11px] text-gray-500 font-medium italic mt-1">Join the world's most exclusive feed</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Official Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-gold" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@vip-access.com"
                  required
                  className="input-dark !pl-12 !bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Secure Access Token</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-gold" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 alphanumeric"
                  required
                  className="input-dark !pl-12 !bg-white/5"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] font-bold text-red-500 text-center">
                {error}
              </div>
            )}

            <button type="submit" className="btn-gold w-full py-4 text-base shadow-xl shadow-gold/20 tap-scale !mt-6" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Register Identity <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
             <Link href="/login" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-gold transition-colors inline-flex items-center gap-2">
                Already registered? Sign In <ChevronRight size={14} />
             </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex flex-col items-center gap-3">
           <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">End-to-End Encrypted Data</span>
           </div>
           <p className="text-[9px] text-gray-800 text-center max-w-[200px] leading-relaxed">
              By registering, you agree to our terms of VIP service and professional privacy standards.
           </p>
        </div>
      </div>
    </div>
  );
}
