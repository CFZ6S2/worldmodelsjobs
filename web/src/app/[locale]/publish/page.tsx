'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  MapPin, 
  Tag, 
  DollarSign, 
  MessageCircle, 
  ChevronRight, 
  Loader2, 
  ShieldCheck, 
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PublishPage() {
  const t = useTranslations('feed'); // Reusing feed translations for common terms
  const tp = useTranslations('pricing');
  const params = useParams();
  const locale = params?.locale || 'en';
  const router = useRouter();
  const { user, isConcierge, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    category: 'CAT_PLAZAS',
    contact: '',
    budget: '',
    platform: 'WEB_DASHBOARD',
    urgencia: 'NORMAL'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isAuto, setIsAuto] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login`);
    } else if (!authLoading && user && !isConcierge) {
      router.push(`/${locale}/pricing`);
    }
  }, [user, isConcierge, authLoading, locale, router]);

  // Real-time Auto-Categorization Engine
  useEffect(() => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();
    if (text.length < 5) return;

    const eventKeywords = [
      'fiesta', 'evento', 'despedida', 'cena', 'horas', 'encuentro', 
      'travel', 'tour', 'eurotour', 'booking', 'dates', 'destination',
      'cliente', 'imagen', 'particular', 'directo', 'direct', 'reserva', 'casting',
      'vip', 'vuelo', 'hotel', 'flight', 'shopping', 'acompañante', 'companion', 'social', 'outcall',
      'hoy', 'mañana', 'am', 'pm', 'tonight', 'tomorrow', 'cita', 'dating', 'hombre', 'natural', 'reservas'
    ];
    
    const housingKeywords = [
      'plaza', 'agencia', 'club', 'habitacion', 'habitación', 'habitaciones', 'independiente', 
      'apartamento', 'room', 'vaga', 'vagas', 'cuarto', 'quartos', 'alojamiento', 'fija', 'stay',
      'piso', 'piso para independiente', 'planta', 'mensual', 'larga estancia', 'recepcionista', 'telefonista'
    ];

    const hasEvent = eventKeywords.some(k => text.includes(k)) || /\b\d+\s*(?:h|hr|hrs|hora|horas)\b/i.test(text);
    const hasHousing = housingKeywords.some(k => text.includes(k));

    // 🏆 ESTRATEGIA OVERRIDER: Eventos SIEMPRE manda (Precisión Total)
    if (hasEvent) {
      if (formData.category !== 'CAT_EVENTOS') {
        setFormData(prev => ({ ...prev, category: 'CAT_EVENTOS' }));
        setIsAuto(true);
      }
    } else if (hasHousing && !isAuto) { 
      // Para plazas solo auto-fixeamos si el usuario no ha tocado nada aún
      if (formData.category !== 'CAT_PLAZAS') {
        setFormData(prev => ({ ...prev, category: 'CAT_PLAZAS' }));
        setIsAuto(true);
      }
    }
  }, [formData.title, formData.description, formData.category]);

  if (authLoading || !user || !isConcierge) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Get Security Token
      const idToken = await user?.getIdToken();

      // 2. Prepare Lead Data for the API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          ...formData,
          title_es: formData.title,
          text_es: formData.description,
          categoria: formData.category,
          ubicacion: formData.city,
          presupuesto: formData.budget,
          createdBy: user?.uid,
          platform: 'DASHBOARD_AGENCY'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error from API');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/feed`);
      }, 2000);
    } catch (err) {
      console.error('Error publishing lead:', err);
      alert('Error publishing. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] pb-32 pt-12 px-6">
      <div className="max-w-[420px] mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gold/10 rounded-xl border border-gold/20">
              <Crown size={16} className="text-gold" />
            </div>
            <span className="text-[10px] font-black tracking-[3px] text-gold uppercase">{tp('tierName')}</span>
          </div>
          <h1 className="text-3xl font-black font-playfair tracking-tight uppercase">
            Publicar <span className="text-gold">Plaza / Evento</span>
          </h1>
          <p className="text-[11px] font-medium text-white/40 leading-relaxed uppercase tracking-wider">
            Tu publicación será visible globalmente en el sistema de inteligencia premium.
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/20 rounded-[32px] p-12 flex flex-col items-center text-center gap-6"
          >
            <div className="p-4 bg-green-500 rounded-full text-black shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <ShieldCheck size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase mb-2">Publicado con éxito</h2>
              <p className="text-xs text-white/50">Tu inteligencia ha sido distribuida a los nodos globales.</p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Form Fields Section */}
            <div className="flex flex-col gap-6">
              
              {/* Category Selector with Auto-Detection Hint */}
              <div className="input-group flex flex-col gap-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">{t('category')}</label>
                  {isAuto && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[8px] font-black text-gold flex items-center gap-1 uppercase tracking-tighter"
                    >
                      <Tag size={10} className="fill-gold" /> Auto-detected
                    </motion.span>
                  )}
                </div>
                
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: 'CAT_PLAZAS' });
                      setIsAuto(false);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black tracking-wider transition-all z-10 ${
                      formData.category === 'CAT_PLAZAS' ? 'bg-gold text-black shadow-gold' : 'text-white/30'
                    }`}
                  >
                    {t('plazas')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: 'CAT_EVENTOS' });
                      setIsAuto(false);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black tracking-wider transition-all z-10 ${
                      formData.category === 'CAT_EVENTOS' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30'
                    }`}
                  >
                    {t('eventos')}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="input-group flex flex-col gap-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">Título de la Oferta</label>
                <input
                  required
                  placeholder="ej. Casting Premium en Marbella"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-gold/50 outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div className="input-group flex flex-col gap-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">Detalles / Contenido</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe los requisitos, horarios y beneficios..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-gold/50 outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div className="input-group flex flex-col gap-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">{t('city')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      required
                      placeholder="Madrid..."
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:border-gold/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="input-group flex flex-col gap-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">Presupuesto</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                      required
                      placeholder="€2500..."
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:border-gold/50 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="input-group flex flex-col gap-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">Enlace / Contacto (WA/TG)</label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input
                    required
                    placeholder="+34 600..."
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:border-gold/50 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Urgency */}
              <div className="input-group flex flex-col gap-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[2px] ml-4">Nivel de Prioridad</label>
                <div className="flex gap-2">
                  {['NORMAL', 'ALTA'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgencia: level })}
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${
                        formData.urgencia === level 
                          ? 'bg-white/10 border-white/20 text-white shadow-xl' 
                          : 'bg-transparent border-white/5 text-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex flex-col gap-6 pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full py-5 flex items-center justify-center gap-3 text-[12px] shadow-gold/20 disabled:grayscale disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>PUBLISH INTEL <Send size={18} /></>
                )}
              </button>

              <div className="flex items-start gap-3 px-4 py-4 bg-gold/5 rounded-2xl border border-gold/10">
                <ShieldCheck size={16} className="text-gold shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">
                  Como Miembro Elite, tus publicaciones tienen prioridad en el algoritmo y aparecen con badge de verificación inmediata.
                </p>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
