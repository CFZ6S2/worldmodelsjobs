'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setLoading(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreview(dataUrl);
        stopCamera();
      }
    }
  };

  const confirmPhoto = () => {
    if (preview && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0a0a0f',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99, padding: 10, color: '#fff', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: 500, 
        aspectRatio: '3/4', 
        background: '#000', 
        borderRadius: 20, 
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 0 40px rgba(201,168,76,0.2)',
        border: '1px solid rgba(201,168,76,0.3)'
      }}>
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <RefreshCw className="animate-spin" color="#c9a84c" />
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 20 }}>
        {preview ? (
          <>
            <button onClick={retake} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 99, padding: '16px 32px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <RefreshCw size={20} /> Retake
            </button>
            <button onClick={confirmPhoto} style={{ background: '#c9a84c', color: '#0a0a0f', border: 'none', borderRadius: 99, padding: '16px 40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
              <Check size={20} /> Use Photo
            </button>
          </>
        ) : (
          <button 
            onClick={capturePhoto} 
            disabled={!stream}
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 99, 
              background: '#fff', 
              border: '8px solid rgba(201,168,76,0.3)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              opacity: stream ? 1 : 0.5
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ width: 50, height: 50, borderRadius: 99, border: '2px solid #000' }} />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
