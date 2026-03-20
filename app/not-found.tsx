'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [dots, setDots] = useState('');

  // Animație puncte
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Cercuri decorative în fundal */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)',
        top: '10%', left: '5%',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
        bottom: '10%', right: '8%',
      }} />
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%', border: '1px solid rgba(99,102,241,0.08)',
        top: '-20%', right: '-10%',
      }} />

      <div style={{ textAlign: 'center', maxWidth: 520, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '8px 20px',
          marginBottom: 40,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          e<span style={{ opacity: 0.5 }}>Conformed</span>
        </div>

        {/* 404 mare */}
        <div style={{
          fontSize: 120,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #6366F1, #A78BFA, #60A5FA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </div>

        {/* Linie separator */}
        <div style={{
          width: 60, height: 3,
          background: 'linear-gradient(90deg, #6366F1, #A78BFA)',
          borderRadius: 99,
          margin: '0 auto 28px',
        }} />

        {/* Mesaj principal mixt */}
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 12px',
          lineHeight: 1.4,
        }}>
          Oops! Pagina asta s-a pierdut undeva{dots}
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          Page not found
        </p>

        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 15,
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}>
          Ruta pe care o cauți nu există sau a fost mutată.
          <br />
          <span style={{ opacity: 0.7, fontSize: 13 }}>
            The page you're looking for doesn't exist or has been moved.
          </span>
        </p>

        {/* Butoane */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            ← Înapoi / Go back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            Dashboard →
          </button>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: 48,
          fontSize: 12,
          color: 'rgba(255,255,255,0.2)',
        }}>
          eConformed · Platformă SaaS pentru conformare ISO & ESG
        </p>

      </div>
    </div>
  );
}