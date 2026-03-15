// app/(auth)/register/page.tsx
// TEMPORAR — înregistrările sunt blocate în timpul reconfigurării platformei.
// De înlocuit cu formularul real după finalizarea migrației.

'use client';
import Link from 'next/link';

export default function RegisterBlocked() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
    }}>
      {/* Stânga – branding identic cu Login */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        color: '#fff',
      }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, marginBottom: 12 }}>
          e<span style={{ opacity: 0.7 }}>Conformed</span>
        </div>
        <div style={{
          fontSize: 18,
          opacity: 0.85,
          textAlign: 'center',
          maxWidth: 320,
          lineHeight: 1.6,
        }}>
          Platformă SaaS pentru conformare ISO, ESG și trasabilitate operațională.
        </div>
        <div style={{ marginTop: 48, display: 'grid', gap: 16, width: '100%', maxWidth: 300 }}>
          {['Conformare ISO & ESG', 'Audit & Documentație', 'Legislație & Trasabilitate', 'Management Integrat'].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, opacity: 0.9,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Dreapta – mesaj blocare */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        background: '#f8fafc',
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

          {/* Icon */}
          <div style={{
            width: 72, height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <h1 style={{
            fontSize: 26, fontWeight: 700,
            margin: '0 0 12px', color: '#111827',
          }}>
            Platformă în reconfigurare
          </h1>

          <p style={{
            color: '#6B7280', fontSize: 15,
            lineHeight: 1.7, margin: '0 0 32px',
          }}>
            Înregistrările sunt temporar suspendate în timp ce îmbunătățim platforma.
            Vom reveni în curând cu o experiență mai bună.
          </p>

          {/* Separator */}
          <div style={{
            background: '#F3F4F6',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 32,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#E0E7FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Ești deja înregistrat?
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  Poți accesa contul tău existent în continuare. Conturile existente nu sunt afectate.
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: '#4F46E5',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}>
            Mergi la autentificare
          </Link>

          <p style={{ marginTop: 20, fontSize: 13, color: '#9CA3AF' }}>
            Întrebări?{' '}
            <a
              href="mailto:contact@econformed.io"
              style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
              contact@econformed.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
