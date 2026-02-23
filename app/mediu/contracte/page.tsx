'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { LS } from '@/lib/mediu-bridge';

/* ================== Styles ================== */
const wrap: React.CSSProperties = { padding: 20 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '8px 0 12px', fontSize: 22, fontWeight: 800 };
const sub: React.CSSProperties = { opacity: 0.8, marginBottom: 16 };

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 24,
  alignItems: 'start',
};
const vbarRight: React.CSSProperties = { borderLeft: '1px solid #e5e7eb', paddingLeft: 24 };

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
  padding: 16,
};

const small: React.CSSProperties = { fontSize: 12, opacity: 0.8 };
const btn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  background: '#0f172a',
  color: '#fff',
  fontSize: 13,
};
const danger: React.CSSProperties = { ...btn, background: '#991b1b' };
const secondary: React.CSSProperties = { ...btn, background: '#334155' };
const success: React.CSSProperties = { ...btn, background: '#166534' };

const sectionTitle: React.CSSProperties = { fontWeight: 700, margin: '6px 0 10px' };

/** ~4 rânduri vizibile + scrollbar */
const scroller: React.CSSProperties = { maxHeight: 320, overflowY: 'auto', paddingRight: 6 };

/** Badge neutru (folosit în Valabile pentru status) */
const tag: React.CSSProperties = { fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#e5e7eb' };

/** Badge colorat (folosit doar în Avertizare) */
type Level = 'ok' | 'warn90' | 'warn60' | 'warn30' | 'expired' | 'indef';
function levelBadgeStyle(level: Level): React.CSSProperties {
  switch (level) {
    case 'warn90': return { ...tag, background: '#fef9c3', color: '#854d0e' };
    case 'warn60': return { ...tag, background: '#ffedd5', color: '#9a3412' };
    case 'warn30':
    case 'expired': return { ...tag, background: '#fee2e2', color: '#991b1b' };
    default: return { ...tag, background: '#e5e7eb', color: '#111827' };
  }
}

/** Modal centrat pentru confirmări în 2 pași */
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(2,6,23,.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
};
const modal: React.CSSProperties = {
  width: 460, maxWidth: '90vw', background: '#fff', borderRadius: 14,
  border: '1px solid #e5e7eb', padding: 16, boxShadow: '0 20px 60px rgba(15,23,42,.3)',
};

/* ================== Types & LS ================== */
type DocType = 'contract' | 'autorizatie';
type DocItem = {
  id: string;
  type: DocType;
  number: string;
  issuer: string;
  name?: string;
  startDate?: string;       // YYYY-MM-DD
  endDate?: string | null;  // YYYY-MM-DD sau null (nedeterminată)
  indefinite: boolean;
  createdAt: string;        // pentru sortare (ultimele sus)
};

type TrashItem = DocItem & { deletedAt: string };

const TRASH_KEY = `${LS.contracte}::trash`;

const lsRead = <T,>(k: string, fb: T): T => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
};
const lsWrite = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));

/* ================== Date utils ================== */
const todayISO = () => new Date().toISOString().slice(0, 10);

function daysUntil(iso: string): number {
  const d1 = new Date(iso + 'T00:00:00');
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  return Math.ceil((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
}

function classify(doc: DocItem): { level: Level; daysLeft: number | null } {
  if (doc.indefinite || !doc.endDate) return { level: 'indef', daysLeft: null };
  const d = daysUntil(doc.endDate);
  if (d <= 0) return { level: 'expired', daysLeft: d };
  if (d <= 30) return { level: 'warn30', daysLeft: d };
  if (d <= 60) return { level: 'warn60', daysLeft: d };
  if (d <= 90) return { level: 'warn90', daysLeft: d };
  return { level: 'ok', daysLeft: d };
}

/* ================== Page ================== */
export default function Page() {
  // form
  const [type, setType] = useState<DocType>('contract');
  const [number, setNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [indef, setIndef] = useState(false);

  // data
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  useEffect(() => { setDocs(lsRead<DocItem[]>(LS.contracte, [])); setTrash(lsRead<TrashItem[]>(TRASH_KEY, [])); }, []);
  useEffect(() => { lsWrite(LS.contracte, docs); }, [docs]);
  useEffect(() => { lsWrite(TRASH_KEY, trash); }, [trash]);

  // search
  const [q, setQ] = useState('');
  const qnorm = q.trim().toLowerCase();
  const matches = (d: DocItem) =>
    [d.number, d.issuer, d.name ?? ''].some(v => (v || '').toLowerCase().includes(qnorm));

  // split + sortare (ultimele sus în Valabile)
  const split = useMemo(() => {
    const valC: DocItem[] = [], valA: DocItem[] = [], warn: DocItem[] = [];
    for (const d of docs) {
      const c = classify(d);
      if (c.level !== 'expired') (d.type === 'contract' ? valC : valA).push(d);
      if (c.level !== 'ok' && c.level !== 'indef') warn.push(d);
    }

    const byCreatedDesc = (a: DocItem, b: DocItem) =>
      (b.createdAt || '').localeCompare(a.createdAt || '');

    valC.sort(byCreatedDesc);
    valA.sort(byCreatedDesc);
    warn.sort((a, b) => (classify(a).daysLeft ?? 9e9) - (classify(b).daysLeft ?? 9e9));

    return {
      valContracts: valC.filter(matches),
      valAutorizatii: valA.filter(matches),
      warning: warn.filter(matches),
    };
  }, [docs, qnorm]);

  /* ========== Confirm modal (2 pași) ========== */
  const [confirm, setConfirm] = useState<{open: boolean; step: 1 | 2; doc?: DocItem}>({ open: false, step: 1 });
  const openDelete = (doc: DocItem) => setConfirm({ open: true, step: 1, doc });
  const closeDelete = () => setConfirm({ open: false, step: 1, doc: undefined });

  const doDelete = () => {
    if (!confirm.doc) return;
    if (confirm.step === 1) { setConfirm({ open: true, step: 2, doc: confirm.doc }); return; }
    const doc = confirm.doc;
    setDocs(docs.filter(d => d.id !== doc.id));
    setTrash([{ ...doc, deletedAt: new Date().toISOString() }, ...trash]);
    closeDelete();
  };

  /* ================== Actions ================== */
  const addDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !issuer.trim()) { alert('Număr și Emitent sunt obligatorii.'); return; }
    if (!indef && !endDate) { alert('Alege o dată de expirare sau bifează „nedeterminată”.'); return; }

    const item: DocItem = {
      id: crypto.randomUUID(),
      type,
      number: number.trim(),
      issuer: issuer.trim(),
      name: name.trim() || undefined,
      startDate: startDate || undefined,
      endDate: indef ? null : endDate,
      indefinite: indef,
      createdAt: new Date().toISOString(),
    };
    setDocs([item, ...docs]);
    setNumber(''); setIssuer(''); setName(''); setStart(''); setEnd(''); setIndef(false);
  };

  const restoreDoc = (id: string) => {
    const t = trash.find(x => x.id === id); if (!t) return;
    setTrash(trash.filter(x => x.id !== id));
    const { deletedAt, ...doc } = t;
    setDocs([doc, ...docs]);
  };

  const purgeDoc = (id: string) => {
    const t = trash.find(x => x.id === id); if (!t) return;
    const ok1 = window.confirm('Ștergere definitivă?'); if (!ok1) return;
    const ok2 = window.confirm('Această acțiune NU poate fi anulată.'); if (!ok2) return;
    setTrash(trash.filter(x => x.id !== id));
  };

  const renewDoc = (id: string) => {
    const doc = docs.find(d => d.id === id); if (!doc) return;
    const choice = window.prompt('Noua dată (YYYY-MM-DD) sau „nedeterminata”:', doc.indefinite ? 'nedeterminata' : (doc.endDate || todayISO()));
    if (choice === null) return;
    const v = (choice || '').trim().toLowerCase();
    if (v === 'nedeterminata' || v === 'nedeterminată') {
      setDocs(docs.map(d => d.id === id ? { ...d, indefinite: true, endDate: null } : d));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      setDocs(docs.map(d => d.id === id ? { ...d, indefinite: false, endDate: v } : d));
    } else {
      alert('Format invalid. Folosește YYYY-MM-DD sau „nedeterminata”.');
    }
  };

  /* ================== UI ================== */
  return (
    <div style={wrap}>
      <Link href="/mediu" style={back}>← Inapoi</Link>
      <h1 style={h1}>Autorizatii / contracte</h1>
      <p style={sub}>Valabile separate pe tip și Avertizare reînnoire (≤90/60/30 zile). Căutarea filtrează toate secțiunile.</p>

      <div style={grid2}>
        {/* STÂNGA */}
        <div>
          {/* Formular */}
          <form onSubmit={addDoc} style={{ ...card, marginBottom: 16, display: 'grid', gap: 12, gridTemplateColumns: '140px 1fr 1fr' }}>
            <div style={{ gridColumn: '1 / -1', fontWeight: 700 }}>Adaugă document</div>

            <div>
              <div style={small}>Tip</div>
              <select value={type} onChange={e => setType(e.target.value as DocType)}>
                <option value="contract">Contract</option>
                <option value="autorizatie">Autorizatie</option>
              </select>
            </div>
            <div>
              <div style={small}>Număr</div>
              <input value={number} onChange={e => setNumber(e.target.value)} placeholder="ex. 123/2025" />
            </div>
            <div>
              <div style={small}>Emitent</div>
              <input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="ex. ANPM" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={small}>Denumire (opțional)</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="ex. Servicii salubrizare" />
            </div>

            <div>
              <div style={small}>Începe la</div>
              <input type="date" value={startDate} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <div style={small}>Expiră la</div>
              <input type="date" value={endDate} onChange={e => { setEnd(e.target.value); setIndef(false); }} disabled={indef} />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <label style={small}><input type="checkbox" checked={indef} onChange={e => { setIndef(e.target.checked); if (e.target.checked) setEnd(''); }} /> nedeterminată</label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={btn}>Adaugă</button>
            </div>
          </form>

          {/* Toolbar căutare */}
          <div style={{ ...card, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 10, alignItems: 'center' }}>
            <div style={small}>Filtrează după denumire / emitent / număr. Se aplică la Valabile și Avertizare.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <input placeholder="Căutare denumire..." value={q} onChange={e => setQ(e.target.value)} />
              {q && <button onClick={() => setQ('')} style={{ ...btn, background: '#475569' }}>Șterge</button>}
            </div>
          </div>

          {/* Contracte valabile */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Contracte <span style={{ ...small, marginLeft: 6 }}>({split.valContracts.length})</span></div>
            {split.valContracts.length === 0 ? (
              <div style={{ ...small, opacity: 0.7 }}>Niciun contract valabil.</div>
            ) : (
              <div style={scroller}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {split.valContracts.map(d => {
                    const c = classify(d);
                    return (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 140px 120px 140px 140px 160px', gap: 8, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Contract — {d.number}</div>
                          <div style={small}>{d.issuer}{d.name ? ` • ${d.name}` : ''}</div>
                        </div>
                        <div><div style={small}>Start</div>{d.startDate || '—'}</div>
                        <div><div style={small}>Expiră</div>{d.indefinite ? 'nedeterminată' : (d.endDate || '—')}</div>
                        <div>
                          <div style={small}>Status</div>
                          {/* Status stabil în Valabile */}
                          <span style={tag}>{c.level === 'indef' ? 'nedeterminată' : `în ${c.daysLeft ?? 0} zile`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={secondary} onClick={() => renewDoc(d.id)}>Reînnoiește</button>
                          <button style={danger} onClick={() => openDelete(d)}>Șterge</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Autorizatii valabile */}
          <div style={card}>
            <div style={sectionTitle}>Autorizatii <span style={{ ...small, marginLeft: 6 }}>({split.valAutorizatii.length})</span></div>
            {split.valAutorizatii.length === 0 ? (
              <div style={{ ...small, opacity: 0.7 }}>Nicio autorizatie valabilă.</div>
            ) : (
              <div style={scroller}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {split.valAutorizatii.map(d => {
                    const c = classify(d);
                    return (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 140px 120px 140px 140px 160px', gap: 8, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Autorizatie — {d.number}</div>
                          <div style={small}>{d.issuer}{d.name ? ` • ${d.name}` : ''}</div>
                        </div>
                        <div><div style={small}>Start</div>{d.startDate || '—'}</div>
                        <div><div style={small}>Expiră</div>{d.indefinite ? 'nedeterminată' : (d.endDate || '—')}</div>
                        <div>
                          <div style={small}>Status</div>
                          <span style={tag}>{c.level === 'indef' ? 'nedeterminată' : `în ${c.daysLeft ?? 0} zile`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={secondary} onClick={() => renewDoc(d.id)}>Reînnoiește</button>
                          <button style={danger} onClick={() => openDelete(d)}>Șterge</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DREAPTA */}
        <div style={vbarRight}>
          {/* Avertizare */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Avertizare de reînnoire <span style={{ ...small, marginLeft: 6 }}>({split.warning.length})</span></div>
            <div style={{ ...small, marginBottom: 8 }}>
              Praguri: <span style={levelBadgeStyle('warn90')}>≤90 zile</span> • <span style={levelBadgeStyle('warn60')}>≤60 zile</span> • <span style={levelBadgeStyle('warn30')}>≤30 zile</span>
            </div>
            {split.warning.length === 0 ? (
              <div style={{ ...small, opacity: 0.7 }}>Nicio avertizare activă.</div>
            ) : (
              <div style={scroller}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {split.warning.map(d => {
                    const c = classify(d);
                    return (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,1fr) 140px 140px 160px', gap: 8, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.type === 'contract' ? 'Contract' : 'Autorizatie'} — {d.number}</div>
                          <div style={small}>{d.issuer}{d.name ? ` • ${d.name}` : ''}</div>
                        </div>
                        <div><div style={small}>Expiră</div>{d.endDate || '—'}</div>
                        <div>
                          <div style={small}>Rămase</div>
                          <span style={levelBadgeStyle(c.level)}>{c.level === 'expired' ? 'expirat' : `${c.daysLeft} zile`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={secondary} onClick={() => renewDoc(d.id)}>Reînnoiește</button>
                          <button style={danger} onClick={() => openDelete(d)}>Șterge</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Coș de gunoi */}
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Coș de gunoi <span style={{ ...small, marginLeft: 6 }}>({trash.length})</span></div>
            {trash.length === 0 ? (
              <div style={{ ...small, opacity: 0.7 }}>Nu există elemente șterse.</div>
            ) : (
              <div style={scroller}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {trash.map(t => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) 160px 160px', gap: 8, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.type === 'contract' ? 'Contract' : 'Autorizatie'} — {t.number}</div>
                        <div style={small}>Șters la: {t.deletedAt.slice(0,10)} • {t.issuer}{t.name ? ` • ${t.name}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={success} onClick={() => restoreDoc(t.id)}>Restaurează</button>
                        <button style={danger} onClick={() => purgeDoc(t.id)}>Șterge definitiv</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======= MODAL ȘTERGERE (2 pași) ======= */}
      {confirm.open && confirm.doc && (
        <div style={overlay} role="dialog" aria-modal>
          <div style={modal}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              {confirm.step === 1 ? 'Confirmă ștergerea' : 'Confirmare finală'}
            </div>
            <p style={{ margin: '6px 0 14px', lineHeight: 1.4 }}>
              {confirm.step === 1
                ? <>Ștergi documentul <b>{confirm.doc.type === 'contract' ? 'Contract' : 'Autorizatie'} — {confirm.doc.number}</b>?</>
                : <>Ești absolut sigur(ă) că vrei să ștergi <b>documentul</b> <b>{confirm.doc.type === 'contract' ? 'Contract' : 'Autorizatie'} — {confirm.doc.number}</b>? Va putea fi recuperat din „Coș de gunoi”.</>}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeDelete} style={{ ...btn, background: '#475569' }}>Anulează</button>
              <button onClick={doDelete} style={danger}>{confirm.step === 1 ? 'Continuă' : 'Șterge'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
