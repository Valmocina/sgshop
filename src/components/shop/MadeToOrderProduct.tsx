import { useState } from "react";
import type { Product, PaymentOption } from "@/types/store";
import { C, font } from "@/lib/theme";
import { IconCheck } from "@/components/ui/Icons";
import { Btn } from "@/components/ui/Btn";
import { ProcurementTimeline } from "@/components/shop/ProcurementTimeline";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { MAX_PREORDER_QTY, depositFor, lineTotal } from "@/lib/preorder";

const body = (size: number, color: string = C.textMuted): React.CSSProperties => ({
  fontFamily: "'Barlow', sans-serif", fontSize: size, color, lineHeight: 1.55,
});

const peso = (n: number) => `₱${n.toLocaleString()}`;

/** Product page for Lifesize items: no stock — the customer pre-orders, then we order from the supplier. */
export function MadeToOrderProduct({ product, onCheckout }: {
  product: Product;
  onCheckout: (opts: { paymentOption: PaymentOption; qty: number }) => void;
}) {
  const isMobile = useWindowWidth() < 760;
  const [qty, setQty] = useState(1);
  const [option, setOption] = useState<PaymentOption>("deposit");
  const [agreed, setAgreed] = useState(false);

  const total = lineTotal(product, qty);
  const deposit = depositFor(product, qty);
  const hasDeposit = deposit < total;
  const effective: PaymentOption = hasDeposit ? option : "full";
  const payToday = effective === "deposit" ? deposit : total;
  const balance = total - payToday;

  const optionCard = (id: PaymentOption, title: string, amount: number, note: string) => {
    const active = effective === id;
    return (
      <button type="button" onClick={() => setOption(id)} style={{
        flex: 1, minWidth: 0, textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
        background: active ? `${C.gold}12` : C.card, border: `1.5px solid ${active ? C.gold : C.border}`,
        boxShadow: active ? `0 4px 18px ${C.gold}1f` : "none", transition: "all 0.15s",
      }}>
        <p style={{ ...font(13, 700, 1.5), color: active ? C.gold : C.text, textTransform: "uppercase", marginBottom: 4 }}>{title}</p>
        <p style={{ ...font(22, 900, 0), color: C.text, marginBottom: 6 }}>{peso(amount)}</p>
        <p style={{ ...body(12, C.textDim) }}>{note}</p>
      </button>
    );
  };

  const stepBtn = (sym: string, next: number, label: string) => (
    <button type="button" onClick={() => setQty(next)} aria-label={label}
      style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", ...font(20, 700, 0), color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {sym}
    </button>
  );
  const stepper = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 30, padding: "4px 8px", border: `1px solid ${C.border}` }}>
      {stepBtn("−", Math.max(1, qty - 1), "Decrease quantity")}
      <span style={{ ...font(18, 700, 0), color: C.text, minWidth: 24, textAlign: "center" }}>{qty}</span>
      {stepBtn("+", Math.min(MAX_PREORDER_QTY, qty + 1), "Increase quantity")}
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "0 10px 24px" : "0 16px 32px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
      <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
        {/* Image */}
        <div style={{ width: isMobile ? "100%" : 400, flexShrink: 0, position: "relative", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", minHeight: isMobile ? 260 : 460 }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: isMobile ? 280 : "100%", maxHeight: 520, objectFit: "contain", display: "block" }} />
          <span style={{ position: "absolute", top: 16, left: 16, ...font(12, 800, 2), color: "#111", background: C.gold, borderRadius: 6, padding: "5px 12px", textTransform: "uppercase" }}>Pre-Order</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "20px 16px" : "34px 38px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[product.brand, product.scale, product.sourcing_country ? `Sourced from ${product.sourcing_country}` : null].filter(Boolean).map(tag => (
              <span key={tag as string} style={{ ...font(10, 600, 1), color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 9px", textTransform: "uppercase" }}>{tag}</span>
            ))}
          </div>
          <h1 style={{ ...font(26, 900, 1), color: C.text, lineHeight: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{product.name}</h1>
          <p style={{ ...font(32, 900, 0), color: C.gold, marginBottom: product.description ? 14 : 20 }}>{peso(product.price)}</p>
          {product.description && <p style={{ ...body(14), marginBottom: 20 }}>{product.description}</p>}

          {product.details.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
              {product.details.map((d, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 7 }}>
                  <span style={{ marginTop: 2, flexShrink: 0 }}><IconCheck s={14} c={C.gold} /></span>
                  <span style={body(14)}>{d}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Not-in-stock notice + lead time */}
          <div style={{ background: `${C.gold}0f`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
            <p style={{ ...font(13, 800, 1.5), color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>Not kept in stock</p>
            <p style={body(13)}>We order this figure from our supplier once your order is placed, so it is made available to you only by pre-order.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 22 }}>
            <span style={{ ...font(12, 700, 1.5), color: C.textMuted, textTransform: "uppercase" }}>Estimated arrival</span>
            <span style={{ ...font(15, 800, 0.3), color: C.text, textAlign: "right" }}>{product.est_arrival || "Confirmed after you order"}</span>
          </div>

          {/* Quantity */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span style={{ ...font(13, 700, 1.5), color: C.textMuted, textTransform: "uppercase" }}>Quantity</span>
            {stepper}
          </div>

          {/* Payment structure */}
          <p style={{ ...font(12, 700, 2), color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Choose how to pay</p>
          <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", marginBottom: 12 }}>
            {hasDeposit && optionCard("deposit", "Pay deposit", deposit, "Balance due when it arrives")}
            {optionCard("full", "Pay in full", total, "Nothing more to pay later")}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", ...body(13), padding: "4px 2px 18px" }}>
            <span>Balance due on arrival</span>
            <span style={{ color: balance > 0 ? C.text : C.textDim, fontWeight: 700 }}>{peso(balance)}</span>
          </div>

          <div style={{ ...body(12, C.textDim), background: `${C.gold}0d`, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
            <span style={{ color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Specialized White-Glove Supervised Delivery: </span>
            Due to the monumental scale and high fragility of life-size models, orders are transported via specialized vehicles strictly accompanied by a SithGuy staff supervisor during delivery. You will select your preferred delivery date and time directly through our web platform once the statue arrives locally.
          </div>

          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 18 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: C.gold, flexShrink: 0 }} />
            <span style={body(13)}>
              I understand this is a <strong style={{ color: C.text }}>strict overseas pre-order</strong> with international production. Cancellations, modifications, or refunds are strictly restricted once overseas procurement is finalized.
            </span>
          </label>

          <Btn full size="lg" disabled={!agreed} onClick={() => onCheckout({ paymentOption: effective, qty })}>
            {effective === "deposit" ? `Pre-order — pay ${peso(payToday)} deposit` : `Pre-order — pay ${peso(payToday)}`}
          </Btn>
          {!agreed && <p style={{ ...body(12, C.textDim), textAlign: "center", marginTop: 8 }}>Tick the box above to continue.</p>}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <ProcurementTimeline />
      </div>
    </div>
  );
}
