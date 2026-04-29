'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
    if (!user || !confirm(`Are you sure you want to restart ${service}?`)) return;
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
        alert(`${service} restart command sent successfully.`);
        setTimeout(fetchStats, 5000);
      }
    } catch (err) {
      alert('Failed to restart service');
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c9a84c]"></div>
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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#c9a84c] tracking-tight">CONTROL TOWER</h1>
            <p className="text-gray-500 mt-2 font-medium uppercase tracking-widest text-xs">WorldModels Infrastructure Management</p>
          </div>
          <div className="flex items-center gap-3 bg-[#111] p-2 rounded-lg border border-[#222]">
            <div className={`w-3 h-3 rounded-full ${stats?.status === 'OK' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-bold uppercase tracking-tighter">{stats?.status || 'CONNECTING...'}</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Leads (24h)" value={stats?.leads24h ?? '...'} subValue="Ingested leads" />
          <StatCard title="Total Database" value={stats?.totalLeads ?? '...'} subValue="Historic records" />
          <StatCard title="System Uptime" value={stats ? formatUptime(stats.uptime) : '...'} subValue={`Node ${stats?.nodeVersion || ''}`} />
          <StatCard title="Last Lead" value={stats ? (stats.lastLeadTime !== 'N/A' ? new Date(stats.lastLeadTime).toLocaleTimeString() : 'N/A') : '...'} subValue="Real-time pulse" />
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#111] rounded-2xl p-8 border border-[#222]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Command Center
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ActionButton 
                label="Restart Backend" 
                onClick={() => handleRestart('backend')} 
                loading={actionLoading === 'backend'}
                description="Refreshes API & Duplication Guard"
              />
              <ActionButton 
                label="Restart Sniffer" 
                onClick={() => handleRestart('sniffer')} 
                loading={actionLoading === 'sniffer'}
                description="Reconnects Telegram Listeners"
              />
              <ActionButton 
                label="Emergency Reset" 
                onClick={() => handleRestart('all')} 
                loading={actionLoading === 'all'}
                variant="danger"
                description="Full system reboot (PM2 All)"
              />
            </div>
          </div>

          <div className="bg-[#111] rounded-2xl p-8 border border-[#222]">
            <h2 className="text-xl font-bold mb-6">Server Specs</h2>
            <div className="space-y-4">
              <SpecItem label="Platform" value={stats?.platform || '...'} />
              <SpecItem label="Memory (RSS)" value={stats ? `${Math.round(stats.memory.rss / 1024 / 1024)} MB` : '...'} />
              <SpecItem label="Heap Used" value={stats ? `${Math.round(stats.memory.heapUsed / 1024 / 1024)} MB` : '...'} />
              <div className="pt-4 mt-4 border-t border-[#222]">
                <p className="text-xs text-gray-600">Admin User: {user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue }: { title: string, value: any, subValue: string }) {
  return (
    <div className="bg-[#111] p-6 rounded-2xl border border-[#222] hover:border-[#c9a84c33] transition-colors">
      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">{title}</p>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-gray-600">{subValue}</p>
    </div>
  );
}

function ActionButton({ label, onClick, loading, description, variant = 'default' }: { label: string, onClick: () => void, loading: boolean, description: string, variant?: 'default' | 'danger' }) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
        variant === 'danger' 
          ? 'bg-red-950/20 border-red-900/50 hover:bg-red-900/40 text-red-200' 
          : 'bg-[#1a1a1a] border-[#333] hover:border-[#c9a84c] text-white'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="font-bold mb-1">{loading ? 'Processing...' : label}</span>
      <span className="text-[10px] uppercase tracking-tighter opacity-60">{description}</span>
    </button>
  );
}

function SpecItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-mono text-[#c9a84c]">{value}</span>
    </div>
  );
}
