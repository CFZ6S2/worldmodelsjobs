import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, ShieldAlert, ExternalLink, Crown, MessageSquare, Lock, Loader2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, arrayUnion } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    title?: string;
    contact?: string;
    platform?: string;
  } | null;
}

export default function ContactModal({ isOpen, onClose, lead }: ContactModalProps) {
  const { user, isVip, isAdmin, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const t = useTranslations('feed');
  
  const [isPhone, setIsPhone] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealing, setRevealing] = useState(false);

  // Logic for contact visibility
  const openedContacts = userData?.openedContacts || [];
  // Admin and VIP have full visibility. Regular users check their list.
  const isOpened = isAdmin || isVip || (lead?.id ? openedContacts.includes(lead.id) : false);
  const contactsCount = openedContacts.length;
  // Admin and VIP can always "Open" (though they are already opened).
  const canOpen = isAdmin || isVip || contactsCount < 3;
  const remaining = Math.max(0, 3 - contactsCount);

  const handleReveal = async () => {
    if (!user || !lead?.id || revealing || !canOpen) return;
    
    setRevealing(true);
    try {
      const userRef = doc(db, 'profiles', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        openedContacts: arrayUnion(lead.id),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error revealing contact:", err);
    } finally {
      setRevealing(false);
    }
  };

  useEffect(() => {
    if (lead?.contact) {
      const cleanContact = lead.contact.replace(/\s/g, '');
      const phoneRegex = /^\+?\d{8,15}$/;
      setIsPhone(phoneRegex.test(cleanContact));
    }
  }, [lead]);

  // Fetch reviews
  useEffect(() => {
    if (!isOpen || !lead?.id || !isVip) return;

    const q = query(
      collection(db, 'lead_reviews'),
      where('leadId', '==', lead.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(revs);
    });

    return () => unsubscribe();
  }, [isOpen, lead?.id, isVip]);

  // Derived values with safety fallbacks to prevent hook mismatch errors
  const isUrl = !!(lead?.contact?.startsWith('http') || lead?.contact?.includes('t.me/') || lead?.contact?.includes('wa.me/'));
  const isTelegram = !!(!isPhone && (lead?.contact?.startsWith('@') || lead?.contact?.includes('t.me/')));
  const isWA = isPhone && !isUrl;
  const hasContact = !!lead?.contact;
  const contactValue = lead?.contact || '';

  const handleAction = () => {
    if (!hasContact || !lead?.contact) return;
    
    if (isUrl) {
      window.open(lead.contact, '_blank');
      return;
    }

    const clean = lead.contact.replace(/[\s\+@]/g, '');
    if (isWA) {
      window.open(`https://wa.me/${clean}`, '_blank');
    } else {
      const tgUser = lead.contact.replace(/[@https:\/\/t.me\/]/g, '');
      window.open(`https://t.me/${tgUser}`, '_blank');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !user || !lead?.id || submitting) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'lead_reviews'), {
        leadId: lead.id,
        uid: user.uid,
        userEmail: user.email,
        content: newReview.trim(),
        contact: lead.contact,
        platform: lead.platform,
        title: lead.title,
        createdAt: serverTimestamp(),
      });
      setNewReview('');
    } catch (err) {
      console.error("Error adding review:", err);
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {(isOpen && lead) && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[420px] bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.8)] pointer-events-auto"
            >
              {/* Header */}
              <div className="px-8 py-8 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20">
                    <Crown size={24} className="text-gold" />
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-bold font-playfair tracking-tight mb-2 uppercase">{t('contactTitle')}</h2>
                  <p className="text-[11px] font-black tracking-[3px] text-gold uppercase opacity-80">{t('contactSubtitle')}</p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden group">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">{t('contactData')}</span>
                  
                  {isOpened ? (
                    /* OPENED STATE: Show real contact */
                    <p className="text-xl font-black font-mono tracking-wider break-all text-white/90">
                      {contactValue}
                    </p>
                  ) : canOpen ? (
                    /* REVEAL STATE: Not yet opened, but has slots */
                    <div className="flex flex-col gap-4">
                      <p className="text-xl font-black font-mono tracking-wider blur-md select-none opacity-20">
                        {contactValue.replace(/./g, 'X')}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={handleReveal}
                          disabled={revealing}
                          className="w-full py-4 bg-gold rounded-xl text-black text-[10px] font-black uppercase hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
                        >
                          {revealing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
                          {revealing ? t('revealing') : t('revealContact')}
                        </button>
                        <span className="text-[9px] font-bold text-gold/60 uppercase tracking-widest text-center">
                          {t('contactsRemaining', { count: remaining })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* LIMIT REACHED STATE: Show Paywall */
                    <div className="flex flex-col gap-4 items-center py-2">
                      <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 animate-pulse">
                        <Lock size={20} />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tight mb-1">{t('contactLimitTitle')}</h4>
                        <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase max-w-[200px] mx-auto">
                          {t('contactLimitSubtitle')}
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/${locale}/profile`)}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase transition-all flex items-center justify-center gap-2"
                      >
                        <Crown size={12} className="text-gold" />
                        {t('becomeVip')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleAction}
                    disabled={!hasContact || !isOpened}
                    className="btn-premium w-full py-5 flex items-center justify-center gap-3 text-[12px] shadow-[0_8px_32px_rgba(212,175,55,0.25)] disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {isUrl ? (
                      <><ExternalLink size={18} strokeWidth={2.5} /> {t('openLink', { defaultValue: 'Abrir Enlace' })}</>
                    ) : isWA ? (
                      <><MessageCircle size={18} strokeWidth={2.5} /> {t('openPlatform', { platform: 'WhatsApp' })}</>
                    ) : (
                      <><Send size={18} strokeWidth={2.5} /> {t('openPlatform', { platform: 'Telegram' })}</>
                    )}
                    <ExternalLink size={14} className="opacity-40" />
                  </button>

                  <div className="flex items-start gap-3 px-4 py-3 bg-red-500/5 rounded-xl border border-red-500/10 grayscale-[0.5] hover:grayscale-0 transition-all">
                    <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">
                      {t('safetyAlert')}
                    </p>
                  </div>
                </div>
              </div>

              {/* VIP Reviews Section */}
              <div className="bg-white/[0.02] border-t border-white/5 px-8 py-8 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold flex items-center gap-2 uppercase">
                      <MessageSquare size={14} className="text-gold" />
                      {t('reviewsTitle')}
                    </h3>
                    <span className="text-[8px] font-black tracking-[2px] text-gold/50 font-mono uppercase">{t('reviewsSubtitle')}</span>
                  </div>
                  {isVip && reviews.length > 0 && (
                    <div className="flex items-center gap-1 text-gold">
                      <Star size={10} fill="currentColor" />
                      <span className="text-[10px] font-bold">{reviews.length}</span>
                    </div>
                  )}
                </div>

                {isVip ? (
                  <div className="flex flex-col gap-6">
                    {/* Add Review Form */}
                    <form onSubmit={handleSubmitReview} className="flex gap-2">
                      <input 
                        type="text"
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder={t('addReviewPlaceholder')}
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-xs focus:border-gold/30 focus:outline-none transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={submitting || !newReview.trim()}
                        className="bg-gold text-black rounded-xl px-4 py-2 text-[8px] font-black uppercase hover:bg-gold/90 transition-colors disabled:opacity-30"
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : t('submitReview')}
                      </button>
                    </form>

                    {/* Reviews List */}
                    <div className="flex flex-col gap-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                      {reviews.length > 0 ? (
                        reviews.map((rev) => (
                          <div key={rev.id} className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-bold text-gold/40 uppercase tracking-tighter">ANÓNIMA</span>
                              <span className="text-[8px] text-white/20 font-mono">
                                {rev.createdAt?.toDate().toLocaleDateString() || '...'}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed italic">
                              "{rev.content}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-white/30 text-center py-4 italic">{t('noReviews')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* VIP LOCK SCREEN */
                  <div className="relative group cursor-pointer" onClick={() => router.push(`/${locale}/profile`)}>
                    <div className="absolute inset-0 bg-gold/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden backdrop-blur-[2px]">
                      <div className="p-3 bg-gold/10 rounded-full border border-gold/20 text-gold animate-pulse">
                        <Lock size={24} />
                      </div>
                      <p className="text-[9px] font-black text-white/60 leading-relaxed uppercase tracking-wider max-w-[240px]">
                        {t('vipOnlyReviews')}
                      </p>
                      <div className="px-4 py-2 bg-gold/20 border border-gold/30 rounded-lg flex items-center gap-2 group-hover:bg-gold transition-all duration-300">
                        <Crown size={12} className="text-gold group-hover:text-black" />
                        <span className="text-[9px] font-black text-gold group-hover:text-black uppercase tracking-tighter">{t('becomeVip')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Decoration */}
              <div className="h-2 w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
