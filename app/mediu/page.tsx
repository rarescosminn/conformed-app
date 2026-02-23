'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { LS, notifyMediu, mediuStats } from '@/lib/mediu-bridge';

const LS_TASKS = 'mediu::tasks';

/* ── Stiluri ─────────────────────────────────────────────────────────────── */
const wrap: React.CSSProperties = { padding: 20 };
const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 520px', // Deșeuri • Autorizatii/Contracte • Dreapta
    gap: 24,
    alignItems: 'stretch',
};
const col: React.CSSProperties = { display: 'grid', alignContent: 'start' };
const colRight: React.CSSProperties = { display: 'grid', gap: 16, alignContent: 'start' };

// bară verticală DOAR între a doua și a treia coloană
const vbar: React.CSSProperties = { borderLeft: '1px solid #e5e7eb', paddingLeft: 24 };

const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(15,23,42,.06), 0 2px 8px rgba(15,23,42,.04)',
    padding: 16,
};
const cardEqual: React.CSSProperties = {
    ...card,
    minHeight: 180,                       // înălțime egală pentru cele 2 carduri mari
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
};
const small: React.CSSProperties = { fontSize: 12, opacity: 0.8 };
const h1: React.CSSProperties = { margin: '4px 0 12px', fontSize: 24, fontWeight: 800 };
const back: React.CSSProperties = { fontSize: 13, opacity: 0.8 };
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13 };

/* ── Tipuri & utilitare simple LS ───────────────────────────────────────── */
type Task = {
    id: string;
    title: string;
    due?: string;     // YYYY-MM-DD
    done: boolean;
    createdAt: string;
};
const lsRead = <T,>(k: string, fb: T): T => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; } };
const lsWrite = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));

/* ── Componentă ──────────────────────────────────────────────────────────── */
export default function Page() {
    // Stats
    const deseuri = useMemo(() => mediuStats.deseuri(), []);
    const contracts = useMemo(() => mediuStats.contracte(), []);
    const locked = useMemo(() => mediuStats.locked(), []);

    // Taskuri (dreapta)
    const [tasks, setTasks] = useState<Task[]>([]);
    const [title, setTitle] = useState('');
    const [due, setDue] = useState('');

    useEffect(() => { setTasks(lsRead<Task[]>(LS_TASKS, [])); }, []);
    useEffect(() => { lsWrite(LS_TASKS, tasks); }, [tasks]);

    const addTask = () => {
        if (!title.trim()) return;
        setTasks([{ id: crypto.randomUUID(), title: title.trim(), due: due || undefined, done: false, createdAt: new Date().toISOString() }, ...tasks]);
        setTitle(''); setDue('');
    };
    const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

    const todayISO = new Date().toISOString().slice(0, 10);
    const todo = tasks.filter(t => !t.done);
    const today = todo.filter(t => t.due === todayISO);
    const overdue = todo.filter(t => t.due && t.due < todayISO);

    return (
        <div style={wrap}>
            <Link href="/" style={back}>← Înapoi</Link>
            <h1 style={h1}>Mediu</h1>
            <div style={{ ...small, marginBottom: 16 }}>Deșeuri • Autorizații / Contracte</div>

            <div style={grid}>
                {/* COL 1: Deșeuri */}
                <div style={col}>
                    <div style={cardEqual}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Deșeuri</div>
                            <div style={small}>
                                Formular saci (culoare, mărime, nr. bucăți, grad umplere), estimare kg, rapoarte zilnic/lunar/anual.
                            </div>
                            <div style={{ ...small, marginTop: 12 }}>
                                Azi: <b>{deseuri.totalKgAzi}</b> kg • De validat: <b>{deseuri.needValidate}</b>
                            </div>
                        </div>
                        <div>
                            <Link href="/mediu/deseuri" style={{ ...btn, display: 'inline-block' }}>Deschide →</Link>
                        </div>
                    </div>
                </div>

                {/* COL 2: Autorizații / Contracte */}
                <div style={col}>
                    <div style={cardEqual}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Autorizații / Contracte</div>
                            <div style={small}>
                                Evidență autorizații și contracte: număr, emitent, valabilitate, scan document, remindere.
                            </div>
                            <div style={{ ...small, marginTop: 12 }}>
                                Total: <b>{contracts.total}</b> • Expiră &lt;60z: <b>{contracts.exp60}</b> • Expirate: <b>{contracts.expirate}</b>
                            </div>
                            <div style={{ ...small, marginTop: 4 }}>
                                Fără scan: <b>{contracts.faraScan}</b> {locked.locked ? '• Raport lunar blocat' : ''}
                            </div>
                        </div>
                        <div>
                            <Link href="/mediu/contracte" style={{ ...btn, display: 'inline-block' }}>Deschide →</Link>
                        </div>
                    </div>
                </div>

                {/* COL 3: TO-DO + Taskuri (cu bară verticală la stânga) */}
                <div style={{ ...colRight, ...vbar }}>
                    {/* TO-DO */}
                    <div style={card}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>TO-DO</div>
                        <div style={small}>
                            Azi: <b>{today.length}</b> &nbsp;•&nbsp; Restante: <b>{overdue.length}</b> &nbsp;•&nbsp; Total deschise: <b>{todo.length}</b>
                        </div>
                        {todo.length === 0 ? (
                            <div style={{ ...small, marginTop: 8, opacity: 0.7 }}>Niciun task deschis.</div>
                        ) : (
                            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                                {todo.slice(0, 5).map(t => (
                                    <li key={t.id} style={{ marginBottom: 6 }}>
                                        <span>{t.title}</span>
                                        {t.due && <span style={{ ...small, marginLeft: 6 }}>(scadent: {t.due})</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Taskuri */}
                    <div style={card}>
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>Taskuri</div>

                        {/* Add */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px', gap: 8, marginBottom: 10 }}>
                            <input placeholder="titlu task..." value={title} onChange={e => setTitle(e.target.value)} />
                            <input type="date" value={due} onChange={e => setDue(e.target.value)} />
                            <button onClick={addTask} style={btn}>Adaugă</button>
                        </div>

                        {/* Listă */}
                        {tasks.length === 0 ? (
                            <div style={{ ...small, opacity: 0.7 }}>Nu există taskuri.</div>
                        ) : (
                            <div style={{ display: 'grid', gap: 6 }}>
                                {tasks.map(t => (
                                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 120px 80px', gap: 8, alignItems: 'center' }}>
                                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                                        <div style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}>
                                            {t.title}
                                        </div>
                                        <div style={small}>{t.due ? `scadent: ${t.due}` : ''}</div>
                                        <button onClick={() => removeTask(t.id)} style={{ ...btn, background: '#991b1b' }}>Șterge</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
