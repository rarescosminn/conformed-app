// lib/notifications.ts
export type Notification = {
    id: string;
    to: string;
    title: string;
    body: string;
    at: string;
    link?: string;
};

const KEY = "notifications_v1";

export function pushNotifications(msgs: Notification[]) {
    if (typeof window === "undefined") return;
    const current: Notification[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [...msgs, ...current];
    localStorage.setItem(KEY, JSON.stringify(next));
    msgs.forEach(m => alert(`🔔 ${m.to}\n${m.title}\n${m.body}`));
}

export function listNotifications(): Notification[] {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
