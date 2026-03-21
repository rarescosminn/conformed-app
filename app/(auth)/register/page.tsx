// app/(auth)/register/page.tsx
'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import Image from 'next/image';

const JUDETE = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila',
  'Brașov','București','Buzău','Călărași','Caraș-Severin','Cluj','Constanța',
  'Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara',
  'Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt',
  'Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea',
  'Vâlcea','Vaslui','Vrancea',
];

const BENEFITS = [
  'Conformare ISO & ESG automatizată',
  'Audit & Documentație centralizată',
  'Legislație actualizată în timp real',
  '90 de zile gratuit, fără card',
];

type Form = {
  nume: string;
  prenume: string;
  email: string;
  telefon: string;
  denumire_org: string;
  judet: string;
  localitate: string;
  parola: string;
  confirma_parola: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState<Form>({
    nume: '', prenume: '', email: '', telefon: '',
    denumire_org: '', judet: '', localitate: '',
    parola: '', confirma_parola: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const set = (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!form.nume.trim()) return 'Numele este obligatoriu.';
    if (!form.prenume.trim()) return 'Prenumele este obligatoriu.';
    if (!form.email.trim()) return 'Email-ul este obligatoriu.';
    if (!form.telefon.trim()) return 'Telefonul este obligatoriu.';
    if (!form.denumire_org.trim()) return 'Denumirea organizației este obligatorie.';
    if (!form.judet) return 'Selectează județul.';
    if (!form.localitate.trim()) return 'Localitatea este obligatorie.';
    if (form.parola.length < 8) return 'Parola trebuie să aibă minim 8 caractere.';
    if (form.parola !== form.confirma_parola) return 'Parolele nu coincid.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.parola,
        options: { data: { nume: form.nume, prenume: form.prenume } },
      });
      if (signUpErr) throw signUpErr;
      const userId = data.user?.id;
      if (!userId) throw new Error('Eroare la creare cont.');
      const { error: leadErr } = await supabase.from('leads').insert({
        user_id: userId,
        nume: form.nume,
        prenume: form.prenume,
        email: form.email,
        telefon: form.telefon,
        denumire_org: form.denumire_org,
        judet: form.judet,
        localitate: form.localitate,
      });
      if (leadErr) throw leadErr;
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la înregistrare.');
    } finally {
      setLoading(false);
    }
  };

  // ---- ECRAN SUCCES ----
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center', background: '#fff', borderRadius: 24, padding: '56px 48px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', color: '#fff' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px', color: '#111827' }}>Verifică-ți emailul!</h1>
          <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>Am trimis un email de confirmare la</p>
          <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 14, padding: '6px 18px', borderRadius: 20, marginBottom: 24 }}>
            {form.email}
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, margin: '0 0 32px' }}>
            Accesează linkul din email pentru a-ți activa contul, apoi vei putea configura platforma.
          </p>
          <Link href="/login" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
            Mergi la autentificare
          </Link>
        </div>
      </div>
    );
  }

  // ---- FORMULAR ----
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* STÂNGA — branding identic cu login */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 48, color: '#fff',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: 8 }}>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/eConformed_LOGO.png"
    alt="eConformed"
    width={140}
    height={140}
    style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
  />
</div>

        <div style={{ fontSize: 13, opacity: 0.75, textAlign: 'center', maxWidth: 280, lineHeight: 1.6, marginBottom: 40, letterSpacing: 0.3 }}>
          a Digital assistant for compliance and growth
        </div>

        <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 99, marginBottom: 32 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280 }}>
          {BENEFITS.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span style={{ opacity: 0.88, lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 28, fontSize: 11, opacity: 0.35, letterSpacing: 1 }}>
          ECONFORMED © {new Date().getFullYear()}
        </div>
      </div>

      {/* DREAPTA — formular */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
              90 zile gratuit · Fără card
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#111827', letterSpacing: -0.5 }}>
              Creează cont gratuit
            </h1>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
              Completează datele pentru a începe perioada de probă.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Nume + Prenume */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nume *</label>
                <input style={inp} placeholder="Popescu" value={form.nume} onChange={set('nume')} />
              </div>
              <div>
                <label style={lbl}>Prenume *</label>
                <input style={inp} placeholder="Ion" value={form.prenume} onChange={set('prenume')} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={lbl}>Email *</label>
              <input style={inp} type="email" placeholder="ion@companie.ro" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>

            {/* Telefon */}
            <div>
              <label style={lbl}>Telefon *</label>
              <input style={inp} type="tel" placeholder="07XX XXX XXX" value={form.telefon} onChange={set('telefon')} />
            </div>

            {/* Denumire org */}
            <div>
              <label style={lbl}>Denumire organizație *</label>
              <input style={inp} placeholder="Ex: Compania Mea S.R.L." value={form.denumire_org} onChange={set('denumire_org')} />
            </div>

            {/* Județ + Localitate */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Județ *</label>
                <select style={inp} value={form.judet} onChange={set('judet')}>
                  <option value="">Selectează</option>
                  {JUDETE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Localitate *</label>
                <input style={inp} placeholder="Ex: Cluj-Napoca" value={form.localitate} onChange={set('localitate')} />
              </div>
            </div>

            {/* Parolă */}
            <div>
              <label style={lbl}>Parolă *</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: 40 }} type={showPass ? 'text' : 'password'} placeholder="Minim 8 caractere" value={form.parola} onChange={set('parola')} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* Confirmare parolă */}
            <div>
              <label style={lbl}>Confirmă parola *</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: 40 }} type={showConfirm ? 'text' : 'password'} placeholder="Repetă parola" value={form.confirma_parola} onChange={set('confirma_parola')} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>{showConfirm ? '🙈' : '👁️'}</button>
              </div>
            </div>

          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 20,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
            }}>
            {loading ? 'Se procesează...' : 'Creează cont gratuit →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6B7280' }}>
            Ai deja cont?{' '}
            <Link href="/login" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
              Autentifică-te
            </Link>
          </p>

          {/* Trust badges */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {['ISO 9001', 'ISO 14001', 'ISO 45001', 'ESG'].map(badge => (
              <div key={badge} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5 }}>
                {badge}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ---- STYLES ----
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: '#111827',
};

const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: 12, top: '50%',
  transform: 'translateY(-50%)', background: 'none',
  border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16,
};