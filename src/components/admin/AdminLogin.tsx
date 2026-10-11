import React, { useState } from "react";
import { C, A, font, af } from "@/lib/theme";

export function AdminLogin({ onLogin }: { onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }> }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = await onLogin(email, pass);
    setBusy(false);
    if (!res.ok) setErr(res.error || "Invalid credentials.");
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", background: focused === name ? "#1e1e1e" : A.card,
    border: `1.5px solid ${focused === name ? A.gold : A.border}`,
    borderRadius: 8, padding: "12px 14px", ...af(14, 500), color: A.text,
    outline: "none", transition: "all 0.2s",
    boxShadow: focused === name ? `0 0 0 3px ${A.gold}22` : "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: A.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5} strokeLinecap="round"><rect x={3} y={11} width={18} height={11} rx={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ ...af(22, 700, 0), color: A.text, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ ...af(13, 400), color: A.textMuted }}>Sithguy Hobbyshop CMS</p>
        </div>

        <div style={{ background: A.surface, borderRadius: 14, padding: "28px 24px", border: `1px solid ${A.border}` }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...af(12, 600, 0.5), color: A.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Email</label>
            <input value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} placeholder="admin@yourdomain.com"
              onFocus={() => setFocused("user")} onBlur={() => setFocused(null)}
              style={inputStyle("user")} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...af(12, 600, 0.5), color: A.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
            <input type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder="••••••••"
              onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
              style={inputStyle("pass")} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && <p style={{ ...af(12, 500), color: A.red, marginBottom: 14, background: `${A.red}15`, borderRadius: 6, padding: "8px 12px", border: `1px solid ${A.red}33` }}>{err}</p>}
          <button onClick={submit} disabled={busy} style={{ width: "100%", background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, padding: "13px 0", ...af(15, 700), color: "#111", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: `0 4px 14px ${A.gold}44` }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = busy ? "0.7" : "1"}>
            {busy ? "Signing In…" : "Sign In to Admin"}
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: 20 }}>
          <a href="#/" style={{ ...af(12, 500), color: A.textMuted, textDecoration: "none" }}>← Back to store</a>
        </p>
      </div>
    </div>
  );
}

// ─── Admin form helpers ───────────────────────────────────────────────────────
