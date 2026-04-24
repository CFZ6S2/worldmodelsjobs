'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Zap, MapPin, Search, ChevronLeft, ShieldCheck, Speaker } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [keywords, setKeywords] = useState('Moscow, Paris, Premium, VIP');

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', padding: '0 20px 100px 20px' }}>
       {/* Header */}
       <div style={{ paddingTop: '40px', paddingBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
         <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
         </button>
         <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>INTELLIGENCE ALERTS</h1>
            <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Real-Time Radar Config</p>
         </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Toggle Card */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '24px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '14px', 
                    background: enabled ? 'rgba(201, 168, 76, 0.1)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                 }}>
                    <Bell size={20} className={enabled ? 'text-gold' : 'text-muted'} />
                 </div>
                 <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Master Feed Alerts</h3>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Push notifications for new leads</p>
                 </div>
              </div>
              <button 
                onClick={() => setEnabled(!enabled)}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  background: enabled ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: enabled ? '27px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: enabled ? '#000' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s'
                }} />
              </button>
           </div>
        </div>

        {/* Filter Card */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '24px' }}>
           <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Keyword Intelligence Filters</h4>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                 <Search size={16} style={{ position: 'absolute', left: '16px', top: '18px', opacity: 0.3 }} />
                 <input 
                    type="text" 
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. Russia, London, VIP..."
                    style={{
                       width: '100%',
                       padding: '16px 16px 16px 48px',
                       background: 'rgba(255,255,255,0.03)',
                       border: '1px solid rgba(255,255,255,0.08)',
                       borderRadius: '16px',
                       color: '#fff',
                       fontSize: '14px',
                       outline: 'none'
                    }}
                 />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: '1.5' }}>
                 Enter comma-separated keywords. You will only receive alerts for intelligence matching these terms.
              </p>
           </div>
        </div>

        {/* Channels */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '24px' }}>
           <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Delivery Channels</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Speaker size={16} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Audio Cues</span>
                 </div>
                 <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)' }}>VIP ONLY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={16} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Telegram Mirroring</span>
                 </div>
                 <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)' }}>VIP ONLY</span>
              </div>
           </div>
        </div>

        <button 
           className="btn-primary"
           style={{ padding: '18px', width: '100%', marginTop: '10px' }}
           onClick={() => router.back()}
        >
           Save Radar Configuration
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.2, marginTop: '20px' }}>
           <ShieldCheck size={14} />
           <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>End-to-End Cryptography</span>
        </div>
      </div>
    </div>
  );
}
