'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Crown, Mail, Lock, ChevronRight, Zap, ShieldCheck } from 'lucide-react';

function LoginContent() {
  const { login, register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'es';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !authLoading) {
      router.push(`/${locale}/feed`);
    }
  }, [user, authLoading, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="animate-fade" style={{ 
      minHeight: '100vh', 
      background: '#000', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 30px rgba(201, 168, 76, 0.3)'
          }}>
            <Crown size={32} color="#000" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>WORLDMODELS</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Intelligence Gateway</p>
        </div>

        <div className="listing-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px' }}>
             <ShieldCheck size={16} className="text-gold" style={{ opacity: 0.3 }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Identity</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Access Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '12px', fontSize: '12px', color: '#ff6b6b', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}
            >
              {loading ? (
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : (
                <>
                  {isLogin ? 'Initiate Access' : 'Create Intelligence Profile'} 
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {isLogin ? "Don't have an profile yet? " : "Already have a profile? "}
              <span className="text-gold" style={{ borderBottom: '1px solid var(--accent)' }}>
                {isLogin ? 'Register Now' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.2 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Lightning</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Encrypted</span>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

