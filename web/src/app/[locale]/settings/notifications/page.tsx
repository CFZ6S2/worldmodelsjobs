'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Volume2, Bookmark, Plus, X, ArrowLeft, Loader2, Save, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Standard Beep' },
  { id: 'luxury', name: 'Golden Chime' },
  { id: 'elegant', name: 'Soft Pulse' },
  { id: 'urgent', name: 'Triple Alert' },
];

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundId: 'default',
    keywords: [] as string[],
  });

  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const docRef = doc(db, 'user_settings', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadSettings();
  }, [user]);

  const addKeyword = () => {
    if (newKeyword && !settings.keywords.includes(newKeyword.toLowerCase())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.toLowerCase()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kw)
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'user_settings', user.uid), {
        ...settings,
        userId: user.uid,
        updated_at: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'Alert settings updated' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-32">
      <header className="sticky top-0 z-50 glass border-b border-white/5 bg-dark-bg/80 px-6 py-4 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-gold font-bold text-sm tap-scale">
          <ArrowLeft size={18} /> Back
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Notification Alerts</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 py-8 space-y-8">
        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <Zap size={20} />}
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}

        <div className="space-y-8">
           {/* Global Push Section */}
           <section className="card-glass flex items-center justify-between border-gold/10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Bell size={24} className="text-gold" />
                 </div>
                 <div>
                    <h3 className="text-base font-bold text-white">Push Notifications</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Real-time job match alerts</p>
                 </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.notificationsEnabled ? 'bg-gold shadow-[0_0_12px_rgba(201,168,76,0.3)]' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.notificationsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
           </section>

           {/* Sound Section */}
           <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Volume2 size={16} className="text-gray-500" />
                 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Alert Sound</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {NOTIFICATION_SOUNDS.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => setSettings(s => ({ ...s, soundId: sound.id }))}
                      className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all tap-scale ${
                        settings.soundId === sound.id 
                        ? 'glass-gold border-gold text-gold' 
                        : 'glass border-white/5 text-gray-500'
                      }`}
                    >
                      {sound.name}
                    </button>
                 ))}
              </div>
           </section>

           {/* Keywords Section */}
           <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <div className="flex items-center gap-2">
                    <Bookmark size={16} className="text-gray-500" />
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Smart Filters</h2>
                 </div>
                 <span className="text-[10px] font-bold text-gold uppercase tracking-tighter italic">AI Analysis</span>
              </div>

              <div className="card-glass space-y-6">
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={newKeyword} 
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                      placeholder="Add keyword (e.g. Paris, VIP)..." 
                      className="input-dark !bg-white/5"
                    />
                    <button onClick={addKeyword} className="bg-gold text-dark-900 rounded-xl px-4 tap-scale">
                       <Plus size={20} />
                    </button>
                 </div>

                 <div className="flex flex-wrap gap-2">
                    {settings.keywords.map(kw => (
                       <div key={kw} className="flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-4 py-2 rounded-xl text-xs font-bold">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="p-0.5 hover:bg-gold/20 rounded-full transition-colors">
                             <X size={14} />
                          </button>
                       </div>
                    ))}
                    {settings.keywords.length === 0 && (
                       <div className="w-full py-8 text-center glass border-dashed border-white/5 rounded-2x border-2">
                          <p className="text-xs text-gray-600 font-medium">No active keyword alerts</p>
                       </div>
                    )}
                 </div>
              </div>
           </section>

           <div className="pt-4">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-gold w-full py-4 text-base shadow-2xl shadow-gold/20 tap-scale"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? 'Updating...' : 'Save Activity Preferences'}
              </button>
           </div>
        </div>
      </main>
    </div>
  );
}
