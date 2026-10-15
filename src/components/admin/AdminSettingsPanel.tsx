import React, { useEffect, useMemo, useState } from "react";
import { C, A, font, af } from "@/lib/theme";
import { AField } from "@/components/admin/AField";
import { AInput } from "@/components/admin/AInput";

export function AdminSettingsPanel({ adminEmail, onChangeAdminPassword, paymongoPublicKey, onChangePaymongoKey, onArchiveAllOrders, showToast }: {
  adminEmail: string;
  onChangeAdminPassword: (oldPass: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
  paymongoPublicKey: string;
  onChangePaymongoKey: (k: string) => void;
  onArchiveAllOrders: () => Promise<boolean>;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const saveAdminPassword = async () => {
    if (!oldPass) { showToast("Enter your current password.", "error"); return; }
    if (newPass.length < 6) { showToast("New password must be at least 6 characters.", "error"); return; }
    if (newPass !== confirmPass) { showToast("Passwords do not match.", "error"); return; }
    if (busy) return;
    setBusy(true);
    const res = await onChangeAdminPassword(oldPass, newPass);
    setBusy(false);
    if (!res.ok) { showToast(res.error || "Could not update password.", "error"); return; }
    setOldPass(""); setNewPass(""); setConfirmPass("");
    showToast("Admin password updated.");
  };

  return (
    <div style={{ padding: "28px 28px", maxWidth: 700 }}>
      <h1 style={{ ...af(22, 700), color: A.text, marginBottom: 28 }}>Settings</h1>

      {/* Admin credentials */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "24px 24px", marginBottom: 24 }}>
        <h2 style={{ ...af(16, 700), color: A.text, marginBottom: 4 }}>Admin Account</h2>
        <p style={{ ...af(12, 400), color: A.textMuted, marginBottom: 20 }}>Signed in as {adminEmail}</p>
        <AField label="Current Password">
          <AInput value={oldPass} onChange={setOldPass} placeholder="Current password" type="password" />
        </AField>
        <AField label="New Password">
          <AInput value={newPass} onChange={setNewPass} placeholder="New password" type="password" />
        </AField>
        <AField label="Confirm New Password">
          <AInput value={confirmPass} onChange={setConfirmPass} placeholder="Confirm new password" type="password" />
        </AField>
        <button onClick={saveAdminPassword} disabled={busy} style={{ marginTop: 4, background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, padding: "10px 24px", ...af(14, 700), color: "#111", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* PayMongo settings */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "24px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={A.gold} strokeWidth={2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h2 style={{ ...af(16, 700), color: A.text }}>PayMongo Integration</h2>
        </div>
        <p style={{ ...af(12, 400), color: A.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Enter your PayMongo public key to enable real GCash and Maya payments. Customers will be redirected to PayMongo's secure checkout. Leave blank to use demo mode.
        </p>
        <AField label="PayMongo Public Key">
          <AInput value={paymongoPublicKey} onChange={onChangePaymongoKey} placeholder="pk_live_... or pk_test_..." />
        </AField>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          {paymongoPublicKey ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={A.green} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ ...af(12, 600), color: A.green }}>Key saved — PayMongo payments enabled</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={A.textMuted} strokeWidth={2}><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></svg>
              <span style={{ ...af(12, 400), color: A.textMuted }}>Demo mode — orders are simulated</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer accounts — see note below */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "24px 24px" }}>
        <h2 style={{ ...af(16, 700), color: A.text, marginBottom: 10 }}>Customer Accounts</h2>
        <p style={{ ...af(13, 400), color: A.textMuted, lineHeight: 1.7 }}>
          Customer accounts are now real Supabase Auth users, so viewing, editing, or deleting other people's
          accounts from here needs a server-side function (using your service role key, which must never be
          shipped to the browser) — not implemented in this pass. Let me know if you want that added.
        </p>
      </div>

      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "24px 24px", marginTop: 24 }}>
        <h2 style={{ ...af(16, 700), color: A.text, marginBottom: 8 }}>Order Archive</h2>
        <p style={{ ...af(13, 400), color: A.textMuted, lineHeight: 1.7, marginBottom: 16 }}>
          Archive all current orders to clear them from the active order and transaction lists. Archived orders are preserved and can be viewed or restored later.
        </p>
        <button disabled={archiving} onClick={async () => {
          if (!window.confirm("Archive all current orders? This preserves the records and they can be restored later.")) return;
          setArchiving(true);
          try {
            await onArchiveAllOrders();
          } finally {
            setArchiving(false);
          }
        }} style={{ background: `${A.gold}18`, border: `1px solid ${A.gold}66`, borderRadius: 8, padding: "10px 18px", ...af(13, 700), color: A.gold, cursor: archiving ? "wait" : "pointer", opacity: archiving ? 0.65 : 1 }}>
          {archiving ? "Archiving…" : "Archive All Orders"}
        </button>
      </div>
    </div>
  );
}
