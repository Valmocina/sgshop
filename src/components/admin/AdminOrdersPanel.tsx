import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrderRecord, FulfillmentStatus } from "@/types/store";
import { A, af } from "@/lib/theme";
import { FULFILLMENT_STEPS, stepIndex } from "@/lib/preorder";

const peso = (n: number) => `₱${Number(n).toLocaleString()}`;

type Filter = "to_order" | "in_progress" | "delivery_scheduled" | "delivered" | "stock" | "unpaid" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "to_order", label: "Needs supplier order" },
  { key: "in_progress", label: "In progress" },
  { key: "delivery_scheduled", label: "Scheduled deliveries" },
  { key: "delivered", label: "Delivered" },
  { key: "stock", label: "In-stock orders" },
  { key: "unpaid", label: "Unpaid / failed" },
  { key: "all", label: "All" },
];

const isPaid = (o: OrderRecord) => o.status === "paid" || o.status === "deposit_paid";
const matches = (o: OrderRecord, f: Filter) => {
  const pre = o.order_type === "preorder";
  switch (f) {
    case "to_order": return pre && isPaid(o) && o.fulfillment_status === "awaiting_order";
    case "in_progress": return pre && isPaid(o) && ["ordered", "in_transit", "arrived"].includes(o.fulfillment_status ?? "");
    case "delivery_scheduled": return !!o.delivery_date && o.fulfillment_status !== "delivered";
    case "delivered": return pre && isPaid(o) && o.fulfillment_status === "delivered";
    case "stock": return !pre && isPaid(o);
    case "unpaid": return o.status === "pending" || o.status === "failed" || o.status === "cancelled";
    default: return true;
  }
};

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: A.green },
  deposit_paid: { label: "Deposit paid", color: A.gold },
  pending: { label: "Awaiting payment", color: A.textMuted },
  failed: { label: "Failed", color: A.red },
  cancelled: { label: "Cancelled", color: A.red },
  refunded: { label: "Refunded", color: A.yellow },
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: A.card, border: `1px solid ${A.border}`, borderRadius: 7,
  padding: "8px 10px", ...af(13, 400), color: A.text, outline: "none",
};
const labelStyle: React.CSSProperties = { ...af(11, 700, 0.5), color: A.textMuted, textTransform: "uppercase", display: "block", marginBottom: 4 };

function OrderCard({ order, onSave, busy }: {
  order: OrderRecord;
  onSave: (id: string, changes: Partial<OrderRecord>, successMsg: string) => Promise<void>;
  busy: boolean;
}) {
  const pre = order.order_type === "preorder";
  const st = STATUS_STYLE[order.status] ?? { label: order.status, color: A.textMuted };
  const balance = Math.max(0, order.total - order.amount_paid);

  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(order.fulfillment_status ?? "awaiting_order");
  const [eta, setEta] = useState(order.est_arrival ?? "");
  const [ref, setRef] = useState(order.supplier_ref ?? "");
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [review, setReview] = useState(order.review_status ?? "accepted");

  const dirty = fulfillment !== (order.fulfillment_status ?? "awaiting_order")
    || eta !== (order.est_arrival ?? "")
    || ref !== (order.supplier_ref ?? "")
    || notes !== (order.admin_notes ?? "")
    || courier !== (order.courier_name ?? "")
    || tracking !== (order.tracking_number ?? "")
    || review !== (order.review_status ?? "accepted");

  const details = () => ({
    est_arrival: eta.trim() || null,
    supplier_ref: ref.trim() || null,
    admin_notes: notes.trim() || null,
    courier_name: courier.trim() || null,
    tracking_number: tracking.trim() || null,
    review_status: review,
  });

  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...af(15, 700), color: A.text, lineHeight: 1.3 }}>
            {order.order_items.map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Order"}
          </p>
          <p style={{ ...af(12, 400), color: A.textMuted }}>
            #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
            {order.payment_method ? ` · ${order.payment_method === "gcash" ? "GCash" : "Maya"}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ ...af(11, 700), color: pre ? A.gold : A.textMuted, background: pre ? `${A.gold}18` : A.card, borderRadius: 4, padding: "3px 9px" }}>{pre ? "PRE-ORDER" : "IN STOCK"}</span>
          <span style={{ ...af(11, 700), color: st.color, background: `${st.color}18`, borderRadius: 4, padding: "3px 9px" }}>{st.label}</span>
        </div>
      </div>

      {/* Customer + money */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: pre ? 16 : 0 }}>
        <div>
          <span style={labelStyle}>Customer</span>
          <p style={{ ...af(14, 600), color: A.text }}>{order.customer_name}</p>
          {order.customer_phone && <p style={{ ...af(13, 400) }}><a href={`tel:${order.customer_phone}`} style={{ color: A.gold, textDecoration: "none" }}>{order.customer_phone}</a></p>}
          {order.customer_email && <p style={{ ...af(13, 400), overflowWrap: "anywhere" }}><a href={`mailto:${order.customer_email}`} style={{ color: A.gold, textDecoration: "none" }}>{order.customer_email}</a></p>}
        </div>
        <div>
          <span style={labelStyle}>Payment</span>
          <p style={{ ...af(13, 400), color: A.textMuted }}>Total <strong style={{ color: A.text }}>{peso(order.total)}</strong></p>
          <p style={{ ...af(13, 400), color: A.textMuted }}>Paid <strong style={{ color: A.text }}>{peso(order.amount_paid)}</strong>{pre && order.payment_option === "deposit" ? " (deposit)" : ""}</p>
          {balance > 0 && isPaid(order) && <p style={{ ...af(13, 400), color: A.textMuted }}>Balance due <strong style={{ color: A.gold }}>{peso(balance)}</strong></p>}
        </div>
      </div>

      {/* Customer-Scheduled Delivery Banner */}
      {order.delivery_date && (
        <div style={{ background: `${A.gold}15`, border: `1px solid ${A.gold}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{ ...af(12, 700), color: A.gold, textTransform: "uppercase" }}>
              📅 Customer Scheduled Delivery: {new Date(order.delivery_date).toLocaleDateString("en-PH", { dateStyle: "full" })}
            </span>
            <span style={{ ...af(12, 600), color: A.text }}>
              Slot: {order.delivery_time_slot || "Standard Daytime"}
            </span>
          </div>
        </div>
      )}

      {/* Pre-order fulfilment & dispatch controls */}
      {pre && isPaid(order) && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Progress</label>
              <select value={fulfillment} onChange={e => setFulfillment(e.target.value as FulfillmentStatus)} style={{ ...inputStyle, cursor: "pointer" }}>
                {FULFILLMENT_STEPS.map(s => <option key={s.key} value={s.key}>{s.admin}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estimated arrival</label>
              <input value={eta} onChange={e => setEta(e.target.value)} placeholder="e.g. 10–12 weeks" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Supplier order ref</label>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="PO / tracking no." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pre-order Review</label>
              <select value={review} onChange={e => setReview(e.target.value as any)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="accepted">Accepted</option>
                <option value="pending">Needs Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Courier Partner</label>
              <input value={courier} onChange={e => setCourier(e.target.value)} placeholder="e.g. Lalamove, J&T, White-glove" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Courier Tracking / Waybill</label>
              <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking number" style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Internal notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Only visible to staff — delivery arrangements, supplier notes…" rows={2}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 14 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {order.fulfillment_status === "awaiting_order" && (
              <button disabled={busy} onClick={() => onSave(order.id, { ...details(), fulfillment_status: "ordered", ordered_at: new Date().toISOString() }, "Marked as ordered from supplier")}
                style={{ padding: "9px 16px", background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, ...af(13, 700), color: "#111", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                Mark ordered from supplier
              </button>
            )}
            {order.fulfillment_status === "arrived" && order.delivery_date && (
              <button disabled={busy} onClick={() => onSave(order.id, { ...details(), fulfillment_status: "delivered" }, "Marked as delivered")}
                style={{ padding: "9px 16px", background: `${A.green}20`, border: `1px solid ${A.green}77`, borderRadius: 8, ...af(13, 700), color: A.green, cursor: "pointer" }}>
                Mark Delivered by Courier ✓
              </button>
            )}
            <button disabled={busy || !dirty} onClick={() => onSave(order.id, { ...details(), fulfillment_status: fulfillment }, "Order updated")}
              style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${dirty ? A.gold : A.border}`, borderRadius: 8, ...af(13, 600), color: dirty ? A.gold : A.textMuted, cursor: dirty ? "pointer" : "default" }}>
              Save changes
            </button>
            {order.status === "deposit_paid" && (
              <button disabled={busy} onClick={() => {
                if (window.confirm(`Confirm you've received the remaining ${peso(balance)} from ${order.customer_name}?`))
                  onSave(order.id, { status: "paid", amount_paid: order.total }, "Balance recorded — order is now fully paid");
              }}
                style={{ padding: "9px 16px", background: `${A.green}18`, border: `1px solid ${A.green}55`, borderRadius: 8, ...af(13, 600), color: A.green, cursor: "pointer" }}>
                Mark balance received ({peso(balance)})
              </button>
            )}
            {stepIndex(order.fulfillment_status) >= 0 && order.ordered_at && (
              <span style={{ ...af(12, 400), color: A.textMuted }}>Ordered {new Date(order.ordered_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Admin: all customer orders, with the pre-order workflow (customer pays → admin orders from supplier → arrival → delivery). */
export function AdminOrdersPanel({ showToast, onChanged }: {
  showToast: (msg: string, type?: "success" | "error") => void;
  onChanged?: () => void;
}) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("to_order");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(product_name, category, unit_price, quantity)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (err) setError(err.message);
    else setOrders((data as unknown as OrderRecord[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (id: string, changes: Partial<OrderRecord>, successMsg: string) => {
    setBusyId(id);
    const { error: err } = await supabase.from("orders").update(changes).eq("id", id);
    setBusyId(null);
    if (err) { showToast(`Couldn't save: ${err.message}`, "error"); return; }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...changes } : o)));
    showToast(successMsg);
    onChanged?.();
  };

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    FILTERS.forEach(f => { c[f.key] = orders.filter(o => matches(o, f.key)).length; });
    return c;
  }, [orders]);
  const shown = orders.filter(o => matches(o, filter));

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ ...af(22, 700), color: A.text }}>Orders</h1>
        <button onClick={load} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 7, ...af(13, 600), color: A.textMuted, cursor: "pointer" }}>Refresh</button>
      </div>
      <p style={{ ...af(13, 400), color: A.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
        Lifesize figures aren't stocked. When a customer pre-orders and pays, it lands under <strong style={{ color: A.text }}>Needs supplier order</strong> — place the order with your supplier, then mark it here and keep the progress and arrival estimate up to date.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const urgent = f.key === "to_order" && counts.to_order > 0;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "8px 14px", borderRadius: 20, cursor: "pointer", ...af(13, active ? 700 : 500),
              background: active ? `${A.gold}18` : A.card, color: active ? A.gold : A.textMuted,
              border: `1px solid ${active ? A.gold : urgent ? `${A.gold}66` : A.border}`,
            }}>
              {f.label} <span style={{ opacity: 0.8 }}>({counts[f.key]})</span>
            </button>
          );
        })}
      </div>

      {error && <p style={{ ...af(13, 500), color: A.red, background: `${A.red}15`, border: `1px solid ${A.red}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>{error}</p>}
      {loading ? (
        <p style={{ ...af(14, 400), color: A.textMuted, padding: "40px 0", textAlign: "center" }}>Loading orders…</p>
      ) : shown.length === 0 ? (
        <p style={{ ...af(14, 400), color: A.textMuted, padding: "48px 0", textAlign: "center" }}>
          {filter === "to_order" ? "Nothing waiting — every paid pre-order has been ordered from the supplier." : "No orders in this view."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {shown.map(o => <OrderCard key={`${o.id}:${o.fulfillment_status}:${o.status}`} order={o} onSave={save} busy={busyId === o.id} />)}
        </div>
      )}
    </div>
  );
}
