"use client";

import React, { useMemo, useState } from "react";
import {
    Approvals, ApprovalItem, ApprovalKind, ApprovalStatus, Role,
    sweepToArchive, resubmit, archiveNow, REJECT_RETENTION_DAYS
} from "../../lib/approvals";
import { moveApprovalIntoResources, mapCategoryToResurseKey } from "../../lib/resources";
import { pushNotifications } from "../../lib/notifications";

/* ===== UI ===== */
const ui = {
    page: { padding: 24, display: "grid", gap: 16, background: "#f7f8fb" } as React.CSSProperties,
    title: { fontSize: 28, fontWeight: 700, margin: 0 } as React.CSSProperties,

    top: { display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" } as React.CSSProperties,
    tabs: { display: "flex", gap: 8, flexWrap: "wrap" } as React.CSSProperties,
    tab: (active: boolean): React.CSSProperties => ({
        border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
        background: active ? "#2563eb" : "#fff",
        color: active ? "#fff" : "#0f172a",
        padding: "8px 12px",
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 600,
    }),

    filters: { display: "flex", gap: 8, alignItems: "center" } as React.CSSProperties,
    input: { border: "1px solid #e5e7eb", padding: "9px 12px", borderRadius: 12, background: "#fff" } as React.CSSProperties,
    select: { border: "1px solid #e5e7eb", padding: "9px 12px", borderRadius: 12, background: "#fff" } as React.CSSProperties,

    stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 10 } as React.CSSProperties,
    stat: { background: "#fff", border: "1px solid #eef2f7", borderRadius: 12, padding: 12, textAlign: "center" } as React.CSSProperties,
    statNum: { fontSize: 22, fontWeight: 700 } as React.CSSProperties,

    card: (status: ApprovalStatus): React.CSSProperties => {
        let bg = "#fff";
        let border = "1px solid rgba(0,0,0,.08)";
        if (status === "changes") { bg = "#FFF7ED"; border = "1px solid #FED7AA"; }      // orange
        if (status === "rejected") { bg = "#FEF2F2"; border = "1px solid #FECACA"; }     // red
        return { background: bg, border, borderRadius: 16, boxShadow: "0 8px 20px rgba(13,27,55,.04)", display: "flex", flexDirection: "column" };
    },

    body: { padding: 16, display: "grid", gap: 8 } as React.CSSProperties,
    titleSmall: { margin: 0, fontSize: 18, fontWeight: 650 } as React.CSSProperties,
    meta: { color: "#475569", fontSize: 13 } as React.CSSProperties,

    badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" } as React.CSSProperties,
    badge: (bg: string, fg: string, br: string): React.CSSProperties => ({ background: bg, color: fg, border: `1px solid ${br}`, padding: "2px 8px", borderRadius: 999, fontSize: 12 }),
    footer: { padding: 12, borderTop: "1px solid #eef2f7", background: "#fcfcfd" } as React.CSSProperties,
    actions: { display: "flex", gap: 8, flexWrap: "wrap" } as React.CSSProperties,
    btn: { border: "1px solid #e5e7eb", background: "#fff", padding: "9px 12px", borderRadius: 10, cursor: "pointer", flex: 1 } as React.CSSProperties,
    btnOk: { border: "none", background: "#16a34a", color: "#fff", padding: "9px 12px", borderRadius: 10, cursor: "pointer", flex: 1 } as React.CSSProperties,
    btnWarn: { border: "none", background: "#f59e0b", color: "#fff", padding: "9px 12px", borderRadius: 10, cursor: "pointer", flex: 1 } as React.CSSProperties,
    btnDanger: { border: "none", background: "#e11d48", color: "#fff", padding: "9px 12px", borderRadius: 10, cursor: "pointer", flex: 1 } as React.CSSProperties,

    history: { padding: "0 16px 16px", borderTop: "1px dashed #e5e7eb", display: "grid", gap: 6 } as React.CSSProperties,
    histRow: { fontSize: 12, color: "#475569" } as React.CSSProperties,

    // modal
    overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 } as React.CSSProperties,
    modal: { width: "min(720px, 92vw)", background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 24px 60px rgba(0,0,0,.2)", overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr auto" } as React.CSSProperties,
    modalHeader: { padding: "16px 20px", borderBottom: "1px solid #eef2f7", fontWeight: 700 } as React.CSSProperties,
    modalBody: { padding: 20, display: "grid", gap: 10 } as React.CSSProperties,
    modalFooter: { padding: 16, borderTop: "1px solid #eef2f7", display: "flex", gap: 10, justifyContent: "flex-end" } as React.CSSProperties,
    textarea: { width: "100%", minHeight: 140, padding: 12, resize: "vertical", borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", fontSize: 14 } as React.CSSProperties,
    btnGhost: { border: "1px solid #e5e7eb", background: "#fff", padding: "8px 12px", borderRadius: 10, cursor: "pointer" } as React.CSSProperties,
    btnPrimary: { border: "none", background: "#2563eb", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer" } as React.CSSProperties,
};

type Status = ApprovalStatus;
const STATUS_LABEL: Record<Status, string> = {
    pending: "În așteptare",
    approved: "Aprobat",
    rejected: "Respins",
    changes: "Revizie solicitată",
};
const KIND_LABEL: Record<ApprovalKind, string> = {
    document: "Documente",
    report: "Rapoarte",
    revision: "Revizii",
    request: "Cereri",
};
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("ro-RO") : "-");
const RES_LABEL: Record<string, string> = { iso: "ISO", ssm: "SSM", psi: "PSI", mediu: "Mediu", hr: "HR", it: "IT", medical: "Medical", proceduri: "Proceduri" };

/* ===== Modal ===== */
type ModalMode = "approved" | "changes" | "rejected";
function ReviewModal({
    open, mode, itemTitle, note, setNote, onCancel, onConfirm
}: { open: boolean; mode: ModalMode; itemTitle: string; note: string; setNote: (v: string) => void; onCancel: () => void; onConfirm: () => void; }) {
    if (!open) return null;
    const modalTitle = mode === "approved" ? `Aprobă documentul: „${itemTitle}”` : mode === "changes" ? `Trimite la revizie: „${itemTitle}”` : `Respinge documentul: „${itemTitle}”`;
    const label = mode === "approved" ? "Observații (opțional)" : "Observații (obligatoriu)";
    const placeholder = mode === "approved" ? "Poți adăuga o notă de aprobare (opțional)." : mode === "changes" ? "Descrie ce trebuie revizuit." : "Precizează motivul respingerii.";
    return (
        <div style={ui.overlay}>
            <div style={ui.modal} role="dialog" aria-modal="true" aria-label={modalTitle}>
                <div style={ui.modalHeader}>{modalTitle}</div>
                <div style={ui.modalBody}>
                    <label style={{ fontSize: 13, color: "#475569" }}>{label}</label>
                    <textarea style={ui.textarea} value={note} placeholder={placeholder} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div style={ui.modalFooter}>
                    <button style={ui.btnGhost} onClick={onCancel}>Anulează</button>
                    <button style={ui.btnPrimary} onClick={onConfirm}>Confirmă</button>
                </div>
            </div>
        </div>
    );
}

/* ===== Card ===== */
function ApprovalCard({
    item, onOpenApprove, onOpenChanges, onOpenReject, onResubmit, onArchiveNow
}: {
    item: ApprovalItem;
    onOpenApprove: (id: string) => void;
    onOpenChanges: (id: string) => void;
    onOpenReject: (id: string) => void;
    onResubmit: (id: string) => void;
    onArchiveNow: (id: string) => void;
}) {
    const badgeStatus = (() => {
        switch (item.status) {
            case "approved": return ui.badge("#dcfce7", "#166534", "#bbf7d0");
            case "rejected": return ui.badge("#fee2e2", "#991b1b", "#fecaca");
            case "changes": return ui.badge("#ffedd5", "#9a3412", "#fed7aa");
            default: return ui.badge("#e0f2fe", "#075985", "#bae6fd");
        }
    })();
    const isRevision = item.kind === "revision";
    const daysLeft = (() => {
        if (item.status !== "rejected" || !item.archiveAt) return null;
        const ms = Date.parse(item.archiveAt) - Date.now();
        const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
        return d < 0 ? 0 : d;
    })();

    return (
        <article style={ui.card(item.status)}>
            <div style={ui.body}>
                <h3 style={ui.titleSmall}>{item.title}</h3>
                <div style={ui.badgeRow}>
                    <span style={ui.badge("#eef2ff", "#3730a3", "#c7d2fe")}>{KIND_LABEL[item.kind]}</span>
                    <span style={ui.badge("#f1f5f9", "#0f172a", "#e2e8f0")}>{item.category}</span>
                    <span style={badgeStatus}>{STATUS_LABEL[item.status]}</span>
                </div>

                {isRevision && (
                    <div style={ui.meta}>
                        Versiune curentă: <b>{item.baseVersion}</b> • Propusă: <b>{item.proposedVersion}</b>
                        <br />Schimbări: {item.changeSummary || "-"}
                    </div>
                )}

                {item.kind === "request" && (
                    <div style={ui.meta}>Tip cerere: <b>{item.requestType}</b> — Motivație: {item.justification}</div>
                )}

                <div style={ui.meta}>
                    Ref: {item.refId || "-"} • Trimis de: {item.submittedBy} • Către: <b>{item.assignee}</b>
                </div>
                <div style={ui.meta}>Trimis la: {fmt(item.submittedAt)} {item.dueAt ? `• Termen: ${fmt(item.dueAt)}` : ""}</div>

                {item.status === "rejected" && (
                    <div style={{ color: "#991b1b", fontSize: 13 }}>
                        Document respins • va fi arhivat automat în <b>{daysLeft}</b> zile (retenție {REJECT_RETENTION_DAYS} zile).
                    </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    {item.previewUrl && <a href={item.previewUrl} target="_blank" rel="noreferrer" style={ui.btn}>👁 Previzualizează</a>}
                    {item.downloadUrl && <a href={item.downloadUrl} target="_blank" rel="noreferrer" style={ui.btn}>⬇ Descarcă</a>}
                </div>
            </div>

            <div style={ui.footer}>
                <div style={ui.actions}>
                    <button style={ui.btnOk} onClick={() => onOpenApprove(item.id)} disabled={item.status === "approved"}>Aprobă</button>
                    <button style={ui.btnWarn} onClick={() => onOpenChanges(item.id)} disabled={item.status === "changes"}>Trimite la revizie</button>
                    <button style={ui.btnDanger} onClick={() => onOpenReject(item.id)} disabled={item.status === "rejected"}>Respinge</button>
                </div>

                {item.status === "rejected" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button style={ui.btn} onClick={() => onResubmit(item.id)}>↻ Retrimite</button>
                        <button style={{ ...ui.btnDanger, flex: "none" }} onClick={() => onArchiveNow(item.id)}>🗄 Arhivează acum</button>
                    </div>
                )}
            </div>

            <div style={ui.history}>
                {item.history.slice().reverse().map((h, i) => (
                    <div key={i} style={ui.histRow}>
                        <b>{fmt(h.at)}</b> — {h.by}: <i>{h.action}</i> {h.note ? `— ${h.note}` : ""}
                    </div>
                ))}
            </div>
        </article>
    );
}

/* ===== Pagina ===== */
export default function ApprovalsPage() {
    const currentUser: { role: Role; name: string } = { role: "Admin", name: "Administrator" };

    // curățăm/archivăm automat la load
    const [items, setItems] = useState<ApprovalItem[]>(sweepToArchive());
    const [tab, setTab] = useState<ApprovalKind>("document");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"Toate" | ApprovalStatus>("Toate");

    const filtered = useMemo(() => {
        return items
            .filter(i => i.kind === tab)
            .filter(i => status === "Toate" ? true : i.status === status)
            .filter(i => {
                const s = q.trim().toLowerCase();
                if (!s) return true;
                return (i.title + " " + i.category + " " + (i.refId || "") + " " + (i.submittedBy || "") + " " + (i.assignee || "")).toLowerCase().includes(s);
            })
            .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
    }, [items, tab, q, status]);

    const stats = useMemo(() => {
        const k = items.filter(i => i.kind === tab);
        return {
            total: k.length,
            pending: k.filter(i => i.status === "pending").length,
            approved: k.filter(i => i.status === "approved").length,
            rejected: k.filter(i => i.status === "rejected").length,
            changes: k.filter(i => i.status === "changes").length,
        };
    }, [items, tab]);

    const RES_NAME = (cat: string) => RES_LABEL[mapCategoryToResurseKey(cat)] || mapCategoryToResurseKey(cat);

    /* ---- Notif helper ---- */
    const notifyAuthors = (it: ApprovalItem, title: string, body: string) => {
        const list = (it.authors && it.authors.length ? it.authors : [it.submittedBy]);
        pushNotifications(list.map((name: string) => ({
            id: `${it.id}-${Date.now()}-${name}`,
            to: name,
            title, body,
            at: new Date().toISOString(),
            link: "#",
        })));
    };

    /* ---- Modale ---- */
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("changes");
    const [modalItem, setModalItem] = useState<ApprovalItem | null>(null);
    const [modalNote, setModalNote] = useState("");

    const openApprove = (id: string) => { const it = Approvals.get(id); if (!it) return; setModalItem(it); setModalMode("approved"); setModalNote(""); setModalOpen(true); };
    const openChanges = (id: string) => { const it = Approvals.get(id); if (!it) return; setModalItem(it); setModalMode("changes"); setModalNote(""); setModalOpen(true); };
    const openReject = (id: string) => { const it = Approvals.get(id); if (!it) return; setModalItem(it); setModalMode("rejected"); setModalNote(""); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setModalItem(null); setModalNote(""); };

    const confirmModal = () => {
        if (!modalItem) return;
        const note = (modalNote || "").trim();

        if (modalMode === "approved") {
            const next = Approvals.updateStatus(modalItem.id, "approved", currentUser.name, note || undefined);
            setItems(next);
            moveApprovalIntoResources(modalItem, note || undefined);
            const sec = RES_NAME(modalItem.category);
            notifyAuthors(modalItem, "Aprobat", `„${modalItem.title}” a fost aprobat de ${currentUser.name} și publicat în Resurse → ${sec}.`);
            pushNotifications([{
                id: `${modalItem.id}-${Date.now()}-self-approved`,
                to: currentUser.name,
                title: "Ați aprobat un document",
                body: `Ați aprobat „${modalItem.title}” (autor: ${modalItem.submittedBy}). Se găsește în Resurse → ${sec}.`,
                at: new Date().toISOString(),
            }]);
        } else if (modalMode === "changes") {
            if (!note) { alert("Te rog completează ce trebuie revizuit."); return; }
            const next = Approvals.addHistory(modalItem.id, currentUser.name, "changes", note);
            setItems(next);
            notifyAuthors(modalItem, "Revizie solicitată", `„${modalItem.title}” necesită revizie. Observație: ${note}`);
        } else {
            if (!note) { alert("Te rog completează motivul respingerii."); return; }
            const next = Approvals.updateStatus(modalItem.id, "rejected", currentUser.name, note);
            setItems(next);
            notifyAuthors(modalItem, "Respins", `„${modalItem.title}” a fost respins. Motiv: ${note}`);
            pushNotifications([{
                id: `${modalItem.id}-${Date.now()}-self-rejected`,
                to: currentUser.name,
                title: "Ați respins un document",
                body: `Ați respins „${modalItem.title}”. Motiv: ${note}`,
                at: new Date().toISOString(),
            }]);
        }
        closeModal();
    };

    /* ---- Stand-by actions ---- */
    const onResubmit = (id: string) => {
        const it = Approvals.get(id); if (!it) return;
        const next = resubmit(id, currentUser.name, "Retrimis de autor");
        setItems(next);
    };
    const onArchiveNow = (id: string) => {
        if (!confirm("Arhivați acum acest document respins?")) return;
        const next = archiveNow(id, currentUser.name, "Arhivat manual");
        setItems(next);
    };

    return (
        <div style={ui.page}>
            <h1 style={ui.title}>Aprobări</h1>

            <div style={ui.top}>
                <div style={ui.tabs}>
                    {(["document", "report", "revision", "request"] as ApprovalKind[]).map(k => (
                        <button key={k} style={ui.tab(tab === k)} onClick={() => setTab(k)}>{KIND_LABEL[k]}</button>
                    ))}
                </div>

                <div style={ui.filters}>
                    <input placeholder="Caută (titlu, categorie, ref, persoană)…" value={q} onChange={e => setQ(e.target.value)} style={ui.input} />
                    <select value={status} onChange={e => setStatus(e.target.value as any)} style={ui.select}>
                        <option>Toate</option>
                        <option value="pending">În așteptare</option>
                        <option value="approved">Aprobate</option>
                        <option value="changes">Revizie solicitată</option>
                        <option value="rejected">Respinse</option>
                    </select>
                </div>
            </div>

            <div style={ui.stats}>
                <div style={ui.stat}><div>Total</div><div style={ui.statNum}>{stats.total}</div></div>
                <div style={ui.stat}><div>În așteptare</div><div style={ui.statNum}>{stats.pending}</div></div>
                <div style={ui.stat}><div>Aprobate</div><div style={ui.statNum}>{stats.approved}</div></div>
                <div style={ui.stat}><div>Revizie</div><div style={ui.statNum}>{stats.changes}</div></div>
                <div style={ui.stat}><div>Respinse</div><div style={ui.statNum}>{stats.rejected}</div></div>
            </div>

            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
                {filtered.length === 0 ? (
                    <div style={{ ...ui.card("pending"), padding: 16, color: "#64748b" }}>Nimic în această categorie.</div>
                ) : (
                    filtered.map(item => (
                        <ApprovalCard
                            key={item.id}
                            item={item}
                            onOpenApprove={openApprove}
                            onOpenChanges={openChanges}
                            onOpenReject={openReject}
                            onResubmit={onResubmit}
                            onArchiveNow={onArchiveNow}
                        />
                    ))
                )}
            </div>

            <ReviewModal
                open={modalOpen}
                mode={modalMode}
                itemTitle={modalItem?.title || ""}
                note={modalNote}
                setNote={setModalNote}
                onCancel={closeModal}
                onConfirm={confirmModal}
            />
        </div>
    );
}
