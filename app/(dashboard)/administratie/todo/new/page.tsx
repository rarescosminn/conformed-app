'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { addTask, TaskPriority } from '@/lib/tasks/store';

export default function NewGeneralTask() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medie');
    const [dueDate, setDueDate] = useState<string>('');
    const [assignee, setAssignee] = useState('');

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        addTask({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            dueDate: dueDate || undefined,
            assignee: assignee.trim() || undefined,
            status: 'deschis',

            area: 'administratie',
            subdomain: null,
        });

        router.push('/administratie');  // te întoarce în Administrație; cardurile se vor actualiza
    }

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 10px', textDecoration: 'none' }}>← Înapoi</Link>
                <h1 style={{ margin: 0, fontSize: 22 }}>Adaugă task (general)</h1>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                <div>
                    <label>Titlu *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                        style={inp} placeholder="ex: Actualizează instrucțiunile…" />
                </div>

                <div>
                    <label>Descriere</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, height: 120 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label>Prioritate</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inp}>
                            <option value="scazuta">Scăzută</option>
                            <option value="medie">Medie</option>
                            <option value="ridicata">Ridicată</option>
                        </select>
                    </div>
                    <div>
                        <label>Termen</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
                    </div>
                </div>

                <div>
                    <label>Responsabil</label>
                    <input value={assignee} onChange={e => setAssignee(e.target.value)} style={inp} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', textDecoration: 'none' }}>Anulează</Link>
                    <button type="submit" style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', background: '#fff' }}>Salvează</button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>Context: aria administrație • general</div>
            </form>
        </div>
    );
}

const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px' };
