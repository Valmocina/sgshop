import { useState } from "react";
import type { Product, PaymentOption, ContactInfo, PayMethod } from "@/types/store";
import { C, font } from "@/lib/theme";
import { Btn } from "@/components/ui/Btn";
import { dueNow, lineTotal } from "@/lib/preorder";
import { savePendingOrder, type PendingOrder } from "@/lib/pendingOrder";

export interface CreateOrderArgs {
  product: Product; qty: number; method: PayMethod;
  preorder: boolean; paymentOption: PaymentOption;
  contact: ContactInfo;
  customer: { id: string; name: string; email: string; phone: string } | null;
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ ...font(14, bold ? 700 : 500, 1), color: bold ? C.text : C.textMuted, textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
    <span style={{ ...font(14, bold ? 800 : 600, 0.5), color: bold ? C.gold : C.textMuted, textAlign: "right", overflowWrap: "anywhere" }}>{value}</span>
  </div>
);

export function PaymentSummaryPage({ product, qty, method, preorder, paymentOption, contact, paymongoPublicKey, customer, onCreateOrder, onMarkOrderPaid, onContinue, onBack }: {
  product: Product; qty: number; method: PayMethod;
  preorder: boolean; paymentOption: PaymentOption;
  contact: ContactInfo;
  paymongoPublicKey: string;
  customer: { id: string; name: string; email: string; phone: string } | null;
  onCreateOrder: (args: CreateOrderArgs) => Promise<string>;
  onMarkOrderPaid: (orderId: string, status: PendingOrder["paidStatus"], amountPaid: number) => Promise<void>;
  onContinue: (info: PendingOrder) => void;
  onBack: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const total = lineTotal(product, qty);
  const today = dueNow(product, qty, paymentOption);
  const balance = total - today;
  const isDeposit = preorder && paymentOption === "deposit" && balance > 0;
  const paidStatus: PendingOrder["paidStatus"] = isDeposit ? "deposit_paid" : "paid";

  const methodColor = method === "gcash" ? "#0063cc" : "#00c389";
  const methodBg = method === "gcash" ? "#fff" : "#1a1a1a";
  const methodLabel = method === "gcash" ? "GCash" : "Maya";

  const handlePay = async () => {
    setPayError("");
    setPaying(true);
    let orderId: string;
    try {
      orderId = await onCreateOrder({ product, qty, method, preorder, paymentOption, contact, customer });
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setPaying(false);
      return;
    }

    const info: PendingOrder = {
      id: orderId, paidStatus, amountPaid: today, preorder, balance,
      estArrival: product.est_arrival ?? null, signedIn: !!customer,
    };

    if (!paymongoPublicKey) {
      // Demo mode — no PayMongo key configured, simulate an immediate successful payment.
      try { await onMarkOrderPaid(orderId, paidStatus, today); }
      catch (err) { console.error("Failed to mark demo order as paid:", err); }
      onContinue(info);
      return;
    }

    const base = window.location.origin + window.location.pathname;
    try {
      const res = await fetch("https://api.paymongo.com/v1/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(paymongoPublicKey + ":")}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(today * 100),   // only what's due today (deposit or full)
              redirect: { success: base + "#/payment-success", failed: base + "#/payment-failed" },
              type: method === "gcash" ? "gcash" : "paymaya",
              currency: "PHP",
              billing: contact.phone ? { phone: "+63" + contact.phone } : undefined,
            },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errors?.[0]?.detail || "Payment initialization failed.");
      savePendingOrder(info);
      window.location.href = json.data.attributes.redirect.checkout_url;
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  const cta = paying
    ? "Redirecting…"
    : paymongoPublicKey
      ? `Pay ₱${today.toLocaleString()} with ${methodLabel} →`
      : preorder ? "Confirm Pre-Order" : "Confirm & Pay";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, padding: "20px 32px" }}>
        <p style={{ ...font(11, 600, 3), color: "rgba(0,0,0,0.5)", textTransform: "uppercase", marginBottom: 2 }}>{preorder ? "PRE-ORDER" : "CHECKOUT"} · STEP 2 OF 2</p>
        <h1 style={{ ...font(26, 900, 2), color: "#111", textTransform: "uppercase" }}>Order Summary</h1>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ background: C.card, padding: "20px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ padding: "8px 20px", borderRadius: 24, background: methodBg, border: `2px solid ${methodColor}` }}>
                <span style={{ ...font(16, 800, 0.5), color: methodColor }}>{methodLabel}</span>
              </div>
              <span style={{ ...font(13, 600, 1), color: C.textMuted }}>selected</span>
              {paymongoPublicKey && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 8 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <span style={{ ...font(11, 600, 1), color: C.textMuted }}>PayMongo</span>
                </div>
              )}
            </div>

            <div style={{ padding: "8px 32px 28px" }}>
              <Row label="Merchant" value="SITHGUY HOBBYSHOP" />
              <Row label="Product" value={product.name.length > 30 ? product.name.slice(0, 30) + "…" : product.name} />
              <Row label="Qty × Unit Price" value={`${qty} × ₱${product.price.toLocaleString()}`} />
              {preorder
                ? <Row label="Order total" value={`₱${total.toLocaleString()}`} />
                : <>
                    <Row label="Product Price" value={`₱${total.toLocaleString()}`} />
                    <Row label="Coupon Discount" value="₱0.00" />
                  </>}
              {preorder && <Row label="Balance on arrival" value={`₱${balance.toLocaleString()}`} />}
              {preorder && <Row label="Est. arrival" value={product.est_arrival || "Confirmed after you order"} />}
              {contact.name && <Row label="Name" value={contact.name} />}
              {contact.email && <Row label="Email" value={contact.email} />}
              {contact.phone && <Row label="Contact" value={`+63 ${contact.phone}`} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0 4px" }}>
                <span style={{ ...font(18, 900, 1.5), color: C.text, textTransform: "uppercase" }}>{preorder ? "Due today" : "Total Amount"}</span>
                <span style={{ ...font(28, 900, 0), color: C.gold }}>₱{today.toLocaleString()}</span>
              </div>
            </div>

            {preorder && (
              <div style={{ margin: "0 32px 16px", background: `${C.gold}10`, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "10px 16px" }}>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  This is a pre-order. After payment we place your order with our supplier{isDeposit ? ", and the balance is due when it arrives" : ""}. We'll contact you to arrange white-glove delivery.
                </p>
              </div>
            )}

            {payError && (
              <div style={{ margin: "0 32px 16px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px" }}>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#dc2626", lineHeight: 1.5 }}><strong>Payment Error:</strong> {payError}</p>
              </div>
            )}

            {paymongoPublicKey && (
              <div style={{ margin: "0 32px 20px", background: `${C.gold}10`, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>You will be redirected to {methodLabel} to complete your payment securely via PayMongo.</p>
              </div>
            )}

            <div style={{ padding: "0 32px 28px", display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={onBack} size="md" disabled={paying}>Back</Btn>
              <div style={{ flex: 1 }}><Btn onClick={handlePay} full size="md" disabled={paying}>{cta}</Btn></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
