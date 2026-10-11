import React, { useState } from "react";
import { C, font } from "@/lib/theme";
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, full }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "outline"; size?: "sm" | "md" | "lg";
  disabled?: boolean; full?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const pad = { sm: "9px 20px", md: "13px 32px", lg: "15px 48px" }[size];
  const fs = { sm: 13, md: 16, lg: 18 }[size];
  const styles: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, border: "none", borderRadius: 40, cursor: disabled ? "default" : "pointer",
    width: full ? "100%" : undefined, padding: pad,
    ...font(fs, 700, 2), textTransform: "uppercase" as const,
    transition: "all 0.18s", opacity: disabled ? 0.45 : 1,
    ...(variant === "primary" && {
      background: hov && !disabled ? C.goldDark : C.gold, color: "#111",
      boxShadow: hov && !disabled ? `0 6px 20px ${C.gold}55` : `0 3px 10px ${C.gold}33`,
      transform: hov && !disabled ? "translateY(-1px)" : "none",
    }),
    ...(variant === "ghost" && {
      background: hov ? C.surfaceHover : "transparent",
      color: C.textMuted, border: `1.5px solid ${C.border}`,
    }),
    ...(variant === "outline" && {
      background: hov ? `${C.gold}18` : "transparent",
      color: C.gold, border: `1.5px solid ${C.gold}`,
    }),
  };
  return (
    <button style={styles} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}