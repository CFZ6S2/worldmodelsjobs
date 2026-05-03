'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, UserPlus, Trash2, Phone, Calendar, Info, ChevronLeft, Lock } from 'lucide-react';

export default function BlacklistPage() {
  const { userData, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [reason, setReason] = useState('Spam/Malicious behavior');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'banned_users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBannedUsers(bans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authLoading, isAdmin]);

  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber) return;

    try {
      await addDoc(collection(db, 'banned_users'), {
        phone: newNumber.replace(/\s+/g, ''),
        reason: reason,
        bannedAt: serverTimestamp(),
        adminId: userData?.uid
      });
      setNewNumber('');
      setReason('Spam/Malicious behavior');
    } catch (err) {
      console.error('Error adding ban:', err);
      alert('Failed to add to blacklist');
    }
  };

  const handleRemoveBan = async (id: string) => {
    if (window.confirm('Are you sure you want to lift this ban?')) {
      try {
        await deleteDoc(doc(db, 'banned_users', id));
      } catch (err) {
        console.error('Error removing ban:', err);
      }
    }
  };

  if (authLoading || loading) return null;

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <Lock size={48} className="text-gold" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#fff' }}>Access Restricted</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '280px' }}>Only high-level intelligence officers can access the systemic blacklist.</p>
        <button onClick={() => router.push(`/${locale}/feed`)} className="btn-primary" style={{ marginTop: '24px', padding: '12px 24px' }}>Return to Feed</button>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', padding: '0 20px 100px 20px' }}>
       {/* Header */}
       <div style={{ paddingTop: '40px', paddingBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
         <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
         </button>
         <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>SYSTEMIC BLACKLIST</h1>
            <p style={{ fontSize: '10px', fontWeight: 800, color: '#ff4444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Security Enforcement Console</p>
         </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Add Ban Form */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '24px', border: '1px solid rgba(255,68,68,0.2)' }}>
           <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ff4444', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>
             <ShieldAlert size={16} /> New Security Ban
           </h4>
           <form onSubmit={handleAddBan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <div style={{ flex: 1, position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '16px', top: '16px', opacity: 0.3 }} />
                    <input 
                       type="text" 
                       placeholder="Phone (e.g. +5521990286011)"
                       value={newNumber}
                       onChange={(e) => setNewNumber(e.target.value)}
                       required
                       style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px' }}
                    />
                 </div>
                 <button type="submit" className="btn-primary" style={{ background: '#ff4444', padding: '0 24px', borderRadius: '12px' }}>
                    <UserPlus size={18} />
                 </button>
              </div>
              <input 
                 type="text" 
                 placeholder="Reason for ban..."
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
           </form>
        </div>

        {/* Banned List */}
        <div>
           <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', paddingLeft: '8px' }}>
             Active System Bans ({bannedUsers.length})
           </h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bannedUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
                   <p style={{ fontSize: '13px' }}>Currently no systemic bans active.</p>
                </div>
              ) : bannedUsers.map((ban) => (
                <div key={ban.id} className="listing-card" style={{ marginBottom: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                         width: '40px', 
                         height: '40px', 
                         borderRadius: '10px', 
                         background: 'rgba(255,68,68,0.1)', 
                         color: '#ff4444',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center'
                      }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <p style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>{ban.phone}</p>
                         <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0' }}>{ban.reason}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleRemoveBan(ban.id)}
                     style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                     onMouseOver={(e) => e.currentTarget.style.color = '#ff4444'}
                     onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
