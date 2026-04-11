'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Search, 
  User, 
  Crown, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Briefcase,
  MessageSquare,
  Trash2,
  XCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const t = useTranslations('profile');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-gray-400">No tienes permisos para acceder a este panel administrativo.</p>
        </div>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    setTargetUser(null);
    setSuccess(null);

    try {
      const q = query(
        collection(db, 'profiles'),
        where('email', '==', searchQuery.trim().toLowerCase())
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Option 2: Try by phone? (Assuming 'phone' field exists)
        const qPhone = query(collection(db, 'profiles'), where('phone', '==', searchQuery.trim()));
        const snapPhone = await getDocs(qPhone);
        if (snapPhone.empty) {
          setError('No se encontró ningún usuario con ese email.');
          return;
        }
        setTargetUser({ id: snapPhone.docs[0].id, ...snapPhone.docs[0].data() });
      } else {
        setTargetUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    } catch (err: any) {
      setError('Error al buscar usuario: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const toggleMembership = async (field: 'isVip' | 'proAgency', currentVal: boolean) => {
    if (!targetUser) return;
    setUpdating(true);
    setError(null);

    const newVal = !currentVal;

    try {
      const userRef = doc(db, 'profiles', targetUser.id);
      await setDoc(userRef, {
        [field]: newVal,
        [`${field}ActivatedAt`]: newVal ? new Date().toISOString() : null,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      setTargetUser({ ...targetUser, [field]: newVal });
      setSuccess(`Membresía ${field === 'isVip' ? 'VIP' : 'Agencia'} ${newVal ? 'activada' : 'desactivada'} con éxito.`);
    } catch (err: any) {
      setError('Error al actualizar membresía: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };
  
  // Real-time reports listener
  React.useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'lead_reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      setLoadingReports(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const deleteReport = async (reportId: string) => {
    if (!confirm('¿Estás seguro de que quieres borrar este reporte?')) return;
    try {
      await deleteDoc(doc(db, 'lead_reviews', reportId));
      setSuccess('Reporte eliminado.');
    } catch (err: any) {
      setError('Error al eliminar reporte: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldCheck className="text-amber-500 w-8 h-8" />
              Panel Administrativo
            </h1>
            <p className="text-gray-400 mt-2">Manage user memberships and status.</p>
          </div>
          <div className="hidden md:block text-right">
            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
              Admin Mode: {user?.email}
            </span>
          </div>
        </header>

        {/* Search Bar */}
        <section className="bg-[#111111] border border-white/5 rounded-2xl p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por email de usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={searching}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold px-8 rounded-xl transition-all flex items-center gap-2"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        </section>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* User Dashboard Card */}
        {targetUser ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* User Info Column */}
            <div className="md:col-span-1 bg-[#111111] border border-white/5 rounded-2xl p-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <User className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-center mb-1 truncate px-2">
                {targetUser.displayName || 'Sin Nombre'}
              </h2>
              <p className="text-gray-500 text-sm text-center mb-4 truncate italic">
                {targetUser.email}
              </p>
              <div className="text-xs text-gray-600 font-mono text-center break-all select-all hover:text-gray-400 transition-colors">
                ID: {targetUser.id}
              </div>
            </div>

            {/* Membership Controls Column */}
            <div className="md:col-span-2 space-y-4">
              {/* VIP TOGGLE */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${targetUser.isVip ? 'bg-amber-500' : 'bg-white/5'}`}>
                    <Crown className={`w-6 h-6 ${targetUser.isVip ? 'text-black' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold">Membresía VIP (20€)</h3>
                    <p className="text-sm text-gray-500">Permite ver reseñas privadas y mejores plazas.</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleMembership('isVip', targetUser.isVip)}
                  disabled={updating}
                  className={`px-6 py-2 rounded-xl font-bold transition-all ${
                    targetUser.isVip 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                    : 'bg-amber-500 text-black hover:scale-105 active:scale-95'
                  }`}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : targetUser.isVip ? 'Revocar VIP' : 'Regalar VIP'}
                </button>
              </div>

              {/* AGENCY TOGGLE */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${targetUser.proAgency ? 'bg-blue-500' : 'bg-white/5'}`}>
                    <Briefcase className={`w-6 h-6 ${targetUser.proAgency ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold">Plan Agencia Pro (50€)</h3>
                    <p className="text-sm text-gray-500">Permite publicar plazas y eventos ilimitados.</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleMembership('proAgency', targetUser.proAgency)}
                  disabled={updating}
                  className={`px-6 py-2 rounded-xl font-bold transition-all ${
                    targetUser.proAgency 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                    : 'bg-blue-500 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : targetUser.proAgency ? 'Revocar Agencia' : 'Regalar Agencia'}
                </button>
              </div>
            </div>
          </div>
        ) : !searching && searchQuery && (
          <div className="text-center py-12 text-gray-600">
            Busca un usuario para ver sus detalles y gestionar su membresía.
          </div>
        )}
        {/* Reports Management */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-red-500 w-6 h-6" />
            <h2 className="text-2xl font-bold">Gestión de Reportes (Lista Negra)</h2>
          </div>

          <div className="space-y-4">
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-gray-500 text-center py-12 bg-[#111] rounded-2xl border border-white/5">
                No hay reportes pendientes de revisión.
              </p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-red-500/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                        REPORTE #{report.id.slice(-6)}
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'Fecha desconocida'}
                      </p>
                    </div>
                    <button 
                      onClick={() => deleteReport(report.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full ${i < (report.rating || 0) ? 'bg-amber-500' : 'bg-white/10'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 italic">"{report.comment}"</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500 uppercase">
                    <span className="bg-white/5 px-2 py-1 rounded">PLATAFORMA: {report.platform || 'DESCONOCIDA'}</span>
                    <span className="bg-white/5 px-2 py-1 rounded">USUARIO: {report.userEmail || 'ANÓNIMO'}</span>
                    {report.leadId && (
                      <span className="bg-white/5 px-2 py-1 rounded">TRABAJO: {report.leadId}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
