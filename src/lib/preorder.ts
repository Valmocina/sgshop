import type { Product, FulfillmentStatus, PaymentOption } from "@/types/store";

// Lifesize figures are never held in stock: the customer orders first, then the
// admin places the order with the supplier.
export const isPreOrder = (p: Pick<Product, "scale">): boolean => p.scale === "Lifesize";

// Used when a product has no fixed deposit amount set. Same 30% the original
// made-to-order page used.
export const DEFAULT_DEPOSIT_PERCENT = 30;

// Sanity limit on how many of one pre-order item can be ordered at once.
export const MAX_PREORDER_QTY = 10;

export const lineTotal = (p: Product, qty: number) => p.price * qty;

/** Deposit for the whole order (a fixed per-unit deposit × qty, or 30% of the total). */
export function depositFor(p: Product, qty: number): number {
  const total = lineTotal(p, qty);
  const raw = p.deposit_amount && p.deposit_amount > 0
    ? p.deposit_amount * qty
    : (total * DEFAULT_DEPOSIT_PERCENT) / 100;
  return Math.min(Math.round(raw), total);
}

/** What the customer pays at checkout. */
export function dueNow(p: Product, qty: number, option: PaymentOption): number {
  return option === "deposit" ? depositFor(p, qty) : lineTotal(p, qty);
}

// Steps the customer sees (and the admin moves orders through).
export const FULFILLMENT_STEPS: { key: FulfillmentStatus; customer: string; admin: string; desc: string }[] = [
  { key: "awaiting_order", customer: "Order received", admin: "Needs supplier order", desc: "Payment received. We'll place your order with our supplier." },
  { key: "ordered", customer: "Ordered from supplier", admin: "Ordered from supplier", desc: "Your figure has been ordered and is being prepared." },
  { key: "in_transit", customer: "On its way to the Philippines", admin: "In transit", desc: "Shipped and travelling to us, including customs clearance." },
  { key: "arrived", customer: "Arrived — balance & delivery", admin: "Arrived", desc: "It's here. Any balance is due and we'll schedule your delivery date and time." },
  { key: "delivered", customer: "Delivered", admin: "Delivered", desc: "Delivered to you by white-glove freight." },
];

export const stepIndex = (s: FulfillmentStatus | null | undefined) =>
  Math.max(0, FULFILLMENT_STEPS.findIndex(x => x.key === s));
