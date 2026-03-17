// app/(auth)/onboarding/page.tsx
'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ORG_CONFIGS, type OrgType } from '@/lib/org-config';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ----------------------------------------------------------------
// ICONS
// ----------------------------------------------------------------
const IconBuilding = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconPublic = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>
);
const IconHospital = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="6" width="20" height="16" rx="2" />
    <path d="M12 10v6M9 13h6" />
    <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// ----------------------------------------------------------------
// TIPURI
// ----------------------------------------------------------------
type FormData = {
  orgType: OrgType | null;
  denumire: string;
  cui: string;
  adresa: string;
  nr_angajati: string;
  multilocatie: boolean;
  descriere: string;
};

const ORG_CARDS: { type: OrgType; icon: React.ReactNode; color: string }[] = [
  { type: 'companie',          icon: <IconBuilding />, color: '#4F46E5' },
  { type: 'institutie_publica',icon: <IconPublic />,   color: '#0891B2' },
  { type: 'spital',            icon: <IconHospital />, color: '#059669' },
];

// ----------------------------------------------------------------
// COMPONENTA PRINCIPALĂ
// ----------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 'welcome'>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    orgType: null,
    denumire: '',
    cui: '',
    adresa: '',
    nr_angajati: '',
    multilocatie: false,
    descriere: '',
  });

  const selectedConfig = form.orgType ? ORG_CONFIGS[form.orgType] : null;

  // ---- HANDLERS ----
  const handleOrgSelect = (type: OrgType) => {
    setForm(f => ({ ...f, orgType: type }));
  };

  const goToStep2 = () => {
    if (!form.orgType) { setError('Selectează tipul organizației.'); return; }
    setError('');
    setStep(2);
  };

  const goToStep3 = () => {
    if (!form.denumire.trim()) { setError('Denumirea organizației este obligatorie.'); return; }
    if (!form.cui.trim()) { setError('CUI / CIF este obligatoriu.'); return; }
    setError('');
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesiune expirată. Te rog autentifică-te din nou.');

      // 1. Upsert în organizations
      const { error: orgErr } = await supabase
        .from('organizations')
        .upsert({
          user_id: user.id,
          org_type: form.orgType,
          denumire: form.denumire,
          descriere: form.descriere,
          nr_angajati: form.nr_angajati ? parseInt(form.nr_angajati) : null,
          adresa: form.adresa,
          cui: form.cui,
          onboarding_completed: true,
        }, { onConflict: 'user_id' });
      if (orgErr) throw orgErr;

      // 2. Insert în onboarding
      const { error: onbErr } = await supabase
        .from('onboarding')
        .upsert({
          user_id: user.id,
          org_type: form.orgType,
          denumire: form.denumire,
          descriere: form.descriere,
          nr_angajati: form.nr_angajati ? parseInt(form.nr_angajati) : null,
          multilocatie: form.multilocatie,
          adresa: form.adresa,
        }, { onConflict: 'user_id' });
      if (onbErr) throw onbErr;

      setStep('welcome');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la salvare.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // STYLES HELPERS
  // ----------------------------------------------------------------
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: '#fff', color: '#111827',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151',
  };

  // ----------------------------------------------------------------
  // ECRAN BINE AI VENIT
  // ----------------------------------------------------------------
  if (step === 'welcome') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8fafc', padding: 24,
      }}>
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center',
          background: '#fff', borderRadius: 24, padding: '56px 48px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', color: '#fff',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: '#111827' }}>
            Bun venit în eConformed!
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
            Platforma a fost configurată pentru
          </p>
          <div style={{
            display: 'inline-block', background: '#EEF2FF', color: '#4F46E5',
            fontWeight: 700, fontSize: 15, padding: '6px 18px',
            borderRadius: 20, marginBottom: 32,
          }}>
            {selectedConfig?.label} — {form.denumire}
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, margin: '0 0 36px' }}>
            Modulele, terminologia și dashboard-ul sunt acum adaptate tipului tău de organizație.
          </p>
          <button
            onClick={() => router.replace('/dashboard')}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
            Mergi la Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // LAYOUT PRINCIPAL
  // ----------------------------------------------------------------
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* STÂNGA — branding */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 48, color: '#fff',
      }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, marginBottom: 12 }}>
          e<span style={{ opacity: 0.7 }}>Conformed</span>
        </div>
        <div style={{ fontSize: 16, opacity: 0.8, textAlign: 'center', maxWidth: 300, lineHeight: 1.7, marginBottom: 48 }}>
          Configurează platforma pentru organizația ta în 3 pași simpli.
        </div>

        {/* Steps indicator */}
        {([1, 2, 3] as const).map((s) => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 20, width: '100%', maxWidth: 280,
            opacity: step === s ? 1 : step > s ? 0.6 : 0.35,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step > s ? 'rgba(255,255,255,0.9)' : step === s ? '#fff' : 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: step > s ? '#4F46E5' : step === s ? '#4F46E5' : '#fff',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>
              {step > s ? <IconCheck /> : s}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {s === 1 ? 'Tip organizație' : s === 2 ? 'Date organizație' : 'Confirmare'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {s === 1 ? 'Selectează profilul tău' : s === 2 ? 'Informații de bază' : 'Verifică și finalizează'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DREAPTA — conținut pas */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 48, background: '#f8fafc', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* ---- PAS 1 — Tip organizație ---- */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>
                Ce tip de organizație ești?
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>
                Platforma se va adapta automat terminologiei și modulelor specifice.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {ORG_CARDS.map(({ type, icon, color }) => {
                  const cfg = ORG_CONFIGS[type];
                  const isSelected = form.orgType === type;
                  return (
                    <button key={type} onClick={() => handleOrgSelect(type)} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                      border: isSelected ? `2px solid ${color}` : '2px solid #e5e7eb',
                      background: isSelected ? `${color}08` : '#fff',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: isSelected ? `${color}15` : '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? color : '#9CA3AF',
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 3 }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                          {cfg.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: color, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: '#fff', flexShrink: 0,
                        }}>
                          <IconCheck />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && <ErrorBox message={error} />}

              <button onClick={goToStep2} style={primaryBtn}>
                Continuă <IconArrow />
              </button>
            </>
          )}

          {/* ---- PAS 2 — Date organizație ---- */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>
                Date despre organizație
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>
                Informații de bază pentru configurarea contului.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={labelStyle}>Denumire organizație *</label>
                  <input
                    style={inputStyle} placeholder="Ex: Golden Audit Consulting S.R.L."
                    value={form.denumire}
                    onChange={e => setForm(f => ({ ...f, denumire: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>CUI / CIF *</label>
                  <input
                    style={inputStyle} placeholder="Ex: RO12345678"
                    value={form.cui}
                    onChange={e => setForm(f => ({ ...f, cui: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Adresă</label>
                  <input
                    style={inputStyle} placeholder="Strada, nr., localitate, județ"
                    value={form.adresa}
                    onChange={e => setForm(f => ({ ...f, adresa: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>
                      Nr. {selectedConfig?.terminology.angajati.toLowerCase() || 'angajați'}
                    </label>
                    <input
                      style={inputStyle} placeholder="Ex: 50" type="number"
                      value={form.nr_angajati}
                      onChange={e => setForm(f => ({ ...f, nr_angajati: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
                      <input
                        type="checkbox" checked={form.multilocatie}
                        onChange={e => setForm(f => ({ ...f, multilocatie: e.target.checked }))}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      Multilocație
                    </label>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Scurtă descriere (opțional)</label>
                  <textarea
                    style={{ ...inputStyle, resize: 'none', height: 80 }}
                    placeholder="Activitate principală, domeniu..."
                    value={form.descriere}
                    onChange={e => setForm(f => ({ ...f, descriere: e.target.value }))}
                  />
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <button onClick={() => setStep(1)} style={secondaryBtn}>← Înapoi</button>
                <button onClick={goToStep3} style={primaryBtn}>Continuă <IconArrow /></button>
              </div>
            </>
          )}

          {/* ---- PAS 3 — Confirmare preview ---- */}
          {step === 3 && selectedConfig && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>
                Verifică configurația
              </h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>
                Acesta este profilul platformei tale. Poți reveni oricând din Setări.
              </p>

              {/* Card tip organizație */}
              <div style={{
                background: '#EEF2FF', borderRadius: 14, padding: '16px 20px',
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: '#4F46E5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  {ORG_CARDS.find(c => c.type === form.orgType)?.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3730A3' }}>{selectedConfig.label}</div>
                  <div style={{ fontSize: 13, color: '#6366F1' }}>{form.denumire} · {form.cui}</div>
                </div>
              </div>

              {/* Date */}
              <div style={{
                background: '#fff', border: '1.5px solid #e5e7eb',
                borderRadius: 14, padding: '16px 20px', marginBottom: 16,
              }}>
                {[
                  { label: 'Adresă', value: form.adresa || '—' },
                  { label: `Nr. ${selectedConfig.terminology.angajati.toLowerCase()}`, value: form.nr_angajati || '—' },
                  { label: 'Multilocație', value: form.multilocatie ? 'Da' : 'Nu' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14,
                  }}>
                    <span style={{ color: '#6B7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Terminologie preview */}
              <div style={{
                background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                borderRadius: 14, padding: '14px 20px', marginBottom: 24,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', marginBottom: 10 }}>
                  TERMINOLOGIE ACTIVĂ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(selectedConfig.terminology).slice(0, 6).map(([key, val]) => (
                    <div key={key} style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#9CA3AF' }}>{key}: </span>
                      <span style={{ fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <button onClick={() => setStep(2)} style={secondaryBtn}>← Înapoi</button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  ...primaryBtn,
                  background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                  {loading ? 'Se salvează...' : 'Finalizează configurarea'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// COMPONENTE HELPER
// ----------------------------------------------------------------
const ErrorBox = ({ message }: { message: string }) => (
  <div style={{
    background: '#FEF2F2', border: '1px solid #FECACA',
    color: '#991B1B', padding: '10px 14px',
    borderRadius: 10, fontSize: 13, marginBottom: 16,
  }}>
    {message}
  </div>
);

const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '13px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', background: '#fff',
  color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};