import { C, font } from "@/lib/theme";
import { IconCheck } from "@/components/ui/Icons";
import { Btn } from "@/components/ui/Btn";
import { ProcurementTimeline } from "@/components/shop/ProcurementTimeline";
import type { PendingOrder } from "@/lib/pendingOrder";

export function OrderConfirmedPage({ order, onBackToShop, onViewOrders }: {
  order: PendingOrder | null;
  onBackToShop: () => void;
  onViewOrders?: () => void;   // only offered to signed-in customers
}) {
  const preorder = !!order?.preorder;
  const copy: React.CSSProperties = { fontFamily: "'Barlow', sans-serif", fontSize: 15, color: C.textMuted, lineHeight: 1.6 };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ textAlign: "center", maxWidth: preorder ? 760 : 440, width: "100%" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 0 40px ${C.gold}55` }}>
          <IconCheck s={40} c="#111" />
        </div>
        <h1 style={{ ...font(38, 900, 4), color: C.text, textTransform: "uppercase", marginBottom: 12 }}>{preorder ? "Pre-order placed!" : "Order placed!"}</h1>

        {preorder && order ? (
          <>
            <p style={{ ...copy, marginBottom: 20 }}>
              We've received your payment of <strong style={{ color: C.gold }}>₱{order.amountPaid.toLocaleString()}</strong>. Next, we'll place your order with our supplier and keep you updated.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              {[
                { label: "Paid today", value: `₱${order.amountPaid.toLocaleString()}` },
                { label: "Balance on arrival", value: `₱${order.balance.toLocaleString()}` },
                { label: "Estimated arrival", value: order.estArrival || "To be confirmed" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 20px", minWidth: 150 }}>
                  <p style={{ ...font(11, 700, 1.5), color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
                  <p style={{ ...font(18, 800, 0), color: C.text }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "left", marginBottom: 24 }}>
              <ProcurementTimeline activeIndex={0} title="What happens next" />
            </div>
            <p style={{ ...copy, fontSize: 13, marginBottom: 28 }}>
              {order.signedIn
                ? "You can follow your order's progress any time under My Account → My Orders."
                : "We'll update you by phone or email. Sign in before your next order to follow it online under My Account."}
            </p>
          </>
        ) : (
          <p style={{ ...copy, marginBottom: 36 }}>
            Your order has been received by Sithguy Hobbyshop. We will contact you shortly to confirm your purchase.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {preorder && order?.signedIn && onViewOrders && <Btn onClick={onViewOrders} size="lg">View My Orders</Btn>}
          <Btn onClick={onBackToShop} size="lg" variant={preorder && order?.signedIn ? "ghost" : "primary"}>Back to Shop</Btn>
        </div>
      </div>
    </div>
  );
}
