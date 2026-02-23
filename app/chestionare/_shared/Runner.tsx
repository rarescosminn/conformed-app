'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Ans = 'da' | 'nu' | 'partial' | 'na';
type Q = {
    section: string;
    role: string;
    questionId: string;
    text: string;
    legalReference?: string;
    answerType: 'yes_no';
    required?: boolean;
};
type Schema = {
    section: string;   // ex: "ATI", "Bloc operator"
    roles: string[];   // ex: ["Generale", "Șef secție", ...]
    questions: Q[];
};

const LABEL: Record<Ans, string> = { da: 'Da', nu: 'Nu', partial: 'Parțial', na: 'N/A' };
const needsEvidence = (ans?: Ans) => ans === 'da' || ans === 'partial';

const panel: React.CSSProperties = {
    border: '1px solid #bfdbfe',
    background: 'linear-gradient(180deg,#eff6ff,#f8fbff)',
    borderRadius: 14,
    padding: 14,
    color: '#1e3a8a',
};
const card: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.65)',
    padding: 16,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
};

export default function Runner({ fileBase }: { fileBase: string }) {
    const [schema, setSchema] = useState<Schema | null>(null);
    const [loadErr, setLoadErr] = useState<string | null>(null);

    const [role, setRole] = useState<string>('');
    const [page, setPage] = useState(0);

    const [answers, setAnswers] = useState<Record<string, Ans>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [files, setFiles] = useState<Record<string, string[]>>({});

    // 1) încărcăm schema din /public/chestionare/<fileBase>.json
    useEffect(() => {
        let mounted = true;
        setLoadErr(null);
        setSchema(null);
        fetch(`/chestionare/${fileBase}.json`, { cache: 'no-store' })
            .then((r) => {
                if (!r.ok) throw new Error(`Nu găsesc /chestionare/${fileBase}.json`);
                return r.json();
            })
            .then((data: Schema) => {
                if (!mounted) return;
                setSchema(data);
                setRole(data.roles?.[0] ?? '');
                setPage(0);
                setAnswers({});
                setNotes({});
                setFiles({});
            })
            .catch((e) => mounted && setLoadErr(e.message));
        return () => {
            mounted = false;
        };
    }, [fileBase]);

    // 2) draft per secție+rol
    const STORAGE_KEY = useMemo(
        () => (schema ? `q-${fileBase}-${schema.section}-${role}` : ''),
        [fileBase, schema, role]
    );

    useEffect(() => {
        if (!STORAGE_KEY) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const j = JSON.parse(raw);
                setAnswers(j.answers ?? {});
                setNotes(j.notes ?? {});
                setFiles(j.files ?? {});
                setPage(j.page ?? 0);
            }
        } catch { }
    }, [STORAGE_KEY]);

    useEffect(() => {
        if (!STORAGE_KEY) return;
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ answers, notes, files, page })
            );
        } catch { }
    }, [STORAGE_KEY, answers, notes, files, page]);

    // 3) filtrare + paginare
    const all = useMemo(
        () => (schema ? schema.questions.filter((q) => q.role === role) : []),
        [schema, role]
    );
    const PER_PAGE = 3;
    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    const from = page * PER_PAGE;
    const to = Math.min(all.length, from + PER_PAGE);
    const visible = all.slice(from, to);

    const pageValid = useMemo(() => {
        return visible.every((q) => {
            const a = answers[q.questionId];
            if (!a) return false;
            if (needsEvidence(a)) return (files[q.questionId]?.length ?? 0) > 0;
            return true;
        });
    }, [visible, answers, files]);

    // UI
    if (loadErr) {
        return (
            <div style={{ padding: 20 }}>
                <Link href="/chestionare" style={{ textDecoration: 'none', fontSize: 13 }}>
                    ← Înapoi
                </Link>
                <div style={{ marginTop: 10, color: '#991b1b' }}>{loadErr}</div>
            </div>
        );
    }
    if (!schema) {
        return (
            <div style={{ padding: 20 }}>
                <Link href="/chestionare" style={{ textDecoration: 'none', fontSize: 13 }}>
                    ← Înapoi
                </Link>
                <div style={{ marginTop: 10 }}>Se încarcă…</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/chestionare" style={{ textDecoration: 'none', fontSize: 13 }}>
                    ← Înapoi
                </Link>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                    Chestionar — {schema.section}
                </h1>
            </div>

            <div style={{ ...panel, marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Rol:
                    <select
                        value={role}
                        onChange={(e) => {
                            setRole(e.target.value);
                            setPage(0);
                        }}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1px solid #bfdbfe',
                            background: '#fff',
                        }}
                    >
                        {schema.roles.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </label>
                <div style={{ marginLeft: 'auto', opacity: 0.8, fontSize: 13 }}>
                    Întrebările {all.length === 0 ? 0 : from + 1}–{to} din {all.length}
                </div>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {visible.map((q) => {
                    const a = answers[q.questionId];
                    const mustEv = needsEvidence(a);
                    const hasEv = (files[q.questionId]?.length ?? 0) > 0;

                    return (
                        <div key={q.questionId} style={card}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>{q.text}</div>
                            {q.legalReference && (
                                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                                    ({q.legalReference})
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                                {(['da', 'nu', 'partial', 'na'] as Ans[]).map((v) => (
                                    <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        <input
                                            type="radio"
                                            name={q.questionId}
                                            checked={a === v}
                                            onChange={() =>
                                                setAnswers((prev) => ({ ...prev, [q.questionId]: v }))
                                            }
                                        />
                                        {LABEL[v]}
                                    </label>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <label
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #bfdbfe',
                                        background: mustEv ? '#fff' : '#f3f4f6',
                                        color: '#1e3a8a',
                                        cursor: mustEv ? 'pointer' : 'not-allowed',
                                    }}
                                    title={mustEv ? 'Încarcă dovadă' : 'Nu este necesară pentru NU / N/A'}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        disabled={!mustEv}
                                        onChange={(e) => {
                                            const picked = Array.from(e.target.files ?? []).map((f) => f.name);
                                            setFiles((s) => ({ ...s, [q.questionId]: picked }));
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    Încarcă dovadă
                                </label>
                                <span style={{ fontSize: 12, opacity: 0.85 }}>
                                    {mustEv
                                        ? hasEv
                                            ? 'Dovadă atașată'
                                            : 'Dovadă obligatorie — lipsește'
                                        : 'Dovada nu este necesară'}
                                </span>
                            </div>

                            {hasEv && (
                                <div style={{ fontSize: 12, opacity: 0.8 }}>
                                    {files[q.questionId]?.join(', ')}
                                </div>
                            )}

                            <div>
                                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                                    Observații (opțional)
                                </div>
                                <textarea
                                    value={notes[q.questionId] ?? ''}
                                    onChange={(e) =>
                                        setNotes((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                                    }
                                    placeholder="Sugestii, clarificări, plan de acțiune…"
                                    style={{
                                        width: '100%',
                                        minHeight: 80,
                                        borderRadius: 10,
                                        border: '1px solid rgba(0,0,0,0.12)',
                                        padding: 10,
                                        background: '#fff',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <Link
                    href="/chestionare"
                    style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        textDecoration: 'none',
                        fontSize: 13,
                    }}
                >
                    ← Înapoi la secții
                </Link>

                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                        marginLeft: 8,
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        cursor: page === 0 ? 'default' : 'pointer',
                    }}
                >
                    ← Înapoi
                </button>

                <button
                    onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                    disabled={page >= pages - 1 || !pageValid}
                    title={pageValid ? '' : 'Completează răspunsurile și dovada obligatorie'}
                    style={{
                        marginLeft: 'auto',
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid #bfdbfe',
                        background: pageValid ? '#fff' : '#f3f4f6',
                        cursor: pageValid ? 'pointer' : 'not-allowed',
                    }}
                >
                    Înainte →
                </button>
            </div>
        </div>
    );
}
