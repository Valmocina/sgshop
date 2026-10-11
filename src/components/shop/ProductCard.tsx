import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { isPreOrder } from "@/lib/preorder";

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
      <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${hov ? C.borderLight : C.border}`, transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${C.gold}33` : "0 2px 8px rgba(0,0,0,0.3)", transition: "all 0.22s" }}>
        <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform 0.3s" }} />
          <div style={{ position: "absolute", inset: 0, background: hov ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hov && <span style={{ ...font(16, 700, 2), color: "#fff", background: C.gold, borderRadius: 20, padding: "8px 22px", boxShadow: `0 2px 10px ${C.gold}66` }}>VIEW DETAILS</span>}
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", gap: 4, padding: 10 }}>
            {product.new && <span style={{ ...font(12, 700, 1), color: "#111", background: C.gold, borderRadius: 4, padding: "3px 10px" }}>NEW</span>}
            {isPreOrder(product)
              ? <span style={{ ...font(12, 700, 1), color: C.gold, background: "rgba(17,17,17,0.85)", border: `1px solid ${C.gold}`, borderRadius: 4, padding: "3px 10px" }}>PRE-ORDER</span>
              : product.stock <= 0
                ? <span style={{ ...font(12, 700, 1), color: "#fff", background: "#555", borderRadius: 4, padding: "3px 10px" }}>SOLD OUT</span>
                : product.stock <= 2 && <span style={{ ...font(12, 700, 1), color: "#fff", background: "#e53e3e", borderRadius: 4, padding: "3px 10px" }}>LOW STOCK</span>}
          </div>
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <p style={{ ...font(16, 700, 0.3), color: C.text, lineHeight: 1.35, marginBottom: 8, textTransform: "uppercase" }}>{product.name}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ ...font(20, 800, 0), color: C.gold }}>₱{product.price.toLocaleString()}</p>
            <span style={{ ...font(12, 600, 0.5), color: C.textDim, background: C.surface, borderRadius: 4, padding: "3px 10px", border: `1px solid ${C.border}` }}>{isPreOrder(product) ? "MADE TO ORDER" : product.condition.split(" ")[0].toUpperCase()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Home Landing ─────────────────────────────────────────────────────────────
