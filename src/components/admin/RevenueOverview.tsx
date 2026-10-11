import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  type OrderRow, type DateRangeKey, getDateRange, formatPeso, isRevenueOrder,
} from "./revenueTypes";
import RevenueChart, { type RevenueBucket } from "./RevenueChart";
import RevenueByCategory, { type CategoryRevenue } from "./RevenueByCategory";
import TopSellingProducts, { type TopProduct } from "./TopSellingProducts";
import RecentTransactions from "./RecentTransactions";

const BORDER = "#2A2A2A";
const SURFACE = "#1A1A1A";
const CARD = "#202020";
const TEXT = "#F0F0F0";
const TEXT_MUTED = "#666";
const GOLD = "#F5A623";
const GOLD_DARK = "#D4891A";
const GREEN = "#22c55e";
const YELLOW = "#eab308";
const RED = "#ef4444";

const af = (size: number, weight = 600): React.CSSProperties => ({
  fontFamily: "'Barlow', sans-serif", fontSize: size, fontWeight: weight,
});

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

export default function RevenueOverview() {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const range = useMemo(
    () => getDateRange(rangeKey, customStart, customEnd),
    [rangeKey, customStart, customEnd]
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      // Single round trip: orders + their line items, embedded via the FK relationship.
      const { data, error: err } = await supabase
        .from("orders")
        .select("id, status, total, refunded_amount, payment_method, customer_name, created_at, order_items(product_name, category, unit_price, quantity)")
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString())
        .order("created_at", { ascending: false });

      if (err) throw err;
      setOrders((data as unknown as OrderRow[]) || []);
    } catch (err: any) {
      console.error("Failed to load revenue data:", err);
      setError(err.message || "Failed to load revenue data. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()]);

  const revenueOrders = useMemo(() => orders.filter(isRevenueOrder), [orders]);

  const totalRevenue = useMemo(() => revenueOrders.reduce((s, o) => s + o.total, 0), [revenueOrders]);
  const refundedAmount = useMemo(() => revenueOrders.reduce((s, o) => s + o.refunded_amount, 0), [revenueOrders]);
  const netRevenue = totalRevenue - refundedAmount;
  const orderCount = revenueOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // ── Revenue over time ──
  const chartBuckets: RevenueBucket[] = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; orders: number; sortKey: number }>();
    for (const o of revenueOrders) {
      const d = new Date(o.created_at);
      let key: string, label: string, sortKey: number;
      if (range.granularity === "hour") {
        key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
        label = d.toLocaleTimeString("en-PH", { hour: "numeric" });
        sortKey = d.getTime() - (d.getTime() % 3600000);
      } else if (range.granularity === "day") {
        key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        label = d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        sortKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      } else {
        key = `${d.getFullYear()}-${d.getMonth()}`;
        label = d.toLocaleDateString("en-PH", { month: "short" });
        sortKey = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      }
      const existing = map.get(key);
      if (existing) { existing.revenue += o.total; existing.orders += 1; }
      else map.set(key, { label, revenue: o.total, orders: 1, sortKey });
    }
    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [revenueOrders, range.granularity]);

  // ── Category revenue ──
  const categoryRevenue: CategoryRevenue[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of revenueOrders) {
      for (const item of o.order_items || []) {
        const amt = item.unit_price * item.quantity;
        map.set(item.category, (map.get(item.category) || 0) + amt);
      }
    }
    return Array.from(map.entries()).map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [revenueOrders]);

  // ── Top-selling products ──
  const topProducts: TopProduct[] = useMemo(() => {
    const map = new Map<string, { unitsSold: number; revenue: number }>();
    for (const o of revenueOrders) {
      for (const item of o.order_items || []) {
        const existing = map.get(item.product_name) || { unitsSold: 0, revenue: 0 };
        existing.unitsSold += item.quantity;
        existing.revenue += item.unit_price * item.quantity;
        map.set(item.product_name, existing);
      }
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [revenueOrders]);

  // ── Export CSV (full period, all statuses) ──
  const exportCsv = () => {
    const header = ["Order ID", "Customer", "Date", "Amount", "Refunded", "Status", "Payment Method"];
    const rows = orders.map(o => [
      o.id,
      o.customer_name,
      new Date(o.created_at).toISOString(),
      o.total.toFixed(2),
      o.refunded_amount.toFixed(2),
      o.status,
      o.payment_method || "",
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const rangeLabel = RANGE_OPTIONS.find(r => r.key === rangeKey)?.label.replace(/\s+/g, "-").toLowerCase() || "custom";
    a.href = url;
    a.download = `sithguy-revenue-${rangeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Clear all data (destructive) ──
  const clearAllData = async () => {
    setClearing(true);
    try {
      // order_items rows cascade-delete automatically via the FK's ON DELETE CASCADE.
      const { error: err } = await supabase.from("orders").delete().gte("created_at", "1900-01-01");
      if (err) throw err;
      await fetchOrders();
    } catch (err: any) {
      console.error("Failed to clear revenue data:", err);
      setError(err.message || "Failed to clear data. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const summaryCards = [
    { label: "Total Revenue", value: formatPeso(totalRevenue), color: GOLD },
    { label: "Orders", value: String(orderCount), color: GREEN },
    { label: "Average Order Value", value: formatPeso(avgOrderValue), color: "#3b82f6" },
    { label: "Refunded Amount", value: formatPeso(refundedAmount), color: YELLOW },
    { label: "Net Revenue", value: formatPeso(netRevenue), color: netRevenue >= 0 ? GREEN : RED },
  ];

  const sectionStyle: React.CSSProperties = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 };

  return (
    <div className="revenue-print-area" style={{ padding: "28px 28px" }}>
      {/* Print-only styling: hides everything else on the page and shows just this section. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .revenue-print-area, .revenue-print-area * { visibility: visible; }
          .revenue-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: #fff !important; }
          .revenue-print-area * { color: #111 !important; background: #fff !important; border-color: #ccc !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ ...af(22, 700), color: TEXT }}>Revenue</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={rangeKey} onChange={e => setRangeKey(e.target.value as DateRangeKey)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "9px 12px", ...af(13, 500), color: TEXT, outline: "none", cursor: "pointer" }}>
            {RANGE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          {rangeKey === "custom" && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 10px", ...af(13, 500), color: TEXT, outline: "none" }} />
              <span style={{ color: TEXT_MUTED }}>to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 10px", ...af(13, 500), color: TEXT, outline: "none" }} />
            </>
          )}
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "9px 14px", ...af(13, 600), color: TEXT_MUTED, cursor: "pointer" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x={6} y={14} width={12} height={8} /></svg>
            Print
          </button>
          <button onClick={exportCsv} disabled={orders.length === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, border: "none", borderRadius: 7, padding: "9px 16px", ...af(13, 700), color: "#111", cursor: orders.length === 0 ? "default" : "pointer", opacity: orders.length === 0 ? 0.5 : 1 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1={12} y1={15} x2={12} y2={3} /></svg>
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print" style={{ background: `${RED}15`, border: `1px solid ${RED}44`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, ...af(13, 500), color: RED }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", ...af(14, 500), color: TEXT_MUTED }}>Loading revenue data…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            {summaryCards.map(({ label, value, color }) => (
              <div key={label} style={{ background: SURFACE, borderRadius: 12, padding: "18px 20px", border: `1px solid ${BORDER}` }}>
                <p style={{ ...af(12, 600), color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</p>
                <p style={{ ...af(24, 700), color }}>{value}</p>
              </div>
            ))}
          </div>

          {orders.length === 0 ? (
            <div style={sectionStyle}>
              <p style={{ textAlign: "center", padding: "40px 0", ...af(14, 500), color: TEXT_MUTED }}>
                No orders in this period yet. Revenue data will appear here once customers start checking out.
              </p>
            </div>
          ) : (
            <>
              {/* Revenue over time */}
              <div style={sectionStyle}>
                <p style={{ ...af(15, 700), color: TEXT, marginBottom: 16 }}>Revenue Over Time</p>
                <RevenueChart buckets={chartBuckets} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0 }}>
                <div style={sectionStyle}>
                  <p style={{ ...af(15, 700), color: TEXT, marginBottom: 16 }}>Revenue by Category</p>
                  <RevenueByCategory data={categoryRevenue} />
                </div>
                <div style={sectionStyle}>
                  <p style={{ ...af(15, 700), color: TEXT, marginBottom: 16 }}>Top-Selling Products</p>
                  <TopSellingProducts products={topProducts} />
                </div>
              </div>
            </>
          )}

          {/* Recent transactions — always shown, even with zero orders, so filters/clear are reachable */}
          <div style={sectionStyle}>
            <p style={{ ...af(15, 700), color: TEXT, marginBottom: 16 }}>Recent Transactions</p>
            <RecentTransactions transactions={orders} onClearAll={clearAllData} clearing={clearing} />
          </div>
        </>
      )}
    </div>
  );
}
