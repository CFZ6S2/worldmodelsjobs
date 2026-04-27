'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { 
    User, Mail, MapPin, Tag, FileText, Save, ArrowLeft, 
    Camera, RefreshCw, Ruler, Heart, Sparkles, Image as ImageIcon, X, Plus
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function EditProfilePage() {
  const { userData, user, updateProfileData, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [formData, setFormData] = useState({
    alias: userData?.alias || '',
    bio: userData?.bio || '',
    city: userData?.city || '',
    gender: userData?.gender || '',
    profileType: userData?.profileType || 'Explorer',
    height: userData?.height || '',
    measurements: userData?.measurements || '',
    surgeries: userData?.surgeries || '',
    tattoos: userData?.tattoos || '',
    photoURL: userData?.photoURL || '',
    gallery: userData?.gallery || []
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        alias: userData.alias || '',
        bio: userData.bio || '',
        city: userData.city || '',
        gender: userData.gender || '',
        profileType: userData.profileType || 'Explorer',
        height: userData.height || '',
        measurements: userData.measurements || '',
        surgeries: userData.surgeries || '',
        tattoos: userData.tattoos || '',
        photoURL: userData.photoURL || '',
        gallery: userData.gallery || []
      });
    }
  }, [userData]);

  const handleFileUpload = async (file: File, type: 'avatar' | 'gallery') => {
    if (!user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${type}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, photoURL: url }));
      } else {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, url].slice(-4) }));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFromGallery = (index: number) => {
    setFormData(prev => ({
        ...prev,
        gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileData(formData);
      router.push(`/${locale}/profile`);
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="animate-fade" style={{ background: '#000', minHeight: '100vh', padding: '0 20px 100px 20px' }}>
      <div style={{ paddingTop: '40px', paddingBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '15px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>{locale === 'es' ? 'Ficha Técnica' : 'Profile Specs'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Avatar Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                <div style={{ 
                    width: '100%', height: '100%', borderRadius: '40px', background: 'linear-gradient(135deg, #111, #000)', 
                    border: '2px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden'
                }}>
                    {formData.photoURL ? (
                        <img src={formData.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={60} className="text-gold" style={{ opacity: 0.5 }} />
                    )}
                </div>
                <input type="file" ref={avatarInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')} accept="image/*" />
                <button type="button" onClick={() => avatarInputRef.current?.click()} style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#c9a84c', width: '40px', height: '40px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #000', cursor: 'pointer', boxShadow: '0 4px 15px rgba(201,168,76,0.4)' }}>
                    {uploading ? <RefreshCw className="animate-spin" size={18} color="#000" /> : <Camera size={18} color="#000" />}
                </button>
            </div>
            <p style={{ fontSize: '12px', color: '#c9a84c', marginTop: '10px', fontWeight: 700 }}>PROFILE AVATAR</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    <Tag size={14} className="text-gold" /> {locale === 'es' ? 'Alias / Nombre' : 'Alias / Name'}
                </label>
                <input type="text" value={formData.alias} onChange={(e) => setFormData({...formData, alias: e.target.value})} placeholder="cesar.herrera.rojo" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', fontSize: '15px', fontWeight: 600, outline: 'none' }} />
            </div>

            {/* Model Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                        <Ruler size={14} className="text-gold" /> {locale === 'es' ? 'Altura' : 'Height'}
                    </label>
                    <input type="text" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} placeholder="175cm" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none' }} />
                </div>
                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                        <Heart size={14} className="text-gold" /> {locale === 'es' ? 'Pecho / Talla' : 'Chest Size'}
                    </label>
                    <input type="text" value={formData.measurements} onChange={(e) => setFormData({...formData, measurements: e.target.value})} placeholder="90C" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none' }} />
                </div>
            </div>

            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                    <Sparkles size={14} className="text-gold" /> {locale === 'es' ? 'Operaciones / Retoques' : 'Surgeries / Touchups'}
                </label>
                <input type="text" value={formData.surgeries} onChange={(e) => setFormData({...formData, surgeries: e.target.value})} placeholder="Rino, Pecho, Labios..." style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none' }} />
            </div>

            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                    <Tag size={14} className="text-gold" /> {locale === 'es' ? 'Tatuajes' : 'Tattoos'}
                </label>
                <input type="text" value={formData.tattoos} onChange={(e) => setFormData({...formData, tattoos: e.target.value})} placeholder="Brazo, Espalda, Ninguno..." style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none' }} />
            </div>

            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                    <MapPin size={14} className="text-gold" /> {locale === 'es' ? 'Ubicación' : 'Location'}
                </label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Madrid, Spain" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none' }} />
            </div>

            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                    <FileText size={14} className="text-gold" /> {locale === 'es' ? 'Biografía' : 'Bio'}
                </label>
                <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px 20px', color: '#fff', outline: 'none', resize: 'none' }} />
            </div>

            {/* Gallery Section */}
            <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '15px' }}>
                    <ImageIcon size={14} className="text-gold" /> {locale === 'es' ? 'Galería (Máx 4)' : 'Gallery (Max 4)'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {formData.gallery.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img src={url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeFromGallery(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {formData.gallery.length < 4 && (
                        <button type="button" onClick={() => galleryInputRef.current?.click()} style={{ aspectRatio: '1/1', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', cursor: 'pointer' }}>
                            <Plus size={24} />
                        </button>
                    )}
                </div>
                <input type="file" ref={galleryInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'gallery')} accept="image/*" />
            </div>

            <button type="submit" disabled={saving || uploading} style={{ marginTop: '20px', width: '100%', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #c9a84c, #f3e5ab)', border: 'none', color: '#000', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: (saving || uploading) ? 'wait' : 'pointer', boxShadow: '0 10px 30px rgba(201,168,76,0.3)' }}>
                {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? (locale === 'es' ? 'Guardando...' : 'Saving...') : (locale === 'es' ? 'Guardar Perfil Completo' : 'Save Full Profile')}
            </button>

        </div>
      </form>
    </div>
  );
}
