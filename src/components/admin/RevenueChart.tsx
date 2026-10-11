import { useRef, useState } from "react";
import { formatPeso } from "./revenueTypes";

export interface RevenueBucket {
  label: string; // pre-formatted x-axis label (e.g. "2PM", "Mon 3", "Jan")
  revenue: number;
  orders: number;
}

// Admin theme colors — kept local since this file lives outside App.tsx.
// Values match the existing admin palette (A.gold / A.card / A.border / A.textMuted).
const GOLD = "#F5A623";
const GOLD_SOFT = "rgba(245, 166, 35, 0.18)";
const BORDER = "#2A2A2A";
const TEXT_MUTED = "#666";
const TEXT = "#F0F0F0";

export default function RevenueChart({ buckets }: { buckets: RevenueBucket[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 800;
  const height = 260;
  const padL = 50, padR = 16, padT = 16, padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxRevenue = Math.max(1, ...buckets.map(b => b.revenue));
  const n = buckets.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const points = buckets.map((b, i) => {
    const x = padL + (n > 1 ? i * stepX : innerW / 2);
    const y = padT + innerH - (b.revenue / maxRevenue) * innerH;
    return { x, y, ...b };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`
    : "";

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const relX = (e.clientX - rect.left) * scaleX;
    let idx = n > 1 ? Math.round((relX - padL) / stepX) : 0;
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  // Show every label if few buckets, else thin them out so text doesn't overlap.
  const labelStride = Math.max(1, Math.ceil(n / 10));

  if (n === 0) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_MUTED, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
        No data for this period
      </div>
    );
  }

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = padT + innerH - f * innerH;
          return (
            <line key={f} x1={padL} y1={y} x2={width - padR} y2={y} stroke={BORDER} strokeWidth={1} />
          );
        })}
        {/* Y axis labels */}
        {[0, 0.5, 1].map(f => {
          const y = padT + innerH - f * innerH;
          return (
            <text key={f} x={padL - 8} y={y + 4} textAnchor="end" fontSize={10} fill={TEXT_MUTED} fontFamily="'Barlow', sans-serif">
              {formatPeso(maxRevenue * f).replace(".00", "")}
            </text>
          );
        })}
        {/* Area + line */}
        {areaPath && <path d={areaPath} fill={GOLD_SOFT} stroke="none" />}
        <path d={linePath} fill="none" stroke={GOLD} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 2.5} fill={GOLD} stroke={hoverIdx === i ? "#111" : "none"} strokeWidth={hoverIdx === i ? 1.5 : 0} />
        ))}
        {/* Hover line */}
        {hovered && (
          <line x1={hovered.x} y1={padT} x2={hovered.x} y2={padT + innerH} stroke={GOLD} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        )}
        {/* X labels */}
        {points.map((p, i) =>
          i % labelStride === 0 ? (
            <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill={TEXT_MUTED} fontFamily="'Barlow', sans-serif">
              {p.label}
            </text>
          ) : null
        )}
      </svg>

      {hovered && (
        <div
          style={{
            position: "absolute",
            left: `${(hovered.x / width) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            transform: "translate(-50%, -115%)",
            background: "#1a1a1a",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: "8px 12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            zIndex: 5,
          }}
        >
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>{hovered.label}</p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 700, color: GOLD }}>{formatPeso(hovered.revenue)}</p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: TEXT }}>{hovered.orders} order{hovered.orders === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}
