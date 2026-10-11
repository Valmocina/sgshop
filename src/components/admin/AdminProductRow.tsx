import React, { useState } from "react";
import { isPreOrder } from "@/lib/preorder";
import type { Product } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { ActionBtn } from "@/components/admin/ActionBtn";

export function AdminProductRow({ product: p, isLast, onEdit, onDelete, onToggleHide, onToggleAvail, onToggleFeatured }: {
  product: Product; isLast: boolean;
  onEdit: () => void; onDelete: () => void;
  onToggleHide: () => void; onToggleAvail: () => void; onToggleFeatured: () => void;
}) {
  const [hov, setHov] = useState(false);
  const tdStyle: React.CSSProperties = { padding: "11px 14px", borderBottom: isLast ? "none" : `1px solid ${A.border}`, verticalAlign: "middle" };
  const isVisible = !p.is_hidden && p.is_available !== false;
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? A.card : "transparent", transition: "background 0.12s", opacity: p.is_hidden ? 0.5 : 1 }}>
      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, background: A.card }} />
          <div>
            <p style={{ ...af(13, 600), color: A.text, lineHeight: 1.3 }}>{p.name}</p>
            <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
              {p.new && <span style={{ ...af(10, 700), color: "#111", background: A.gold, borderRadius: 3, padding: "1px 5px" }}>NEW</span>}
              {p.is_featured && <span style={{ ...af(10, 700), color: A.gold, background: `${A.gold}18`, borderRadius: 3, padding: "1px 5px", border: `1px solid ${A.gold}44` }}>FEATURED</span>}
            </div>
          </div>
        </div>
      </td>
      <td style={tdStyle}><span style={{ ...af(12, 500), color: A.textMuted }}>{p.category}</span></td>
      <td style={tdStyle}><span style={{ ...af(14, 700), color: A.gold }}>₱{p.price.toLocaleString()}</span></td>
      <td style={tdStyle}>
        {isPreOrder(p)
          ? <span style={{ ...af(11, 700), color: A.gold, background: `${A.gold}18`, border: `1px solid ${A.gold}44`, borderRadius: 4, padding: "2px 8px" }}>PRE-ORDER</span>
          : <span style={{ ...af(13, 700), color: p.stock === 0 ? A.red : p.stock <= 2 ? A.yellow : A.green }}>{p.stock}</span>}
      </td>
      <td style={tdStyle}>
        <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
          <span style={{ ...af(11, 700), color: isVisible ? A.green : A.textMuted, background: isVisible ? `${A.green}15` : `${A.border}`, borderRadius: 4, padding: "2px 8px", display: "inline-block" }}>
            {p.is_hidden ? "Hidden" : p.is_available === false ? "Unavailable" : "Visible"}
          </span>
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <ActionBtn title={p.is_hidden ? "Show" : "Hide"} color={p.is_hidden ? A.green : A.textMuted} onClick={onToggleHide}>
            {p.is_hidden
              ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx={12} cy={12} r={3}/></svg>
              : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1={1} y1={1} x2={23} y2={23}/></svg>
            }
          </ActionBtn>
          <ActionBtn title={p.is_featured ? "Unfeature" : "Feature"} color={p.is_featured ? A.gold : A.textMuted} onClick={onToggleFeatured}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill={p.is_featured ? A.gold : "none"} stroke={p.is_featured ? A.gold : "currentColor"} strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </ActionBtn>
          <ActionBtn title="Edit" color={A.blue} onClick={onEdit}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </ActionBtn>
          <ActionBtn title="Delete" color={A.red} onClick={onDelete}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

