

import { useMemo } from 'react'

export type SectiiFilterProps = {
    /** slugs selectate (ex: "neurologie") */
    selected: string[]
    /** callback cu lista actualizată de slugs */
    onChange: (next: string[]) => void
    /** opțional: prefix pentru id-urile checkbox-urilor */
    idPrefix?: string
}

/* === Listă secții + utilitare slugify (RO) — autonomie totală (fără alte importuri) === */
const SECTII_RAW = [
    'ATI',
    'Bloc operator',
    'Boli infecțioase',
    'Cardiologie',
    'Chirurgie generală',
    'CSSD/CPIVD (Sterilizare)',
    'Dermatologie',
    'Diabet, nutriție și boli metabolice',
    'Endocrinologie',
    'Farmacie',
    'Gastroenterologie',
    'Hematologie',
    'Laborator',
    'Nefrologie',
    'Neonatologie',
    'Neurologie',
    'Obstetrică–Ginecologie',
    'Oftalmologie',
    'Oncologie',
    'ORL',
    'Ortopedie',
    'Pediatrie',
    'Pneumologie',
    'Psihiatrie',
    'Radiologie–Imagistică',
    'Recuperare medicală',
    'UPU',
]

const normalizeRo = (s: string) =>
    s
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

const OPTIONS = SECTII_RAW
    .map((name) => ({ name, slug: toSlug(name) }))
    .sort((a, b) => normalizeRo(a.name).localeCompare(normalizeRo(b.name)))

export default function SectiiFilter({ selected, onChange, idPrefix = 'sectii' }: SectiiFilterProps) {
    const allSlugs = useMemo(() => OPTIONS.map((o) => o.slug), [])

    const toggle = (slug: string) => {
        const has = selected.includes(slug)
        const next = has ? selected.filter((s) => s !== slug) : [...selected, slug]
        onChange(next)
    }

    const selectAll = () => onChange(allSlugs)
    const clearAll = () => onChange([])

    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
            {/* header */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium">Secții</h3>
                <div className="ml-1 flex items-center gap-2">
                    <button type="button" onClick={selectAll} className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50">
                        Selectează toate
                    </button>
                    <button type="button" onClick={clearAll} className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50">
                        Golește
                    </button>
                </div>
                <span className="ml-auto text-xs text-zinc-500">
                    {selected.length}/{OPTIONS.length} selectate
                </span>
            </div>

            {/* grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {OPTIONS.map(({ name, slug }) => {
                    const id = `${idPrefix}-${slug}`
                    const checked = selected.includes(slug)
                    const classes = [
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                        checked
                            ? 'border-[#192431] bg-[#192431]/5 ring-1 ring-[#192431]/30'
                            : 'border-zinc-200 hover:bg-zinc-50',
                        'focus-within:ring-2 focus-within:ring-zinc-200',
                    ].join(' ')
                    return (
                        <label key={slug} htmlFor={id} className={classes} title={name}>
                            <input
                                id={id}
                                name="sectii"
                                type="checkbox"
                                className="h-4 w-4 cursor-pointer accent-[#192431]"
                                checked={checked}
                                onChange={() => toggle(slug)}
                            />
                            <span className="truncate">{name}</span>
                        </label>
                    )
                })}
            </div>
        </section>
    )
}
