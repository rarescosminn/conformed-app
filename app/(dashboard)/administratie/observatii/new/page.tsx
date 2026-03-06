'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Observation = {
    id: string;
    area: 'administratie';
    subdomain: string | null;
    message: string;
    createdAt: string;
};

const KEY = 'admin_observations_v1';

export default function NewObservation() {
    const router = useRouter();
    const [message, setMessage] = useState('');

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;
        const now = new Date().toISOString();
        const o: Observation = {
            id: String(Date.now()),
            area: 'administratie',
            subdomain: null,
            message: message.trim(),
            createdAt: now,
        };
        try {
            const raw = localStorage.getItem(KEY);
            const list: Observation[] = raw ? JSON.parse(raw) : [];
            list.unshift(o);
            localStorage.setItem(KEY, JSON.stringify(list));
        } catch { }
        router.push('/administratie');
    }

    const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px' };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 10px', textDecoration: 'none' }}>← Înapoi</Link>
                <h1 style={{ margin: 0, fontSize: 22 }}>Trimite observație</h1>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                <div>
                    <label>Mesaj*</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...inp, height: 140 }} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', textDecoration: 'none' }}>Anulează</Link>
                    <button type="submit" style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', background: '#fff' }}>Trimite</button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>Context: Administrație • general</div>
            </form>
        </div>
    );
}
