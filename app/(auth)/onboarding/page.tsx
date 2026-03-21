// app/(auth)/onboarding/page.tsx
'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ORG_CONFIGS, type OrgType } from '@/lib/org-config';
import { CATEGORII_ACTIVITATE, type CategorieActivitate } from '@/lib/admin-modules-config';

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
const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ----------------------------------------------------------------
// DATE PRESTABILITE
// ----------------------------------------------------------------
const SECTII_SPITAL = [
  'ATI', 'Bloc operator', 'Boli infecțioase', 'Cardiologie',
  'Chirurgie generală', 'Dermatologie', 'Diabet, nutriție și boli metabolice',
  'Endocrinologie', 'Farmacie', 'Gastroenterologie', 'Hematologie',
  'Laborator', 'Nefrologie', 'Neonatologie', 'Neurologie',
  'Obstetrică-Ginecologie', 'Oftalmologie', 'Oncologie', 'ORL',
  'Ortopedie', 'Pediatrie', 'Pneumologie', 'Psihiatrie',
  'Radiologie-Imagistică', 'Recuperare medicală', 'Sterilizare (CSSD)', 'UPU',
];

const DEPARTAMENTE_COMPANIE = [
  'HR', 'Financiar-Contabil', 'Producție', 'IT', 'Juridic',
  'Marketing', 'Vânzări', 'Logistică', 'Calitate', 'Achiziții',
  'Administrație', 'Management',
];

const DEPARTAMENTE_INSTITUTIE = [
  'Resurse Umane', 'Financiar-Contabil', 'Juridic', 'Urbanism',
  'Registratură', 'Relații Publice', 'IT', 'Achiziții Publice',
  'Administrație', 'Servicii Sociale', 'Mediu', 'Management',
];

// ----------------------------------------------------------------
// TIPURI
// ----------------------------------------------------------------
type Step = 1 | 2 | 3 | 4 | 'welcome';

type Locatie = {
  id: string;
  nume: string;
  adresa: string;
  departamente: string[];
  departamentNou: string;
};

// Funcții protejate — au superputeri în platformă
export const FUNCTII_PROTEJATE = ['CEO / Director General', 'Manager General'];

type FormData = {
  orgType: OrgType | null;
  denumire: string;
  cui: string;
  adresa: string;
  nr_angajati: string;
  multilocatie: boolean;
  descriere: string;
  categorie_activitate: CategorieActivitate | null;
  functie: string;
  functie_custom: string;
  departamenteSelectate: string[];
  departamentNou: string;
  locatii: Locatie[];
};

const ORG_CARDS: { type: OrgType; icon: React.ReactNode; color: string }[] = [
  { type: 'companie', icon: <IconBuilding />, color: '#4F46E5' },
  { type: 'institutie_publica', icon: <IconPublic />, color: '#0891B2' },
  { type: 'spital', icon: <IconHospital />, color: '#059669' },
];

// ----------------------------------------------------------------
// COMPONENTA PRINCIPALĂ
// ----------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMultilocatieWarning, setShowMultilocatieWarning] = useState(false);

  const [form, setForm] = useState<FormData>({
    orgType: null,
    denumire: '',
    cui: '',
    adresa: '',
    nr_angajati: '',
    multilocatie: false,
    descriere: '',
    categorie_activitate: null,
    functie: '',
    functie_custom: '',
    departamenteSelectate: [],
    departamentNou: '',
    locatii: [],
  });

  const selectedConfig = form.orgType ? ORG_CONFIGS[form.orgType] : null;

  const listaPrestabilita =
    form.orgType === 'spital' ? SECTII_SPITAL :
    form.orgType === 'institutie_publica' ? DEPARTAMENTE_INSTITUTIE :
    DEPARTAMENTE_COMPANIE;

  const labelDepartament = form.orgType === 'spital' ? 'secție' : 'departament';
  const labelDepartamente = form.orgType === 'spital' ? 'Secții active' : 'Departamente active';

  // ---- TOGGLE DEPARTAMENT ----
  const toggleDepartament = (nume: string) => {
    setForm(f => ({
      ...f,
      departamenteSelectate: f.departamenteSelectate.includes(nume)
        ? f.departamenteSelectate.filter(d => d !== nume)
        : [...f.departamenteSelectate, nume],
    }));
  };

  const adaugaDepartamentNou = () => {
    const nou = form.departamentNou.trim();
    if (!nou || form.departamenteSelectate.includes(nou)) return;
    setForm(f => ({ ...f, departamenteSelectate: [...f.departamenteSelectate, nou], departamentNou: '' }));
  };

  // ---- LOCATII ----
  const adaugaLocatie = () => {
    setForm(f => ({
      ...f,
      locatii: [...f.locatii, {
        id: crypto.randomUUID(),
        nume: 'Punct de lucru',
        adresa: '',
        departamente: [],
        departamentNou: '',
      }],
    }));
  };

  const updateLocatie = (id: string, field: keyof Locatie, value: string | string[]) => {
    setForm(f => ({ ...f, locatii: f.locatii.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };

  const toggleLocatieDepartament = (locatieId: string, dept: string) => {
    setForm(f => ({
      ...f,
      locatii: f.locatii.map(l => {
        if (l.id !== locatieId) return l;
        return {
          ...l,
          departamente: l.departamente.includes(dept)
            ? l.departamente.filter(d => d !== dept)
            : [...l.departamente, dept],
        };
      }),
    }));
  };

  const adaugaDepartamentLocatie = (locatieId: string) => {
    const locatie = form.locatii.find(l => l.id === locatieId);
    if (!locatie) return;
    const nou = locatie.departamentNou.trim();
    if (!nou || locatie.departamente.includes(nou)) return;
    updateLocatie(locatieId, 'departamente', [...locatie.departamente, nou]);
    updateLocatie(locatieId, 'departamentNou', '');
  };

  const stergeLocatie = (id: string) => {
    setForm(f => ({ ...f, locatii: f.locatii.filter(l => l.id !== id) }));
  };

  // ---- MULTILOCATIE TOGGLE cu Sediu central auto ----
  const handleMultilocatieChange = (checked: boolean) => {
    setForm(f => ({
      ...f,
      multilocatie: checked,
      locatii: checked && f.locatii.length === 0
        ? [{
            id: crypto.randomUUID(),
            nume: 'Sediu central',
            adresa: f.adresa, // preia adresa din Pasul 2
            departamente: [],
            departamentNou: '',
          }]
        : f.locatii,
    }));
  };

  // ---- NAVIGARE ----
  const goToStep2 = () => {
    if (!form.orgType) { setError('Selectează tipul organizației.'); return; }
    setError(''); setStep(2);
  };

  const goToStep3 = () => {
    if (!form.denumire.trim()) { setError('Denumirea organizației este obligatorie.'); return; }
    if (!form.cui.trim()) { setError('CUI / CIF este obligatoriu.'); return; }
    if (!form.functie) { setError('Selectează funcția ta în organizație.'); return; }
    if (form.functie === 'alta' && !form.functie_custom.trim()) { setError('Specifică funcția ta.'); return; }
    setError(''); setStep(4);
  };

  const goToConfirmare = () => {
    if (form.departamenteSelectate.length === 0) {
      setError(`Selectează cel puțin un ${labelDepartament}.`); return;
    }
    if (form.multilocatie) { setShowMultilocatieWarning(true); return; }
    setError(''); setStep(3);
  };

  // ---- SUBMIT ----
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesiune expirată. Te rog autentifică-te din nou.');

      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .upsert({
          user_id: user.id,
          org_type: form.orgType,
          denumire: form.denumire,
          descriere: form.descriere,
          nr_angajati: form.nr_angajati ? parseInt(form.nr_angajati) : null,
          adresa: form.adresa,
          cui: form.cui,
          categorie_activitate: form.categorie_activitate,
          onboarding_completed: true,
        }, { onConflict: 'user_id' })
        .select('id')
        .single();
      if (orgErr) throw orgErr;

      const orgId = orgData.id;

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
          categorie_activitate: form.categorie_activitate,
        }, { onConflict: 'user_id' });
      if (onbErr) throw onbErr;

      if (form.departamenteSelectate.length > 0) {
        const depts = form.departamenteSelectate.map(nume => ({
          org_id: orgId,
          nume,
          tip: form.orgType === 'spital' ? 'sectie' : 'departament',
          activ: true,
        }));
        const { error: deptErr } = await supabase.from('departments').insert(depts);
        if (deptErr) throw deptErr;
      }

      if (form.multilocatie && form.locatii.length > 0) {
        for (const locatie of form.locatii) {
          if (locatie.departamente.length > 0) {
            const locDepts = locatie.departamente.map(nume => ({
              org_id: orgId,
              nume,
              cod: locatie.nume,
              tip: form.orgType === 'spital' ? 'sectie' : 'departament',
              activ: true,
            }));
            const { error: locErr } = await supabase.from('departments').insert(locDepts);
            if (locErr) throw locErr;
          }
        }
      }

      // 5. Insert în user_profiles
      const functieFinala = form.functie === 'alta' ? form.functie_custom : form.functie;
      const esteProtejat = FUNCTII_PROTEJATE.includes(functieFinala);
      const { error: profileErr } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        org_id: orgId,
        functie: functieFinala,
        rol: esteProtejat ? 'admin' : 'admin', // primul user e întotdeauna admin
        este_protejat: esteProtejat,
        admin_since: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (profileErr) throw profileErr;

      setStep('welcome');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Eroare la salvare.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // STYLES
  // ----------------------------------------------------------------
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: '#fff', color: '#111827',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151',
  };

  const totalSteps = 4;
  const stepLabels = ['Tip organizație', 'Date organizație', labelDepartamente, 'Confirmare'];
  const stepSubs = ['Selectează profilul tău', 'Informații de bază', 'Configurare module', 'Verifică și finalizează'];

  // ----------------------------------------------------------------
  // WELCOME
  // ----------------------------------------------------------------
  if (step === 'welcome') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', background: '#fff', borderRadius: 24, padding: '56px 48px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', color: '#fff' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: '#111827' }}>Bun venit în eConformed!</h1>
          <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>Platforma a fost configurată pentru</p>
          <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 15, padding: '6px 18px', borderRadius: 20, marginBottom: 8 }}>
            {selectedConfig?.label} — {form.denumire}
          </div>
          {form.categorie_activitate && (
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
              {CATEGORII_ACTIVITATE[form.categorie_activitate]?.label}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 32 }}>
            {form.departamenteSelectate.length} {labelDepartamente.toLowerCase()} configurate
            {form.multilocatie && form.locatii.length > 0 && ` · ${form.locatii.length} locații`}
          </div>
          <button onClick={() => router.replace('/dashboard')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
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

      {/* STÂNGA */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, color: '#fff', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -2, marginBottom: 8 }}>
          e<span style={{ opacity: 0.7 }}>Conformed</span>
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, textAlign: 'center', maxWidth: 260, lineHeight: 1.7, marginBottom: 40 }}>
          Configurează platforma în {totalSteps} pași simpli.
        </div>
        {([1, 2, 4, 3] as const).map((s, idx) => {
          const isDone = step === 'welcome' || (typeof step === 'number' && typeof s === 'number' && step > s) || (s === 4 && step === 3);
          const isCurrent = step === s;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, width: '100%', maxWidth: 280, opacity: isCurrent ? 1 : isDone ? 0.6 : 0.35 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDone ? 'rgba(255,255,255,0.9)' : isCurrent ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone || isCurrent ? '#4F46E5' : '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {isDone ? <IconCheck /> : idx + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{stepLabels[idx]}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{stepSubs[idx]}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DREAPTA */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* ---- PAS 1 ---- */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>Ce tip de organizație ești?</h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>Platforma se va adapta automat terminologiei și modulelor specifice.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {ORG_CARDS.map(({ type, icon, color }) => {
                  const cfg = ORG_CONFIGS[type];
                  const isSelected = form.orgType === type;
                  return (
                    <button key={type} onClick={() => setForm(f => ({ ...f, orgType: type }))} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 14, cursor: 'pointer', border: isSelected ? `2px solid ${color}` : '2px solid #e5e7eb', background: isSelected ? `${color}08` : '#fff', textAlign: 'left' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: isSelected ? `${color}15` : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? color : '#9CA3AF' }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 3 }}>{cfg.label}</div>
                        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{cfg.description}</div>
                      </div>
                      {isSelected && <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><IconCheck /></div>}
                    </button>
                  );
                })}
              </div>
              {error && <ErrorBox message={error} />}
              <button onClick={goToStep2} style={primaryBtn}>Continuă <IconArrow /></button>
            </>
          )}

          {/* ---- PAS 2 ---- */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>Date despre organizație</h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>Informații de bază pentru configurarea contului.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={labelStyle}>Denumire organizație *</label>
                  <input style={inputStyle} placeholder="Ex: Golden Audit Consulting S.R.L." value={form.denumire} onChange={e => setForm(f => ({ ...f, denumire: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>CUI / CIF *</label>
                  <input style={inputStyle} placeholder="Ex: RO12345678" value={form.cui} onChange={e => setForm(f => ({ ...f, cui: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Adresă sediu principal</label>
                  <input style={inputStyle} placeholder="Strada, nr., localitate, județ" value={form.adresa} onChange={e => setForm(f => ({ ...f, adresa: e.target.value }))} />
                </div>

                {/* Categorie activitate — ascuns pentru spital */}
                {form.orgType !== 'spital' && (
                  <div>
                    <label style={labelStyle}>Categorie de activitate</label>
                    <select
                      style={inputStyle}
                      value={form.categorie_activitate || ''}
                      onChange={e => setForm(f => ({ ...f, categorie_activitate: e.target.value as CategorieActivitate || null }))}
                    >
                      <option value="">Selectează domeniul principal</option>
                      {Object.entries(CATEGORII_ACTIVITATE).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nr. {selectedConfig?.terminology.angajati.toLowerCase() || 'angajați'}</label>
                    <input style={inputStyle} placeholder="Ex: 50" type="number" value={form.nr_angajati} onChange={e => setForm(f => ({ ...f, nr_angajati: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={form.multilocatie}
                        onChange={e => handleMultilocatieChange(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      Multilocație
                    </label>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Scurtă descriere (opțional)</label>
                  <textarea style={{ ...inputStyle, resize: 'none', height: 80 } as React.CSSProperties} placeholder="Activitate principală, domeniu..." value={form.descriere} onChange={e => setForm(f => ({ ...f, descriere: e.target.value }))} />
                </div>

                {/* FUNCȚIE */}
                <div>
                  <label style={labelStyle}>Funcția ta în organizație *</label>
                  <select
                    style={inputStyle}
                    value={form.functie}
                    onChange={e => setForm(f => ({ ...f, functie: e.target.value, functie_custom: '' }))}
                  >
                    <option value="">Selectează funcția</option>
                    <option value="Administrator">Administrator</option>
                    <option value="CEO / Director General">CEO / Director General</option>
                    <option value="Manager General">Manager General</option>
                    <option value="alta">Altă funcție...</option>
                  </select>
                </div>
                {form.functie === 'alta' && (
                  <div>
                    <label style={labelStyle}>Specifică funcția</label>
                    <input
                      style={inputStyle}
                      placeholder="Ex: Director Financiar, Responsabil Calitate..."
                      value={form.functie_custom}
                      onChange={e => setForm(f => ({ ...f, functie_custom: e.target.value }))}
                    />
                  </div>
                )}
                {(form.functie === 'CEO / Director General' || form.functie === 'Manager General') && (
                  <div style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3730A3' }}>
                    ℹ️ Funcția selectată are acces complet la platformă, inclusiv gestionarea locațiilor și a conturilor.
                  </div>
                )}
              </div>
              {error && <ErrorBox message={error} />}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <button onClick={() => setStep(1)} style={secondaryBtn}>← Înapoi</button>
                <button onClick={goToStep3} style={primaryBtn}>Continuă <IconArrow /></button>
              </div>
            </>
          )}

          {/* ---- PAS 4 — DEPARTAMENTE ---- */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>{labelDepartamente}</h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 20px' }}>
                Bifează {form.orgType === 'spital' ? 'secțiile active' : 'departamentele active'} din organizație. Poți adăuga și unele personalizate.
              </p>

              {/* Grid bifă */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {listaPrestabilita.map(dept => {
                  const sel = form.departamenteSelectate.includes(dept);
                  return (
                    <button key={dept} onClick={() => toggleDepartament(dept)} style={{ padding: '8px 14px', borderRadius: 20, border: sel ? '2px solid #4F46E5' : '1.5px solid #e5e7eb', background: sel ? '#EEF2FF' : '#fff', color: sel ? '#4F46E5' : '#374151', fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer' }}>
                      {sel && '✓ '}{dept}
                    </button>
                  );
                })}
              </div>

              {/* Adaugă manual */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder={`Adaugă ${labelDepartament} nou...`} value={form.departamentNou} onChange={e => setForm(f => ({ ...f, departamentNou: e.target.value }))} onKeyDown={e => e.key === 'Enter' && adaugaDepartamentNou()} />
                <button onClick={adaugaDepartamentNou} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                  <IconPlus /> Adaugă
                </button>
              </div>

              {/* Locații multilocație */}
              {form.multilocatie && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 12 }}>Locații</div>
                  {form.locatii.map((locatie, idx) => (
                    <div key={locatie.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 12, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{
                          fontWeight: 600, fontSize: 13, color: '#fff',
                          background: idx === 0 ? '#4F46E5' : '#6B7280',
                          padding: '3px 10px', borderRadius: 10,
                        }}>
                          {idx === 0 ? 'Sediu central' : `Locație ${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button onClick={() => stergeLocatie(locatie.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}>Șterge</button>
                        )}
                      </div>

                      {/* Nume locație */}
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Denumire locație</label>
                        <input
                          style={inputStyle}
                          placeholder={idx === 0 ? 'Sediu central' : 'Ex: Punct de lucru Cluj'}
                          value={locatie.nume}
                          onChange={e => updateLocatie(locatie.id, 'nume', e.target.value)}
                        />
                      </div>

                      {/* Adresă locație */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ ...labelStyle, fontSize: 12 }}>Adresă</label>
                        <input
                          style={inputStyle}
                          placeholder="Strada, nr., localitate, județ"
                          value={locatie.adresa}
                          onChange={e => updateLocatie(locatie.id, 'adresa', e.target.value)}
                        />
                      </div>

                      {/* Departamente locație */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {listaPrestabilita.slice(0, 12).map(dept => {
                          const sel = locatie.departamente.includes(dept);
                          return (
                            <button key={dept} onClick={() => toggleLocatieDepartament(locatie.id, dept)} style={{ padding: '6px 12px', borderRadius: 16, border: sel ? '2px solid #4F46E5' : '1.5px solid #e5e7eb', background: sel ? '#EEF2FF' : '#F9FAFB', color: sel ? '#4F46E5' : '#6B7280', fontSize: 12, cursor: 'pointer' }}>
                              {sel && '✓ '}{dept}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1, fontSize: 13 }} placeholder={`${labelDepartament} personalizat...`} value={locatie.departamentNou} onChange={e => updateLocatie(locatie.id, 'departamentNou', e.target.value)} onKeyDown={e => e.key === 'Enter' && adaugaDepartamentLocatie(locatie.id)} />
                        <button onClick={() => adaugaDepartamentLocatie(locatie.id)} style={{ padding: '0 12px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', cursor: 'pointer', fontSize: 12 }}>+ Adaugă</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={adaugaLocatie} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px dashed #C7D2FE', background: '#F5F3FF', color: '#4F46E5', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <IconPlus /> Adaugă punct de lucru
                  </button>
                </div>
              )}

              {error && <ErrorBox message={error} />}

              {/* Warning multilocatie */}
              {showMultilocatieWarning && (
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ color: '#D97706', flexShrink: 0 }}><IconWarning /></span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 4 }}>Verificare recomandată</div>
                      <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
                        Ai selectat multilocație. Recomandăm să verifici din nou configurația fiecărei locații înainte de a finaliza. Această setare influențează toate modulele platformei.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowMultilocatieWarning(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #FCD34D', background: '#fff', color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Revin să verific</button>
                    <button onClick={() => { setShowMultilocatieWarning(false); setStep(3); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Continuă oricum</button>
                  </div>
                </div>
              )}

              {!showMultilocatieWarning && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <button onClick={() => setStep(2)} style={secondaryBtn}>← Înapoi</button>
                  <button onClick={goToConfirmare} style={primaryBtn}>Continuă <IconArrow /></button>
                </div>
              )}
            </>
          )}

          {/* ---- PAS 3 — CONFIRMARE ---- */}
          {step === 3 && selectedConfig && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>Verifică configurația</h2>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Acesta este profilul platformei tale. Poți reveni oricând din Setări.</p>

              <div style={{ background: '#EEF2FF', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {ORG_CARDS.find(c => c.type === form.orgType)?.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3730A3' }}>{selectedConfig.label}</div>
                  <div style={{ fontSize: 13, color: '#6366F1' }}>{form.denumire} · {form.cui}</div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                {[
                  { label: 'Adresă sediu', value: form.adresa || '—' },
                  { label: 'Categorie activitate', value: form.categorie_activitate ? CATEGORII_ACTIVITATE[form.categorie_activitate]?.label : '—' },
                  { label: `Nr. ${selectedConfig.terminology.angajati.toLowerCase()}`, value: form.nr_angajati || '—' },
                  { label: 'Multilocație', value: form.multilocatie ? `Da (${form.locatii.length} locații)` : 'Nu' },
                  { label: labelDepartamente, value: `${form.departamenteSelectate.length} selectate` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                    <span style={{ color: '#6B7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {form.departamenteSelectate.length > 0 && (
                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '14px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', marginBottom: 10 }}>{labelDepartamente.toUpperCase()} ACTIVE</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {form.departamenteSelectate.map(d => (
                      <span key={d} style={{ background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12 }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}

<div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400E', lineHeight: 1.6, marginBottom: 16 }}>
                <strong>⚠️ Notă demo:</strong> Te încurajăm să folosești date fictive sau de test în această perioadă. eConformed nu își asumă responsabilitatea pentru datele introduse în versiunea demo.
              </div>

              {error && <ErrorBox message={error} />}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <button onClick={() => setStep(4)} style={secondaryBtn}>← Înapoi</button>
                <button onClick={handleSubmit} disabled={loading} style={{ ...primaryBtn, background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', cursor: loading ? 'not-allowed' : 'pointer' }}>
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

// ---- HELPERS ----
const ErrorBox = ({ message }: { message: string }) => (
  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
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