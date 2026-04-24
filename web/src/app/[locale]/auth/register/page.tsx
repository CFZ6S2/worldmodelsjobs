'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('./login?mode=signup');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-pulse" style={{ width: '40px', height: '40px', border: '3px solid #c9a84c', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );
}
