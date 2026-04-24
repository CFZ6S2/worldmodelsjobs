'use client';

import { Suspense, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { User, MapPin, Ruler, Weight, UserCircle, ArrowLeft, Loader2, Star, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';
import Link from 'next/link';

function ProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const locale = useLocale();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'profiles', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isPublic) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-bg px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
          <UserCircle size={32} className="text-gray-600" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Profile not found or private</h2>
        <p className="text-xs text-gray-500 max-w-[240px]">The user you're looking for doesn't exist or has disabled their public view.</p>
        <Link href={`/${locale}/feed`} className="btn-gold !px-10 tap-scale">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-32">
      {/* Hero Header */}
      <div className="h-[60vh] relative overflow-hidden">
        <img 
          src={profile.photos?.[0] || 'https://via.placeholder.com/600x800'} 
          alt={profile.fullName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-black/40" />
        
        <nav className="absolute top-0 left-0 right-0 p-6 z-10">
          <button onClick={() => router.back()} className="glass-gold !bg-black/20 p-2.5 rounded-full text-white tap-scale border-white/10">
            <ArrowLeft size={20} />
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold/30 backdrop-blur-md">
                <Star size={12} className="text-gold fill-gold" />
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Verified Model</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-2xl">{profile.fullName}</h1>
            <div className="flex justify-center items-center gap-4 text-gray-400 font-bold text-[11px] uppercase tracking-wider">
               <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gold" /> {profile.city || 'Global'}</span>
               <span className="w-1 h-1 rounded-full bg-gray-700"></span>
               <span className="flex items-center gap-1.5"><Bookmark size={14} className="text-gold" /> VIP Talent</span>
            </div>
        </div>
      </div>

      <main className="px-6 -mt-4 relative z-10 space-y-6">
        {/* Quick Stats Grid */}
        <section className="grid grid-cols-3 gap-3">
           <div className="glass p-4 rounded-2xl text-center space-y-1 border-white/5 shadow-xl shadow-black/20">
              <span className="text-[9px] font-bold text-gray-500 uppercase block">Height</span>
              <span className="text-sm font-bold text-white italic">{profile.measurements?.height} cm</span>
           </div>
           <div className="glass p-4 rounded-2xl text-center space-y-1 border-white/5 shadow-xl shadow-black/20">
              <span className="text-[9px] font-bold text-gray-500 uppercase block">Weight</span>
              <span className="text-sm font-bold text-white italic">{profile.measurements?.weight} kg</span>
           </div>
           <div className="glass p-4 rounded-2xl text-center space-y-1 border-white/5 shadow-xl shadow-black/20">
              <span className="text-[9px] font-bold text-gray-500 uppercase block">Rate</span>
              <span className="text-sm font-bold text-gold italic">€{profile.pricing?.hourly}/h</span>
           </div>
        </section>

        {/* About Section */}
        <section className="card-glass space-y-4 border-gold/5 shadow-gold/5">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                 <User size={16} className="text-gold" />
              </div>
              <h3 className="font-bold text-base tracking-tight italic">Professional Bio</h3>
           </div>
           <p className="text-[14px] text-gray-400 leading-relaxed font-medium">
             {profile.bio || "No biography provided."}
           </p>
           
           <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                 <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-widest leading-none">Vital Stats</span>
                 <span className="text-xs font-bold text-white tracking-widest">{profile.measurements?.bust}-{profile.measurements?.waist}-{profile.measurements?.hips}</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-gold/5 border border-gold/10 text-[10px] font-bold text-gold uppercase tracking-widest">
                 Luxe Talent
              </div>
           </div>
        </section>

        {/* Gallery */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Visual Portfolio</h3>
              <span className="text-[10px] font-bold text-gold">{profile.photos?.length || 0} Assets</span>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {profile.photos?.slice(0, 4).map((url: string, i: number) => (
                <div key={i} className="aspect-[3/4] rounded-3xl overflow-hidden glass border-white/5 tap-scale shadow-2xl">
                  <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
        </section>

        {/* Footer Cta */}
        <section className="pt-8 pb-12 text-center">
            <button className="btn-gold w-full py-4 shadow-2xl shadow-gold/20 tap-scale">
               Send Professional Inquiry <ChevronRight size={18} />
            </button>
            <p className="text-[10px] text-gray-600 mt-6 font-bold uppercase tracking-[0.2em]">WorldModels&Jobs Certified Premium Profile</p>
        </section>
      </main>
    </div>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-dark-bg"><Loader2 className="animate-spin text-gold" size={32} /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
