'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function SearchModal({ isOpen, onClose, searchTerm, setSearchTerm }: SearchModalProps) {
  const t = useTranslations('feed');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative w-full max-w-[440px] bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8 flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Search size={16} className="text-gold" />
                  </div>
                  <span className="text-[10px] font-black text-gold uppercase tracking-[2pt]">{t('search')}</span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              <div className="relative">
                <input
                  autoFocus
                  placeholder={t('searchPlaceholder') || "Dubai, Marbella, Eurotour..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-lg font-bold text-white placeholder:text-white/20 focus:border-gold/50 outline-none transition-all shadow-inner"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                   <Zap size={18} className={`${searchTerm ? 'text-gold fill-gold' : 'text-white/10'} transition-colors`} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">{t('trending') || "INTELIGENCIA POPULAR"}</p>
                <div className="flex flex-wrap gap-2">
                  {['Marbella', 'Eurotour', 'Casting', 'Dubai', 'Piso', 'Evento'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-4 py-2 bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/5 rounded-xl text-[10px] font-bold text-white/40 hover:text-gold transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gold/5 p-4 flex items-center justify-center border-t border-white/5">
                <p className="text-[8px] font-black text-gold uppercase tracking-[1pt]">
                   {t('resultsRealtime') || "Resultados actualizados en tiempo real"}
                </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
