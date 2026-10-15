import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { MyOrders } from "@/components/auth/MyOrders";

export function CustomerAccountPage({ customer, onChangePassword, onUpdateContact, onLogout, onBack }: {
  customer: { name: string; email: string; phone: string; contactEmail: string; contactPhone: string };
  onChangePassword: (oldPass: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateContact: (email: string, phone: string) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => void;
  onBack: () => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [contactMsg, setContactMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [contactEmail, setContactEmail] = useState(customer.contactEmail || customer.email);
  const [contactPhone, setContactPhone] = useState(customer.contactPhone || customer.phone);
  const [contactBusy, setContactBusy] = useState(false);

  const save = async () => {
    if (newPass.length < 6) { setMsg({ text: "Password must be at least 6 characters.", ok: false }); return; }
    if (newPass !== confirmPass) { setMsg({ text: "Passwords do not match.", ok: false }); return; }
    if (busy) return;
    setBusy(true);
    const res = await onChangePassword(oldPass, newPass);
    setBusy(false);
    if (res.ok) { setMsg({ text: "Password updated successfully!", ok: true }); setOldPass(""); setNewPass(""); setConfirmPass(""); }
    else { setMsg({ text: res.error || "Current password is incorrect.", ok: false }); }
  };
  const saveContact = async () => {
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) {
      setContactMsg({ text: "Enter a valid email address.", ok: false });
      return;
    }
    const digits = contactPhone.replace(/\D/g, "");
    if (contactPhone && !(digits.length === 10 && digits.startsWith("9") || digits.startsWith("63") && digits.length === 12 || digits.startsWith("09") && digits.length === 11)) {
      setContactMsg({ text: "Enter a valid Philippine mobile number.", ok: false });
      return;
    }
    if (contactBusy) return;
    setContactBusy(true);
    const phone = digits.startsWith("63") ? `+${digits}` : digits.startsWith("0") ? `+63${digits.slice(1)}` : digits ? `+63${digits}` : "";
    const res = await onUpdateContact(contactEmail.trim(), phone);
    setContactBusy(false);
    setContactMsg(res.ok
      ? { text: "Contact details saved.", ok: true }
      : { text: res.error || "Could not update contact details.", ok: false });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <IconArrowLeft c="#111" s={18} />
        </button>
        <Logo size="sm" />
        <span style={{ ...font(16, 800, 1), color: "#111", textTransform: "uppercase", marginLeft: 4 }}>My Account</span>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 16px" }}>
        <div style={{ width: "100%", maxWidth: 720 }}>
          {/* Profile card */}
          <div style={{ background: C.surface, borderRadius: 14, padding: "24px 28px", border: `1px solid ${C.border}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconUser s={26} c="#111" />
            </div>
            <div>
              <p style={{ ...font(18, 800, 1), color: C.text, textTransform: "uppercase" }}>{customer.name}</p>
              {customer.email && <p style={{ ...font(13, 400, 0), color: C.textMuted, fontFamily: "'Barlow', sans-serif" }}>{customer.email}</p>}
              {customer.phone && <p style={{ ...font(13, 400, 0), color: C.textMuted, fontFamily: "'Barlow', sans-serif" }}>{customer.phone}</p>}
            </div>
          </div>

          <MyOrders />

          <div style={{ background: C.surface, borderRadius: 14, padding: "24px 28px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <p style={{ ...font(14, 700, 2), color: C.text, textTransform: "uppercase", marginBottom: 8 }}>Contact Details</p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: C.textMuted, marginBottom: 18 }}>
              Add an email or phone number so we can contact you about orders.
            </p>
            <Input icon={<IconUser c="#777" />} placeholder="Email address" value={contactEmail} onChange={value => { setContactEmail(value); setContactMsg(null); }} label="Email" />
            <Input placeholder="Philippine mobile number" value={contactPhone} onChange={value => { setContactPhone(value); setContactMsg(null); }} label="Mobile Number" />
            {contactMsg && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: contactMsg.ok ? "#16a34a" : "#e53e3e", background: contactMsg.ok ? "#dcfce7" : "#fee2e2", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>{contactMsg.text}</p>}
            <Btn onClick={saveContact} full size="md" disabled={contactBusy}>{contactBusy ? "Saving…" : "Save Contact Details"}</Btn>
          </div>

          {/* Change password */}
          <div style={{ background: C.surface, borderRadius: 14, padding: "24px 28px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <p style={{ ...font(14, 700, 2), color: C.text, textTransform: "uppercase", marginBottom: 20 }}>Change Password</p>
            <Input icon={<IconLock c="#777" />} type="password" placeholder="Current password" value={oldPass} onChange={v => { setOldPass(v); setMsg(null); }} label="Current Password" />
            <Input icon={<IconLock c="#777" />} type="password" placeholder="New password" value={newPass} onChange={v => { setNewPass(v); setMsg(null); }} label="New Password" />
            <Input icon={<IconLock c="#777" />} type="password" placeholder="Confirm new password" value={confirmPass} onChange={v => { setConfirmPass(v); setMsg(null); }} label="Confirm New Password" />
            {msg && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: msg.ok ? "#16a34a" : "#e53e3e", background: msg.ok ? "#dcfce7" : "#fee2e2", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>{msg.text}</p>}
            <Btn onClick={save} full size="md" disabled={busy}>{busy ? "Updating…" : "Update Password"}</Btn>
          </div>

          <Btn onClick={onLogout} variant="ghost" full size="md">Sign Out</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Header ──────────────────────────────────────────────────────────────
