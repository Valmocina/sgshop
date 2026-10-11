import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { CartRow } from "@/components/checkout/CartRow";

export function CartPage({
  cartItems,
  onBack,
  onRemove,
  onUpdateQty,
  onCheckout,
  cartCount,
  onCartClick,
  onAccountClick,
}: {
  cartItems: { product: Product; qty: number }[];
  onBack: () => void;
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, qty: number) => void;
  onCheckout: (product: Product, qty: number) => void;
  cartCount: number;
  onCartClick: () => void;
  onAccountClick: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const total = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const isEmpty = cartItems.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <ShopHeader
        cartCount={cartCount}
        onCartClick={onCartClick}
        onAccountClick={onAccountClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Page header */}
      <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: 0.7 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
          <IconArrowLeft c="#111" s={18} />
        </button>
        <div>
          <p style={{ ...font(11, 600, 3), color: "rgba(0,0,0,0.5)", textTransform: "uppercase", marginBottom: 1 }}>SITHGUY HOBBYSHOP</p>
          <h1 style={{ ...font(26, 900, 2), color: "#111", textTransform: "uppercase" }}>My Cart</h1>
        </div>
        {!isEmpty && (
          <span style={{ marginLeft: "auto", ...font(14, 700, 1), color: "#111", background: "rgba(0,0,0,0.15)", borderRadius: 20, padding: "4px 14px" }}>
            {cartItems.reduce((s, i) => s + i.qty, 0)} {cartItems.reduce((s, i) => s + i.qty, 0) === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "28px 16px", alignItems: "flex-start" }}>
        {isEmpty ? (
          /* ── Empty state ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "80px 24px", textAlign: "center" }}>
            {/* Cart illustration */}
            <div style={{ position: "relative", marginBottom: 32 }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: C.surface, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <IconCart s={52} c={C.textDim} />
              </div>
              <div style={{ position: "absolute", top: -4, right: -4, width: 36, height: 36, borderRadius: "50%", background: C.card, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...font(20, 900, 0), color: C.textDim, lineHeight: 1 }}>0</span>
              </div>
            </div>
            <h2 style={{ ...font(30, 900, 3), color: C.text, textTransform: "uppercase", marginBottom: 10 }}>Your Cart is Empty</h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: C.textMuted, lineHeight: 1.7, maxWidth: 340, marginBottom: 36 }}>
              Looks like you haven't added any collectibles yet. Browse our catalog and find something epic.
            </p>
            <Btn onClick={onBack} size="lg">Browse Collection →</Btn>
          </div>
        ) : (
          /* ── Filled cart ── */
          <div style={{ width: "100%", maxWidth: 860, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", flexDirection: "column" }}>
            {/* Items list */}
            <div style={{ flex: 1, width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {cartItems.map(({ product, qty }) => (
                <CartRow
                  key={product.id}
                  product={product}
                  qty={qty}
                  onRemove={() => onRemove(product.id)}
                  onQtyChange={(q) => onUpdateQty(product.id, q)}
                />
              ))}
            </div>

            {/* Order summary panel */}
            <div style={{ width: "100%", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ background: C.card, padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
                <p style={{ ...font(14, 700, 2), color: C.text, textTransform: "uppercase" }}>Order Summary</p>
              </div>
              <div style={{ padding: "16px 24px" }}>
                {cartItems.map(({ product, qty }) => (
                  <div key={product.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ ...font(12, 500, 0.3), color: C.textMuted, flex: 1, marginRight: 8, lineHeight: 1.3 }}>{product.name.length > 28 ? product.name.slice(0, 28) + "…" : product.name} ×{qty}</span>
                    <span style={{ ...font(13, 700, 0), color: C.text, flexShrink: 0 }}>₱{(product.price * qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ ...font(15, 800, 1.5), color: C.text, textTransform: "uppercase" }}>Total</span>
                  <span style={{ ...font(22, 900, 0), color: C.gold }}>₱{total.toLocaleString()}</span>
                </div>
                {cartItems.length === 1 ? (
                  <Btn onClick={() => onCheckout(cartItems[0].product, cartItems[0].qty)} full size="md">
                    Checkout →
                  </Btn>
                ) : (
                  <div>
                    <p style={{ ...font(11, 500, 0.5), color: C.textMuted, textAlign: "center", marginBottom: 10, fontFamily: "'Barlow', sans-serif" }}>Select an item below to checkout individually</p>
                    {cartItems.map(({ product, qty }) => (
                      <button key={product.id}
                        onClick={() => onCheckout(product, qty)}
                        style={{ display: "block", width: "100%", marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.surfaceHover; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                      >
                        <span style={{ ...font(11, 600, 0.3), color: C.text }}>{product.name.length > 28 ? product.name.slice(0, 28) + "…" : product.name}</span>
                        <span style={{ ...font(12, 800, 0), color: C.gold, display: "block", marginTop: 2 }}>₱{(product.price * qty).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

