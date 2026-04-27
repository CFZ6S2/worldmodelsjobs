'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MapPin, Clock, Share2, ShieldCheck, Zap, Search, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Ad {
  id: string;
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  category?: string;
  categoria?: string;
  timestamp?: any;
  activa?: boolean;
  contact?: string;
  translations?: Record<string, { titulo: string; descripcion: string }>;
  [key: string]: any;
}

const getAdData = (ad: Ad, locale: string) => {
  let description = '';
  if (ad.translations?.[locale]?.descripcion) {
    description = ad.translations[locale].descripcion;
  } else if (ad[`text_${locale}`]) {
    description = ad[`text_${locale}`];
  } else if (ad.text_es) {
    description = ad.text_es;
  } else if (ad.descripcion) {
    description = ad.descripcion;
  } else {
    description = ad.content || ad.rawText || '';
  }

  let title = '';
  if (ad.translations?.[locale]?.titulo) {
    title = ad.translations[locale].titulo;
  } else if (ad[`title_${locale}`]) {
    title = ad[`title_${locale}`];
  } else if (ad.title_es) {
    title = ad.title_es;
  } else if (ad.titulo) {
    title = ad.titulo;
  } else {
    title = ad.title || 'WorldModels Listing';
  }

  const location = ad.city || ad.location || ad.ubicacion || 'Global';
  return { title, description, location };
};

export default function FeedPage() {
  const t = useTranslations('feed');
  const locale = useLocale();
  const router = useRouter();
  const { userData } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchAds = (collectionName: string) => {
      const q = query(
        collection(db, collectionName),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      return onSnapshot(q, (snapshot) => {
        const adsData: Ad[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any,
          _source: collectionName
        }));
        
        // 🛡️ MODERATION & CLEANING
        const processed = adsData.filter(ad => 
          ad.activa !== false && 
          !ad.trash && 
          ad.status !== 'banned'
        );

        setAds(prev => {
          // Robust deduplication using a Map by ID
          const adMap = new Map();
          [...prev, ...processed].forEach(a => {
            // Keep the one from 'ofertas' if there's a collision, as it's our primary source
            if (!adMap.has(a.id) || a._source === 'ofertas') {
              adMap.set(a.id, a);
            }
          });

          return Array.from(adMap.values()).sort((a, b) => {
            const getT = (ad: Ad) => {
              const ts = ad.timestamp || ad.ingestedAt || ad.createdAt;
              if (!ts) return 0;
              if (ts.seconds) return ts.seconds * 1000;
              return new Date(ts).getTime() || 0;
            };
            return getT(b) - getT(a);
          });
        });

        setLoading(false);
      }, (err) => {
        console.error(`Firestore error in ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      });
    };

    const unsubOfertas = fetchAds('ofertas');
    const unsubLeads = fetchAds('leads');

    return () => {
      unsubOfertas();
      unsubLeads();
    };
  }, []);

  const filteredAds = ads.filter(ad => {
    const { title, description, location } = getAdData(ad, locale);
    const adCategory = ad.category || ad.categoria || 'CAT_PLAZAS';
    
    const matchesCategory = category === 'all' || adCategory === category;
    const matchesSearch = !search || 
      description.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return '...';
    
    let date: Date;
    if (timestamp instanceof Date) date = timestamp;
    else if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') date = new Date(timestamp);
    else return '...';

    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return locale === 'es' ? 'ahora' : 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="animate-fade" style={{ padding: '0 16px 100px 16px' }}>
      {/* Premium Header Sticky */}
      <div className="sticky top-0 z-50 pt-4 pb-2 bg-black/80 backdrop-blur-md" style={{ margin: '0 -16px 16px -16px', padding: '16px 16px 8px 16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.03)',
          padding: '8px 12px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', 
              width: '36px', 
              height: '36px', 
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(201, 168, 76, 0.3)'
            }}>
              <Search size={18} color="#000" />
            </div>
            <input 
              type="text"
              placeholder={t('searchPlaceholder') || (locale === 'es' ? "Buscar ciudad o contenido..." : "Search city or content...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              <Globe size={16} color="var(--accent)" />
            </button>

            {showLangMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                background: 'rgba(15, 15, 15, 0.98)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '18px',
                padding: '8px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 1000,
                minWidth: '150px'
              }}>
                {['es', 'en', 'pt', 'ru'].map(l => (
                  <button
                    key={l}
                    onClick={() => {
                      router.push(`/${l}/feed`);
                      setShowLangMenu(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: locale === l ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                      color: locale === l ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                      fontSize: '13px',
                      fontWeight: 800,
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{l === 'en' ? '🇺🇸' : l === 'es' ? '🇪🇸' : l === 'pt' ? '🇧🇷' : '🇷🇺'}</span>
                    <span>{l === 'en' ? 'English' : l === 'es' ? 'Español' : l === 'pt' ? 'Português' : 'Русский'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills - More Premium */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
        {['all', 'CAT_PLAZAS', 'CAT_EVENTOS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: category === cat ? 'rgba(201, 168, 76, 0.4)' : 'rgba(255,255,255,0.05)',
              background: category === cat ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255,255,255,0.03)',
              color: category === cat ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
              fontSize: '13px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {t(`category_${cat.toLowerCase().replace('cat_', '')}`)}
          </button>
        ))}
      </div>


      {/* List Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="animate-pulse flex flex-col items-center gap-4">
              <Zap size={32} className="text-gold" />
              <div className="text-gold font-black tracking-widest uppercase text-xs">{t('loading')}</div>
            </div>
          </div>
        ) : filteredAds.length === 0 ? (
          <div style={{ 
            padding: '80px 20px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '32px', 
            border: '1px dashed rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Search size={40} className="text-white/10" />
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs" style={{ margin: 0 }}>
              {t('noPostings') || 'No models found in this area'}
            </p>
          </div>
        ) : (
            filteredAds.map((ad, index) => {
              const { title, description, location } = getAdData(ad, locale);
              return (
                <article key={ad.id} className="listing-card animate-fade shadow-2xl" style={{ 
                  animationDelay: `${index * 0.05}s`,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ padding: '4px 10px', fontSize: '9px', fontWeight: 900 }}>
                      {ad.category === 'CAT_EVENTOS' || ad.categoria === 'CAT_EVENTOS' ? t('category_eventos') : t('category_plazas')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700 }}>
                      <Clock size={12} />
                      <span>{getRelativeTime(ad.timestamp)}</span>
                    </div>
                  </div>

                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 900, 
                    color: '#fff', 
                    marginBottom: '8px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}>
                    {title}
                  </h3>

                  <p style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255,255,255,0.7)', 
                    lineHeight: 1.6, 
                    marginBottom: '20px',
                    fontWeight: 500,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                      <MapPin size={14} color="#c9a84c" />
                      <span>{location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c9a84c', fontSize: '12px', fontWeight: 800 }}>
                      <Zap size={14} className="fill-gold" />
                      <span className="uppercase tracking-wider">{t('live')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ 
                        flex: 1, 
                        padding: '16px', 
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(255,255,255,0.1)' 
                      }}
                      onClick={() => {
                        const contact = ad.contact || ad.contacto || ad.whatsapp || ad.phone || ad.phoneNumber || ad.sender || ad.from || '';
                        if (!contact) return alert('No contact info available');
                        
                        if (contact.includes('@')) {
                          window.open(`https://t.me/${contact.replace('@', '')}`, '_blank');
                        } else {
                          const cleanPhone = contact.replace(/[^0-9]/g, '');
                          if (cleanPhone.length < 5) {
                            window.open(`https://t.me/${contact.trim()}`, '_blank');
                          } else {
                            window.open(`https://wa.me/${cleanPhone}`, '_blank');
                          }
                        }
                      }}
                    >
                      {t('postularAhora')}
                    </button>
                    <button style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      width: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}>
                      <Share2 size={20} color="#fff" />
                    </button>
                  </div>
                </article>
              );
            })
        )}
      </div>
    </div>
  );
}
