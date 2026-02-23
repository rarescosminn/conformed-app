// lib/ssm/store.ts
export type ID = string;

/* ===== Instruiri ===== */
export type TrainingRow = {
    id: ID;
    title: string;          // ex: "Instruire SSM trimestrială T3"
    date: string;           // YYYY-MM-DD
    department: string;     // ex: "ATI"
    planned: string[];      // nume planificate (din import HR)
    present: string[];      // nume prezente (completat la încărcarea dovezii)
    absentsMotivated: string[]; // bifați ca "motivați"
    proofUrl?: string;      // URL obiect (local)
    finalized: boolean;     // devine true doar după proof
    createdAt: string;
};

export type TrainingState = {
    trainings: TrainingRow[];
};

const TRAINING_KEY = 'ssmpsi_trainings_v1';

function readTrainings(): TrainingState {
    try { return JSON.parse(localStorage.getItem(TRAINING_KEY) || '{"trainings":[]}'); }
    catch { return { trainings: [] }; }
}
function writeTrainings(s: TrainingState) {
    localStorage.setItem(TRAINING_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event('ssmpsi-change'));
}

export function listTrainings(): TrainingRow[] { return readTrainings().trainings; }
export function upsertTraining(row: TrainingRow) {
    const s = readTrainings();
    const i = s.trainings.findIndex(t => t.id === row.id);
    if (i >= 0) s.trainings[i] = row; else s.trainings.unshift(row);
    writeTrainings(s);
}
export function importCSVRows(csv: string) {
    // CSV coloane simple: Nume;Departament;Titlu instruire;Data(YYYY-MM-DD)
    // Grupăm după (titlu+data+departament)
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    type Key = string;
    const map = new Map<Key, TrainingRow>();
    for (const ln of lines.slice(1)) {
        const [name, dep, title, date] = ln.split(';').map(s => (s || '').trim());
        const key = `${title}|${date}|${dep}`;
        const exist = map.get(key) || {
            id: crypto.randomUUID(), title, date, department: dep,
            planned: [], present: [], absentsMotivated: [], finalized: false, createdAt: new Date().toISOString()
        } as TrainingRow;
        if (name) exist.planned.push(name);
        map.set(key, exist);
    }
    const s = readTrainings();
    s.trainings = [...Array.from(map.values()), ...s.trainings];
    writeTrainings(s);
}
export function percentCompliance(period: { y: number, m?: number }): number {
    const all = listTrainings().filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === period.y && (period.m == null || d.getMonth() === period.m);
    });
    if (!all.length) return 0;
    const ok = all.filter(t => t.finalized || (t.present.length + t.absentsMotivated.length) >= t.planned.length).length;
    return Math.round((ok / all.length) * 100);
}

/* ===== Echipamente ===== */
export type Equip = {
    id: ID;
    type: 'stingator' | 'hidrant' | 'trusa' | 'alarma' | 'alt';
    code: string;           // ID intern
    location: string;
    lastCheck: string;      // YYYY-MM-DD
    dueDate: string;        // YYYY-MM-DD
    notes?: string;
};
export type EquipState = { items: Equip[] };
const EQUIP_KEY = 'ssmpsi_equips_v1';
function readEquips(): EquipState { try { return JSON.parse(localStorage.getItem(EQUIP_KEY) || '{"items":[]}'); } catch { return { items: [] }; } }
function writeEquips(s: EquipState) { localStorage.setItem(EQUIP_KEY, JSON.stringify(s)); window.dispatchEvent(new Event('ssmpsi-change')); }
export function listEquips(): Equip[] { return readEquips().items; }
export function upsertEquip(e: Equip) {
    const s = readEquips(); const i = s.items.findIndex(x => x.id === e.id);
    if (i >= 0) s.items[i] = e; else s.items.unshift(e);
    writeEquips(s);
}
export function equipStatus(e: Equip): 'valid' | 'expira' | 'expirat' {
    const today = new Date(); const due = new Date(e.dueDate);
    const days = Math.floor((+due - +today) / 86400000);
    if (days < 0) return 'expirat';
    if (days <= 30) return 'expira';
    return 'valid';
}

/* ===== Incidente / Accidente ===== */
export type Incident = {
    id: ID;
    date: string;
    location: string;
    person: string;
    description: string;
    status: 'raportat' | 'validat_sef' | 'clasificat';
    managerName?: string;
    classification?: 'incident' | 'accident_usor' | 'grav' | 'mortal';
    createdAt: string;
};
const INC_KEY = 'ssmpsi_incidents_v1';
type IncState = { list: Incident[] };
function readInc(): IncState { try { return JSON.parse(localStorage.getItem(INC_KEY) || '{"list":[]}'); } catch { return { list: [] }; } }
function writeInc(s: IncState) { localStorage.setItem(INC_KEY, JSON.stringify(s)); window.dispatchEvent(new Event('ssmpsi-change')); }
export function listIncidents(): Incident[] { return readInc().list; }
export function upsertIncident(i: Incident) {
    const s = readInc(); const idx = s.list.findIndex(x => x.id === i.id);
    if (idx >= 0) s.list[idx] = i; else s.list.unshift(i);
    writeInc(s);
}
