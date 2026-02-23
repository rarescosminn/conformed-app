'use client';

export type TaskStatus = 'deschis' | 'inchis';
export type TaskPriority = 'scazuta' | 'medie' | 'ridicata';

export type Task = {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;     // YYYY-MM-DD
    assignee?: string;
    status: TaskStatus;

    // context
    area: 'administratie';
    subdomain: string | null;   // null => general

    createdAt: string;
    updatedAt: string;
};

const KEY = 'admin_tasks_v1';

function normalize(list: any[]): Task[] {
    return (list || []).map((t: any) => {
        const st = String(t?.status ?? 'deschis').toLowerCase();
        return {
            id: String(t.id ?? Date.now()),
            title: String(t.title ?? ''),
            description: t.description || undefined,
            priority: (t.priority as TaskPriority) ?? 'medie',
            dueDate: t.dueDate || undefined,
            assignee: t.assignee || undefined,
            status: st === 'inchis' ? 'inchis' : 'deschis',             // << normalizare
            area: 'administratie',
            subdomain: t.subdomain === undefined ? null : t.subdomain,  // null pt. general
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || new Date().toISOString(),
        } as Task;
    });
}

function read(): Task[] {
    try {
        const raw = localStorage.getItem(KEY);
        return normalize(raw ? JSON.parse(raw) : []);
    } catch {
        return [];
    }
}
function write(list: Task[]) {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('tasks-changed')); // update cross-components
}

export function getAllTasks(filter?: { area?: 'administratie'; subdomain?: string | null }) {
    const list = read();
    if (!filter) return list;
    return list.filter(t =>
        (filter.area ? t.area === filter.area : true) &&
        (filter.subdomain === undefined ? true : t.subdomain === filter.subdomain)
    );
}

export function addTask(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const now = new Date().toISOString();
    const task: Task = { ...input, id: String(Date.now()), createdAt: now, updatedAt: now };
    const list = read();
    list.unshift(task);
    write(list);
    return task;
}

export function updateTask(id: string, patch: Partial<Task>) {
    const list = read();
    const i = list.findIndex(t => t.id === id);
    if (i >= 0) {
        list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
        write(list);
    }
}

export function removeTask(id: string) {
    write(read().filter(t => t.id !== id));
}

/* ---- metrici carduri ---- */
function isOpen(t: Task) { return t.status !== 'inchis'; }
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function countOpenTasks(filter: { area: 'administratie'; subdomain: string | null }) {
    return getAllTasks(filter).filter(isOpen).length;
}
export function countTodoToday(filter: { area: 'administratie'; subdomain: string | null }) {
    const today = ymd(new Date());
    return getAllTasks(filter).filter(t => isOpen(t) && t.dueDate === today).length;
}
export function countTodoLate(filter: { area: 'administratie'; subdomain: string | null }) {
    const today = ymd(new Date());
    return getAllTasks(filter).filter(t => isOpen(t) && (t.dueDate ?? '') < today).length;
}
