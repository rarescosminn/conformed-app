'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Titluri frumoase per slug
const SLUG_TITLES: Record<string, string> = {
  'bucatarie': 'Bucătărie / HACCP',
  'retetar': 'Rețetar & Meniu',
  'aprovizionare': 'Aprovizionare & Stocuri',
  'siguranta-alim': 'Siguranța alimentară',
  'personal': 'Personal & Ture',
  'mentenanta': 'Mentenanță echipamente',
  'retelistica': 'Rețelistică',
  'curatenie': 'Curățenie',
  'deseuri-alim': 'Deșeuri alimentare',
  'proiecte-urgente': 'Proiecte & Urgențe',
  'santiere': 'Șantiere active',
  'permise': 'Permise & Autorizații',
  'utilaje': 'Utilaje & Echipamente',
  'subcontractori': 'Subcontractori',
  'calitate-lucrari': 'Calitate lucrări',
  'necalificati': 'Muncitori necalificați',
  'deseuri': 'Deșeuri',
  'receptii': 'Recepții lucrări',
  'documentatie': 'Documentație tehnică',
  'linii-productie': 'Linii de producție',
  'plan-productie': 'Plan producție',
  'calitate': 'Calitate producție',
  'depozit': 'Depozit & Logistică',
  'energie': 'Energie & Utilități',
  'mediu': 'Mediu',
  'securitate': 'Securitate & Pază',
  'stocuri': 'Gestiune stocuri',
  'punct-vanzare': 'Punct de vânzare',
  'merchandising': 'Merchandising',
  'siguranta-prod': 'Siguranța produselor',
  'clienti': 'Clienți',
  'logistica': 'Logistică & Transport',
  'retelistica-it': 'Rețelistică IT',
  'securitate-cyber': 'Securitate cibernetică',
  'echipamente-it': 'Echipamente IT',
  'helpdesk': 'Helpdesk',
  'backup': 'Backup & Recuperare',
  'licente': 'Licențe software',
  'cloud': 'Cloud & SaaS',
  'continuitate': 'Continuitate activitate',
  'gdpr': 'GDPR & Protecția datelor',
  'monitorizare': 'Monitorizare sisteme',
  'audit-it': 'Audit IT',
  'parc-auto': 'Parc auto',
  'soferi': 'Șoferi',
  'rute': 'Rute & Curse',
  'gps': 'GPS & Monitorizare',
  'combustibil': 'Combustibil',
  'documente-transp': 'Documente transport',
  'adr': 'Conformare ADR',
  'proiecte': 'Proiecte & Contracte',
  'facturare': 'Facturare & Financiar',
  'conformare-reg': 'Conformare & Reglementare',
  'risc': 'Risc & Control intern',
  'documente': 'Documente & Arhivă',
  'furnizori': 'Furnizori & Achiziții',
  'audit-intern': 'Audit intern',
  'autorizatii': 'Autorizații & Avize',
  'sali': 'Săli & Spații',
  'personal-didactic': 'Personal didactic',
  'personal-aux': 'Personal auxiliar',
  'elevi': 'Elevi / Studenți',
  'cantina': 'Cantină & Alimentație',
  'achizitii': 'Achiziții publice',
  'operatiuni': 'Operațiuni zilnice',
  'terenuri': 'Terenuri & Parcele',
  'culturi': 'Culturi & Producție',
  'depozitare': 'Depozitare & Silozuri',
  'animale': 'Animale & Zootehnie',
  'irigatie': 'Irigații & Utilități',
  'fitosanitar': 'Fitosanitar & Tratamente',
  'subventii': 'Documente & Subvenții',
  'transport': 'Transport & Logistică',
  'mediu-agri': 'Mediu & Sustenabilitate',
  'programari': 'Programări & Agendă',
  'pacienti': 'Pacienți',
  'personal-med': 'Personal medical',
  'echip-medicale': 'Echipamente medicale',
  'sterilizare': 'Sterilizare & Igienizare',
  'deseuri-med': 'Deșeuri medicale',
  'bucatarie-med': 'Bucătărie / Nutriție',
  'centralist': 'Centrală telefonică',
  'heliport': 'Heliport',
  'personal-aux-sp': 'Personal auxiliar',
};

type Task = {
  id: string;
  titlu: string;
  status: 'deschis' | 'in_lucru' | 'inchis';
  prioritate: 'mica' | 'medie' | 'mare';
  data: string;
  responsabil: string;
  observatii: string;
};

const STORAGE_KEY_PREFIX = 'admin_tasks_';

function loadTasks(slug: string): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + slug);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTasks(slug: string, tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + slug, JSON.stringify(tasks));
  } catch { }
}

const STATUS_LABELS = { deschis: 'Deschis', in_lucru: 'În lucru', inchis: 'Închis' };
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  deschis: { bg: '#FEF2F2', color: '#991B1B' },
  in_lucru: { bg: '#FFFBEB', color: '#92400E' },
  inchis: { bg: '#F0FDF4', color: '#166534' },
};
const PRIO_COLORS: Record<string, { bg: string; color: string }> = {
  mica: { bg: '#F3F4F6', color: '#374151' },
  medie: { bg: '#FFFBEB', color: '#92400E' },
  mare: { bg: '#FEF2F2', color: '#991B1B' },
};

export default function AdminSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) ?? '';
  const title = SLUG_TITLES[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const [tasks, setTasks] = React.useState<Task[]>(() => loadTasks(slug));
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('toate');
  const [form, setForm] = useState({
    titlu: '', status: 'deschis' as Task['status'],
    prioritate: 'medie' as Task['prioritate'],
    responsabil: '', observatii: '',
  });

  function addTask() {
    if (!form.titlu.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      titlu: form.titlu,
      status: form.status,
      prioritate: form.prioritate,
      responsabil: form.responsabil,
      observatii: form.observatii,
      data: new Date().toLocaleDateString('ro-RO'),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(slug, updated);
    setForm({ titlu: '', status: 'deschis', prioritate: 'medie', responsabil: '', observatii: '' });
    setShowForm(false);
  }

  function updateStatus(id: string, status: Task['status']) {
    const updated = tasks.map(t => t.id === id ? { ...t, status } : t);
    setTasks(updated);
    saveTasks(slug, updated);
  }

  function deleteTask(id: string) {
    if (!confirm('Ștergi acest task?')) return;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(slug, updated);
  }

  const filtered = filterStatus === 'toate' ? tasks : tasks.filter(t => t.status === filterStatus);
  const counts = {
    deschis: tasks.filter(t => t.status === 'deschis').length,
    in_lucru: tasks.filter(t => t.status === 'in_lucru').length,
    inchis: tasks.filter(t => t.status === 'inchis').length,
  };

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/administratie" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
          ← Administrație
        </Link>
        <span style={{ opacity: 0.3 }}>/</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{title}</h1>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {counts.deschis} deschise · {counts.in_lucru} în lucru · {counts.inchis} închise
          </div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          + Task nou
        </button>
      </div>

      {/* Formular de adăugare */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Task nou — {title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Titlu task *</label>
              <input style={inp} placeholder="Descrie scurt task-ul..." value={form.titlu} onChange={e => setForm(f => ({ ...f, titlu: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTask()} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}>
                  <option value="deschis">Deschis</option>
                  <option value="in_lucru">În lucru</option>
                  <option value="inchis">Închis</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Prioritate</label>
                <select style={inp} value={form.prioritate} onChange={e => setForm(f => ({ ...f, prioritate: e.target.value as Task['prioritate'] }))}>
                  <option value="mica">Mică</option>
                  <option value="medie">Medie</option>
                  <option value="mare">Mare</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Responsabil</label>
                <input style={inp} placeholder="Nume persoană" value={form.responsabil} onChange={e => setForm(f => ({ ...f, responsabil: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Observații</label>
              <textarea style={{ ...inp, height: 70, resize: 'none' } as React.CSSProperties} placeholder="Detalii suplimentare..." value={form.observatii} onChange={e => setForm(f => ({ ...f, observatii: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addTask} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Salvează task
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtre status */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['toate', 'deschis', 'in_lucru', 'inchis'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '6px 14px', borderRadius: 20, border: filterStatus === s ? '2px solid #4F46E5' : '1.5px solid #e5e7eb',
            background: filterStatus === s ? '#EEF2FF' : '#fff', color: filterStatus === s ? '#4F46E5' : '#374151',
            fontSize: 13, fontWeight: filterStatus === s ? 700 : 400, cursor: 'pointer',
          }}>
            {s === 'toate' ? `Toate (${tasks.length})` : s === 'in_lucru' ? `În lucru (${counts.in_lucru})` : `${STATUS_LABELS[s as keyof typeof STATUS_LABELS]} (${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {/* Lista taskuri */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', border: '1.5px dashed #e5e7eb', borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Niciun task pentru {title}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Apasă "+ Task nou" pentru a adăuga primul task.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => (
            <div key={task.id} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{task.titlu}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_COLORS[task.status].bg, color: STATUS_COLORS[task.status].color }}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: PRIO_COLORS[task.prioritate].bg, color: PRIO_COLORS[task.prioritate].color }}>
                      {task.prioritate === 'mica' ? 'Prioritate mică' : task.prioritate === 'medie' ? 'Prioritate medie' : 'Prioritate mare'}
                    </span>
                    {task.responsabil && <span style={{ fontSize: 12, color: '#6B7280' }}>👤 {task.responsabil}</span>}
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{task.data}</span>
                  </div>
                  {task.observatii && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{task.observatii}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value as Task['status'])}
                    style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer' }}
                  >
                    <option value="deschis">Deschis</option>
                    <option value="in_lucru">În lucru</option>
                    <option value="inchis">Închis</option>
                  </select>
                  <button onClick={() => deleteTask(task.id)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, color: '#374151' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' };