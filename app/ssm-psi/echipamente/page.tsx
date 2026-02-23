'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Equip, equipStatus, listEquips, upsertEquip } from '@/lib/ssm/store';

export default function Page() {
    const [items, setItems] = useState<Equip[]>([]);
    const [q, setQ] = useState('');
    useEffect(() => { const r = () => setItems(listEquips()); r(); window.addEventListener('ssmpsi-change', r); return () => window.removeEventListener('ssmpsi-change', r); }, []);
    const filtered = useMemo(() => items.filter(e => (e.location + e.code + e.type).toLowerCase().includes(q.toLowerCase())), [items, q]);

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Echipamente SSM & PSI</h1>
            <div style={{ margin: '10px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Caută cod/locație/tip…" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', minWidth: 260 }} />
                <AddEdit onSave={e => upsertEquip(e)} />
            </div>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                    <tr style={{ textAlign: 'left', opacity: 0.7 }}>
                        <th>Tip</th><th>Cod</th><th>Locație</th><th>Ultima verif.</th><th>Scadență</th><th>Status</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(e => <Row key={e.id} e={e} />)}
                    {!filtered.length && <tr><td colSpan={7} style={{ opacity: 0.7 }}>Nu există echipamente.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function Row({ e }: { e: Equip }) {
    const st = equipStatus(e);
    const badge: React.CSSProperties = { display: 'inline-flex', padding: '2px 8px', borderRadius: 999, border: '1px solid', fontSize: 12 };
    const color = st === 'valid' ? '#166534' : st === 'expira' ? '#92400e' : '#991b1b';
    return (
        <tr style={{ background: '#fff' }}>
            <td>{e.type}</td>
            <td>{e.code}</td>
            <td>{e.location}</td>
            <td>{e.lastCheck}</td>
            <td>{e.dueDate}</td>
            <td><span style={{ ...badge, borderColor: color, color }}>{st}</span></td>
            <td><AddEdit initial={e} onSave={x => upsertEquip(x)} /></td>
        </tr>
    );
}

function AddEdit({ initial, onSave }: { initial?: Equip; onSave: (e: Equip) => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Equip>(initial ?? { id: crypto.randomUUID(), type: 'stingator', code: '', location: '', lastCheck: '', dueDate: '', notes: '' });
    useEffect(() => { if (initial) setForm(initial); }, [initial]);
    const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', cursor: 'pointer' };
    return (
        <>
            <button style={btn} onClick={() => setOpen(true)}>{initial ? 'Editează' : 'Adaugă'}</button>
            {!open ? null : (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
                    <div style={{ width: 'min(560px,96vw)', background: '#fff', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                            <b>{initial ? 'Editează echipament' : 'Adaugă echipament'}</b>
                            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>✕</button>
                        </div>
                        <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                            <label>Tip
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Equip['type'] })} style={inp() as any}>
                                    <option value="stingator">Stingător</option>
                                    <option value="hidrant">Hidrant</option>
                                    <option value="trusa">Trusă</option>
                                    <option value="alarma">Alarmă</option>
                                    <option value="alt">Alt</option>
                                </select>
                            </label>
                            <label>Cod
                                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp()} />
                            </label>
                            <label>Locație
                                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inp()} />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <label>Ultima verificare
                                    <input type="date" value={form.lastCheck} onChange={e => setForm({ ...form, lastCheck: e.target.value })} style={inp()} />
                                </label>
                                <label>Scadență
                                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inp()} />
                                </label>
                            </div>
                            <label>Note
                                <input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} style={inp()} />
                            </label>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                                <button onClick={() => setOpen(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>Renunță</button>
                                <button onClick={() => { onSave(form); setOpen(false); }} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff' }}>Salvează</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
const inp = () => ({ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', marginTop: 4 });
