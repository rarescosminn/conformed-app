"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/context/OrgContext";

/* ================= Types ================= */
type BigCard = { id: string; title: string; description: string; icon: string; link: string; };
type HitType = "category" | "subcategory" | "file";
type Suggestion = { id: string; label: string; type: HitType; href: string; openInNewTab?: boolean; };

/* ================= Cards per org_type ================= */
const CARDS_SPITAL: BigCard[] = [
 { id: "proceduri",    title: "Proceduri",          description: "Proceduri pentru Mediu, Medical, SSM, PSI, HR, IT, ISO.", icon: "[P]",  link: "/resurse/proceduri" },
  { id: "instructiuni", title: "Instructiuni",        description: "Instructiuni de lucru si ghiduri aplicate pe domenii.",   icon: "[I]",  link: "/resurse/instructiuni" },
  { id: "template",     title: "Template documente",  description: "Modele: rapoarte, planuri, check-listuri, formulare.",   icon: "[T]",  link: "/resurse/template" },
  { id: "ssm",          title: "SSM",                 description: "Plan P&P, evaluari risc, fise individuale, registre.",   icon: "[S]",  link: "/resurse/ssm" },
  { id: "psi",          title: "PSI",                 description: "Plan PSI, evacuare, verificari stingatoare/hidranti.",   icon: "[F]",  link: "/resurse/psi" },
  { id: "mediu",        title: "Mediu",               description: "Registre, AFM, plan monitorizare, RetuRO, proceduri.",  icon: "[M]",  link: "/resurse/mediu" },
  { id: "hr",           title: "HR",                  description: "Fise post, registre personal, politici, training.",      icon: "[HR]", link: "/resurse/hr" },
  { id: "medical",      title: "Medical",             description: "Protocoale, ghiduri, planuri de urgenta, registre.",    icon: "[Md]", link: "/resurse/medical" },
  { id: "iso",          title: "ISO",                 description: "ISO 9001, 14001, 45001, 50001, 13485 - documentatie.",  icon: "[ISO]",link: "/resurse/iso" },
  { id: "it",           title: "IT & securitate",     description: "Politici IT, GDPR, ISO 27001, instructiuni.",           icon: "[IT]", link: "/resurse/it" },
  ];

const CARDS_COMPANIE: BigCard[] = [
  { id: "proceduri",    title: "Proceduri",          description: "Proceduri pentru Calitate, Mediu, SSM, PSI, HR, IT.",   icon: "[P]",   link: "/resurse/proceduri" },
  { id: "instructiuni", title: "Instructiuni",        description: "Instructiuni de lucru si ghiduri aplicate pe domenii.", icon: "[I]",   link: "/resurse/instructiuni" },
  { id: "template",     title: "Template documente",  description: "Modele: rapoarte, planuri, check-listuri, formulare.",  icon: "[T]",   link: "/resurse/template" },
  { id: "ssm",          title: "SSM",                 description: "Plan P&P, evaluari risc, fise individuale, registre.",  icon: "[S]",   link: "/resurse/ssm" },
  { id: "psi",          title: "PSI",                 description: "Plan PSI, evacuare, verificari stingatoare/hidranti.",  icon: "[F]",   link: "/resurse/psi" },
  { id: "mediu",        title: "Mediu",               description: "Registre, AFM, plan monitorizare, proceduri ISO 14001.",icon: "[M]",   link: "/resurse/mediu" },
  { id: "hr",           title: "HR",                  description: "Fise post, registre personal, politici, training.",     icon: "[HR]",  link: "/resurse/hr" },
  { id: "iso",          title: "ISO",                 description: "ISO 9001, 14001, 45001, 50001, 27001 - documentatie.",  icon: "[ISO]", link: "/resurse/iso" },
  { id: "esg",          title: "ESG",                 description: "Rapoarte ESG, indicatori sustenabilitate, ghiduri.",    icon: "[ESG]", link: "/resurse/esg" },
  { id: "it",           title: "IT & securitate",     description: "Politici IT, GDPR, ISO 27001, instructiuni.",           icon: "[IT]",  link: "/resurse/it" },
  ];

const CARDS_INSTITUTIE: BigCard[] = [
 { id: "proceduri",    title: "Proceduri",          description: "Proceduri pentru servicii publice, SSM, PSI, HR, IT.",  icon: "[P]",   link: "/resurse/proceduri" },
  { id: "instructiuni", title: "Instructiuni",        description: "Instructiuni de lucru si ghiduri aplicate pe domenii.", icon: "[I]",   link: "/resurse/instructiuni" },
  { id: "template",     title: "Template documente",  description: "Modele: rapoarte, planuri, check-listuri, formulare.",  icon: "[T]",   link: "/resurse/template" },
  { id: "ssm",          title: "SSM",                 description: "Plan P&P, evaluari risc, fise individuale, registre.",  icon: "[S]",   link: "/resurse/ssm" },
  { id: "psi",          title: "PSI",                 description: "Plan PSI, evacuare, verificari stingatoare/hidranti.",  icon: "[F]",   link: "/resurse/psi" },
  { id: "mediu",        title: "Mediu",               description: "Registre, AFM, plan monitorizare, proceduri ISO 14001.",icon: "[M]",   link: "/resurse/mediu" },
  { id: "hr",           title: "HR",                  description: "Fise post, registre personal, politici, training.",     icon: "[HR]",  link: "/resurse/hr" },
  { id: "iso",          title: "ISO",                 description: "ISO 9001, 14001, 45001 - documentatie si inregistrari.",icon: "[ISO]", link: "/resurse/iso" },
  { id: "guvernanta",   title: "Guvernanta",           description: "SCIM, etica, transparenta, avertizori, anticoruptie.", icon: "[G]",   link: "/resurse/guvernanta" },
  { id: "it",           title: "IT & securitate",     description: "Politici IT, GDPR, NIS2, instructiuni echipamente.",   icon: "[IT]",  link: "/resurse/it" },
  ];

/* ================= Search index per org_type ================= */
const SEARCH_BASE: Suggestion[] = [
  { id: "sub-proc-ssm",  label: "Proceduri / SSM",     type: "subcategory", href: "/resurse/proceduri?q=ssm" },
  { id: "sub-proc-psi",  label: "Proceduri / PSI",     type: "subcategory", href: "/resurse/proceduri?q=psi" },
  { id: "sub-proc-iso",  label: "Proceduri / ISO",     type: "subcategory", href: "/resurse/proceduri?q=iso" },
  { id: "sub-ins-psi",   label: "Instrucțiuni / PSI",  type: "subcategory", href: "/resurse/instructiuni?q=psi" },
  { id: "sub-ins-ssm",   label: "Instrucțiuni / SSM",  type: "subcategory", href: "/resurse/instructiuni?q=ssm" },
  { id: "sub-tmp-rap",   label: "Template / Rapoarte", type: "subcategory", href: "/resurse/template?q=rapoarte" },
  { id: "cat-ssm",       label: "SSM (pagina)",        type: "category",    href: "/resurse/ssm" },
  { id: "cat-psi",       label: "PSI (pagina)",        type: "category",    href: "/resurse/psi" },
  { id: "cat-mediu",     label: "Mediu (pagina)",      type: "category",    href: "/resurse/mediu" },
  { id: "cat-hr",        label: "HR (pagina)",         type: "category",    href: "/resurse/hr" },
  { id: "cat-iso",       label: "ISO (pagina)",        type: "category",    href: "/resurse/iso" },
  { id: "cat-it",        label: "IT & securitate (pagina)", type: "category", href: "/resurse/it" },
  { id: "f-in05",        label: "IN-05 Instrucțiuni PSI evacuare.pdf",  type: "file", href: "/files/IN-05.pdf",  openInNewTab: true },
  { id: "f-iso9001",     label: "ISO 9001 – Manualul calității.pdf",    type: "file", href: "/files/ISO9001-Manual.pdf", openInNewTab: true },
];

const SEARCH_SPITAL: Suggestion[] = [
  ...SEARCH_BASE,
  { id: "sub-proc-mediu", label: "Proceduri / Mediu",  type: "subcategory", href: "/resurse/proceduri?q=mediu" },
  { id: "cat-medical",    label: "Medical (pagina)",   type: "category",    href: "/resurse/medical" },
  { id: "f-po14",         label: "PO-14 Procedură deșeuri medicale.pdf", type: "file", href: "/files/PO-14.pdf", openInNewTab: true },
];

const SEARCH_COMPANIE: Suggestion[] = [
  ...SEARCH_BASE,
  { id: "sub-proc-mediu", label: "Proceduri / Mediu",  type: "subcategory", href: "/resurse/proceduri?q=mediu" },
  { id: "cat-esg",        label: "ESG (pagina)",       type: "category",    href: "/resurse/esg" },
];

const SEARCH_INSTITUTIE: Suggestion[] = [
  ...SEARCH_BASE,
  { id: "cat-guvernanta", label: "Guvernanță (pagina)", type: "category",   href: "/resurse/guvernanta" },
];

/* ================= UI ================= */
const ui = {
  page: { padding: 24, display: "grid", gap: 16, background: "#f7f8fb" } as const,
  title: { fontSize: 28, fontWeight: 700, margin: 0 } as const,
  filters: { display: "grid", gridTemplateColumns: "1fr 180px", gap: 12, alignItems: "center" } as const,
  searchWrap: { position: "relative" } as const,
  searchInput: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px 10px 36px", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.04)" } as const,
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" } as const,
  sortSel: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", background: "#fff" } as const,
  suggBox: { position: "absolute" as const, top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 6, boxShadow: "0 8px 20px rgba(13,27,55,.08)", overflow: "hidden" },
  suggItem: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" } as const,
  suggType: { fontSize: 12, color: "#64748b", marginLeft: 12 } as const,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 } as const,
  card: { border: "1px solid rgba(0,0,0,.06)", borderRadius: 16, background: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,.05)", padding: 20, display: "flex", flexDirection: "column", minHeight: 200 } as const,
  icon: { fontSize: 36, marginBottom: 12 } as const,
  cardTitle: { fontSize: 20, fontWeight: 600, margin: "0 0 8px 0" } as const,
  desc: { fontSize: 14, color: "#475569", flex: 1 } as const,
  btn: { marginTop: 16, border: "1px solid #2563eb", background: "#2563eb", color: "#fff", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 500, textAlign: "center" as const },
};

export default function ResursePage() {
  const router = useRouter();
  const { orgType } = useOrg();

  const CARDS =
    orgType === 'spital' ? CARDS_SPITAL :
    orgType === 'institutie_publica' ? CARDS_INSTITUTIE :
    CARDS_COMPANIE;

  const SEARCH_INDEX =
    orgType === 'spital' ? SEARCH_SPITAL :
    orgType === 'institutie_publica' ? SEARCH_INSTITUTIE :
    SEARCH_COMPANIE;

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"Relevanță" | "Alfabetic">("Relevanță");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredCards = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = [...CARDS];
    if (s) list = list.filter(c => (c.title + " " + c.description).toLowerCase().includes(s));
    if (sort === "Alfabetic") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [q, sort, CARDS]);

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return SEARCH_INDEX
      .map(sug => { const hay = sug.label.toLowerCase(); const score = hay.startsWith(s) ? 3 : hay.includes(s) ? 2 : 0; return { sug, score }; })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.sug.label.localeCompare(b.sug.label))
      .slice(0, 10)
      .map(x => x.sug);
  }, [q, SEARCH_INDEX]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node) && inputRef.current !== e.target) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const go = (sug: Suggestion) => {
    if (sug.type === "file" && sug.openInNewTab) window.open(sug.href, "_blank");
    else router.push(sug.href);
    setOpen(false); setActiveIdx(-1);
  };

  const onSubmit = () => {
    if (!suggestions.length) return;
    if (activeIdx >= 0) return go(suggestions[activeIdx]);
    go(suggestions[0]);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(p => Math.min(p + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(p => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); onSubmit(); }
    else if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); }
  };

  return (
    <div style={ui.page}>
      <h1 style={ui.title}>Resurse</h1>

      <div style={ui.filters}>
        <div style={ui.searchWrap} ref={boxRef}>
          <span style={ui.searchIcon}>🔎</span>
          <input
            ref={inputRef}
placeholder='Cauta (ex: ISO 14001, evacuare PSI, PO-14)...'
value={q}
onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(-1); }}
onKeyDown={onKeyDown}
onFocus={() => q && setOpen(true)}
style={ui.searchInput}
/>
          {open && suggestions.length > 0 && (
            <div style={ui.suggBox}>
              {suggestions.map((sug, i) => (
                <div key={sug.id} onClick={() => go(sug)} onMouseEnter={() => setActiveIdx(i)}
                  style={{ ...ui.suggItem, background: i === activeIdx ? "#f8fafc" : "#fff" }}>
                  <span>{sug.label}</span>
                  <span style={ui.suggType}>
                    {sug.type === "file" ? "fișier" : sug.type === "subcategory" ? "subcategorie" : "categorie"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <select style={ui.sortSel} value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option>Relevanță</option>
          <option>Alfabetic</option>
        </select>
      </div>

      <div style={ui.grid}>
        {filteredCards.map((c) => (
          <div key={c.id} style={ui.card}>
            <div>
              <div style={ui.icon}>{c.icon}</div>
              <h3 style={ui.cardTitle}>{c.title}</h3>
              <p style={ui.desc}>{c.description}</p>
            </div>
            <a href={c.link} style={ui.btn}>Vezi detalii →</a>
          </div>
        ))}
      </div>
    </div>
  );
}