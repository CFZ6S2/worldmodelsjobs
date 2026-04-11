'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Hash, MapPin, Save, Loader2, Plus, X, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('alerts');

  // Alerts data
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    keywords: [] as string[],
    cities: [] as string[],
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, loading, router, locale]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (user) {
        const docRef = doc(db, 'userAlerts', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      }
    };
    fetchAlerts();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'userAlerts', user.uid), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(t('success'));
    } catch (e) {
      console.error(e);
      alert('Error saving configuration');
    }
    setSaving(false);
  };

  const addItem = (type: 'keywords' | 'cities', value: string) => {
    if (!value.trim()) return;
    setSettings(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], value.trim().toLowerCase()])]
    }));
    if (type === 'keywords') setNewKeyword('');
    else setNewCity('');
  };

  const removeItem = (type: 'keywords' | 'cities', index: number) => {
    setSettings(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] pb-32 text-white">
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#080808] to-[#000]">
        
        {/* Header */}
        <header className="px-8 pt-12 pb-10 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 rounded-2xl border border-white/5 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20">
                <Bell size={24} className="text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-playfair tracking-tight uppercase leading-none mb-1">{t('title')}</h1>
                <p className="text-[10px] font-black text-gold tracking-[3px] uppercase opacity-70">{t('subtitle')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-8 flex flex-col gap-10">
          
          {/* Master Toggle */}
          <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold uppercase tracking-wide">{t('realtime')}</span>
              <p className="text-[10px] text-white/40 uppercase font-black">{t('realtimeDesc')}</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-500 flex items-center ${
                settings.notificationsEnabled ? 'bg-gold' : 'bg-white/10'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-xl transform transition-transform duration-300 ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </section>

          {/* Keywords Section */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-gold" />
                <span className="text-[11px] font-black tracking-widest uppercase">{t('keywords')}</span>
              </div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">0{settings.keywords.length} {t('active')}</span>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={t('keywordsPlaceholder')}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-gold/30 focus:outline-none transition-all placeholder:text-white/10"
                onKeyDown={(e) => e.key === 'Enter' && addItem('keywords', newKeyword)}
              />
              <button 
                onClick={() => addItem('keywords', newKeyword)}
                className="p-3 bg-white/5 rounded-xl border border-white/5 text-gold hover:bg-gold hover:text-black transition-all shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <AnimatePresence>
                {settings.keywords.map((kw, i) => (
                  <motion.div 
                    key={kw}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 rounded-xl"
                  >
                    <span className="text-[10px] font-black uppercase text-gold/80 tracking-wide">{kw}</span>
                    <button onClick={() => removeItem('keywords', i)} className="text-white/20 hover:text-white">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Cities Section */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gold" />
                <span className="text-[11px] font-black tracking-widest uppercase">{t('cities')}</span>
              </div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">0{settings.cities.length} {t('active')}</span>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder={t('citiesPlaceholder')}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-gold/30 focus:outline-none transition-all placeholder:text-white/10"
                onKeyDown={(e) => e.key === 'Enter' && addItem('cities', newCity)}
              />
              <button 
                onClick={() => addItem('cities', newCity)}
                className="p-3 bg-white/5 rounded-xl border border-white/5 text-gold hover:bg-gold hover:text-black transition-all shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <AnimatePresence>
                {settings.cities.map((city, i) => (
                  <motion.div 
                    key={city}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 rounded-xl"
                  >
                    <span className="text-[10px] font-black uppercase text-white/60 tracking-wide">{city}</span>
                    <button onClick={() => removeItem('cities', i)} className="text-white/20 hover:text-white">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex flex-col gap-6 pt-5">
             <div className="flex items-start gap-3 px-6 py-4 bg-gold/5 border border-gold/10 rounded-2xl">
                <ShieldCheck size={18} className="text-gold shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">
                  {t('disclaimer')}
                </p>
             </div>

             <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-premium w-full py-5 text-[11px] font-black flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(212,175,55,0.2)]"
            >
              {saving ? (
                <><Loader2 className="animate-spin" size={18} /> {t('syncing')}</>
              ) : (
                <><Zap size={18} strokeWidth={2.5} /> {t('sync')}</>
              )}
            </button>
          </div>

        </main>

        {/* Global Footer Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
