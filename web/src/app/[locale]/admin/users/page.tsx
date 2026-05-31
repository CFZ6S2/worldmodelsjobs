'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Crown, Shield, ShieldAlert, ArrowLeft, Users, Search, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

interface UserRecord {
  uid: string;
  email: string;
  userRole?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  alias?: string;
  city?: string;
}

export default function AdminUsersPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'premium'>('all');
  const [fetchLoading, setFetchLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user) return;
    setFetchLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      // Adjust to production URL or relative path if proxied
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'http://178.156.186.149:3001';

      const res = await fetch(`${baseUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError(locale === 'es' ? 'Error al cargar usuarios' : 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleUpdateUser = async (uid: string, fields: Partial<UserRecord>) => {
    if (!user) return;
    setUpdatingUid(uid);
    try {
      const token = await user.getIdToken();
      const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'http://178.156.186.149:3001';

      const res = await fetch(`${baseUrl}/api/admin/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, ...fields })
      });
      
      if (res.ok) {
        // Update local state
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...fields } : u));
      } else {
        alert(locale === 'es' ? 'Error al actualizar usuario' : 'Failed to update user');
      }
    } catch (err) {
      alert('Error updating user');
    } finally {
      setUpdatingUid(null);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } else if (!isAdmin) {
        router.push(`/${locale}`);
      } else {
        fetchUsers();
      }
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    let result = users;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.email?.toLowerCase().includes(q) || 
        u.alias?.toLowerCase().includes(q) || 
        u.uid?.toLowerCase().includes(q)
      );
    }

    // Role type filter
    if (roleFilter === 'admin') {
      result = result.filter(u => u.userRole === 'admin' || u.isAdmin === true);
    } else if (roleFilter === 'premium') {
      result = result.filter(u => u.isPremium === true);
    }

    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c9a84c]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-32 animate-fade" style={{ background: '#000', minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-nav" style={{ top: 0, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => router.push(`/${locale}/admin`)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
              {locale === 'es' ? 'Gestión de Usuarios' : 'User Management'}
            </h1>
            <p className="text-gold" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              {locale === 'es' ? 'Panel de Control' : 'Database Access'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={20} className="text-gold" />
          <span className="badge" style={{ fontSize: '11px', padding: '4px 8px' }}>{users.length}</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '100px 20px 40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {/* Search and Filters */}
        <div className="listing-card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input 
              type="text" 
              placeholder={locale === 'es' ? 'Buscar por email, alias o UID...' : 'Search by email, alias or UID...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 16px 12px 40px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'admin', 'premium'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setRoleFilter(filter)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: roleFilter === filter ? '#c9a84c' : 'rgba(255,255,255,0.05)',
                  background: roleFilter === filter ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                  color: roleFilter === filter ? '#c9a84c' : 'rgba(255,255,255,0.6)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {filter === 'all' && (locale === 'es' ? 'Todos' : 'All')}
                {filter === 'admin' && 'Admin'}
                {filter === 'premium' && 'Premium'}
              </button>
            ))}
          </div>
        </div>

        {/* Status / Loader */}
        {fetchLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 0' }}>
            <Loader2 className="animate-spin text-gold" size={32} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {locale === 'es' ? 'Cargando usuarios...' : 'Fetching users...'}
            </p>
          </div>
        ) : error ? (
          <div className="listing-card" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(231,76,60,0.2)' }}>
            <AlertTriangle size={32} color="#e74c3c" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#ff6b6b', fontSize: '14px', margin: '0 0 16px 0' }}>{error}</p>
            <button className="btn-primary" onClick={fetchUsers} style={{ padding: '8px 16px', fontSize: '12px' }}>
              {locale === 'es' ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
            <Users size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>
              {locale === 'es' ? 'No se encontraron usuarios.' : 'No users found.'}
            </p>
          </div>
        ) : (
          /* Users List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((u) => {
              const userIsAdmin = u.userRole === 'admin' || u.isAdmin === true;
              const userIsPremium = u.isPremium === true;
              const isUpdating = updatingUid === u.uid;

              return (
                <div key={u.uid} className="listing-card" style={{ padding: '16px', marginBottom: 0, opacity: isUpdating ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {u.alias || u.email?.split('@')[0] || 'Anonymous'}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
                        {u.email}
                      </p>
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', margin: 0 }}>
                        UID: {u.uid}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {userIsAdmin && (
                        <span className="badge" style={{ background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', color: '#000', fontSize: '9px', fontWeight: 900 }}>
                          ADMIN
                        </span>
                      )}
                      {userIsPremium && (
                        <span className="badge" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', fontSize: '9px' }}>
                          PREMIUM
                        </span>
                      )}
                      {!userIsAdmin && !userIsPremium && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>
                          FREE
                        </span>
                      )}
                    </div>
                  </div>

                  {u.city && (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px 0' }}>
                      📍 {u.city}
                    </p>
                  )}

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px', marginTop: '12px' }}>
                    {/* Toggle Admin */}
                    <button
                      disabled={isUpdating || u.uid === user.uid} // Can't remove admin from yourself
                      onClick={() => handleUpdateUser(u.uid, { 
                        isAdmin: !userIsAdmin, 
                        userRole: !userIsAdmin ? 'admin' : 'user' 
                      })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: userIsAdmin ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.03)',
                        color: userIsAdmin ? '#e74c3c' : '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: u.uid === user.uid ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Shield size={12} />
                      {userIsAdmin 
                        ? (locale === 'es' ? 'Quitar Admin' : 'Revoke Admin') 
                        : (locale === 'es' ? 'Hacer Admin' : 'Make Admin')}
                    </button>

                    {/* Toggle Premium */}
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateUser(u.uid, { isPremium: !userIsPremium })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(201,168,76,0.2)',
                        background: userIsPremium ? 'rgba(255,255,255,0.03)' : 'rgba(201,168,76,0.1)',
                        color: userIsPremium ? '#fff' : '#c9a84c',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Crown size={12} />
                      {userIsPremium 
                        ? (locale === 'es' ? 'Quitar Premium' : 'Revoke Premium') 
                        : (locale === 'es' ? 'Dar Premium' : 'Grant Premium')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
