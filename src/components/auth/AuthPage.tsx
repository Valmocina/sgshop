import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";

export function AuthPage({ onLogin, onBack, onSignUp, onForgotPassword }: {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onBack?: () => void;
  onSignUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  onForgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const resetFields = () => { setEmail(""); setPassword(""); setName(""); setConfirm(""); setError(""); };

  const submitLogin = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await onLogin(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error || "Invalid email or password.");
  };

  const submitSignUp = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await onSignUp(name.trim(), email.trim(), password);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not create account."); return; }
    if (res.needsConfirmation) {
      setError("");
      resetFields();
      setShowSignUp(false);
      setForgotMsg(null);
      setShowForgot(false);
      alert("Account created! Please check your email to confirm your address before signing in.");
      return;
    }
    resetFields();
    setShowSignUp(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Hero header */}
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, padding: "32px 0 28px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(0,0,0,0.15) 0%, transparent 60%)" }} />
        <Logo size="lg" />
        {/* Back to Home — top-left corner */}
        {onBack && (
          <button onClick={onBack} style={{ position: "absolute", top: 14, left: 18, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 20, padding: "5px 12px", backdropFilter: "blur(4px)", cursor: "pointer", transition: "background 0.18s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.22)"}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1={19} y1={12} x2={5} y2={12}/><polyline points="12 19 5 12 12 5"/></svg>
            <span style={{ ...font(11, 700, 1), color: "#111" }}>HOME</span>
          </button>
        )}
        {/* Admin link — top-right corner */}
        <a href="#/admin" style={{ position: "absolute", top: 14, right: 18, display: "flex", alignItems: "center", gap: 5, textDecoration: "none", background: "rgba(0,0,0,0.22)", borderRadius: 20, padding: "5px 12px", backdropFilter: "blur(4px)", border: "1px solid rgba(0,0,0,0.15)", transition: "background 0.18s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.22)"}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5} strokeLinecap="round"><rect x={3} y={11} width={18} height={11} rx={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ ...font(11, 700, 1), color: "#111" }}>ADMIN</span>
        </a>
      </div>

      {/* Form area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 12px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          {showForgot ? (
            /* ── Forgot Password ── */
            <>
              <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "20px 24px 0", border: `1px solid ${C.border}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => { setShowForgot(false); setForgotEmail(""); setForgotMsg(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", ...font(12, 600, 0.5), color: C.textMuted, padding: "6px 0", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={19} y1={12} x2={5} y2={12}/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Sign In
                </button>
                <span style={{ ...font(13, 700, 3), color: C.gold, textTransform: "uppercase", padding: "8px 0" }}>FORGOT PASSWORD</span>
              </div>
              <div style={{ background: C.lightBg, borderRadius: "0 0 14px 14px", padding: "32px 20px 28px", border: `1px solid ${C.border}`, borderTop: "none" }}>
                <h2 style={{ ...font(30, 800, 3), color: "#1a1a1a", textAlign: "center", marginBottom: 10, textTransform: "uppercase" }}>Reset Password</h2>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: "#666", textAlign: "center", marginBottom: 28, lineHeight: 1.5 }}>
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <Input icon={<IconUser c="#777" />} placeholder="Email Address" value={forgotEmail} onChange={v => { setForgotEmail(v); setForgotMsg(null); }} label="Email Address" />
                {forgotMsg && (
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: forgotMsg.ok ? "#16a34a" : "#e53e3e", background: forgotMsg.ok ? "#dcfce7" : "#fee2e2", borderRadius: 8, padding: "12px 16px", marginBottom: 16, lineHeight: 1.5 }}>
                    {forgotMsg.text}
                  </div>
                )}
                <Btn onClick={async () => {
                  if (!forgotEmail.trim()) { setForgotMsg({ text: "Please enter your email address.", ok: false }); return; }
                  const res = await onForgotPassword(forgotEmail.trim());
                  setForgotMsg(res.ok
                    ? { text: "If an account exists for that email, a reset link has been sent.", ok: true }
                    : { text: res.error || "Something went wrong. Please try again.", ok: false });
                }} full size="lg">Send Reset Link</Btn>
              </div>
            </>
          ) : !showSignUp ? (
            /* ── Sign In ── */
            <>
              <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "20px 24px 0", border: `1px solid ${C.border}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...font(16, 700, 3), color: C.gold, textTransform: "uppercase", padding: "8px 0" }}>SIGN IN</span>
              </div>
              <div style={{ background: C.lightBg, borderRadius: "0 0 14px 14px", padding: "28px 20px 24px", border: `1px solid ${C.border}`, borderTop: "none" }}>
                <h2 style={{ ...font(34, 800, 4), color: "#1a1a1a", textAlign: "center", marginBottom: 28, textTransform: "uppercase" }}>WELCOME BACK</h2>
                <Input icon={<IconUser c="#777" />} placeholder="Email Address" value={email} onChange={v => { setEmail(v); setError(""); }} />
                <Input icon={<IconLock c="#777" />} type="password" placeholder="Password" value={password} onChange={v => { setPassword(v); setError(""); }} />
                {error && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: "#e53e3e", background: "#fee2e2", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>{error}</p>}
                <div style={{ textAlign: "right", marginBottom: 20, marginTop: -4 }}>
                  <button onClick={() => { setShowForgot(true); setForgotEmail(""); setForgotMsg(null); }} style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: "#555", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    Forgot password?
                  </button>
                </div>
                <Btn onClick={submitLogin} full size="lg" disabled={busy}>{busy ? "Signing In…" : "Sign In"}</Btn>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #C8C8C8", textAlign: "center" }}>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 16, color: "#666", marginBottom: 12 }}>
                    Don&apos;t have an account?
                  </p>
                  <button
                    onClick={() => { resetFields(); setShowSignUp(true); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${C.border}`, borderRadius: 30, padding: "10px 24px", ...font(15, 700, 1.5), color: C.surface, cursor: "pointer", textTransform: "uppercase", transition: "all 0.18s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.surface; e.currentTarget.style.borderColor = C.border; }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><line x1={19} y1={8} x2={19} y2={14}/><line x1={22} y1={11} x2={16} y2={11}/></svg>
                    Create an account
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── Sign Up ── */
            <>
              <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "20px 24px 0", border: `1px solid ${C.border}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => { resetFields(); setShowSignUp(false); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", ...font(12, 600, 0.5), color: C.textMuted, padding: "6px 0", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.gold} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={19} y1={12} x2={5} y2={12}/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Sign In
                </button>
                <span style={{ ...font(13, 700, 3), color: C.gold, textTransform: "uppercase", padding: "8px 0" }}>SIGN UP</span>
              </div>
              <div style={{ background: C.lightBg, borderRadius: "0 0 14px 14px", padding: "32px 20px 32px", border: `1px solid ${C.border}`, borderTop: "none" }}>
                <h2 style={{ ...font(26, 800, 4), color: "#1a1a1a", textAlign: "center", marginBottom: 24, textTransform: "uppercase" }}>CREATE ACCOUNT</h2>
                <Input icon={<IconUser c="#777" />} placeholder="Full Name" value={name} onChange={v => { setName(v); setError(""); }} label="Full Name" />
                <Input placeholder="Email Address" value={email} onChange={v => { setEmail(v); setError(""); }} label="Email" />
                <Input icon={<IconLock c="#777" />} type="password" placeholder="Password" value={password} onChange={v => { setPassword(v); setError(""); }} label="Password" />
                <Input icon={<IconLock c="#777" />} type="password" placeholder="Confirm Password" value={confirm} onChange={v => { setConfirm(v); setError(""); }} label="Confirm Password" />
                {error && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#e53e3e", background: "#fee2e2", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>{error}</p>}
                <div style={{ marginTop: 8 }}>
                  <Btn onClick={submitSignUp} full size="lg" disabled={busy}>{busy ? "Creating Account…" : "Create Account"}</Btn>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Customer Account Page ────────────────────────────────────────────────────
