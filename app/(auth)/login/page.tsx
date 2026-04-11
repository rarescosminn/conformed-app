'use client';
import React from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BENEFITS = [
  'Conformare ISO & ESG automatizată',
  'Audit & Documentație centralizată',
  'Legislație actualizată în timp real',
  'Management integrat pe toate nivelele',
];

export default function Login() {
  const [email,    setEmail]    = React.useState('');
  const [pass,     setPass]     = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [loading,  setLoading]  = React.useState(false);
  const [error,    setError]    = React.useState('');
  // mobil: 'branding' | 'form'
  const [mobileSlide, setMobileSlide] = React.useState<'branding' | 'form'>('branding');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submit() {
    if (!email || !pass) { setError('Completați email-ul și parola.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Eroare la autentificare.');
      setLoading(false);
      return;
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasMfa = factors?.totp && factors.totp.length > 0;
    if (!hasMfa) {
      router.replace('/mfa-setup');
    } else {
      const al = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (al.data?.nextLevel === 'aal2') router.replace('/mfa-verify');
      else router.replace('/dashboard');
    }
    setLoading(false);
  }

  async function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') await submit();
  }

  /* ===================== RENDER ===================== */
  return (
    <>
      {/* -------- CSS injectat -------- */}
      <style>{`
        /* Reset box-sizing */
        *, *::before, *::after { box-sizing: border-box; }

        /* Wrapper principal */
        .ec-login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }

        /* ---- PANOUL STÂNG (branding) ---- */
        .ec-branding {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
          color: #fff;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        /* ---- PANOUL DREPT (form) ---- */
        .ec-form-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
          background: #f8fafc;
        }

        /* ===================== MOBILE ===================== */
        @media (max-width: 767px) {
          .ec-login-root {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            position: relative;
          }

          /* Ambele panouri ocupa tot ecranul,
             se translateaza stanga/dreapta */
          .ec-branding,
          .ec-form-panel {
            position: absolute;
            inset: 0;
            height: 100%;
            width: 100%;
            transition: transform 0.45s cubic-bezier(0.77, 0, 0.175, 1);
            overflow-y: auto;
          }

          /* Branding: vizibil implicit, iese la stânga la slide */
          .ec-branding {
            transform: translateX(0%);
            position: relative;
            min-height: 100vh;
          }
          .ec-branding.slid-out {
            transform: translateX(-100%);
            position: absolute;
            pointer-events: none;
          }

          /* Form: ascuns la dreapta implicit, intră la slide */
          .ec-form-panel {
            transform: translateX(100%);
            position: absolute;
            min-height: 100vh;
          }
          .ec-form-panel.slid-in {
            transform: translateX(0%);
            position: relative;
          }

          /* Buton CTA mobil pe branding */
          .ec-mobile-cta {
            display: flex !important;
          }

          /* Butonul back pe form */
          .ec-back-btn {
            display: flex !important;
          }
        }

        /* Desktop: ascunde butoanele mobile */
        .ec-mobile-cta { display: none; }
        .ec-back-btn   { display: none; }

        /* Input focus */
        .ec-input:focus {
          border-color: #6366F1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        /* Animatie shimmer pe butonul submit */
        @keyframes ec-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .ec-submit-btn:not(:disabled):hover {
          background-size: 200% auto;
          animation: ec-shimmer 1.5s linear infinite;
          background-image: linear-gradient(135deg, #4F46E5, #7C3AED, #4F46E5);
        }

        /* Pulse pe dot-ul "Platformă securizată" */
        @keyframes ec-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .ec-secure-dot { animation: ec-pulse 2s ease-in-out infinite; }

        /* Fade-in pentru benefits */
        @keyframes ec-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ec-benefit {
          animation: ec-fadein 0.5s ease both;
        }
        .ec-benefit:nth-child(1) { animation-delay: 0.1s; }
        .ec-benefit:nth-child(2) { animation-delay: 0.2s; }
        .ec-benefit:nth-child(3) { animation-delay: 0.3s; }
        .ec-benefit:nth-child(4) { animation-delay: 0.4s; }
      `}</style>

      <div className="ec-login-root">

        {/* ============ STÂNGA — BRANDING ============ */}
        <div className={`ec-branding${mobileSlide === 'form' ? ' slid-out' : ''}`}>

          {/* Logo */}
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, color: '#fff' }}>
              e<span style={{ opacity: 0.6 }}>Conformed</span>
            </div>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 13, opacity: 0.75, textAlign: 'center',
            maxWidth: 280, lineHeight: 1.6, marginBottom: 40, letterSpacing: 0.3,
          }}>
            a Digital assistant for compliance and growth
          </div>

          {/* Separator */}
          <div style={{
            width: 40, height: 2, background: 'rgba(255,255,255,0.3)',
            borderRadius: 99, marginBottom: 32,
          }} />

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280 }}>
            {BENEFITS.map((b, i) => (
              <div key={b} className="ec-benefit" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span style={{ opacity: 0.88, lineHeight: 1.4 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA mobil — vizibil doar pe telefon */}
          <button
            className="ec-mobile-cta"
            onClick={() => setMobileSlide('form')}
            style={{
              marginTop: 48,
              padding: '14px 40px',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              alignItems: 'center',
              gap: 8,
              letterSpacing: 0.3,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            Intră în cont →
          </button>

          {/* Footer */}
          <div style={{
            position: 'absolute', bottom: 28,
            fontSize: 11, opacity: 0.35, letterSpacing: 1,
          }}>
            ECONFORMED © {new Date().getFullYear()}
          </div>
        </div>

        {/* ============ DREAPTA — FORMULAR ============ */}
        <div className={`ec-form-panel${mobileSlide === 'form' ? ' slid-in' : ''}`}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Buton back mobil */}
            <button
              className="ec-back-btn"
              onClick={() => setMobileSlide('branding')}
              style={{
                marginBottom: 24,
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                alignItems: 'center',
                gap: 4,
              }}
            >
              ← Înapoi
            </button>

            {/* Header formular */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#EEF2FF', color: '#4F46E5',
                fontSize: 12, fontWeight: 700, padding: '4px 12px',
                borderRadius: 99, marginBottom: 16,
              }}>
                <div className="ec-secure-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
                Platformă securizată
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#111827', letterSpacing: -0.5 }}>
                Bun venit înapoi
              </h1>
              <p style={{ color: '#6B7280', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Autentifică-te în contul tău eConformed.
              </p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email</label>
              <input
                className="ec-input"
                style={inp}
                placeholder="nume@companie.ro"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                type="email"
                autoComplete="email"
              />
            </div>

            {/* Parolă */}
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Parolă</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="ec-input"
                  style={{ ...inp, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={handleKey}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
                Ai uitat parola?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#991B1B', padding: '10px 14px',
                borderRadius: 10, fontSize: 13, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="ec-submit-btn"
              onClick={submit}
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                borderRadius: 10, border: 'none',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Se verifică...' : 'Intră în cont →'}
            </button>

            {/* Register */}
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7280' }}>
              Nu ai cont?{' '}
              <Link href="/register" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
                Înregistrează-te gratuit
              </Link>
            </p>

            {/* Trust badges */}
            <div style={{
              marginTop: 36, paddingTop: 24,
              borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'center',
              gap: 24, flexWrap: 'wrap',
            }}>
              {['ISO 9001', 'ISO 14001', 'ISO 45001', 'ESG'].map(badge => (
                <div key={badge} style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#9CA3AF', letterSpacing: 0.5,
                }}>
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

/* ---- STYLES ---- */
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600,
  display: 'block', marginBottom: 6, color: '#374151',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  borderRadius: 10, border: '1.5px solid #e5e7eb',
  fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
  color: '#111827', transition: 'border-color 0.2s',
};

const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: 12,
  top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none',
  cursor: 'pointer', color: '#9CA3AF', fontSize: 16,
};