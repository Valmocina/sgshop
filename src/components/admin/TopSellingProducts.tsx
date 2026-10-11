import { formatPeso } from "./revenueTypes";

const BORDER = "#2A2A2A";
const CARD = "#202020";
const TEXT = "#F0F0F0";
const TEXT_MUTED = "#666";
const GOLD = "#F5A623";

export interface TopProduct {
  name: string;
  unitsSold: number;
  revenue: number;
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: 0.5, color: TEXT_MUTED, textTransform: "uppercase", textAlign: "left",
  borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap",
};

export default function TopSellingProducts({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED, padding: "20px 0", textAlign: "center" }}>No sales in this period yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr style={{ background: CARD }}>
            <th style={thStyle}>Product</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Units Sold</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p.name} style={{ borderBottom: i === products.length - 1 ? "none" : `1px solid ${BORDER}` }}>
              <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 500, color: TEXT }}>{p.name}</td>
              <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED, textAlign: "right" }}>{p.unitsSold}</td>
              <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 700, color: GOLD, textAlign: "right" }}>{formatPeso(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
