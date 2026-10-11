-- ─── 004: Normalization & Type Fixes ────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run even if 003 was already applied.

-- 1. Fix product_id type mismatch: must match products.id (int8/bigint).
--    Supabase ERD showed int2 (smallint) which caps out at 32,767 products.
--    Cast is safe — all existing values fit in bigint.
alter table public.order_items
  alter column product_id type bigint using product_id::bigint;

-- 2. Fix delivery_date type: was text, should be date so DB can validate,
--    sort chronologically, and support range queries.
--    Existing ISO-format text values (e.g. '2026-12-25') cast cleanly.
--    NULL values stay NULL.
alter table public.orders
  alter column delivery_date type date using delivery_date::date;

-- NOTE: est_arrival (in both orders and products) stays as text intentionally —
-- it stores human-readable ranges like "8–12 weeks" or "Q4 2026", not exact dates.
-- delivery_time_slot stays text — it's a label like "Morning (9:00 AM – 1:00 PM)".
