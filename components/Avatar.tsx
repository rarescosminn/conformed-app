"use client";
import { useMemo } from "react";
import { useProfileStore } from "@/store/useProfileStore";

function hash(str: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seedToGradient(seed: string) {
    const h = hash(seed);
    const h1 = h % 360;
    const h2 = (h * 7) % 360;
    const s = 65 + (h % 20);   // 65–84
    const l1 = 55;
    const l2 = 45;
    return `linear-gradient(135deg, hsl(${h1} ${s}% ${l1}%) 0%, hsl(${h2} ${s}% ${l2}%) 100%)`;
}

function initials(name?: string) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase() || a.toUpperCase() || "U";
}

type Props = {
    size?: number; // px
    className?: string;
    withHoverGlow?: boolean;
};

export default function Avatar({ size = 96, className = "", withHoverGlow = true }: Props) {
    const { name, email, avatarUrl, avatarSeed } = useProfileStore();

    const seed = avatarSeed || email || name || "user";
    const styleGradient = useMemo(() => ({ backgroundImage: seedToGradient(seed) }), [seed]);
    const label = initials(name);

    return (
        <div
            className={`relative inline-block ${withHoverGlow ? "group" : ""}`}
            style={{ width: size, height: size }}
        >
            {/* Aura glow – funcționează și pentru imagini, și pentru fallback */}
            <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 rounded-full opacity-0 blur-lg transition
                    ${withHoverGlow ? "group-hover:opacity-100" : ""}`}
                style={{
                    backgroundImage: seedToGradient(seed),
                    filter: "saturate(1.1) blur(14px)",
                    willChange: "opacity, filter",
                }}
            />

            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name || "Avatar"}
                    className={`relative z-[1] block h-full w-full rounded-full object-cover ring-1 ring-black/5 shadow`}
                    draggable={false}
                />
            ) : (
                <div
                    className={`relative z-[1] flex h-full w-full items-center justify-center rounded-full text-white ring-1 ring-black/5 shadow ${className}`}
                    style={styleGradient}
                >
                    <span className="select-none font-semibold" style={{ fontSize: Math.floor(size * 0.36) }}>
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
}
