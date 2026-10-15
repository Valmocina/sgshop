import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrderRecord, FulfillmentStatus, ReviewStatus } from "@/types/store";
import { A, af } from "@/lib/theme";
import { stepIndex } from "@/lib/preorder";

const peso = (n: number) => `₱${Number(n).toLocaleString()}`;

type Filter = "to_order" | "in_progress" | "delivery_scheduled" | "delivered" | "stock" | "unpaid" | "archived" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "to_order", label: "Needs supplier order" },
  { key: "in_progress", label: "In progress" },
  { key: "delivery_scheduled", label: "Scheduled deliveries" },
  { key: "delivered", label: "Delivered" },
  { key: "stock", label: "In-stock orders" },
  { key: "unpaid", label: "Unpaid / failed" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

const isPaid = (o: OrderRecord) => o.status === "paid" || o.status === "deposit_paid";
const matches = (o: OrderRecord, f: Filter) => {
  if (f === "archived") return !!o.archived_at;
  if (o.archived_at) return false;
  const pre = o.order_type === "preorder";
  switch (f) {
    case "to_order": return pre && isPaid(o) && o.fulfillment_status === "awaiting_order";
    case "in_progress": return pre && isPaid(o) && ["ordered", "in_transit", "arrived", "scheduled_delivery"].includes(o.fulfillment_status ?? "");
    case "delivery_scheduled": return !!o.delivery_date && isPaid(o) && o.fulfillment_status === "scheduled_delivery";
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
  onSave: (id: string, changes: Partial<OrderRecord>, successMsg: string) => Promise<boolean>;
  busy: boolean;
}) {
  const pre = order.order_type === "preorder";
  const st = STATUS_STYLE[order.status] ?? { label: order.status, color: A.textMuted };
  const balance = Math.max(0, order.total - order.amount_paid);
  const fullyPaid = order.status === "paid" && order.amount_paid >= order.total;
  const orderRef = `SG-${order.id.toUpperCase()}`;

  const [eta, setEta] = useState(order.est_arrival ?? "");
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [review, setReview] = useState<ReviewStatus>(order.review_status ?? "pending");
  const [savingReview, setSavingReview] = useState<ReviewStatus | null>(null);
  const [manageProgress, setManageProgress] = useState(false);

  const dirty = eta !== (order.est_arrival ?? "")
    || notes !== (order.admin_notes ?? "")
    || courier !== (order.courier_name ?? "")
    || tracking !== (order.tracking_number ?? "");

  const details = () => ({
    est_arrival: eta.trim() || null,
    admin_notes: notes.trim() || null,
    courier_name: courier.trim() || null,
    tracking_number: tracking.trim() || null,
  });
  const workflowActive = isPaid(order) && order.status !== "cancelled" && review === "accepted";
  const canAdminCancel = isPaid(order) && order.status !== "cancelled" && order.fulfillment_status !== "delivered";
  const nextProgress: { status: FulfillmentStatus; label: string } | null = ({
    awaiting_order: { status: "ordered", label: "Mark ordered from supplier" },
    ordered: { status: "in_transit", label: "Mark in transit" },
    in_transit: { status: "arrived", label: "Mark arrived" },
    scheduled_delivery: { status: "delivered", label: "Mark delivered" },
  } as Partial<Record<FulfillmentStatus, { status: FulfillmentStatus; label: string }>>)[order.fulfillment_status ?? "awaiting_order"] ?? null;
  const updateReview = async (status: ReviewStatus) => {
    if (busy || savingReview || order.status === "cancelled" || order.fulfillment_status !== "awaiting_order" || status === review) return;
    if (status === "accepted" && !window.confirm("Accept this pre-order and allow it to proceed to supplier ordering?")) return;
    if (status === "rejected" && !window.confirm("Reject this pre-order? This will cancel the order and cannot be undone.")) return;
    const changes: Partial<OrderRecord> = { review_status: status };
    if (status === "rejected") {
      changes.status = "cancelled";
      changes.cancellation_reason = "admin_rejected";
      changes.delivery_date = null;
      changes.delivery_time_slot = null;
    }
    setSavingReview(status);
    try {
      const saved = await onSave(order.id, changes, status === "rejected" ? "Pre-order rejected" : `Pre-order marked ${status === "pending" ? "under review" : "accepted"}`);
      if (saved) setReview(status);
    } finally {
      setSavingReview(null);
    }
  };

  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 12, padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...af(15, 700), color: A.text, lineHeight: 1.3 }}>
            {order.order_items.map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Order"}
          </p>
          <p style={{ ...af(12, 400), color: A.textMuted }}>
            Order Ref: <strong style={{ color: A.text }}>{orderRef}</strong> · {new Date(order.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
            {order.payment_method ? ` · ${order.payment_method === "gcash" ? "GCash" : "Maya"}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ ...af(11, 700), color: pre ? A.gold : A.textMuted, background: pre ? `${A.gold}18` : A.card, borderRadius: 4, padding: "3px 9px" }}>{pre ? "PRE-ORDER" : "IN STOCK"}</span>
          <span style={{ ...af(11, 700), color: st.color, background: `${st.color}18`, borderRadius: 4, padding: "3px 9px" }}>
            {order.status === "cancelled" ? (order.cancellation_reason === "customer_cancelled" ? "Customer Cancelled" : order.cancellation_reason === "admin_rejected" ? "Admin Rejected" : order.cancellation_reason === "admin_cancelled" ? "Admin Cancelled" : "Cancelled") : st.label}
          </span>
          {(order.fulfillment_status === "delivered" || order.archived_at) && (
            <button className="admin-order-button no-print" disabled={busy} onClick={() => onSave(
              order.id,
              { archived_at: order.archived_at ? null : new Date().toISOString() },
              order.archived_at ? "Order restored from archive" : "Delivered order archived",
            )}
              style={{ padding: "5px 10px", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 6, ...af(11, 600), color: A.textMuted, cursor: busy ? "wait" : "pointer" }}>
              {order.archived_at ? "Restore" : "Archive"}
            </button>
          )}
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
      {order.delivery_date && isPaid(order) && (
        <div style={{ background: `${A.gold}15`, border: `1px solid ${A.gold}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{ ...af(12, 700), color: A.gold, textTransform: "uppercase" }}>
              📅 Customer Scheduled White-Glove Supervised Delivery: {new Date(order.delivery_date).toLocaleDateString("en-PH", { dateStyle: "full" })}
            </span>
            <span style={{ ...af(12, 600), color: A.text }}>
              Slot: {order.delivery_time_slot || "Standard Daytime"}
            </span>
            <span style={{ ...af(11, 700), color: A.green, textTransform: "uppercase" }}>
              Delivery status: {order.fulfillment_status === "delivered" ? "Delivered" : "Scheduled"}
            </span>
          </div>
        </div>
      )}
      {pre && isPaid(order) && order.status !== "cancelled" && order.fulfillment_status === "arrived" && !order.delivery_date && (
        <p style={{ ...af(13, 600), color: A.gold, marginBottom: 14 }}>Waiting for customer to schedule delivery.</p>
      )}

      {/* Pre-order fulfilment & dispatch controls */}
      {pre && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Estimated arrival</label>
              <input value={eta} onChange={e => setEta(e.target.value)} placeholder="e.g. 10–12 weeks" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Pre-order Review</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([
                ["pending", "Under Review"],
                ["accepted", "Accepted"],
                ["rejected", "Rejected"],
              ] as [ReviewStatus, string][]).map(([status, label]) => (
                <button className="admin-order-button" key={status} disabled={busy || !!savingReview || order.status === "cancelled" || order.fulfillment_status !== "awaiting_order"} onClick={() => updateReview(status)} style={{
                  padding: "8px 13px", borderRadius: 7, border: `1px solid ${review === status ? A.gold : A.border}`,
                  background: review === status ? `${A.gold}22` : "transparent", ...af(12, 700),
                  color: review === status ? A.gold : A.textMuted, cursor: busy || savingReview || order.status === "cancelled" || order.fulfillment_status !== "awaiting_order" ? "not-allowed" : "pointer",
                  opacity: busy || savingReview || order.status === "cancelled" || order.fulfillment_status !== "awaiting_order" ? 0.65 : 1,
                }}>
                  {savingReview === status ? "Saving…" : label}
                </button>
              ))}
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

          {workflowActive && (
            <div style={{ marginBottom: 12 }}>
              <button className="admin-order-button" onClick={() => setManageProgress(value => !value)} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${A.gold}`, borderRadius: 8, ...af(13, 700), color: A.gold, cursor: "pointer" }}>
                {manageProgress ? "Close Progress" : "Manage Progress"}
              </button>
              {manageProgress && (
                <div style={{ marginTop: 10, padding: "12px 14px", background: A.card, border: `1px solid ${A.border}`, borderRadius: 8 }}>
                  {order.fulfillment_status === "arrived" && !order.delivery_date ? (
                    <p style={{ ...af(13, 600), color: A.gold }}>Waiting for customer to schedule delivery.</p>
                  ) : nextProgress?.status === "delivered" && !fullyPaid ? (
                    <p style={{ ...af(13, 600), color: A.gold }}>Confirm full payment before marking this order delivered.</p>
                  ) : nextProgress && (
                    <button className="admin-order-button" disabled={busy || (nextProgress.status === "delivered" && (!fullyPaid || !order.delivery_date || !order.delivery_time_slot))} onClick={() => {
                      const changes: Partial<OrderRecord> = { ...details(), fulfillment_status: nextProgress.status };
                      if (nextProgress.status === "ordered") changes.ordered_at = new Date().toISOString();
                      onSave(order.id, changes, nextProgress.label);
                    }}
                      style={{ padding: "9px 16px", background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, ...af(13, 700), color: "#111", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
                      {nextProgress.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="admin-order-button" disabled={busy || !dirty} onClick={() => onSave(order.id, details(), "Order details updated")}
              style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${dirty ? A.gold : A.border}`, borderRadius: 8, ...af(13, 600), color: dirty ? A.gold : A.textMuted, cursor: dirty ? "pointer" : "default" }}>
              Save details
            </button>
            {order.status === "deposit_paid" && (
              <button className="admin-order-button" disabled={busy} onClick={() => {
                if (window.confirm(`Confirm you've received the remaining ${peso(balance)} from ${order.customer_name}?`))
                  onSave(order.id, { status: "paid", amount_paid: order.total }, "Balance recorded — order is now fully paid");
              }}
                style={{ padding: "9px 16px", background: `${A.green}18`, border: `1px solid ${A.green}55`, borderRadius: 8, ...af(13, 600), color: A.green, cursor: "pointer" }}>
                Mark balance received ({peso(balance)})
              </button>
            )}
            {canAdminCancel && (
              <button className="admin-order-button" disabled={busy} onClick={() => {
                if (window.confirm("Cancel this order? Any payment already received will remain recorded and will not be refunded automatically."))
                  onSave(order.id, { status: "cancelled", cancellation_reason: "admin_cancelled", delivery_date: null, delivery_time_slot: null }, "Order cancelled by admin");
              }}
                style={{ padding: "9px 16px", background: `${A.red}18`, border: `1px solid ${A.red}55`, borderRadius: 8, ...af(13, 600), color: A.red, cursor: busy ? "wait" : "pointer" }}>
                Cancel Order
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
  const printDeliveredOrders = () => {
    const clearPrintTarget = () => {
      delete document.body.dataset.adminPrint;
      window.removeEventListener("afterprint", clearPrintTarget);
    };
    document.body.dataset.adminPrint = "delivered";
    window.addEventListener("afterprint", clearPrintTarget);
    window.print();
  };

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
  useEffect(() => {
    const refreshOnFocus = () => { void load(); };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [load]);

  const save = async (id: string, changes: Partial<OrderRecord>, successMsg: string) => {
    setBusyId(id);
    try {
      const { data, error: err } = await supabase.from("orders").update(changes).eq("id", id).select("id").maybeSingle();
      if (err || !data) {
        showToast(`Couldn't save: ${err?.message ?? "Order no longer exists or is unavailable."}`, "error");
        return false;
      }
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...changes } : o)));
      showToast(successMsg);
      onChanged?.();
      return true;
    } catch (err) {
      showToast(`Couldn't save: ${err instanceof Error ? err.message : "Unexpected error."}`, "error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    FILTERS.forEach(f => { c[f.key] = orders.filter(o => matches(o, f.key)).length; });
    return c;
  }, [orders]);
  const shown = orders.filter(o => matches(o, filter));

  return (
    <div className="admin-orders-print-area" style={{ padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ ...af(22, 700), color: A.text }}>Orders</h1>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          {(filter === "delivered" || filter === "archived") && (
            <button className="admin-order-button" onClick={printDeliveredOrders} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 7, ...af(13, 600), color: A.textMuted, cursor: "pointer" }}>Print Items</button>
          )}
          <button className="admin-order-button" onClick={load} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 7, ...af(13, 600), color: A.textMuted, cursor: "pointer" }}>Refresh</button>
        </div>
      </div>
      <p className="no-print" style={{ ...af(13, 400), color: A.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
        Lifesize figures aren't stocked. When a customer pre-orders and pays, it lands under <strong style={{ color: A.text }}>Needs supplier order</strong> — place the order with your supplier, then mark it here and keep the progress and arrival estimate up to date.
      </p>

      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const urgent = f.key === "to_order" && counts.to_order > 0;
          return (
            <button className="admin-order-button" key={f.key} onClick={() => { setFilter(f.key); void load(); }} style={{
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
          {shown.map(o => <OrderCard key={`${o.id}:${o.fulfillment_status}:${o.status}:${o.review_status}`} order={o} onSave={save} busy={busyId === o.id} />)}
        </div>
      )}
    </div>
  );
}
