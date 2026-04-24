'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Zap, MapPin, AlignLeft, CreditCard, Send, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function PublishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    category: 'CAT_PLAZAS'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        timestamp: serverTimestamp(),
        ingestedAt: new Date().toISOString()
      });
      
      setSuccess(true);
      setTimeout(() => router.push('/feed'), 2000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit intelligence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <CheckCircle2 size={64} className="text-gold" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 15px rgba(201,168,76,0.4))' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>Intelligence Submitted</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Your lead is being processed by our system.</p>
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
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>SUBMIT INTELLIGENCE</h1>
            <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Direct Listing Portal</p>
         </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="listing-card" style={{ marginBottom: 0, padding: '24px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase' }}>Listing Title</label>
                  <div style={{ position: 'relative' }}>
                    <Zap size={16} style={{ position: 'absolute', left: '16px', top: '18px', opacity: 0.3 }} />
                    <input 
                      type="text" 
                      placeholder="e.g. VIP Hostess Moscow"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase' }}>Operation Area</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '16px', top: '18px', opacity: 0.3 }} />
                    <input 
                      type="text" 
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                      style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase' }}>Detailed Intelligence</label>
                  <div style={{ position: 'relative' }}>
                    <AlignLeft size={16} style={{ position: 'absolute', left: '16px', top: '18px', opacity: 0.3 }} />
                    <textarea 
                      placeholder="Describe the opportunity or requirement..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                      rows={5}
                      style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#fff', outline: 'none', resize: 'none' }}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase' }}>Budget / Rate (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={16} style={{ position: 'absolute', left: '16px', top: '18px', opacity: 0.3 }} />
                    <input 
                      type="text" 
                      placeholder="e.g. 5000€"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>
             </div>
          </div>

          {error && (
            <div style={{ padding: '16px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '16px', color: '#ff6b6b', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            {loading ? (
              <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <>
                <Send size={18} />
                Deploy Intelligence
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
