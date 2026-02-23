// /lib/ssmpsi-bridge.ts
export type Keys =
    | "eip" | "evacuari" | "avize" | "permise" | "riscuri"
    | "audite" | "documente" | "kpi";

const LS = {
    eip: "ssmpsi::eip",
    evacuari: "ssmpsi::evacuari",
    avize: "ssmpsi::avize",
    permise: "ssmpsi::permise",
    riscuri: "ssmpsi::riscuri",
    audite: "ssmpsi::audite",
    documente: "ssmpsi::documente",
    kpi: "ssmpsi::kpi",
} as const;

export const read = <T = any>(key: Keys): T[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LS[key]);
        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch { return []; }
};

// ——— agregatori pentru carduri ———
export const stats = {
    eip() {
        const list = read<any>("eip");
        const total = list.length;
        const exp30 = list.filter((i: any) =>
            i.dataExpirare && (new Date(i.dataExpirare).getTime() - Date.now()) / 86400000 <= 30
        ).length;
        return { total, exp30 };
    },
    evacuari() {
        const list = read<any>("evacuari");
        const ord = [...list].sort((a: any, b: any) => new Date(a.dataPlanificata).getTime() - new Date(b.dataPlanificata).getTime());
        const upcoming = ord.find((x: any) => new Date(x.dataPlanificata).getTime() >= Date.now());
        const lastTwo = [...list].sort((a: any, b: any) => new Date(b.dataPlanificata).getTime() - new Date(a.dataPlanificata).getTime()).slice(0, 2);
        return { upcoming, lastTwo };
    },
    avize() {
        const list = read<any>("avize");
        const total = list.length;
        const exp60 = list.filter((a: any) => (new Date(a.dataExpirare).getTime() - Date.now()) / 86400000 <= 60).length;
        return { total, exp60 };
    },
    permise() {
        const list = read<any>("permise");
        const now = Date.now();
        const activeAzi = list.filter((p: any) => {
            const start = new Date(p.dataStart).getTime();
            const stop = p.dataStop ? new Date(p.dataStop).getTime() : undefined;
            const inInterval = stop ? now >= start && now <= stop : now >= start;
            return p.activ && inInterval;
        }).length;
        return { activeAzi };
    },
    riscuri() {
        const list = read<any>("riscuri");
        const deschise = list.filter((r: any) => r.status !== "inchis").length;
        const intarziate = list.filter((r: any) => r.termen && new Date(r.termen).getTime() < Date.now() && r.status !== "inchis").length;
        return { deschise, intarziate };
    },
    audite() {
        const list = read<any>("audite");
        const viitoare = list.filter((a: any) => new Date(a.data).getTime() >= Date.now()).length;
        const nc = list.reduce((acc: number, a: any) => acc + (a.neconformitatiDeschise || 0), 0);
        return { viitoare, nc };
    },
    documente() {
        const list = read<any>("documente");
        const total = list.length;
        const recent = list.filter((d: any) => {
            if (!d.dataUpload) return false;
            // “recent” = încărcate în ultimele 30 de zile:
            return (Date.now() - new Date(d.dataUpload).getTime()) / 86400000 <= 30;
        }).length;
        return { total, recent };
    },
    kpi() {
        const list = read<any>("kpi");
        const total = list.length;
        const recent = list.filter((r: any) => {
            if (!r.dataGenerare) return false;
            return (Date.now() - new Date(r.dataGenerare).getTime()) / 86400000 <= 30;
        }).length;
        return { total, recent };
    },
};

// ——— event bus minimal pentru “refresh fără reload” ———
const EVT = "ssmpsi:update";

export const notifyUpdate = (key?: Keys) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
};

export const onDataChange = (cb: (key?: Keys) => void) => {
    const h = (e: Event) => cb((e as CustomEvent).detail?.key);
    window.addEventListener(EVT, h as any);
    return () => window.removeEventListener(EVT, h as any);
};
