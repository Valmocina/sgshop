import type { Product, FulfillmentStatus, PaymentOption } from "@/types/store";

// The platform maintains zero on-hand stock: all items are pure pre-orders
// initiating overseas international procurement upon order placement.
export const isPreOrder = (_p?: Pick<Product, "scale">): boolean => true;

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
  { key: "awaiting_order", customer: "Pre-Order Confirmed", admin: "Needs supplier order", desc: "Payment received. We initiate procurement with overseas manufacturers." },
  { key: "ordered", customer: "Overseas Production", admin: "Ordered from supplier", desc: "Your statue has been ordered with international partners and is in production." },
  { key: "in_transit", customer: "International Transit", admin: "In transit", desc: "Shipped abroad and travelling to the Philippines, undergoing customs clearance." },
  { key: "arrived", customer: "Arrived Locally — Schedule Delivery", admin: "Arrived", desc: "Cleared customs! Please select your White-Glove Supervised Delivery schedule." },
  { key: "scheduled_delivery", customer: "White-Glove Delivery Scheduled", admin: "Scheduled Delivery", desc: "Your delivery date and time have been confirmed." },
  { key: "delivered", customer: "White-Glove Delivered", admin: "Delivered", desc: "Successfully delivered via specialized transport accompanied by a staff supervisor." },
];

export const stepIndex = (s: FulfillmentStatus | null | undefined) =>
  Math.max(0, FULFILLMENT_STEPS.findIndex(x => x.key === s));
