import { C, A, font, af } from "@/lib/theme";

export function AToggle({ label, checked, onChange, activeColor = A.green }: { label: string; checked: boolean; onChange: () => void; activeColor?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? activeColor : A.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
      </div>
      <span style={{ ...af(13, 500), color: checked ? A.text : A.textMuted }}>{label}</span>
    </label>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
