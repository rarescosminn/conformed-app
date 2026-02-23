'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Suggestion = {
    id: string;
    area: 'administratie';
    subdomain: string | null; // general
    message: string;
    isAnonymous: boolean;
    name?: string;
    email?: string;
    gdprConsent: boolean;
    createdAt: string;
};

const KEY = 'admin_suggestions_v1';

export default function NewSuggestion() {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [isAnon, setIsAnon] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [gdpr, setGdpr] = useState(false);

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;

        // dacă NU e anonim și sunt date personale, e necesar consimțământul
        if (!isAnon && (name.trim() || email.trim()) && !gdpr) return;

        const now = new Date().toISOString();
        const s: Suggestion = {
            id: String(Date.now()),
            area: 'administratie',
            subdomain: null,
            message: message.trim(),
            isAnonymous: isAnon,
            name: isAnon ? undefined : (name.trim() || undefined),
            email: isAnon ? undefined : (email.trim() || undefined),
            gdprConsent: isAnon ? false : gdpr,
            createdAt: now,
        };

        try {
            const raw = localStorage.getItem(KEY);
            const list: Suggestion[] = raw ? JSON.parse(raw) : [];
            list.unshift(s);
            localStorage.setItem(KEY, JSON.stringify(list));
        } catch { }

        router.push('/administratie');
    }

    const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px' };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 10px', textDecoration: 'none' }}>← Înapoi</Link>
                <h1 style={{ margin: 0, fontSize: 22 }}>Trimite sugestie</h1>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                <div>
                    <label>Mesaj*</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...inp, height: 140 }} />
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
                    Trimit anonim
                </label>

                {!isAnon && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label>Nume</label>
                                <input value={name} onChange={e => setName(e.target.value)} style={inp} />
                            </div>
                            <div>
                                <label>Email</label>
                                <input value={email} onChange={e => setEmail(e.target.value)} style={inp} />
                            </div>
                        </div>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={gdpr} onChange={e => setGdpr(e.target.checked)} />
                            Îmi exprim acordul pentru prelucrarea datelor personale în scopul soluționării sugestiei.
                        </label>
                    </>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Link href="/administratie" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', textDecoration: 'none' }}>Anulează</Link>
                    <button type="submit" style={{ border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', background: '#fff' }}>Trimite</button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>Context: Administrație • general</div>
            </form>
        </div>
    );
}
