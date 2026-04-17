'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Camera, Save, ArrowLeft, Loader2, CheckCircle2, Video, Ruler, Weight, UserCircle, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import CameraCapture from '@/components/CameraCapture';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const { user, userData, isPremium, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('profile');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    measurements: {
      height: '',
      weight: '',
      bust: '',
      waist: '',
      hips: '',
    },
    experience: '',
    pricing: {
      hourly: '',
      daily: '',
    },
    gender: 'female' as 'male' | 'female',
    isPublic: true,
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            fullName: data.fullName || '',
            bio: data.bio || '',
            measurements: data.measurements || { height: '', weight: '', bust: '', waist: '', hips: '' },
            experience: data.experience || '',
            pricing: data.pricing || { hourly: '', daily: '' },
            gender: data.gender || 'female',
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
          });
          setPhotos(data.photos || []);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMessage(null);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setPhotos(prev => [...prev, url]);
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error') });
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    setShowCamera(false);
    setMessage(null);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_camera.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snapshot.ref);
      setPhotos(prev => [...prev, url]);
    } catch (err) {
      console.error('Camera upload error:', err);
      setMessage({ type: 'error', text: 'Camera upload failed: ' + (err instanceof Error ? err.message : 'Unknown error') });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        ...formData,
        photos,
        userId: user.uid,
        updated_at: serverTimestamp(),
      });
      setMessage({ type: 'success', text: t('success') });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: t('error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold/30" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      <header className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex items-center gap-4 bg-dark-bg/80">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full glass-gold flex items-center justify-center text-gold tap-scale">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-black uppercase tracking-tight italic">{t('title')}</h1>
      </header>

      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <Loader2 size={18} />}
            <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-10">
          {/* Header Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Identity Basics</h2>
            <div className="card-glass space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('fullName')}</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="input-dark" placeholder="e.g. Elena VIP" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('bio')}</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="input-dark min-h-[100px]" placeholder="Share your specialty, style and experience..." />
              </div>
            </div>
          </section>

          {userData?.gender !== 'male' && (
            <>
              {/* Professional Fields Section */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">{t('professionalFields')}</h2>
                <div className="card-glass space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gold">
                        <Ruler size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('height')}</span>
                      </div>
                      <input type="number" name="measurements.height" value={formData.measurements.height} onChange={handleInputChange} className="input-dark" placeholder="cm" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gold">
                        <Weight size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('weight')}</span>
                      </div>
                      <input type="number" name="measurements.weight" value={formData.measurements.weight} onChange={handleInputChange} className="input-dark" placeholder="kg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase text-center block">{t('bust')}</label>
                      <input type="text" name="measurements.bust" value={formData.measurements.bust} onChange={handleInputChange} className="input-dark text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase text-center block">{t('waist')}</label>
                      <input type="text" name="measurements.waist" value={formData.measurements.waist} onChange={handleInputChange} className="input-dark text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase text-center block">{t('hips')}</label>
                      <input type="text" name="measurements.hips" value={formData.measurements.hips} onChange={handleInputChange} className="input-dark text-center" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gold">
                        <CreditCard size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('hourly')}</span>
                      </div>
                      <input type="number" name="pricing.hourly" value={formData.pricing.hourly} onChange={handleInputChange} className="input-dark" placeholder="€" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gold">
                        <CreditCard size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('daily')}</span>
                      </div>
                      <input type="number" name="pricing.daily" value={formData.pricing.daily} onChange={handleInputChange} className="input-dark" placeholder="€" />
                    </div>
                  </div>
                </div>
              </section>

              {/* WorldModels Premium Block */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('premiumBadge')}</h2>
                  <div className="px-2 py-0.5 rounded-full glass-gold border-gold/30 text-[8px] font-black uppercase tracking-tighter text-gold">VIP Access</div>
                </div>
                <div className="card-glass border-gold/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors" />
                  
                  <div className="space-y-6 relative">
                    {/* Membership Status */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('premiumStatus')}</p>
                        <p className={`text-sm font-black ${isPremium ? 'text-gold italic' : 'text-white'}`}>
                          {isPremium ? t('premiumActive') : t('premiumInactive')}
                        </p>
                      </div>
                      {!isPremium && (
                        <button type="button" onClick={() => router.push('/pricing')} className="px-4 py-2 rounded-xl glass-gold border-gold/50 text-[10px] font-black uppercase tracking-widest text-gold hover:scale-105 transition-all">
                          {t('upgradeCta')}
                        </button>
                      )}
                    </div>

                    {/* Verification Status */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('verificationStatus')}</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${userData?.isVip ? 'bg-gold animate-pulse' : 'bg-gray-600'}`} />
                          <p className={`text-sm font-bold ${userData?.isVip ? 'text-white' : 'text-gray-500'}`}>
                            {userData?.isVip ? t('verified') : t('notVerified')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Media Gallery Section */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">{t('gallery')}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((url, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden glass border-white/10 group relative tap-scale">
                      <img src={url} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="text-white text-[10px] font-bold uppercase">{t('delete')}</button>
                      </div>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div className="grid grid-cols-1 gap-2 aspect-[3/4]">
                      <label className="flex-1 flex flex-col items-center justify-center glass-gold rounded-2xl cursor-pointer text-gold tap-scale border-dashed border-2">
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                        <span className="text-[9px] font-bold uppercase mt-1">{uploading ? t('uploading') : t('upload')}</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                      </label>
                      <button type="button" onClick={() => setShowCamera(true)} disabled={uploading} className="flex-1 flex flex-col items-center justify-center glass rounded-2xl text-gray-400 tap-scale">
                        <Video size={18} />
                        <span className="text-[9px] font-bold uppercase mt-1">{t('camera')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Visibility Section */}
          <section className="card-glass flex items-center justify-between border-gold/10">
             <div>
                <h3 className="text-sm font-bold text-white">{t('public')}</h3>
                <p className="text-[10px] text-gray-500 font-medium">{t('publicDesc')}</p>
             </div>
             <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.isPublic ? 'bg-gold shadow-[0_0_12px_rgba(201,168,76,0.3)]' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${formData.isPublic ? 'left-7' : 'left-1'}`} />
              </button>
          </section>

          <div className="pt-4">
            <button type="submit" disabled={saving} className="btn-gold w-full py-4 text-base shadow-2xl shadow-gold/20 tap-scale">
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>

        {showCamera && (
          <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
        )}

        {user && (
          <div className="text-center pb-12">
              <Link href={`/${locale}/profile/view?id=${user.uid}`} className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-gold transition-colors inline-flex items-center gap-1">
                 {t('viewPreview')} <ChevronRight size={12} />
              </Link>
          </div>
        )}
      </main>
    </div>
  );
}
