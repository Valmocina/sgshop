import React, { useEffect, useMemo, useState } from "react";
import type { Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import headerCollage from "@/assets/header-collage.png";

export function ShopHeader({ cartCount, onCartClick, onAccountClick, onLogout, customerLoggedIn, searchQuery, onSearchChange, popIn = false, onPopInEnd }: {
  cartCount: number; onCartClick: () => void; onAccountClick: () => void;
  onLogout: () => void; customerLoggedIn: boolean;
  searchQuery: string; onSearchChange: (v: string) => void;
  popIn?: boolean; onPopInEnd?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 640;
  return (
    <div className={popIn ? "shop-header-pop" : undefined} onAnimationEnd={popIn ? onPopInEnd : undefined} style={{ minHeight: "16.667vh", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: C.goldDark, backgroundImage: `url(${headerCollage})`, backgroundSize: "cover", backgroundPosition: "center 30%", padding: isMobile ? "8px 12px" : "10px 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: `0 2px 20px rgba(0,0,0,0.5)`, overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(245,166,35,0.55), rgba(212,137,26,0.62))", pointerEvents: "none" }} />
      {/* Row 1: logo + actions */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: isMobile ? 10 : 20, marginBottom: isMobile ? 8 : 0 }}>
        <Logo size="md" />
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
              <IconSearch c="#111" s={20} />
            </span>
            <input
              value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search collectibles..."
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{
                width: "100%", borderRadius: 30, border: `1.5px solid ${focused ? "#fff" : "transparent"}`,
                background: "rgba(255,255,255,0.85)",
                padding: "10px 16px 10px 44px",
                ...font(14, 500, 0.3), color: "#111",
                outline: "none", transition: "all 0.2s",
              }}
            />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20, marginLeft: "auto" }}>
          {[
            { icon: <IconCart c="#111" s={isMobile ? 28 : 32} />, label: "CART", badge: cartCount, onClick: onCartClick },
            { icon: <IconUser c="#111" s={isMobile ? 26 : 30} />, label: "ACCOUNT", badge: 0, onClick: onAccountClick },
          ].map(({ icon, label, badge, onClick }) => (
            <button key={label} onClick={onClick} style={{ minWidth: 48, minHeight: 48, padding: 4, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                {icon}
                {badge > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: "#e53e3e", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", ...font(10, 700, 0), border: "1.5px solid #fff" }}>
                    {badge}
                  </span>
                )}
              </div>
              {!isMobile && <span style={{ ...font(10, 700, 1.5), color: "#111", textTransform: "uppercase" }}>{label}</span>}
            </button>
          ))}
          {customerLoggedIn && (
            <button
              onClick={onLogout}
              style={{ minHeight: 44, padding: isMobile ? "0 10px" : "0 16px", border: "1px solid rgba(17,17,17,0.55)", borderRadius: 8, background: "rgba(255,255,255,0.75)", color: "#111", cursor: "pointer", ...font(isMobile ? 10 : 12, 700, 1.2) }}
            >
              LOG OUT
            </button>
          )}
        </div>
      </div>
      {/* Row 2 (mobile only): search bar */}
      {isMobile && (
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
            <IconSearch c="#111" s={18} />
          </span>
          <input
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search collectibles..."
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{
              width: "100%", borderRadius: 30, border: `1.5px solid ${focused ? "#fff" : "transparent"}`,
              background: "rgba(255,255,255,0.85)",
              padding: "9px 14px 9px 36px",
              ...font(13, 500, 0.3), color: "#111",
              outline: "none", transition: "all 0.2s", boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Nav Bar ──────────────────────────────────────────────────────────────────
