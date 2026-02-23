'use client';

import { useMemo, useState } from 'react';

type Answer = 'Da' | 'Nu' | 'Parțial' | 'N/A' | '';

type QA = {
    id: string;
    text: string;
    evidenceLabel?: string;
};

const QUESTIONS: QA[] = [
    { id: 'q1', text: 'Există procedură actualizată pentru trierea pacienților în UPU?', evidenceLabel: 'Procedura / dovada aplicării' },
    { id: 'q2', text: 'Se asigură instruirea periodică privind securitatea datelor?', evidenceLabel: 'Plan instruire + semnături' },
    { id: 'q3', text: 'Sunt respectate timpii standard pentru decontaminare?', evidenceLabel: 'Fișe/registre de lucru' },
    { id: 'q4', text: 'Echipamentele critice au verificări metrologice la zi?', evidenceLabel: 'Buletin metrologic' },
    { id: 'q5', text: 'Există evidență a incidentelor și a acțiunilor corective?', evidenceLabel: 'Registru incidente' },
    { id: 'q6', text: 'Planul de evacuare este afișat și validat?', evidenceLabel: 'Plan + PV verificare' },
];

const PER_PAGE = 3;

type State = {
    answer: Answer;
    file?: File | null;
    note: string;
    error?: string | null;
};

export default function QuestionnaireTable() {
    const [state, setState] = useState<Record<string, State>>(
        () => Object.fromEntries(QUESTIONS.map(q => [q.id, { answer: '', file: null, note: '', error: null }]))
    );
    const [page, setPage] = useState(0);

    const totalPages = Math.ceil(QUESTIONS.length / PER_PAGE);
    const pageQuestions = useMemo(
        () => QUESTIONS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
        [page]
    );

    // setters
    const setAnswer = (id: string, answer: Answer) =>
        setState(s => ({ ...s, [id]: { ...s[id], answer, error: null } }));

    const setFile = (id: string, file: File | null) =>
        setState(s => ({ ...s, [id]: { ...s[id], file, error: null } }));

    const setNote = (id: string, note: string) =>
        setState(s => ({ ...s, [id]: { ...s[id], note } }));

    // validare pe pagină
    const validatePage = (): boolean => {
        let ok = true;
        const ids = pageQuestions.map(q => q.id);
        setState(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                const it = next[id];
                if (!it.answer) { next[id] = { ...it, error: 'Selectează un răspuns.' }; ok = false; }
                if (it.answer === 'Da' && !it.file) { next[id] = { ...it, error: 'Document obligatoriu pentru răspunsul „Da”.' }; ok = false; }
            });
            return next;
        });
        return ok;
    };

    const goPrev = () => setPage(p => Math.max(p - 1, 0));
    const goNext = () => { if (validatePage()) setPage(p => Math.min(p + 1, totalPages - 1)); };

    const handleSubmit = () => {
        if (!validatePage()) return;
        const payload = QUESTIONS.map(q => ({
            id: q.id,
            question: q.text,
            answer: state[q.id].answer,
            note: state[q.id].note,
            fileName: state[q.id].file?.name ?? null,
        }));
        console.log('SUBMIT', payload);
        alert('Răspunsuri salvate local (mock). Integrare API la pasul următor.');
    };

    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Pagina {page + 1} / {totalPages}</strong>
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Întrebările {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, QUESTIONS.length)} din {QUESTIONS.length}
                </span>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {pageQuestions.map(q => {
                    const st = state[q.id];
                    const needFile = st.answer === 'Da';
                    const disabledUpload = !st.answer || st.answer === 'Nu' || st.answer === 'N/A';
                    return (
                        <div key={q.id} className="card" style={{ padding: 12 }}>
                            <div style={{ marginBottom: 6, fontWeight: 600 }}>{q.text}</div>

                            {/* răspunsuri */}
                            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 8 }}>
                                {(['Da', 'Nu', 'Parțial', 'N/A'] as Answer[]).map(v => (
                                    <label key={v} style={{ fontSize: 14, userSelect: 'none' }}>
                                        <input
                                            type="radio"
                                            name={`a-${q.id}`}
                                            checked={st.answer === v}
                                            onChange={() => setAnswer(q.id, v)}
                                            style={{ marginRight: 6 }}
                                        />
                                        {v}
                                    </label>
                                ))}
                            </div>

                            {/* upload + observații */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                                        {q.evidenceLabel ?? 'Document justificativ'}
                                        {needFile && <span style={{ color: '#DC2626' }}> • obligatoriu pentru „Da”</span>}
                                    </div>
                                    <label
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                            padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                                            background: disabledUpload ? '#F9FAFB' : 'white',
                                            color: disabledUpload ? '#9CA3AF' : '#111827',
                                            cursor: disabledUpload ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setFile(q.id, e.target.files?.[0] ?? null)}
                                            disabled={disabledUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M4 17V7a3 3 0 0 1 3-3h4" stroke="currentColor" strokeWidth="1.6" />
                                            <path d="M10 17 21 6M21 6v7M21 6h-7" stroke="currentColor" strokeWidth="1.6" />
                                        </svg>
                                        {st.file ? st.file.name : 'Alege fișier'}
                                    </label>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Observații (opțional)</div>
                                    <textarea
                                        rows={3}
                                        value={st.note}
                                        onChange={(e) => setNote(q.id, e.target.value)}
                                        placeholder="Sugestii, clarificări, plan de acțiune…"
                                        style={{ width: '100%', resize: 'vertical', padding: 8, borderRadius: 8, border: '1px solid #E5E7EB' }}
                                    />
                                </div>
                            </div>

                            {st.error && <div style={{ marginTop: 8, color: '#B91C1C', fontSize: 12 }}>{st.error}</div>}
                        </div>
                    );
                })}
            </div>

            {/* acțiuni */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <button
                    onClick={goPrev}
                    disabled={page === 0}
                    style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                        background: page === 0 ? '#F3F4F6' : 'white', color: page === 0 ? '#9CA3AF' : '#111827'
                    }}
                >
                    ◀ Înapoi
                </button>

                {page < totalPages - 1 ? (
                    <button
                        onClick={goNext}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0B5EBF', background: '#0B5EBF', color: 'white' }}
                    >
                        Înainte ▶
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #047857', background: '#059669', color: 'white' }}
                    >
                        Trimite chestionarul
                    </button>
                )}
            </div>
        </div>
    );
}
