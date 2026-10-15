// ─── Revenue tab: shared types + date-range helpers ────────────────────────
// Kept separate from RevenueOverview.tsx so the subcomponents (RevenueChart,
// RevenueByCategory, TopSellingProducts, RecentTransactions) can import
// types without importing the orchestrator itself.

export type OrderItemRow = {
  product_name: string;
  category: string;
  unit_price: number;
  quantity: number;
};

export type OrderRow = {
  id: string;
  status: string; // "pending" | "paid" | "failed" | "cancelled" | "refunded"
  total: number;
  refunded_amount: number;
  payment_method: string | null;
  customer_name: string;
  created_at: string;
  archived_at: string | null;
  order_items: OrderItemRow[];
};

// Orders in these statuses count as real, successful revenue.
export const REVENUE_STATUSES = ["paid", "refunded"];

export type DateRangeKey = "today" | "week" | "month" | "lastMonth" | "year" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  granularity: "hour" | "day" | "month";
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getDateRange(key: DateRangeKey, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  switch (key) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now), granularity: "hour" };
    case "week": {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1;
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - diffToMonday);
      return { start, end: endOfDay(now), granularity: "day" };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: endOfDay(now), granularity: "day" };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, granularity: "day" };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: endOfDay(now), granularity: "month" };
    }
    case "custom": {
      const start = customStart ? startOfDay(new Date(customStart)) : startOfDay(now);
      const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
      const spanDays = (end.getTime() - start.getTime()) / 86400000;
      return { start, end, granularity: spanDays > 60 ? "month" : "day" };
    }
  }
}

export function formatPeso(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Only statuses in REVENUE_STATUSES count toward any revenue metric.
export function isRevenueOrder(o: OrderRow): boolean {
  return REVENUE_STATUSES.includes(o.status);
}
