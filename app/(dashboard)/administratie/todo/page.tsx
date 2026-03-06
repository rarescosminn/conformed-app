'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Scope = { area: 'administratie'; subdomain?: string | null };
type Status = 'Deschis' | 'Închis' | 'deschis' | 'inchis';
type Priority = 'Scăzută' | 'Medie' | 'Ridicată';
type Task = {
    id: string;
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;                 // YYYY-MM-DD
    assignee?: string;
    status: Status;
    scope?: Scope | null;
    createdAt?: string;
};

const KEYS = ['hc_tasks', 'admin_tasks'] as const;

function readAll(): Task[] {
    const all: Task[] = [];
    for (const k of KEYS) {
        try {
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const arr = JSON.parse(raw) as Task[];
            if (Array.isArray(arr)) all.push(...arr);
        } catch { }
    }
    // eliminăm duplicate după id
    const map = new Map<string, Task>();
    for (const t of all) map.set(t.id, t);
    return [...map.values()];
}

function writeAll(tasks: Task[]) {
    // scriem în ambele chei ca să rămână sincron
    const str = JSON.stringify(tasks);
    for (const k of KEYS) {
        try { localStorage.setItem(k, str); } catch { }
    }
    // notificăm UI-ul
    try { window.dispatchEvent(new Event('tasks-changed')); } catch { }
}

function isGeneralScope(t: Task) {
    const s = t.scope;
    return (s?.area === 'administratie') && (s?.subdomain == null);
}
function isOpen(t: Task) {
    const s = (t.status || 'Deschis').toString().toLowerCase();
    return s !== 'inchis' && s !== 'închis';
}

export default function Page() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = () => {
        setLoading(true);
        setTasks(readAll());
        setLoading(false);
    };

    useEffect(() => {
        refresh();
        const on = () => refresh();
        window.addEventListener('storage', on);
        window.addEventListener('tasks-changed', on);
        return () => {
            window.removeEventListener('storage', on);
            window.removeEventListener('tasks-changed', on);
        };
    }, []);

    const openGeneral = useMemo(
        () => tasks.filter(t => isGeneralScope(t) && isOpen(t)),
        [tasks]
    );

    const finalize = (id: string) => {
        const next = tasks.map(t =>
            t.id === id ? { ...t, status: 'Închis' as Status } : t
        );
        setTasks(next);
        writeAll(next);
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link
                    href="/administratie"
                    style={{
                        display: 'inline-flex',
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        textDecoration: 'none',
                        background: '#fff'
                    }}
                >
                    ← Înapoi
                </Link>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                    Taskuri deschise (general)
                </h1>
            </div>

            <div
                style={{
                    marginTop: 12,
                    border: '1px solid #bfdbfe',
                    background: '#f5faff',
                    borderRadius: 12,
                    padding: 10,
                    color: '#1e3a8a'
                }}
            >
                {loading
                    ? 'Se încarcă…'
                    : openGeneral.length === 0
                        ? 'Nu există taskuri deschise.'
                        : `Aveți ${openGeneral.length} task(uri) deschise.`}
            </div>

            <Link
                href="/administratie/todo/new"
                style={{
                    display: 'inline-flex',
                    marginTop: 12,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #bfdbfe',
                    background: '#fff',
                    textDecoration: 'none',
                    fontSize: 13
                }}
            >
                + Adaugă task
            </Link>

            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {openGeneral.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            background: '#fff',
                            padding: 12,
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 10,
                            alignItems: 'center'
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700 }}>{t.title}</div>
                            <div style={{ fontSize: 13, opacity: 0.85 }}>
                                {t.priority ? `Prioritate: ${t.priority} • ` : ''}
                                {t.dueDate ? `Termen: ${t.dueDate} • ` : ''}
                                {t.assignee ? `Responsabil: ${t.assignee}` : ''}
                            </div>
                            {t.description ? (
                                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
                                    {t.description}
                                </div>
                            ) : null}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => finalize(t.id)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #10b981',
                                    background: '#ecfdf5',
                                    cursor: 'pointer'
                                }}
                                title="Marchează ca închis"
                            >
                                Finalizează
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
