"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";

const IMG_MAX_BYTES = 2 * 1024 * 1024;
const IMG_ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const ADMIN_EMAIL = "contact@econformed.io";

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------
function getInitials(nume?: string, prenume?: string, email?: string): string {
  if (nume && prenume) {
    return `${prenume.charAt(0)}${nume.charAt(0)}`.toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    const parts = local.split(".");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return "??";
}

function formatDisplayName(nume?: string, prenume?: string, email?: string): string {
  if (nume && prenume) {
    return `${prenume} ${nume.toUpperCase()}`;
  }
  if (email) {
    const local = email.split("@")[0];
    const parts = local.split(".");
    if (parts.length >= 2) {
      const p = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const n = parts[1].toUpperCase();
      return `${p} ${n}`;
    }
    return local;
  }
  return "—";
}

// ----------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------
export default function FooterUser() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [nume, setNume] = useState<string>("");
  const [prenume, setPrenume] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showDemoMsg, setShowDemoMsg] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdmin = userEmail === ADMIN_EMAIL;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user?.email) {
        const email = data.user.email;
        setUserEmail(email);

        // Încarcă avatar din localStorage
        const saved = localStorage.getItem(`avatar_${email}`);
        if (saved) setAvatar(saved);

        // Încearcă să încarce nume din user_profiles
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("nume, prenume")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profile?.nume) setNume(profile.nume);
        if (profile?.prenume) setPrenume(profile.prenume);
      }
    });
  }, []);

  if (pathname === "/login") return null;

  const initials = getInitials(nume, prenume, userEmail);
  const displayName = formatDisplayName(nume, prenume, userEmail);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMG_ALLOWED.has(file.type)) return setError("Format neacceptat.");
    if (file.size > IMG_MAX_BYTES) return setError("Max 2MB.");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      if (userEmail) localStorage.setItem(`avatar_${userEmail}`, base64);
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = "";
  };

  const handleAvatarClick = () => {
    if (!isAdmin) {
      setShowDemoMsg(true);
      setTimeout(() => setShowDemoMsg(false), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      className="sb__footer"
      aria-label="User info"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px", borderTop: "1px solid rgba(0,0,0,.06)",
        flexWrap: "wrap", position: "relative",
      }}
    >
      {/* AVATAR / INIȚIALE */}
      {isAdmin ? (
        // Admin — upload activ
        <label
          style={avatarWrapStyle(!!avatar)}
          title="Schimbă poza"
        >
          {avatar ? (
            <>
              <Image src={avatar} alt="User photo" fill sizes="36px" style={{ objectFit: "cover" }} unoptimized />
              <div style={hoverOverlayStyle}>✎</div>
            </>
          ) : (
            <span style={initialsStyle}>{initials}</span>
          )}
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
        </label>
      ) : (
        // Alți useri — inițiale + mesaj demo la click
        <div
          style={avatarWrapStyle(false)}
          onClick={handleAvatarClick}
          title="Foto profil indisponibil în versiunea demo"
        >
          <span style={initialsStyle}>{initials}</span>
        </div>
      )}

      {/* MESAJ DEMO */}
      {showDemoMsg && (
        <div style={{
          position: "absolute", bottom: "100%", left: 0, right: 0,
          background: "#1E1B4B", color: "#A5B4FC",
          fontSize: 11, padding: "8px 12px", borderRadius: 8,
          border: "1px solid rgba(99,102,241,0.3)",
          zIndex: 50, lineHeight: 1.5,
        }}>
          Foto profil va fi disponibil după perioada demo.
        </div>
      )}

      {/* NUME */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#6b7280", fontSize: 11 }}>Logged in as</div>
        <div style={{
          fontWeight: 700, fontSize: 13,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName}
        </div>
      </div>

      {/* BUTON IEȘIRE */}
      <button
        onClick={handleLogout}
        style={{
          background: "transparent",
          border: "1px solid rgba(0,0,0,.15)",
          borderRadius: 8, padding: "5px 8px",
          cursor: "pointer", fontSize: 11,
          fontWeight: 700, color: "#6b7280",
          flexShrink: 0,
        }}
      >
        Ieșire
      </button>

      {!!error && <div style={{ color: "#b91c1c", fontSize: 11, width: "100%" }}>{error}</div>}
    </div>
  );
}

// ----------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------
function avatarWrapStyle(hasAvatar: boolean): React.CSSProperties {
  return {
    position: "relative",
    width: 36, height: 36,
    borderRadius: "50%",
    overflow: "hidden",
    cursor: "pointer",
    flexShrink: 0,
    border: hasAvatar ? "2px solid #4F46E5" : "2px solid #e5e7eb",
    background: hasAvatar ? "transparent" : "linear-gradient(135deg, #4F46E5, #7C3AED)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}

const initialsStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1,
  userSelect: "none",
};

const hoverOverlayStyle: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "rgba(0,0,0,.45)",
  color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 14,
};