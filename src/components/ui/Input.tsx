import React, { useState } from "react";
import { C, font } from "@/lib/theme";
export function Input({ icon, type = "text", placeholder, value, onChange, label }: {
  icon?: React.ReactNode; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <p style={{ ...font(12, 600, 1.5), color: C.textMuted, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>}
      <div style={{
        position: "relative", display: "flex", alignItems: "center",
        background: focused ? "#fff" : "#F0F0F0",
        borderRadius: 10, border: `1.5px solid ${focused ? C.gold : "#D0D0D0"}`,
        transition: "all 0.2s", boxShadow: focused ? `0 0 0 3px ${C.gold}22` : "none",
      }}>
        {icon && <span style={{ position: "absolute", left: 14, opacity: 0.5, display: "flex" }}>{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            padding: icon ? "13px 16px 13px 44px" : "13px 16px",
            ...font(15, 500, 0.3), color: "#1a1a1a",
          }}
        />
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
