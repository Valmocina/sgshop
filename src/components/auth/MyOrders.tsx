import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrderRecord } from "@/types/store";
import { C, font } from "@/lib/theme";
import { ProcurementTimeline } from "@/components/shop/ProcurementTimeline";
import { FULFILLMENT_STEPS, stepIndex } from "@/lib/preorder";

const peso = (n: number) => `₱${Number(n).toLocaleString()}`;
const body: React.CSSProperties = { fontFamily: "'Barlow', sans-serif", fontSize: 13, color: C.textMuted, lineHeight: 1.5 };

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  paid: { text: "Paid", color: "#22c55e" },
  deposit_paid: { text: "Deposit paid", color: C.gold },
  refunded: { text: "Refunded", color: "#eab308" },
  cancelled: { text: "Cancelled", color: "#ef4444" },
};

function OrderCard({ order, onReload }: { order: OrderRecord; onReload?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(order.delivery_date ?? "");
  const [selectedSlot, setSelectedSlot] = useState(order.delivery_time_slot ?? "Morning (9:00 AM - 1:00 PM)");
  const [savingSchedule, setSavingSchedule] = useState(false);

  const preorder = order.order_type === "preorder";
  const st = STATUS_LABEL[order.status] ?? { text: order.status, color: C.textMuted };
  const balance = Math.max(0, order.total - order.amount_paid);
  const step = stepIndex(order.fulfillment_status);
  const stepName = FULFILLMENT_STEPS[step]?.customer;
  const items = order.order_items ?? [];
  const isArrived = order.fulfillment_status === "arrived";
  const isDelivered = order.fulfillment_status === "delivered";

  const handleConfirmSchedule = async () => {
    if (!selectedDate) return;
    setSavingSchedule(true);
    const { error } = await supabase
      .from("orders")
      .update({
        delivery_date: selectedDate,
        delivery_time_slot: selectedSlot,
      })
      .eq("id", order.id);
    setSavingSchedule(false);
    if (!error) {
      setIsScheduling(false);
      if (onReload) onReload();
    } else {
      alert("Unable to save delivery schedule: " + error.message);
    }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...font(14, 700, 0.5), color: C.text, textTransform: "uppercase", lineHeight: 1.3 }}>
            {items.map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Order"}
          </p>
          <p style={{ ...body, fontSize: 12, color: C.textDim }}>
            {new Date(order.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })} · #{order.id.slice(0, 8)}
            {preorder && " · Pre-order"}
          </p>
        </div>
        <span style={{ ...font(11, 800, 1), color: st.color, background: `${st.color}1a`, border: `1px solid ${st.color}55`, borderRadius: 20, padding: "3px 12px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{st.text}</span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12 }}>
        <span style={body}>Total <strong style={{ color: C.text }}>{peso(order.total)}</strong></span>
        <span style={body}>Paid <strong style={{ color: C.text }}>{peso(order.amount_paid)}</strong></span>
        {balance > 0 && order.status !== "cancelled" && <span style={body}>Balance on arrival <strong style={{ color: C.gold }}>{peso(balance)}</strong></span>}
        {preorder && order.est_arrival && <span style={body}>Est. arrival <strong style={{ color: C.text }}>{order.est_arrival}</strong></span>}
      </div>

      {/* Arrival Confirmation & Delivery Scheduling on Webpage */}
      {(isArrived || isDelivered) && order.status !== "cancelled" && (
        <div style={{ marginTop: 14, background: isDelivered ? "#16a34a12" : `${C.gold}15`, border: `1px solid ${isDelivered ? "#16a34a44" : `${C.gold}55`}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{isDelivered ? "✓" : "🎉"}</span>
            <strong style={{ ...font(12, 800, 1), color: isDelivered ? "#22c55e" : C.gold, textTransform: "uppercase" }}>
              {isDelivered ? "Order Delivered Successfully" : "Item Arrival Confirmed in the Philippines"}
            </strong>
          </div>
          <p style={{ ...body, fontSize: 12, color: C.text, marginBottom: 10 }}>
            {isDelivered
              ? "Your item was successfully delivered by our courier service."
              : "Your collectible has arrived at our local facility and cleared customs! You can now select your preferred delivery date."}
          </p>

          {order.delivery_date && !isScheduling ? (
            <div style={{ background: C.surface, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
              <p style={{ ...font(11, 700, 1), color: "#22c55e", textTransform: "uppercase", marginBottom: 4 }}>
                📅 Scheduled Delivery Date
              </p>
              <p style={{ ...body, fontSize: 13, color: C.text }}>
                <strong>Date:</strong> {new Date(order.delivery_date).toLocaleDateString("en-PH", { dateStyle: "full" })}
              </p>
              <p style={{ ...body, fontSize: 13, color: C.text }}>
                <strong>Time Slot:</strong> {order.delivery_time_slot || "Morning (9:00 AM - 1:00 PM)"}
              </p>
              {order.courier_name && (
                <p style={{ ...body, fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                  <strong>Courier:</strong> {order.courier_name} {order.tracking_number ? `(#${order.tracking_number})` : ""}
                </p>
              )}
              {!isDelivered && (
                <button onClick={() => setIsScheduling(true)} style={{ marginTop: 8, background: "none", border: "none", color: C.gold, cursor: "pointer", ...font(11, 700, 1), textTransform: "uppercase", padding: 0 }}>
                  Reschedule Delivery ✎
                </button>
              )}
            </div>
          ) : !isDelivered ? (
            <div style={{ background: C.surface, borderRadius: 8, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <p style={{ ...font(11, 700, 1), color: C.gold, textTransform: "uppercase", marginBottom: 8 }}>
                Select Delivery Date & Time
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Preferred Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Time Slot</label>
                  <select
                    value={selectedSlot}
                    onChange={e => setSelectedSlot(e.target.value)}
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none", cursor: "pointer" }}
                  >
                    <option value="Morning (9:00 AM - 1:00 PM)">Morning (9:00 AM – 1:00 PM)</option>
                    <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM – 5:00 PM)</option>
                    <option value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={savingSchedule || !selectedDate}
                  onClick={handleConfirmSchedule}
                  style={{
                    padding: "7px 14px",
                    background: `linear-gradient(135deg, ${C.gold}, #c89528)`,
                    border: "none",
                    borderRadius: 6,
                    color: "#111",
                    ...font(12, 700, 1),
                    cursor: selectedDate ? "pointer" : "not-allowed",
                    opacity: selectedDate ? 1 : 0.6,
                  }}
                >
                  {savingSchedule ? "Saving..." : "Confirm Delivery Date"}
                </button>
                {isScheduling && (
                  <button onClick={() => setIsScheduling(false)} style={{ padding: "7px 12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {preorder && order.fulfillment_status && order.status !== "cancelled" && (
        <>
          <button onClick={() => setOpen(o => !o)} style={{ marginTop: 12, background: "none", border: "none", padding: 0, cursor: "pointer", ...font(12, 700, 1.5), color: C.gold, textTransform: "uppercase" }}>
            {open ? "Hide progress ▲" : `Progress: ${stepName} ▼`}
          </button>
          {open && <div style={{ marginTop: 14 }}><ProcurementTimeline activeIndex={step} title="Order progress" /></div>}
        </>
      )}
    </div>
  );
}

/** The signed-in customer's own orders (row-level security limits the query to their rows). */
export function MyOrders() {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    supabase
      .from("orders")
      .select("*, order_items(product_name, category, unit_price, quantity)")
      .in("status", ["paid", "deposit_paid", "refunded", "cancelled"])
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setOrders((data as unknown as OrderRecord[]) ?? []);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div style={{ background: C.surface, borderRadius: 14, padding: "24px 28px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
      <p style={{ ...font(14, 700, 2), color: C.text, textTransform: "uppercase", marginBottom: 16 }}>My Orders</p>
      {error && <p style={{ ...body, color: "#e53e3e" }}>Couldn't load your orders: {error}</p>}
      {!error && orders === null && <p style={body}>Loading your orders…</p>}
      {orders && orders.length === 0 && <p style={body}>You haven't placed any orders yet.</p>}
      {orders && orders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(o => <OrderCard key={o.id} order={o} onReload={fetchOrders} />)}
        </div>
      )}
    </div>
  );
}
