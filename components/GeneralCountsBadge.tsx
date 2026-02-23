// components/GeneralCountsBadge.tsx
'use client';

import { useEffect, useState } from 'react';
import {
    countOpenTasksGeneral,
    countTodoLateGeneral,
    countTodoTodayGeneral,
} from '@/lib/tasks/store';

export default function GeneralCountsBadge() {
    const [today, setToday] = useState(0);
    const [late, setLate] = useState(0);
    const [open, setOpen] = useState(0);

    const refresh = () => {
        try {
            setToday(countTodoTodayGeneral());
            setLate(countTodoLateGeneral());
            setOpen(countOpenTasksGeneral());
        } catch {
            // în caz de localStorage indisponibil (SSR/safari private mode), ignorăm
        }
    };

    useEffect(() => {
        refresh();

        // Actualizează când se schimbă localStorage în alt tab sau când revii în tab
        const onStorage = () => refresh();
        const onVisible = () => document.visibilityState === 'visible' && refresh();

        window.addEventListener('storage', onStorage);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('storage', onStorage);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return (
        <div
            style={{
                fontSize: 12,
                lineHeight: 1.4,
                padding: '6px 8px',
                borderRadius: 10,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1e3a8a',
                display: 'inline-block',
            }}
            title="Contoare pentru elementele generale (fără subdomeniu)"
        >
            To-Do: azi <b>{today}</b> • întârziate <b>{late}</b> • Taskuri deschise <b>{open}</b>
        </div>
    );
}
