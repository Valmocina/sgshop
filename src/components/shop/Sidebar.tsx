import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";

export function Sidebar({ filterSearch, setFilterSearch, newArrival, setNewArrival, conditions, setConditions, franchises, setFranchises, brands, setBrands, scales, setScales, minPrice, setMinPrice, maxPrice, setMaxPrice, onReset, mobile }: any) {
  const toggle = <T,>(arr: T[], val: T): T[] => arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const CheckRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => {
    const [hov, setHov] = useState(false);
    return (
      <label onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 6, background: hov ? C.surfaceHover : "transparent", transition: "background 0.15s", marginBottom: 1 }}>
        <div onClick={onChange} style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? C.gold : C.borderLight}`, background: checked ? C.gold : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
          {checked && <IconCheck s={10} c="#111" />}
        </div>
        <span style={{ ...font(12, 500, 0.5), color: checked ? C.text : C.textMuted, textTransform: "uppercase" }}>{label}</span>
      </label>
    );
  };

  const SLabel = ({ children }: { children: string }) => (
    <p style={{ ...font(11, 700, 2), color: C.gold, textTransform: "uppercase", margin: "14px 0 4px", paddingLeft: 6, borderLeft: `2px solid ${C.gold}` }}>
      {children}
    </p>
  );

  return (
    <div className={mobile ? undefined : "sidebar-scroll"} style={mobile ? { width: "100%", padding: "16px 20px", background: "transparent" } : { width: 320, flexShrink: 0, background: C.surface, borderRadius: 12, padding: "16px 12px 16px", border: `1px solid ${C.border}`, position: "sticky", top: 70, maxHeight: "calc(100vh - 90px)", overflowY: "auto" }}>
      <p style={{ ...font(13, 700, 1.5), color: C.text, marginBottom: 8, textTransform: "uppercase" }}>Filters</p>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><IconSearch c={C.text} s={14} /></span>
        <input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search..."
          style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px 8px 30px", ...font(13, 500, 0), color: C.text, outline: "none" }} />
      </div>

      <CheckRow label="New Arrival" checked={newArrival} onChange={() => setNewArrival(!newArrival)} />

      <SLabel>Statue Edition</SLabel>
      {(["Brand New", "Mint in Box"] as Condition[]).map((c) => (
        <CheckRow key={c} label={c === "Brand New" ? "Overseas Factory Pre-Order" : "Monumental Collector Edition"} checked={conditions.includes(c)} onChange={() => setConditions(toggle(conditions, c))} />
      ))}

      <SLabel>Franchise</SLabel>
      {(["Star Wars", "Marvel", "DC"] as Franchise[]).map((f) => (
        <CheckRow key={f} label={f} checked={franchises.includes(f)} onChange={() => setFranchises(toggle(franchises, f))} />
      ))}

      <SLabel>Studio / Brand</SLabel>
      {(["Queen Studios", "Sideshow", "Hot Toys", "Others"] as Brand[]).map((b) => (
        <CheckRow key={b} label={b} checked={brands.includes(b)} onChange={() => setBrands(toggle(brands, b))} />
      ))}

      <SLabel>Scale & Size</SLabel>
      {(["Lifesize", "1:2", "1:3", "1:4"] as Scale[]).map((s) => (
        <CheckRow key={s} label={s === "Lifesize" ? "1:1 Lifesize (Full Scale)" : `${s} Scale Monumental`} checked={scales.includes(s)} onChange={() => setScales(toggle(scales, s))} />
      ))}

      <SLabel>Price (PHP)</SLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min"
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 8px", ...font(12, 500, 0), color: C.text, outline: "none" }} />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max"
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 8px", ...font(12, 500, 0), color: C.text, outline: "none" }} />
      </div>

      <button onClick={onReset} style={{ display: "block", width: "100%", marginTop: 14, padding: "8px 0", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, ...font(12, 700, 1.5), color: C.textMuted, cursor: "pointer", textTransform: "uppercase", transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
        Reset Filters
      </button>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
