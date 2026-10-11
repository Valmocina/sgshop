import React, { useState } from "react";
import { C, A, font, af } from "@/lib/theme";

export function ActionBtn({ title, color, onClick, children }: { title: string; color: string; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${hov ? color : A.border}`, background: hov ? `${color}18` : "transparent", color: hov ? color : A.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

