import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";

export function CartRow({ product, qty, onRemove, onQtyChange }: {
  product: Product; qty: number; onRemove: () => void; onQtyChange: (q: number) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.surface, borderRadius: 14, border: `1px solid ${hov ? C.borderLight : C.border}`, display: "flex", gap: 0, overflow: "hidden", transition: "all 0.18s", boxShadow: hov ? "0 4px 20px rgba(0,0,0,0.35)" : "none" }}>
      {/* Image */}
      <div style={{ width: 110, flexShrink: 0, background: C.card, position: "relative", overflow: "hidden" }}>
        <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: hov ? "scale(1.05)" : "scale(1)", transition: "transform 0.3s" }} />
      </div>
      {/* Info */}
      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <p style={{ ...font(13, 700, 0.5), color: C.text, lineHeight: 1.3, textTransform: "uppercase", flex: 1 }}>{product.name}</p>
            <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: C.textDim, flexShrink: 0, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e53e3e"} onMouseLeave={e => e.currentTarget.style.color = C.textDim}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <span style={{ ...font(10, 600, 0.5), color: C.textDim, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase" }}>{product.brand}</span>
            <span style={{ ...font(10, 600, 0.5), color: C.textDim, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase" }}>{product.condition}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <p style={{ ...font(18, 900, 0), color: C.gold }}>₱{(product.price * qty).toLocaleString()}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 30, padding: "3px 6px", border: `1px solid ${C.border}` }}>
            <button onClick={() => onQtyChange(Math.max(1, qty - 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", ...font(18, 700, 0), color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>−</button>
            <span style={{ ...font(15, 700, 0), color: C.text, minWidth: 22, textAlign: "center" }}>{qty}</span>
            <button onClick={() => onQtyChange(Math.min(product.stock, qty + 1))} style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", ...font(18, 700, 0), color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Failed ───────────────────────────────────────────────────────────
