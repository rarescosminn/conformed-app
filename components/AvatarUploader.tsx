"use client";
import { useRef, useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";

export default function AvatarUploader() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { setProfile } = useProfileStore();
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    function pick() { inputRef.current?.click(); }

    async function onFile(file?: File) {
        if (!file) return;
        setErr(null);
        if (!file.type.startsWith("image/")) return setErr("Te rog o imagine.");
        if (file.size > 5 * 1024 * 1024) return setErr("Max 5MB.");

        const fd = new FormData();
        fd.append("file", file);

        setLoading(true);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Eroare la upload.");
            setProfile({ avatarUrl: data.url }); // <- rămâne același API
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button onClick={pick} disabled={loading}
                className="rounded-xl px-3 py-2 text-sm ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50">
                {loading ? "Se încarcă..." : "Încarcă poză"}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])} />
            {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
    );
}
