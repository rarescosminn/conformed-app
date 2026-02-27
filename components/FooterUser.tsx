// components/FooterUser.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const IMG_MAX_BYTES = 2 * 1024 * 1024;
const IMG_ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function FooterUser() {
    const [avatar, setAvatar] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const lastObjectUrl = useRef<string | null>(null);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [userEmail, setUserEmail] = useState<string>('');

useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
    });
}, []);

    useEffect(() => {
        return () => {
            if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
        };
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        const file = e.target.files?.[0];
        if (!file) return;
        if (!IMG_ALLOWED.has(file.type)) return setError("Format neacceptat. Folosește JPG/PNG/WebP.");
        if (file.size > IMG_MAX_BYTES) return setError("Imagine prea mare. Limită: 2 MB.");
        if (lastObjectUrl.current) URL.revokeObjectURL(lastObjectUrl.current);
        const url = URL.createObjectURL(file);
        lastObjectUrl.current = url;
        setAvatar(url);
        (e.target as HTMLInputElement).value = "";
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div
            className="sb__footer"
            aria-label="User info"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderTop: "1px solid rgba(0,0,0,.06)", flexWrap: "wrap" }}
        >
            <label
                style={{ position: "relative", width: 100, height: 100, borderRadius: "50%", overflow: "hidden", cursor: "pointer", transform: "scale(0.75)", transformOrigin: "left center", boxShadow: avatar ? "0 4px 12px rgba(0,0,0,.18)" : "none", border: avatar ? "3px solid var(--accent, #3b82f6)" : "2px dashed #9ca3af", background: avatar ? "transparent" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 16, fontWeight: 600, textAlign: "center", padding: "4px" }}
                title={avatar ? "Schimbă poza" : "Încarcă poza"}
            >
                {avatar ? (
                    <>
                        <Image src={avatar} alt="User photo" fill sizes="48px" style={{ objectFit: "cover" }} unoptimized />
                        <div className="hover-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .25s", fontWeight: 600, fontSize: 10 }}>Schimbă</div>
                    </>
                ) : (
                    <span>Alege poză</span>
                )}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
            </label>

            <div style={{ flex: 1 }}>
                <div style={{ color: "#6b7280", fontSize: 16 }}>Logged in as</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{userEmail || 'Management'}</div>
            </div>

            <button
                onClick={handleLogout}
                style={{ background: "transparent", border: "1px solid rgba(0,0,0,.15)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#6b7280" }}
            >
                Ieșire
            </button>

            {!!error && <div style={{ color: "#b91c1c", fontSize: 12 }}>{error}</div>}

            <style jsx>{`label:hover .hover-overlay { opacity: 1; }`}</style>
        </div>
    );
}