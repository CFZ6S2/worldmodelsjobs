'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, Mail, Lock, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const getLocalizedText = (key: string, locale: string) => {
  const dicts: Record<string, Record<string, string>> = {
    gateway: {
      es: 'Portal de Inteligencia',
      en: 'Intelligence Gateway',
      pt: 'Portal de Inteligência',
      ru: 'Портал разведки'
    },
    or: {
      es: 'O CONTINUAR CON',
      en: 'OR CONTINUE WITH',
      pt: 'OU CONTINUAR COM',
      ru: 'ИЛИ ПРОДОЛЖИТЬ С'
    },
    google: {
      es: 'Continuar con Google',
      en: 'Continue with Google',
      pt: 'Continuar com o Google',
      ru: 'Войти через Google'
    },
    initiate: {
      es: 'Iniciar Acceso',
      en: 'Initiate Access',
      pt: 'Iniciar Acesso',
      ru: 'Войти'
    },
    create: {
      es: 'Crear Perfil',
      en: 'Create Profile',
      pt: 'Criar Perfil',
      ru: 'Создать профиль'
    },
    noAccount: {
      es: '¿Aún no tienes perfil? ',
      en: "Don't have a profile yet? ",
      pt: 'Ainda não tem um perfil? ',
      ru: 'Еще нет профиля? '
    },
    haveAccount: {
      es: '¿Ya tienes perfil? ',
      en: 'Already have a profile? ',
      pt: 'Já tem um perfil? ',
      ru: 'Уже есть профиль? '
    },
    registerNow: {
      es: 'Regístrate Ahora',
      en: 'Register Now',
      pt: 'Cadastre-se Agora',
      ru: 'Зарегистрироваться'
    },
    signInNow: {
      es: 'Iniciar Sesión',
      en: 'Sign In',
      pt: 'Entrar',
      ru: 'Войти'
    }
  };
  return dicts[key]?.[locale] || dicts[key]?.['es'];
};

function LoginContent() {
  const { login, register, loginWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const locale = useLocale();
  
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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Login failed');
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
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            {getLocalizedText('gateway', locale)}
          </p>
        </div>

        <div className="listing-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px' }}>
             <ShieldCheck size={16} className="text-gold" style={{ opacity: 0.3 }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {t('emailLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {t('passwordLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  {isLogin ? getLocalizedText('initiate', locale) : getLocalizedText('create', locale)} 
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
              {getLocalizedText('or', locale)}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
            </svg>
            {getLocalizedText('google', locale)}
          </button>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {isLogin ? getLocalizedText('noAccount', locale) : getLocalizedText('haveAccount', locale)}
              <span className="text-gold" style={{ borderBottom: '1px solid #c9a84c' }}>
                {isLogin ? getLocalizedText('registerNow', locale) : getLocalizedText('signInNow', locale)}
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
