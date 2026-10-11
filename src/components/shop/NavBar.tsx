import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";

export function NavBar({ active, onChange }: { active: Category; onChange: (c: Category) => void }) {
  const cats: Category[] = ["HOME", "ALL", "POPULAR", "STARWARS", "MARVEL", "DC", "OTHERS"];
  return (
    <div style={{ background: C.surface, borderBottom: `2px solid ${C.border}`, display: "flex", paddingLeft: 8, overflow: "auto" }}>
      {cats.map((cat) => {
        const isActive = active === cat;
        return (
          <button key={cat} onClick={() => onChange(cat)} style={{
            padding: "14px 18px", background: "none", border: "none",
            borderBottom: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
            ...font(14, 700, 1.5), color: isActive ? C.gold : C.textMuted,
            cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            marginBottom: -2,
          }}>
            {cat}
          </button>
        );
      })}
    </div>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
