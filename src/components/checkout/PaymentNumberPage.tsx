import { useState } from "react";
import type { Product, PaymentOption, ContactInfo, PayMethod } from "@/types/store";
import { C, font } from "@/lib/theme";
import { Btn } from "@/components/ui/Btn";
import { dueNow, lineTotal } from "@/lib/preorder";

const fieldStyle: React.CSSProperties = {
  width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: "13px 16px", ...font(16, 500, 0.5), color: C.text, outline: "none",
};
const labelStyle: React.CSSProperties = { ...font(12, 700, 1.5), color: C.textMuted, textTransform: "uppercase", marginBottom: 6, display: "block" };
const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = C.gold);
const blur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = C.border);

export function PaymentNumberPage({ product, qty, preorder, paymentOption, guest, defaultName, defaultEmail, onNext, onBack }: {
  product: Product; qty: number;
  preorder: boolean; paymentOption: PaymentOption;
  guest: boolean;                       // not signed in
  defaultName: string; defaultEmail: string;
  onNext: (method: PayMethod, contact: ContactInfo) => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<PayMethod>("gcash");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");

  // A pre-order is a long-running order we have to follow up on, so we need real contact details.
  const askIdentity = preorder && guest;
  const total = lineTotal(product, qty);
  const today = dueNow(product, qty, paymentOption);

  const submit = () => {
    // Normalise "0917…", "63917…" and "917…" to the 10 digits that follow +63.
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("63") && digits.length > 10) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (preorder && digits.length !== 10) { setError("Please enter a valid mobile number (e.g. 917 123 4567) so we can reach you about your order."); return; }
    if (askIdentity && !name.trim()) { setError("Please enter your full name."); return; }
    if (askIdentity && !/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    setError("");
    onNext(method, { name: name.trim(), email: email.trim(), phone: digits });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, padding: "20px 32px" }}>
        <p style={{ ...font(11, 600, 3), color: "rgba(0,0,0,0.5)", textTransform: "uppercase", marginBottom: 2 }}>
          {preorder ? "PRE-ORDER" : "CHECKOUT"} · STEP 1 OF 2
        </p>
        <h1 style={{ ...font(26, 900, 2), color: "#111", textTransform: "uppercase" }}>Payment Method</h1>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Order summary pill */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...font(11, 600, 1), color: C.textMuted, textTransform: "uppercase", marginBottom: 2 }}>{preorder ? "Pre-ordering" : "Ordering"}{qty > 1 ? ` · ×${qty}` : ""}</p>
                <p style={{ ...font(14, 700, 0.5), color: C.text, textTransform: "uppercase" }}>{product.name}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ ...font(20, 800, 0), color: C.gold }}>₱{today.toLocaleString()}</p>
                {preorder && <p style={{ ...font(11, 600, 1), color: C.textMuted, textTransform: "uppercase" }}>due today</p>}
              </div>
            </div>
            {preorder && total > today && (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: C.textDim, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                Order total ₱{total.toLocaleString()} · balance of ₱{(total - today).toLocaleString()} due when it arrives
              </p>
            )}
          </div>

          <div style={{ background: C.surface, borderRadius: 16, padding: "32px 36px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span style={{ ...font(11, 700, 2), color: C.textMuted, textTransform: "uppercase" }}>Secured by PayMongo</span>
            </div>

            <p style={{ ...font(13, 700, 2), color: C.textMuted, textTransform: "uppercase", marginBottom: 18, textAlign: "center" }}>Select E-Wallet</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 32 }}>
              {([
                { id: "gcash", label: "GCash", color: "#0063cc", bg: "#fff" },
                { id: "maya", label: "Maya", color: "#00c389", bg: "#1a1a1a" },
              ] as const).map(({ id, label, color, bg }) => (
                <button key={id} onClick={() => setMethod(id)} style={{ padding: "12px 28px", borderRadius: 30, background: bg, border: `2.5px solid ${method === id ? color : C.border}`, cursor: "pointer", transition: "all 0.2s", boxShadow: method === id ? `0 4px 20px ${color}44` : "none", transform: method === id ? "scale(1.04)" : "scale(1)" }}>
                  <span style={{ ...font(17, 800, 0.5), color }}>{label}</span>
                </button>
              ))}
            </div>

            {askIdentity && (
              <>
                <label style={labelStyle}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" style={{ ...fieldStyle, marginBottom: 14 }} onFocus={focus} onBlur={blur} />
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...fieldStyle, marginBottom: 14 }} onFocus={focus} onBlur={blur} />
              </>
            )}

            <label style={labelStyle}>Mobile number{preorder ? "" : " (optional)"}</label>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: C.textDim, marginBottom: 10 }}>
              {preorder ? "We'll use this to confirm your order and arrange delivery." : "For order coordination only — payment is processed through your e-wallet."}
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: error ? 12 : 28 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 16px", flexShrink: 0, ...font(16, 700, 0.5), color: C.text }}>+63</div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9XX XXX XXXX" inputMode="tel" style={{ ...fieldStyle, flex: 1, width: "auto" }} onFocus={focus} onBlur={blur} />
            </div>

            {error && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#dc2626", background: "#fee2e2", borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={onBack} size="md">Back</Btn>
              <div style={{ flex: 1 }}><Btn onClick={submit} full size="md">Next →</Btn></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
