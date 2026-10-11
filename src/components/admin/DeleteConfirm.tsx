import type { Product } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";

export function DeleteConfirm({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, background: A.surface, borderRadius: 14, border: `1px solid ${A.border}`, overflow: "hidden" }}>
        <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${A.red}18`, border: `1.5px solid ${A.red}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={A.red} strokeWidth={2.5} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </div>
          <h3 style={{ ...af(17, 700), color: A.text, marginBottom: 8 }}>Delete Product?</h3>
          <p style={{ ...af(13, 400), color: A.textMuted, lineHeight: 1.6 }}>
            Are you sure you want to delete<br />
            <strong style={{ color: A.text }}>{product.name}</strong>?<br />
            This action cannot be undone.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 8, ...af(14, 600), color: A.textMuted, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px 0", background: A.red, border: "none", borderRadius: 8, ...af(14, 700), color: "#fff", cursor: "pointer", boxShadow: `0 3px 10px ${A.red}44` }}>
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
