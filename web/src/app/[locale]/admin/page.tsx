'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Crown, Zap, Shield, RefreshCw, Database, Activity, Terminal } from 'lucide-react';
import { useLocale } from 'next-intl';

interface SystemStats {
  status: string;
  uptime: number;
  leads24h: number;
  totalLeads: number;
  lastLeadTime: string;
  memory: { rss: number; heapUsed: number };
  platform: string;
  nodeVersion: string;
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://178.156.186.149:3001/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleRestart = async (service: string) => {
    if (!user || !confirm(`Confirm restart: ${service}?`)) return;
    setActionLoading(service);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://178.156.186.149:3001/api/admin/restart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ service })
      });
      if (res.ok) {
        alert(`${service} restart initialized.`);
        setTimeout(fetchStats, 5000);
      }
    } catch (err) {
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/');
      } else {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c9a84c]"></div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="flex-1 flex flex-col pb-32 animate-fade">
      {/* Header - Matching Mobile Style */}
      <header className="glass-nav" style={{ top: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Crown size={20} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Admin Panel</h1>
            <p className="text-gold" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Control Tower</p>
          </div>
        </div>
        <div className="badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className={`w-2 h-2 rounded-full ${stats?.status === 'OK' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span>{stats?.status || 'OFFLINE'}</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '100px 20px 40px' }}>
        
        {/* Real-time Health Badge */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
           <div className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <Activity size={14} />
              <span>LIVE SYSTEM PULSE: {stats ? (stats.lastLeadTime !== 'N/A' ? `${Math.floor((new Date().getTime() - new Date(stats.lastLeadTime).getTime())/60000)}m lag` : 'N/A') : '...'}</span>
           </div>
        </div>

        {/* Stats Grid - Mobile Optimized */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="listing-card" style={{ padding: '16px', marginBottom: 0 }}>
             <Zap size={18} color="#c9a84c" style={{ marginBottom: '8px' }} />
             <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Leads (24h)</p>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats?.leads24h ?? '...'}</h3>
          </div>
          <div className="listing-card" style={{ padding: '16px', marginBottom: 0 }}>
             <Database size={18} color="#c9a84c" style={{ marginBottom: '8px' }} />
             <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total DB</p>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats?.totalLeads ?? '...'}</h3>
          </div>
          <div className="listing-card" style={{ padding: '16px', marginBottom: 0, gridColumn: 'span 2' }}>
             <Activity size={18} color="#c9a84c" style={{ marginBottom: '8px' }} />
             <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>System Uptime</p>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stats ? formatUptime(stats.uptime) : '...'}</h3>
             <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Node {stats?.nodeVersion}</p>
          </div>
        </div>

        {/* Command Center */}
        <div className="listing-card" style={{ padding: '24px' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} color="#c9a84c" />
              COMMAND CENTER
           </h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => handleRestart('backend')}
                disabled={!!actionLoading}
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '12px' }}
              >
                {actionLoading === 'backend' ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                RESTART BACKEND
              </button>

              <button 
                onClick={() => handleRestart('sniffer')}
                disabled={!!actionLoading}
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '12px' }}
              >
                {actionLoading === 'sniffer' ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                RESTART SNIFFER
              </button>

              <button 
                onClick={() => handleRestart('all')}
                disabled={!!actionLoading}
                style={{ 
                  width: '100%', 
                  background: 'rgba(231, 76, 60, 0.1)', 
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  color: '#e74c3c',
                  padding: '16px',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {actionLoading === 'all' ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                EMERGENCY RESET
              </button>
           </div>
        </div>

        {/* Server Specs */}
        <div style={{ marginTop: '24px' }}>
           <h4 style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '8px' }}>
              Infrastructure Details
           </h4>
           <div className="listing-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Platform</span>
                 <span style={{ fontSize: '12px', fontWeight: 700 }}>{stats?.platform || '...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Memory (RSS)</span>
                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9a84c' }}>{stats ? `${Math.round(stats.memory.rss / 1024 / 1024)} MB` : '...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Heap Used</span>
                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9a84c' }}>{stats ? `${Math.round(stats.memory.heapUsed / 1024 / 1024)} MB` : '...'}</span>
              </div>
           </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '32px', fontStyle: 'italic' }}>
          Secure Access: {user?.email}
        </p>
      </main>
    </div>
  );
}
