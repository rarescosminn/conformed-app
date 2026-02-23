'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import HrCards from './HrCards'
import HrTableSectii from './HrTableSectii'
import HrLegendCard from './HrLegendCard'
import RegesImportClient from './reges/RegesImportClient'
import BurnoutCard from './BurnoutCard'

/* ---------- utilitare slugify RO ---------- */
const normalizeRo = (s: string) =>
    (s ?? '')
        .replace(/Ă|Â|ă|â/g, 'a')
        .replace(/Î|î/g, 'i')
        .replace(/Ș|Ş|ș|ş/g, 's')
        .replace(/Ț|Ţ|ț|ţ/g, 't')
        .replace(/–|—/g, '-')
        .toLowerCase()
        .trim()

const toSlug = (s: string) =>
    normalizeRo(s)
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

/* ---------- opțiuni secții (alfabetic) ---------- */
const SECTII_RAW = [
    'ATI', 'Bloc operator', 'Boli infecțioase', 'Cardiologie', 'Chirurgie generală', 'CSSD/CPIVD (Sterilizare)',
    'Dermatologie', 'Diabet, nutriție și boli metabolice', 'Endocrinologie', 'Farmacie', 'Gastroenterologie', 'Hematologie',
    'Laborator', 'Nefrologie', 'Neonatologie', 'Neurologie', 'Obstetrică–Ginecologie', 'Oftalmologie', 'Oncologie', 'ORL',
    'Ortopedie', 'Pediatrie', 'Pneumologie', 'Psihiatrie', 'Radiologie–Imagistică', 'Recuperare medicală', 'UPU',
]

const OPTIONS = SECTII_RAW
    .map((name) => ({ name, slug: toSlug(name) }))
    .sort((a, b) => normalizeRo(a.name).localeCompare(normalizeRo(b.name)))

const VALID_SLUGS = new Set(OPTIONS.map(o => o.slug))

type Props = {
    summary: any
    rows: any[]
    currentDomain: any
}

/* ---------- CHIP-uri + Căutare (componentă locală) ---------- */
function SectiiFilterChips({
    selected, onChange,
}: { selected: string[]; onChange: (next: string[]) => void }) {

    const [q, setQ] = useState('')

    const allSlugs = useMemo(() => OPTIONS.map(o => o.slug), [])
    const qNorm = normalizeRo(q)

    const visible = useMemo(() => {
        if (!qNorm) return OPTIONS
        return OPTIONS.filter(o => normalizeRo(o.name).includes(qNorm))
    }, [qNorm])

    const visibleSlugs = useMemo(() => new Set(visible.map(v => v.slug)), [visible])

    const toggle = (slug: string) =>
        onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug])

    // „Selectează toate” — dacă e căutare activă, doar rezultatele vizibile; altfel, toate
    const selectAll = () => {
        const target = qNorm ? visible.map(v => v.slug) : allSlugs
        onChange(Array.from(new Set([...selected, ...target])))
    }

    // „Golește” — dacă e căutare activă, deselectează doar cele vizibile; altfel, toate
    const clearAll = () => {
        if (!qNorm) return onChange([])
        onChange(selected.filter(s => !visibleSlugs.has(s)))
    }

    return (
        <section className="hr-filter card">
            <div className="hr-filter-head">
                <h3>Secții</h3>

                <div className="hr-filter-actions">
                    <button type="button" onClick={selectAll} className="rounded-md border px-2 py-1 text-xs">Selectează toate</button>
                    <button type="button" onClick={clearAll} className="rounded-md border px-2 py-1 text-xs">Golește</button>
                </div>

                <div className="hr-filter-search">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <input
                        placeholder="Caută secția…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <span className="hr-filter-count">
                    {selected.length}/{OPTIONS.length} selectate
                </span>
            </div>

            <div className="chips">
                {visible.map(({ name, slug }) => {
                    const checked = selected.includes(slug)
                    return (
                        <button
                            key={slug}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => toggle(slug)}
                            className="chip"
                            title={name}
                        >
                            <span aria-hidden className="chip-bullet">{checked ? '✓' : ''}</span>
                            <span className="truncate text-sm">{name}</span>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}

/* ---------- Pagina client ---------- */
export default function HrPageClient({ summary, rows, currentDomain }: Props) {
    const [sectii, setSectii] = useState<string[]>([])

    /* ===== Sincronizare în URL ===== */
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const initialized = useRef(false)

    // citește din URL o singură dată
    useEffect(() => {
        if (initialized.current) return
        initialized.current = true
        const qp = searchParams.get('sectii')
        if (!qp) return
        const arr = qp.split(',')
            .map(s => s.trim())
            .filter(s => s && VALID_SLUGS.has(s))
        if (arr.length) setSectii(arr)
    }, [searchParams])

    // scrie în URL la schimbarea selecției (fără scroll / fără push)
    useEffect(() => {
        const current = searchParams.get('sectii') ?? ''
        const encoded = [...new Set(sectii)].sort().join(',')
        if (encoded === current) return
        const sp = new URLSearchParams(Array.from(searchParams.entries()))
        if (encoded) sp.set('sectii', encoded); else sp.delete('sectii')
        router.replace(sp.size ? `${pathname}?${sp.toString()}` : pathname, { scroll: false })
    }, [sectii, router, pathname, searchParams])

    /* ===== Filtrarea tabelului ===== */
    const getRowSlug = (row: any) => {
        if (row?.sectieSlug) return String(row.sectieSlug)
        const name = row?.sectie ?? row?.sectie_nume ?? row?.section ?? row?.department ?? row?.nume ?? ''
        return toSlug(String(name))
    }

    const filteredRows = useMemo(() => {
        if (!sectii.length) return rows
        return rows.filter(r => sectii.includes(getRowSlug(r)))
    }, [rows, sectii])

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-semibold">HR – Structură și Necesar</h1>
            <HrCards summary={summary} />
            <SectiiFilterChips selected={sectii} onChange={setSectii} />
            <HrTableSectii rows={filteredRows} />
            <RegesImportClient />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <HrLegendCard domain={currentDomain} />
              <BurnoutCard />
            </div>
        </div>
    )
}