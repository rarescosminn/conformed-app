'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

type Doc = {
  id: string;
  titlu: string;
  descriere?: string;
  tip: string;
  url_extern?: string;
  storage_path?: string;
  marime_bytes?: number;
  created_at: string;
};

const CAT_LABELS: Record<string, string> = {
  proceduri: 'Proceduri', instructiuni: 'Instrucțiuni', template: 'Template documente',
  ssm: 'SSM', psi: 'PSI', mediu: 'Mediu', hr: 'HR', medical: 'Medical',
  iso: 'ISO', it: 'IT & Securitate', esg: 'ESG', guvernanta: 'Guvernanță',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
};
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, color: '#374151',
};

function fmtSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResurseCatPage() {
  const params = useParams();
  const cat = (params?.cat as string) ?? '';
  const catLabel = CAT_LABELS[cat] ?? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [docs, setDocs] = useState<Doc[]>([]);
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    titlu: '', descriere: '', tip: 'document', url_extern: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase.from('organizations').select('id').eq('user_id', user.id).maybeSingle();
      if (!org) return;
      setOrgId(org.id);
      const { data } = await supabase.from('documente').select('*').eq('org_id', org.id).eq('categorie', cat).order('created_at', { ascending: false });
      setDocs(data ?? []);
      setLoading(false);
    }
    load();
  }, [cat]);

  async function addDoc() {
    if (!form.titlu.trim()) { setMsg('Titlul este obligatoriu.'); return; }
    setUploading(true); setMsg('');

    let storage_path = null;
    let marime_bytes = null;

    // Upload fișier în Supabase Storage dacă există
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${orgId}/${cat}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('documente').upload(path, file);
      if (uploadErr) { setMsg('Eroare upload: ' + uploadErr.message); setUploading(false); return; }
      storage_path = path;
      marime_bytes = file.size;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('documente').insert({
      org_id: orgId,
      categorie: cat,
      titlu: form.titlu,
      descriere: form.descriere || null,
      tip: form.tip,
      url_extern: form.url_extern || null,
      storage_path,
      marime_bytes,
      creat_de: user?.id,
    }).select().single();

    if (error) { setMsg('Eroare la salvare: ' + error.message); }
    else {
      setDocs(d => [data, ...d]);
      setShowForm(false);
      setForm({ titlu: '', descriere: '', tip: 'document', url_extern: '' });
      setFile(null);
    }
    setUploading(false);
  }

  async function downloadDoc(doc: Doc) {
    if (doc.storage_path) {
      const { data } = await supabase.storage.from('documente').createSignedUrl(doc.storage_path, 60);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } else if (doc.url_extern) {
      window.open(doc.url_extern.startsWith('http') ? doc.url_extern : `https://${doc.url_extern}`, '_blank');
    }
  }

  async function deleteDoc(id: string, storage_path?: string) {
    if (!confirm('Ștergi acest document?')) return;
    if (storage_path) await supabase.storage.from('documente').remove([storage_path]);
    await supabase.from('documente').delete().eq('id', id);
    setDocs(d => d.filter(x => x.id !== id));
  }

  const filtered = docs.filter(d =>
    !q || d.titlu.toLowerCase().includes(q.toLowerCase()) || (d.descriere ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Link href="/resurse" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>← Resurse</Link>
        <span style={{ opacity: 0.3 }}>/</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{catLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{catLabel}</h1>
          <div style={{ fontSize: 13, color: '#6B7280' }}>{docs.length} documente</div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          + Adaugă document
        </button>
      </div>

      {/* Formular */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Document nou — {catLabel}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Titlu *</label>
              <input style={inp} placeholder="ex: Procedura SSM-01" value={form.titlu} onChange={e => setForm(f => ({ ...f, titlu: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Descriere</label>
              <textarea style={{ ...inp, height: 70, resize: 'none' } as React.CSSProperties} placeholder="Scurtă descriere..." value={form.descriere} onChange={e => setForm(f => ({ ...f, descriere: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Tip document</label>
                <select style={inp} value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))}>
                  <option value="document">Document</option>
                  <option value="procedura">Procedură</option>
                  <option value="instructiune">Instrucțiune</option>
                  <option value="formular">Formular</option>
                  <option value="raport">Raport</option>
                  <option value="plan">Plan</option>
                  <option value="politica">Politică</option>
                  <option value="altele">Altele</option>
                </select>
              </div>
              <div>
                <label style={lbl}>URL extern (opțional)</label>
                <input style={inp} placeholder="ex: drive.google.com/..." value={form.url_extern} onChange={e => setForm(f => ({ ...f, url_extern: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Fișier (PDF, Word, Excel)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 13 }}
              />
              {file && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{file.name} ({fmtSize(file.size)})</div>}
            </div>
            {msg && <div style={{ color: '#991B1B', fontSize: 13 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addDoc} disabled={uploading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {uploading ? 'Se încarcă...' : 'Salvează'}
              </button>
              <button onClick={() => { setShowForm(false); setMsg(''); }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Căutare */}
      <div style={{ marginBottom: 16 }}>
        <input
          style={{ ...inp, maxWidth: 400 }}
          placeholder="Caută document..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {/* Lista documente */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', border: '1.5px dashed #e5e7eb', borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Niciun document în {catLabel}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Apasă "+ Adaugă document" pentru a încărca primul document.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(doc => (
            <div key={doc.id} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>
                      {doc.tip === 'procedura' ? '📋' : doc.tip === 'instructiune' ? '📘' : doc.tip === 'formular' ? '📝' : doc.tip === 'raport' ? '📊' : doc.tip === 'plan' ? '🗓️' : doc.tip === 'politica' ? '🛡️' : '📄'}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{doc.titlu}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#EEF2FF', color: '#4F46E5' }}>
                      {doc.tip}
                    </span>
                    {doc.marime_bytes && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtSize(doc.marime_bytes)}</span>
                    )}
                  </div>
                  {doc.descriere && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{doc.descriere}</div>}
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Adăugat: {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {(doc.storage_path || doc.url_extern) && (
                    <button onClick={() => downloadDoc(doc)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Deschide
                    </button>
                  )}
                  <button onClick={() => deleteDoc(doc.id, doc.storage_path)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Șterge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}