'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, ShieldCheck, Crown, LogOut, Settings, Bell, ChevronRight, Zap } from 'lucide-react';

export default function ProfilePage() {
  const { userData, user, logout, loading, isPremium, isVip, isAdmin } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', padding: '0 20px 100px 20px' }}>
      {/* Premium Header */}
      <div style={{ paddingTop: '60px', paddingBottom: '40px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 20px' }}>
           <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '35px', 
              background: 'linear-gradient(135deg, #222, #050505)', 
              border: '2px solid rgba(201, 168, 76, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 15px 35px rgba(0,0,0,0.8)'
           }}>
              <User size={48} className="text-gold" style={{ opacity: 0.8 }} />
           </div>
           {(isPremium || isVip) && (
             <div style={{ 
               position: 'absolute', 
               bottom: '-5px', 
               right: '-5px', 
               background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)',
               padding: '6px',
               borderRadius: '12px',
               boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
             }}>
               <Crown size={16} color="#000" />
             </div>
           )}
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 5px 0' }}>
          {userData?.alias || (user?.email?.split('@')[0]) || 'Member'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
           <span className="badge" style={{ fontSize: '9px', padding: '4px 10px' }}>
             {isAdmin ? 'System Admin' : isVip ? 'Exclusive VIP' : isPremium ? 'Premium Intelligence' : 'Explorer'}
           </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Identity Card */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '20px' }}>
           <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Identity & Security</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} className="text-muted" />
                 </div>
                 <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Registered Email</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{user.email}</p>
                 </div>
                 <ShieldCheck size={18} className="text-gold" style={{ opacity: 0.5 }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} className="text-muted" />
                 </div>
                 <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Subscription Level</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{isPremium ? 'Active Premium' : 'Free Access'}</p>
                 </div>
                 <ChevronRight size={18} className="text-muted" />
              </div>
           </div>
        </div>

        {/* Action Menu */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '12px' }}>
           {[
             { label: 'Notifications', icon: Bell, href: '/settings/notifications' },
             { label: 'Account Settings', icon: Settings, href: '/settings' },
           ].map((item, idx) => (
             <button 
               key={idx}
               onClick={() => router.push(`/${item.href}`)}
               style={{ 
                 width: '100%', 
                 padding: '16px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '16px', 
                 background: 'none', 
                 border: 'none',
                 cursor: 'pointer',
                 borderBottom: idx === 0 ? '1px solid rgba(255,255,255,0.03)' : 'none'
               }}
             >
               <item.icon size={18} className="text-gold" />
               <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: '#fff', textAlign: 'left' }}>{item.label}</span>
               <ChevronRight size={16} className="text-muted" />
             </button>
           ))}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{ 
            marginTop: '20px',
            width: '100%', 
            padding: '20px', 
            borderRadius: '20px', 
            background: 'rgba(255,50,50,0.05)', 
            border: '1px solid rgba(255,50,50,0.1)',
            color: '#ff6b6b',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,50,50,0.05)'}
        >
          <LogOut size={18} />
          Secure Logout
        </button>

      </div>
    </div>
  );
}
