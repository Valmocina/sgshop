import { formatPeso } from "./revenueTypes";

const GOLD = "#F5A623";
const BORDER = "#2A2A2A";
const TEXT = "#F0F0F0";
const TEXT_MUTED = "#666";

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export default function RevenueByCategory({ data }: { data: CategoryRevenue[] }) {
  const max = Math.max(1, ...data.map(d => d.revenue));

  if (data.length === 0) {
    return <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED, padding: "20px 0", textAlign: "center" }}>No sales in this period yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map(({ category, revenue }) => (
        <div key={category}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: TEXT }}>{category}</span>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 700, color: GOLD }}>{formatPeso(revenue)}</span>
          </div>
          <div style={{ height: 8, background: BORDER, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(revenue / max) * 100}%`, background: GOLD, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
