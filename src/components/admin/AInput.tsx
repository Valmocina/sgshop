import React, { useState } from "react";
import { C, A, font, af } from "@/lib/theme";

export function AInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} type={type} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width: "100%", background: A.card, border: `1.5px solid ${focused ? A.gold : A.border}`, borderRadius: 8, padding: "10px 12px", ...af(14, 400), color: A.text, outline: "none", transition: "all 0.18s", boxShadow: focused ? `0 0 0 3px ${A.gold}1a` : "none" }} />
  );
}

