import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { useWindowWidth } from "@/hooks/useWindowWidth";

export function ProductDetailPage({ product, cartCount, onBack, onAddToCart, onCartClick, onAccountClick }: {
  product: Product; cartCount: number; onBack: () => void;
  onAddToCart: (p: Product, qty: number) => void; onCartClick: () => void; onAccountClick: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [added, setAdded] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 640;

  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    if (qty > 0 && !soldOut) { setAdded(true); onAddToCart(product, qty); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <ShopHeader cartCount={cartCount} onCartClick={onCartClick} onAccountClick={onAccountClick} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div style={{ padding: isMobile ? "10px" : "16px" }}>
        {/* Back bar */}
        <div style={{ marginBottom: 14 }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", ...font(13, 700, 2), color: C.gold, textTransform: "uppercase", padding: "8px 0" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <IconArrowLeft c={C.gold} s={16} /> CONTINUE TO SHOP
          </button>
        </div>

        <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 0, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
            {/* Image */}
            <div style={{ width: isMobile ? "100%" : 380, flexShrink: 0, position: "relative", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={product.image} alt={product.name} style={{ width: "100%", height: isMobile ? 260 : 380, objectFit: "contain", display: "block" }} />
              {product.new && (
                <div style={{ position: "absolute", top: 16, left: 16, background: C.gold, borderRadius: 6, padding: "4px 12px", ...font(12, 700, 1.5), color: "#111" }}>NEW ARRIVAL</div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "20px 16px" : "36px 40px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {[product.brand, product.condition, product.scale].map((tag) => (
                  <span key={tag} style={{ ...font(10, 600, 1), color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 9px", textTransform: "uppercase" }}>{tag}</span>
                ))}
              </div>
              <h1 style={{ ...font(24, 900, 1), color: C.text, marginBottom: 10, lineHeight: 1.25, textTransform: "uppercase" }}>{product.name}</h1>
              <p style={{ ...font(32, 900, 0), color: C.gold, marginBottom: product.description ? 16 : 24 }}>₱{product.price.toLocaleString()}</p>

              {product.description && (
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, lineHeight: 1.6, color: C.textMuted, marginBottom: 24 }}>{product.description}</p>
              )}

              <div style={{ marginBottom: 28, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                <p style={{ ...font(12, 700, 2), color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Details</p>
                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                  {product.details.map((d, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ color: C.gold, marginTop: 2, flexShrink: 0 }}><IconCheck s={14} c={C.gold} /></span>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: C.textMuted, lineHeight: 1.4 }}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ ...font(13, 700, 1.5), color: soldOut ? "#e53e3e" : C.textMuted, textTransform: "uppercase" }}>{soldOut ? "Sold out" : `Stock: ${product.stock}`}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 30, padding: "4px 8px", border: `1px solid ${C.border}` }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", ...font(20, 700, 0), color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>−</button>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      max={product.stock}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v)) setQty(Math.min(product.stock, Math.max(1, v)));
                      }}
                      style={{ ...font(18, 700, 0), color: C.text, background: "transparent", border: "none", outline: "none", width: 48, textAlign: "center", MozAppearance: "textfield" } as React.CSSProperties}
                    />
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", ...font(20, 700, 0), color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>+</button>
                  </div>
                </div>
                <Btn onClick={handleAdd} full size="lg" disabled={qty < 1 || soldOut}>
                  {soldOut ? "SOLD OUT" : added ? <><IconCheck s={18} c="#111" /> Added to Cart!</> : "ADD TO CART"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Number ───────────────────────────────────────────────────────────
