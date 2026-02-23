// lib/suggestions/store.ts
export type Area = 'administratie';

export type Suggestion = {
    id: string;
    type: 'sugestie' | 'observatie';
    message: string;
    isAnonymous: boolean;
    name?: string;
    email?: string;
    area: Area;                 // 'administratie'
    subdomain?: string | null;  // null => general
    createdAt: string;
};

const KEY = 'hc:suggestions:v1';

function load(): Suggestion[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Suggestion[]) : [];
    } catch {
        return [];
    }
}

function save(list: Suggestion[]) {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('suggestions:updated'));
}

export function addSuggestion(input: Omit<Suggestion, 'id' | 'createdAt'>) {
    const list = load();
    list.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input });
    save(list);
}

export function countSuggestions(filter?: { area?: Area; subdomain?: string | null }) {
    const list = load();
    if (!filter) return list.length;
    return list.filter(s =>
        (filter.area ? s.area === filter.area : true) &&
        (filter.subdomain !== undefined ? (s.subdomain ?? null) === (filter.subdomain ?? null) : true)
    ).length;
}
