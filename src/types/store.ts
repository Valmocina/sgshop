export type Page = "auth" | "shop" | "cart" | "product" | "lifesize" | "payment-number" | "payment-summary" | "account";
export type AuthTab = "signin" | "signup";
export type AdminTab = "dashboard" | "products" | "settings" | "orders" | "revenue" | "stats";
export type Category = "HOME" | "ALL" | "POPULAR" | "STARWARS" | "MARVEL" | "DC" | "OTHERS";
export type Condition = "Brand New" | "Back in Box" | "Mint in Box" | "Loose No Box";
export type Franchise = "Star Wars" | "Marvel" | "DC";
export type Brand = "Sideshow" | "Hot Toys" | "Queen Studios" | "Hasbro" | "Others";
export type Scale = "1:32" | "1:16" | "1:8" | "1:4" | "1:3" | "1:2" | "Lifesize";


export interface Product {
  id: number; name: string; price: number; image: string;
  category: Category; franchise: Franchise; brand: Brand;
  scale: Scale; condition: Condition; stock: number;
  details: string[]; new: boolean;
  description?: string;
  is_available?: boolean;
  is_hidden?: boolean;
  is_featured?: boolean;
  // Pre-order fields (used by Lifesize items, which are never kept in stock)
  est_arrival?: string | null;      // e.g. "8–12 weeks" — admin can update when shipping slips
  deposit_amount?: number | null;   // fixed deposit in PHP; null = default percentage
  sourcing_country?: string | null; // where the admin sources the figure from
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderType = "stock" | "preorder";
export type PaymentOption = "full" | "deposit";

// "deposit_paid" = pre-order whose deposit was received but balance is still owed.
export type OrderStatus = "pending" | "paid" | "deposit_paid" | "failed" | "cancelled" | "refunded";

// Admin-side progress of a pre-order, after the customer has paid.
export type FulfillmentStatus = "awaiting_order" | "ordered" | "in_transit" | "arrived" | "delivered";

export type ReviewStatus = "pending" | "accepted" | "rejected";

export interface OrderRecord {
  id: string;
  created_at: string;
  status: OrderStatus;
  order_type: OrderType;
  payment_option: PaymentOption | null;
  total: number;
  amount_due_now: number;
  amount_paid: number;
  refunded_amount: number;
  payment_method: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  fulfillment_status: FulfillmentStatus | null;
  est_arrival: string | null;
  supplier_ref: string | null;
  admin_notes: string | null;
  ordered_at: string | null;
  delivery_date?: string | null;
  delivery_time_slot?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  review_status?: ReviewStatus | null;
  order_items: { product_name: string; category: string; unit_price: number; quantity: number }[];
}
export interface ContactInfo { name: string; email: string; phone: string }
export type PayMethod = "gcash" | "maya";

