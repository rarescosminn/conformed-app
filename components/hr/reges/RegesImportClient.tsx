'use client'

import { useMemo, useState } from 'react'

/** Tip row generic, indexat pe header-ele CSV */
type CsvRow = Record<string, string>

function detectDelimiter(sample: string): ',' | ';' | '\t' {
    // ne uităm în primele 3 linii
    const lines = sample.split(/\r?\n/).slice(0, 3)
    const tally = { ',': 0, ';': 0, '\t': 0 } as Record<string, number>
    for (const line of lines) {
        tally[','] += (line.match(/,/g) || []).length
        tally[';'] += (line.match(/;/g) || []).length
        tally['\t'] += (line.match(/\t/g) || []).length
    }
    const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || ','
    return best as ',' | ';' | '\t'
}

/** Parser CSV mic, cu suport pentru ghilimele + delimiter auto */
function parseCSV(text: string, delimiter?: ',' | ';' | '\t'): { headers: string[]; rows: CsvRow[] } {
    // eliminăm BOM dacă e prezent
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
    const delim = delimiter || detectDelimiter(text)

    const rowsRaw: string[][] = []
    let field = ''
    let row: string[] = []
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (inQuotes) {
            if (c === '"') {
                const next = text[i + 1]
                if (next === '"') { field += '"'; i++ } // escape ""
                else { inQuotes = false }
            } else {
                field += c
            }
        } else {
            if (c === '"') inQuotes = true
            else if (c === '\r') { /* skip */ }
            else if (c === '\n') { row.push(field); rowsRaw.push(row); row = []; field = '' }
            else if (c === delim) { row.push(field); field = '' }
            else { field += c }
        }
    }
    // push last
    if (field.length > 0 || row.length > 0) {
        row.push(field)
        rowsRaw.push(row)
    }

    if (rowsRaw.length === 0) return { headers: [], rows: [] }

    const headers = rowsRaw[0].map(h => h.trim())
    const rows: CsvRow[] = []

    for (let r = 1; r < rowsRaw.length; r++) {
        const raw = rowsRaw[r]
        if (raw.length === 1 && raw[0].trim() === '') continue // linie goală
        const obj: CsvRow = {}
        headers.forEach((h, idx) => {
            obj[h] = (raw[idx] ?? '').trim()
        })
        rows.push(obj)
    }

    return { headers, rows }
}

export default function RegesImportClient() {
    const [month, setMonth] = useState<string>('')        // YYYY-MM
    const [fileName, setFileName] = useState<string>('')
    const [headers, setHeaders] = useState<string[]>([])
    const [rows, setRows] = useState<CsvRow[]>([])
    const [error, setError] = useState<string>('')

    async function handleFile(file: File) {
        setError('')
        setFileName(file.name)
        const text = await file.text()
        const { headers, rows } = parseCSV(text)
        if (!headers.length || !rows.length) {
            setHeaders([]); setRows([])
            setError('CSV-ul pare gol sau are un header invalid.')
            return
        }
        setHeaders(headers)
        setRows(rows)
    }

    const sample = useMemo(() => rows.slice(0, 10), [rows])

    return (
        <section className="card" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ marginRight: 8 }}>REGES – Încărcare lunară CSV</h3>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Luna:</span>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', background: '#fff' }}
                    />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="text-xs" style={{ fontSize: 12, color: 'var(--text-muted)' }}>CSV:</span>
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ fontSize: 12 }}
                    />
                </label>

                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    {fileName ? fileName : 'nicio selecție'}
                </span>
            </div>

            {error && <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div>}

            {headers.length > 0 && (
                <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                        <thead>
                            <tr>
                                {headers.map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sample.map((r, i) => (
                                <tr key={i}>
                                    {headers.map(h => (
                                        <td key={h} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                                            {r[h]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
                        Afișez primele {sample.length} rânduri din {rows.length}.
                    </div>
                </div>
            )}

            {/* Placeholder pentru pasul următor (trimis către API / generare fișier compatibil REGES) */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    disabled={!month || rows.length === 0}
                    style={{
                        border: '1px solid var(--border)',
                        background: '#fff',
                        borderRadius: 8,
                        padding: '8px 12px',
                        opacity: (!month || rows.length === 0) ? .6 : 1
                    }}
                    title={!month ? 'Selectează luna' : (rows.length === 0 ? 'Încarcă un CSV' : '')}
                    onClick={() => alert('În pasul 2 trimitem la API / generăm CSV pentru REGES')}
                >
                    Continuă (pasul 2)
                </button>
            </div>
        </section>
    )
}
