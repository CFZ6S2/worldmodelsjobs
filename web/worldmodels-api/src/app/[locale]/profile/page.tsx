'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { User, MapPin, Ruler, Heart, Briefcase, Clock, LogOut, Save, Loader2, Sparkles, CheckCircle2, Globe, Lock, AlertCircle, Camera, Link as LinkIcon, Crown, ShieldCheck, ChevronRight, Bell } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const { user, userData, loading, logout, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('profile');

  // Profile data
  const [profile, setProfile] = useState({
    descripcion: '',
    altura: '',
    busto: '',
    ubicacion: '',
    budget: '',
    disponibilidad: '',
    photoUrl: '',
    socialLink: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, loading, router, locale]);

  useEffect(() => {
    if (userData) {
      setProfile(prev => ({
        ...prev,
        ...userData
      }));
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...profile,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(t('success'));
    } catch (e) {
      console.error(e);
      alert(t('error'));
    }
    setSaving(false);
  };

  const handleGoVip = async () => {
    if (!user) return;
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid, 
          email: user.email,
          plan: 'vip'
        }),
      });
      const { sessionUrl, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = sessionUrl;
    } catch (err) {
      console.error(err);
      alert('Error initiating checkout');
    }
    setUpgrading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube una imagen válida');
      return;
    }

    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/avatar_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newProfile = { ...profile, photoUrl: downloadURL };
      setProfile(newProfile);

      // Persist immediately
      await setDoc(doc(db, 'profiles', user.uid), {
        photoUrl: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error("Upload error:", error);
      alert('Error al subir la imagen');
    }
    setUploadingPhoto(false);
  };

  const handleSignOut = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  const isVip = userData?.isVip || false;

  return (
    <div className="min-h-screen bg-[#000] pb-32 text-white">
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#080808] to-[#000]">
        
        {/* Header Profile */}
        <header className="px-8 pt-12 pb-8 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20 shadow-2xl overflow-hidden relative group/avatar">
                {profile.photoUrl ? (
                   <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-gold" />
                )}
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white/80"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Camera size={20} />
                  )}
                </button>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-gold rounded-xl text-black shadow-lg">
                <Sparkles size={12} />
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-3 bg-white/5 rounded-2xl border border-white/5 text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold font-playfair tracking-tight uppercase">{t('title')}</h1>
              {isVip && (
                <div className="px-2 py-0.5 bg-gold/10 border border-gold/20 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-gold" />
                  <span className="text-[8px] font-black text-gold uppercase tracking-tighter">VIP</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-gold tracking-[3px] uppercase opacity-70">
              {user?.email || 'System ID: XXX-404'}
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="px-8 flex flex-col gap-8 pb-12">
          
          {/* VIP Membership Card */}
          <section className="premium-card p-6 border-gold/20 bg-gradient-to-br from-gold/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Crown size={80} className="text-gold" />
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-[4px] text-gold uppercase">{t('vipMembership')}</span>
                <h3 className="text-xl font-bold">{isVip ? t('vipActive') : t('noVip')}</h3>
              </div>
              <div className={`p-3 rounded-2xl border ${isVip ? 'bg-gold/20 border-gold/40 text-gold' : 'bg-white/5 border-white/5 text-white/20'}`}>
                {isVip ? <CheckCircle2 size={24} /> : <Lock size={24} />}
              </div>
            </div>

            <p className="text-xs text-white/50 leading-relaxed mb-6">
              {t('vipBenefits')}
            </p>

            {!isVip && (
              <button 
                onClick={handleGoVip}
                disabled={upgrading}
                className="btn-premium w-full py-4 text-[10px] font-black flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {upgrading ? <Loader2 className="animate-spin" size={16} /> : <Crown size={16} />}
                {t('getVip')}
              </button>
            )}
          </section>

          {/* Section: Professional Details */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2 opacity-30">
              <div className="h-[1px] flex-1 bg-white" />
              <span className="text-[9px] font-black tracking-[4px] uppercase whitespace-nowrap">{t('nodeLabel')}</span>
              <div className="h-[1px] flex-1 bg-white" />
            </div>

            <div className="flex flex-col gap-4">

              {/* Bio */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">{t('bio')}</label>
                <textarea 
                  value={profile.descripcion}
                  onChange={(e) => setProfile({...profile, descripcion: e.target.value})}
                  placeholder={t('bioPlaceholder')}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-gold/30 focus:outline-none transition-all min-h-[100px] resize-none"
                />
              </div>

              {/* Grid 2 Cols */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                    <Ruler size={10} /> {t('height')}
                  </label>
                  <input 
                    type="text"
                    value={profile.altura}
                    onChange={(e) => setProfile({...profile, altura: e.target.value})}
                    placeholder="e.g. 175cm"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 text-sm focus:border-gold/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <MapPin size={10} /> {t('location')}
                </label>
                <input 
                  type="text"
                  value={profile.ubicacion}
                  onChange={(e) => setProfile({...profile, ubicacion: e.target.value})}
                  placeholder={t('locationPlaceholder')}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 text-sm focus:border-gold/30 focus:outline-none transition-all"
                />
              </div>

              {/* Social Link */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <LinkIcon size={10} /> {t('socialLink')}
                </label>
                <input 
                  type="text"
                  value={profile.socialLink}
                  onChange={(e) => setProfile({...profile, socialLink: e.target.value})}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 text-sm focus:border-gold/30 focus:outline-none transition-all"
                />
              </div>

            </div>
          </section>

          {/* Section: System Configuration */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 opacity-30">
              <div className="h-[1px] flex-1 bg-white" />
              <span className="text-[9px] font-black tracking-[4px] uppercase whitespace-nowrap">{t('systemSettings')}</span>
              <div className="h-[1px] flex-1 bg-white" />
            </div>
            
            <button 
              onClick={() => router.push(`/${locale}/settings/notifications`)}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold/10 rounded-xl text-gold group-hover:scale-110 transition-transform">
                  <Bell size={18} />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase">{t('configureAlerts')}</span>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-gold transition-colors" />
            </button>
          </section>

          {/* Admin Tools Section */}
          {isAdmin && (
            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-2 opacity-30">
                <div className="h-[1px] flex-1 bg-amber-500" />
                <span className="text-[9px] font-black tracking-[4px] uppercase whitespace-nowrap text-amber-500">ADMIN TOOLS</span>
                <div className="h-[1px] flex-1 bg-amber-500" />
              </div>
              <button 
                onClick={() => router.push(`/${locale}/admin`)}
                className="w-full py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-3 text-amber-500 hover:bg-amber-500 hover:text-black transition-all group font-black text-[10px] tracking-widest uppercase"
              >
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                Gestionar Membresías
              </button>
            </section>
          )}

          {/* Action Button */}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-premium w-full py-5 text-[11px] font-black flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(212,175,55,0.2)] disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="animate-spin" size={18} /> {t('updating')}</>
            ) : (
              <><Save size={18} strokeWidth={2.5} /> {t('saveData')}</>
            )}
          </button>
        </main>

        {/* Global Footer Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
