'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, MessageSquare, Loader2, Crown, Lock, Search, AlertTriangle, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';

export default function BlacklistPage() {
  const { user, isVip, loading: authLoading } = useAuth();
  const t = useTranslations('feed'); // Reusing some feed translations
  const params = useParams();
  const locale = (params?.locale as string) || 'es';
  const router = useRouter();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isVip) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'lead_reviews'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isVip]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  // Filter reports
  const filteredReports = reports.filter(r => 
    (r.contact?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#000] pb-32 font-playfair">
      <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 relative bg-gradient-to-b from-[#0a0000] to-[#000]">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-3xl px-6 py-6 border-b border-red-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <ShieldAlert size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none mb-1 text-white">
                LISTA <span className="text-red-600">NEGRA</span>
              </h1>
              <p className="text-[7px] font-black text-red-600/70 tracking-[3pt] uppercase">
                PLAZAS Y CONTACTOS REPORTEADOS
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="Buscar por teléfono o plaza..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-red-600/50 transition-all text-white"
            />
          </div>
        </header>

        <main className="px-5 pt-8">
          {!isVip ? (
            /* LOCK SCREEN */
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                <Lock size={40} className="text-red-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-tight">Acceso Restringido</h2>
                <p className="text-[10px] uppercase font-black tracking-[2px] text-white/40 max-w-[280px] leading-relaxed mx-auto">
                  Solo las <span className="text-gold">Membresías VIP</span> pueden acceder a la base de inteligencia táctica y seguridad.
                </p>
              </div>
              <button 
                onClick={() => router.push(`/${locale}/profile`)}
                className="btn-premium px-10 py-5 flex items-center gap-3 text-[11px]"
              >
                OBTENER ACCESO VIP <Crown size={14} />
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-20 gap-6">
              <Loader2 size={40} className="animate-spin text-red-600" />
              <p className="text-[9px] font-black tracking-[4px] uppercase">Descifrando Reportes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-32 opacity-20 flex flex-col items-center gap-4">
              <AlertTriangle size={30} />
              <p className="text-[9px] font-black tracking-[4px] uppercase">No hay amenazas detectadas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white/[0.03] border border-red-900/20 rounded-[28px] overflow-hidden relative group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full">
                          <AlertTriangle size={10} className="text-red-600" />
                          <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">AMENAZA CONFIRMADA</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/20">
                          {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : '---'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2 bg-white/5 rounded-lg">
                            <Phone size={14} className="text-red-500" />
                          </div>
                          <h3 className="text-lg font-bold font-mono tracking-tighter text-white">
                            {report.contact || 'ID: ' + report.leadId.slice(-8)}
                          </h3>
                        </div>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider pl-11">
                          {report.title || 'Plaza sin título'}
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 italic text-[12px] text-white/70 leading-relaxed relative">
                        <MessageSquare className="absolute -top-2 -left-2 text-red-600 opacity-20" size={24} />
                        "{report.content || report.comment}"
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[8px] font-black uppercase text-white/20 tracking-[2px]">
                        <span>REPORTEADO POR: ANÓNIMA</span>
                        <div className="flex h-1 gap-1">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className={`w-3 rounded-full ${i < (report.rating || 1) ? 'bg-red-600' : 'bg-white/10'}`} />
                           ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-8 py-6 z-50">
           <BottomNav />
        </div>
      </div>
      <style jsx global>{`
        .btn-premium {
          @apply relative overflow-hidden font-black uppercase tracking-[2px] rounded-xl transition-transform active:scale-95;
          background: linear-gradient(135deg, #d4af37 0%, #f9d976 50%, #b8860b 100%);
          color: black;
        }
      `}</style>
    </div>
  );
}
