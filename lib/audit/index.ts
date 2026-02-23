// /lib/audit/index.ts
type AuditEvent = {
    scope: "hospital" | "site";
    hospitalId: string;
    siteCode?: string;
    action: string;
    details?: Record<string, unknown>;
};

export function audit(ev: AuditEvent) {
    try {
        // Stub local: trimitem în console. În producție -> API.
        // eslint-disable-next-line no-console
        console.info("[AUDIT]", new Date().toISOString(), ev);
    } catch {
        // ignore
    }
}
