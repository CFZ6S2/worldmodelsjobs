'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Crown, MapPin, Tag, Send, CheckCircle2, Loader2, Bell, Filter, Search, ChevronRight, Clock, Lock } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from 'next-intl';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Post {
  id: string;
  title?: string;
  description?: string;
  text?: string;
  city: string;
  category?: string;
  source?: string;
  budget?: number;
  created_at: { seconds: number } | string;
}

const CITIES = ['All', 'Paris', 'Dubai', 'London', 'Miami', 'Barcelona', 'Tokyo', 'NYC'];

export default function FeedPage() {
  const { user, isPremium, logout, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('feed');

  const CATEGORIES = [
    { id: 'ALL', label: t('category_all') },
    { id: 'CAT_PLAZAS', label: t('category_plazas') },
    { id: 'CAT_EVENTOS', label: t('category_eventos') },
    { id: 'CAT_AGENCY', label: t('category_agency') },
    { id: 'CAT_MODELOS', label: t('category_modelos') },
    { id: 'VARIO', label: t('category_varios') },
  ];

  function timeAgo(ts: { seconds: number } | string | undefined): string {
    if (!ts) return '';
    const secs = typeof ts === 'object' ? ts.seconds : Math.floor(new Date(ts).getTime() / 1000);
    const diff = Math.floor(Date.now() / 1000) - secs;
    if (diff < 60) return t('justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t('ago')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t('ago')}`;
    return `${Math.floor(diff / 86400)}d ${t('ago')}`;
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedPosts, setAppliedPosts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('ALL');

  const fetchPosts = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/posts?locale=${locale}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/login`);
    if (user) fetchPosts();
  }, [user, loading, router, fetchPosts, locale]);

  const handleApply = async (postId: string) => {
    if (!user) return;
    setApplying(postId);
    try {
      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        postId,
        status: 'pending',
        created_at: serverTimestamp(),
      });
      setAppliedPosts(prev => new Set(prev).add(postId));
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(null);
    }
  };

  const displayPosts = posts
    .filter(p => city === 'All' || p.city === city)
    .filter(p => category === 'ALL' || p.category === category)
    .slice(0, isPremium ? posts.length : 3);

  return (
    <div className="flex-1 flex flex-col pb-32">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 bg-dark-bg/80">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl glass-gold flex items-center justify-center shadow-lg shadow-gold/10">
              <Crown size={22} className="text-gold" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white uppercase italic">Activity</h1>
              <div className="flex items-center gap-1.5 opacity-50">
                 <div className="w-1 h-1 bg-gold rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{posts.length} {t('listings')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center tap-scale transition-all",
                showFilters ? "bg-gold text-dark-900" : "glass text-gray-400"
              )}
            >
              <Filter size={20} />
            </button>
            <Link href={`/${locale}/settings/notifications`} className="w-10 h-10 rounded-full glass flex items-center justify-center tap-scale">
              <Bell size={20} className="text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Dynamic Filters (City and Category) */}
        {showFilters && (
          <div className="px-6 pb-4 animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
            {/* Cities */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={cn(
                    "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all tap-scale",
                    city === c 
                    ? "bg-gold text-dark-900 shadow-lg shadow-gold/20" 
                    : "glass text-gray-500 border-white/5"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all tap-scale border",
                    category === cat.id 
                    ? "bg-gold text-dark-900 border-gold shadow-lg shadow-gold/20" 
                    : "bg-white/5 text-gold/60 border-gold/10 hover:border-gold/30"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Stats Summary Area */}
      <section className="px-6 pt-6 pb-2">
         <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('globalActivity')}</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] font-bold text-green-500 uppercase">{t('live')}</span>
            </div>
         </div>
      </section>

      {/* Main Feed */}
      <main className="px-6 py-4 space-y-4">
        {fetching && posts.length === 0 ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-gold/30" size={32} />
          </div>
        ) : (
          displayPosts.map((post) => (
            <div key={post.id} className="card-glass space-y-4 tap-scale border-gold/5">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gold leading-tight">
                  {post.title || t('nuevoLead')}
                </h3>
                <p className="text-[13px] text-gray-400 leading-relaxed italic">
                  {post.description || post.text || "-"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 uppercase">
                 <div className="flex items-center gap-1">
                   <Tag size={12} className="text-gold/50" />
                   {post.category || 'VIP'}
                 </div>
                 <div className="flex items-center gap-1">
                   <MapPin size={12} className="text-gold/50" />
                   {post.city}
                 </div>
                 <div className="flex items-center gap-1">
                   <Clock size={12} className="text-gold/50" />
                   {timeAgo(post.created_at)}
                 </div>
                 {post.budget && post.budget > 0 && (
                   <div className="flex items-center gap-1 text-green-500/80">
                     <span className="text-xs">€</span>
                     {post.budget}
                   </div>
                 )}
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-white/5">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                      <Search size={12} className="text-gold" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{post.source || 'Premium'} {t('premiumSource')}</span>
                 </div>

                 {appliedPosts.has(post.id) ? (
                  <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">{t('postulada')}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleApply(post.id)}
                    disabled={applying === post.id}
                    className="btn-gold !py-2.5 !px-5 !text-xs shadow-lg shadow-gold/5 tap-scale"
                  >
                    {applying === post.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                    {t('postularAhora')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Empty State */}
        {displayPosts.length === 0 && !fetching && (
          <div className="py-20 text-center space-y-4 animate-in fade-in duration-500">
             <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto opacity-50">
                <Bell size={24} className="text-gold" />
             </div>
             <p className="text-sm font-medium text-gray-500">{t('noPostings')}</p>
          </div>
        )}
      </main>

      {/* Premium Paywall */}
      {!isPremium && posts.length > 3 && (
        <section className="px-6 mt-4 relative">
          <div className="blur-md opacity-30 select-none pointer-events-none">
            {posts.slice(3, 4).map(p => (
              <div key={p.id} className="card-glass h-32 mb-4"></div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-dark-surface to-transparent pt-12 pb-8 px-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl glass-gold border-gold/30 flex items-center justify-center shadow-xl shadow-gold/20">
              <Lock size={24} className="text-gold" />
            </div>
            <h3 className="text-xl font-bold italic tracking-tight">{t('unlockTitle')}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[240px]">
              {t('unlockDesc', { count: posts.length })}
            </p>
            <Link href={`/${locale}/pricing`} className="btn-gold !px-10 shadow-gold/20 tap-scale">
              {t('unlockCta')} <ChevronRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
