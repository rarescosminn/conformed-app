// /lib/context/tenant.ts
// Sursă unică pentru hospitalId (din cookie "hospitalId"); fallback H001
export function getHospitalId(): string {
    if (typeof document !== "undefined") {
        const m = document.cookie.match(/(?:^|;\s*)hospitalId=([^;]+)/);
        if (m?.[1]) return decodeURIComponent(m[1]);
    }
    return "H001";
}
