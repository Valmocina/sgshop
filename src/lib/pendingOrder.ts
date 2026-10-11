// Remembers an order across the PayMongo redirect (the browser leaves the app and
// comes back with a fresh page load, so React state is lost).
export const PENDING_ORDER_KEY = "sithguy_pending_order";

export interface PendingOrder {
  id: string;
  /** Status to record if the payment succeeds. */
  paidStatus: "paid" | "deposit_paid";
  /** Amount received at checkout (full total, or just the deposit). */
  amountPaid: number;
  preorder: boolean;
  balance: number;
  estArrival: string | null;
  /** Whether the customer was signed in (decides what the confirmation page tells them). */
  signedIn: boolean;
}

export const savePendingOrder = (o: PendingOrder) => localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(o));
export const clearPendingOrder = () => localStorage.removeItem(PENDING_ORDER_KEY);
export function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch { return null; }
}
