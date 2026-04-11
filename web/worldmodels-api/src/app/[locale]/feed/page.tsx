'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Send, MessageCircle, Loader2, Crown, Search, X, ShieldCheck, Bell } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ContactModal from '@/components/ContactModal';
import SearchModal from '@/components/SearchModal';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';

interface Lead {
  id: string;
  title_es?: string;
  text_es?: string;
  title_en?: string;
  text_en?: string;
  title_pt?: string;
  text_pt?: string;
  title_ru?: string;
  text_ru?: string;
  categoria?: string;
  platform?: string;
  city?: string;
  ubicacion?: string;
  urgencia?: string;
  budget?: string;
  presupuesto?: string;
  createdAt?: any;
  contact?: string;
  whatsapp?: string;
  telegram?: string;
  user?: string;
  username?: string;
}

/**
 * Robust Deep Search for Contact
 */
function extractContact(data: any): string {
  if (!data) return '';
  
  const JUNK_VALUES = [
    'información no disponible', 
    'unknown', 
    'no disponible', 
    'undefined', 
    'null', 
    'none',
    'phone',
    'whatsapp',
    'true',
    'false'
  ];

  const isJunk = (val: string) => {
    if (!val || typeof val !== 'string') return true;
    const low = val.toLowerCase().trim();
    const isHash = /^[a-zA-Z0-9]{15,30}$/.test(val) && (/[a-z]/.test(val) && /[A-Z]/.test(val));
    return low.length < 3 || JUNK_VALUES.some(junk => low.includes(junk)) || isHash;
  };

  const direct = data.contact || data.contacto || data.whatsapp || data.telegram || data.user || data.username || '';
  if (!isJunk(direct)) return direct;

  const seen = new Set();
  const search = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return null;
    seen.add(obj);

    const keys = ['remoteJid', 'contact', 'whatsapp', 'telegram', 'username', 'phoneNumber', 'sender', 'wa_id', 'waId'];
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === 'string' && !isJunk(val) && !val.includes('@s.whatsapp.net')) {
        return val;
      }
      if (typeof val === 'string' && val.includes('@s.whatsapp.net')) {
        return val.split('@')[0];
      }
    }

    for (const k in obj) {
      const result = search(obj[k]);
      if (result) return result;
    }
    return null;
  };

  const deep = search(data);
  if (deep) return deep;

  const text = (data.title_es || '') + ' ' + (data.text_es || '') + ' ' + (data.rawText || '') + ' ' + (data.descripcion || '');
  const phMatch = text.match(/\+?(?:\d[\s-]*){9,15}\d/);
  if (phMatch) return phMatch[0].replace(/\s/g, '');

  const tgMatch = text.match(/@[\w\d_]{5,}/);
  if (tgMatch) return tgMatch[0];

  return '';
}

export default function FeedPage() {
  const t = useTranslations('feed');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'es';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  const CATEGORY_MAP = {
    ALL: t('all'),
    PLAZAS: t('plazas'),
    EVENTOS: t('eventos'),
  };

  const CATEGORY_VALUE_MAP = {
    ALL: 'TODO',
    PLAZAS: 'CAT_PLAZAS',
    EVENTOS: 'CAT_EVENTOS',
  };

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const leadsRef = collection(db, 'leads');
    
    let q = query(leadsRef, orderBy('createdAt', 'desc'), limit(60));

    if (filter !== 'ALL') {
      q = query(leadsRef, where('categoria', '==', CATEGORY_VALUE_MAP[filter as keyof typeof CATEGORY_VALUE_MAP]), orderBy('createdAt', 'desc'), limit(60));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Lead));
      setLeads(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleReveal = useCallback((lead: Lead) => {
    const contact = extractContact(lead);
    const titleKey = `title_${locale}` as keyof Lead;
    setSelectedLead({
      id: lead.id,
      title: lead[titleKey] || lead.title_es,
      platform: lead.platform,
      contact: contact
    });
    setIsModalOpen(true);
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#000] pb-32 selection:bg-gold selection:text-black font-playfair">
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#050505] to-[#000]">
        
        <header className="sticky top-0 z-40 glass px-6 py-6 flex flex-col gap-5 border-b border-white/5 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-gold to-gold-dark rounded-2xl text-black shadow-gold flex items-center justify-center">
                <Crown size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none mb-1">
                  {t('title')}<span className="text-gold">{t('jobs')}</span>
                </h1>
                <p className="text-[7px] font-black text-gold tracking-[3pt] uppercase opacity-70">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-3 rounded-2xl border transition-all ${
                  searchTerm 
                    ? 'bg-gold/20 border-gold/40 text-gold' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => router.push(`/${locale}/settings/notifications`)}
                className="p-3 bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 rounded-2xl transition-all"
              >
                <Bell size={20} strokeWidth={2.5} />
              </button>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {Object.entries(CATEGORY_MAP).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black transition-all duration-300 tap-scale whitespace-nowrap border ${
                  filter === key
                    ? 'bg-gold border-gold text-black shadow-gold'
                    : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-5 pt-8">
          <div className="flex flex-col gap-8">
            {/* Search Status / Clear */}
            {searchTerm && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-gold/10 border border-gold/20 rounded-2xl px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <Search size={14} className="text-gold" />
                  <span className="text-[10px] font-black text-gold uppercase tracking-wider">
                    {t('resultsFor', { query: searchTerm })}
                  </span>
                </div>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-1 hover:bg-gold/20 rounded-lg transition-colors"
                >
                  <X size={14} className="text-gold" />
                </button>
              </motion.div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 gap-6">
                <Loader2 size={40} className="animate-spin text-gold" />
                <p className="text-[9px] font-black tracking-[4px] uppercase">{t('decrypting')}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {leads.filter(lead => {
                  const titleKey = `title_${locale}` as keyof Lead;
                  const textKey = `text_${locale}` as keyof Lead;
                  const localizedTitle = (lead[titleKey] || lead.title_es || '').toLowerCase();
                  const localizedText = (lead[textKey] || lead.text_es || '').toLowerCase();
                  const city = String(lead.city || lead.ubicacion || '').toLowerCase();
                  const budget = String(lead.budget || lead.presupuesto || '').toLowerCase();
                  const query = searchTerm.toLowerCase();
                  
                  return localizedTitle.includes(query) || localizedText.includes(query) || city.includes(query) || budget.includes(query);
                }).map((lead, index) => {
                  const titleKey = `title_${locale}` as keyof Lead;
                  const textKey = `text_${locale}` as keyof Lead;
                  const localizedTitle = lead[titleKey] || lead.title_es;
                  const localizedText = lead[textKey] || lead.text_es;

                    const isAgency = lead.platform === 'DASHBOARD_AGENCY';

                    return (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        className={`premium-card group relative active:scale-[0.98] transition-all duration-500 ${
                          isAgency ? 'border-red-600/40 bg-red-600/5 shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:border-red-500' : ''
                        }`}
                      >
                      {lead.urgencia === 'ALTA' && (
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse border border-white/20">
                          {t('urgent')}
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[9px] font-black tracking-[2px] uppercase ${
                            isAgency ? 'text-red-500' : lead.categoria === 'CAT_EVENTOS' ? 'text-purple-400' : 'text-gold'
                          }`}>
                            {isAgency && <ShieldCheck size={10} className="inline mr-1 mb-0.5" />}
                            {lead.categoria === 'CAT_EVENTOS' ? t('eventos') : t('plazas')}
                          </span>
                          <p className="text-[10px] font-bold text-white/40 uppercase font-mono">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                          {lead.platform?.toLowerCase().includes('whatsapp') ? (
                            <MessageCircle size={12} className="text-green-500" />
                          ) : (
                            <Send size={12} className="text-blue-400" />
                          )}
                          <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">
                            {lead.platform || 'SECURE'}
                          </span>
                        </div>
                      </div>

                        <h3 className={`text-lg font-bold leading-tight mb-3 font-playfair transition-colors tracking-tight ${
                          isAgency ? 'group-hover:text-red-400' : 'group-hover:text-gold'
                        }`}>
                          {localizedTitle}
                        </h3>
                      <p className="text-[13px] text-white/60 leading-relaxed mb-6 font-medium line-clamp-4">
                        {localizedText}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${isAgency ? 'bg-red-500/10 border-red-500/10' : 'bg-white/5 border-white/5'}`}>
                            <MapPin size={12} className={isAgency ? 'text-red-500' : 'text-gold'} />
                          </div>
                          <span className="text-[9px] font-black uppercase text-white/40 truncate tracking-wide">
                            {lead.city || lead.ubicacion || t('global')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 border-l border-white/5 pl-4">
                          <div className={`p-2 rounded-xl border ${isAgency ? 'bg-red-500/10 border-red-500/10' : 'bg-white/5 border-white/5'}`}>
                            <Zap size={12} className={isAgency ? 'text-red-500' : 'text-gold'} />
                          </div>
                          <span className="text-[9px] font-black uppercase text-white/40 truncate tracking-wide">
                            {lead.budget || lead.presupuesto || t('discuss')}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleReveal(lead)}
                        className={`w-full py-4.5 text-[10px] font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 rounded-xl uppercase tracking-[2px] ${
                          isAgency 
                            ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20' 
                            : 'btn-premium'
                        }`}
                      >
                        {t('revealContact')} {isAgency ? <ShieldCheck size={14} /> : <Crown size={14} strokeWidth={2.5} />}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {!loading && leads.length === 0 && (
              <div className="text-center py-32 opacity-10 flex flex-col items-center gap-4">
                <Loader2 size={30} />
                <p className="text-[9px] font-black tracking-[4px] uppercase">{t('noIntelligence')}</p>
              </div>
            )}
          </div>
        </main>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-8 py-6 z-50">
           <BottomNav />
        </div>
      </div>

      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        lead={selectedLead} 
      />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .py-4\.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }
      `}</style>
    </div>
  );
}
