'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, BellOff, Search, ChevronLeft,
  ShieldCheck, Loader2, CheckCircle2, Smartphone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';

type PermState = 'default' | 'granted' | 'denied' | 'unsupported';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, userData, updateProfileData, loading: authLoading } = useAuth();

  const [permState, setPermState] = useState<PermState>('default');
  const [enabled, setEnabled] = useState(true);
  const [keywords, setKeywords] = useState('Moscow, Paris, Premium, VIP');
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setPermState('unsupported');
      } else {
        setPermState(Notification.permission as PermState);
      }
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setEnabled(userData.alertsEnabled !== false);
      setKeywords(userData.alertKeywords || 'Moscow, Paris, Premium, VIP');
    }
  }, [userData]);

  const handleActivatePush = useCallback(async () => {
    if (!user) return;
    setActivating(true);
    try {
      const { requestPushPermission } = await import('@/lib/notifications');
      const result = await requestPushPermission(user.uid);
      if (result.success) {
        setPermState('granted');
        setEnabled(true);
      } else {
        const current = Notification.permission as PermState;
        setPermState(current);
      }
    } finally {
      setActivating(false);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveOk(false);
    try {
      await updateProfileData({ alertsEnabled: enabled, alertKeywords: keywords });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  const pushBlocked = permState === 'denied';
  const pushReady = permState === 'granted';

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* Header */}
      <div style={{ padding: '44px 20px 24px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Alertas de Intel</h1>
          <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '2px 0 0' }}>Radar en tiempo real</p>
        </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* === PUSH BANNER === */}
        {!pushReady && permState !== 'unsupported' && (
          <div style={{
            background: pushBlocked ? 'rgba(255,59,48,0.06)' : 'rgba(201,168,76,0.06)',
            border: `1px solid ${pushBlocked ? 'rgba(255,59,48,0.25)' : 'rgba(201,168,76,0.25)'}`,
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: pushBlocked ? 0 : '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: pushBlocked ? 'rgba(255,59,48,0.1)' : 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {pushBlocked
                  ? <BellOff size={18} color="#ff3b30" />
                  : <Smartphone size={18} color="var(--accent)" />
                }
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: pushBlocked ? '#ff3b30' : '#fff', margin: 0 }}>
                  {pushBlocked ? 'Notificaciones bloqueadas' : 'Activa las notificaciones push'}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {pushBlocked
                    ? 'Ve a los ajustes de tu navegador y permite las notificaciones para este sitio.'
                    : 'Recibe alertas de nuevas oportunidades directamente en este dispositivo.'}
                </p>
              </div>
            </div>
            {!pushBlocked && (
              <button
                onClick={handleActivatePush}
                disabled={activating}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)',
                  border: 'none', cursor: activating ? 'default' : 'pointer',
                  color: '#000', fontWeight: 900, fontSize: '13px',
                  letterSpacing: '0.03em', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', opacity: activating ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {activating ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                {activating ? 'Activando...' : 'Activar notificaciones push'}
              </button>
            )}
          </div>
        )}

        {/* === PUSH CONFIRMED === */}
        {pushReady && (
          <div style={{
            background: 'rgba(52,199,89,0.06)',
            border: '1px solid rgba(52,199,89,0.2)',
            borderRadius: '20px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <CheckCircle2 size={18} color="#34c759" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#34c759', margin: 0 }}>
              Push activo — recibirás alertas en este dispositivo
            </p>
          </div>
        )}

        {/* === MASTER TOGGLE === */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: enabled ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.3s'
              }}>
                <Bell size={20} color={enabled ? 'var(--accent)' : 'rgba(255,255,255,0.2)'} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Alertas del feed</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>Nuevos anuncios en tiempo real</p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              aria-label="Toggle alertas"
              style={{
                width: '52px', height: '30px', borderRadius: '15px',
                background: enabled ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                position: 'relative', border: 'none', cursor: 'pointer',
                transition: 'background 0.3s', flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute', top: '5px',
                left: enabled ? '27px' : '5px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.25s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
              }} />
            </button>
          </div>
        </div>

        {/* === KEYWORDS === */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '20px 22px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
            Filtros de palabras clave
          </p>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, pointerEvents: 'none' }} />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="ej. Dubai, Londres, VIP..."
              style={{
                width: '100%', padding: '14px 14px 14px 42px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', color: '#fff', fontSize: '14px', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, margin: '12px 0 0' }}>
            Palabras separadas por comas. Solo recibirás alertas que coincidan con estos términos.
          </p>
        </div>

        {/* === VIP CHANNELS (locked) === */}
        <div className="listing-card" style={{ marginBottom: 0, padding: '20px 22px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
            Canales de entrega
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Sonidos de alerta', emoji: '🔔' },
              { label: 'Espejo en Telegram', emoji: '📡' },
            ].map(({ label, emoji }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '17px' }}>{emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.08em', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '6px', padding: '3px 8px' }}>
                  VIP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* === SAVE === */}
        <button
          className="btn-primary"
          style={{ padding: '18px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '14px', fontWeight: 900 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          {saveOk && <CheckCircle2 size={16} />}
          {saving ? 'Guardando...' : saveOk ? '¡Guardado!' : 'Guardar configuración'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.15 }}>
          <ShieldCheck size={13} />
          <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cifrado extremo a extremo</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
