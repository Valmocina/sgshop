-- ─── 003: Delivery Scheduling, Courier Tracking & Pre-order Review Migration ────
-- Run this in your Supabase Dashboard → SQL Editor

-- 1. Add delivery & tracking columns to public.orders
alter table public.orders
  add column if not exists delivery_date text,
  add column if not exists delivery_time_slot text,
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists review_status text default 'accepted'
    check (review_status in ('pending', 'accepted', 'rejected'));

-- 2. Update orders_guard so customers can schedule delivery on their arrived orders
create or replace function public.orders_guard() returns trigger
language plpgsql as $$
begin
  if public.is_admin() then return new; end if;

  -- Allow customer to set/update their delivery date and time slot
  if old.customer_id = auth.uid()
     and new.total is not distinct from old.total
     and new.amount_paid is not distinct from old.amount_paid
     and new.status is not distinct from old.status
     and new.fulfillment_status is not distinct from old.fulfillment_status
     and new.amount_due_now is not distinct from old.amount_due_now
     and new.refunded_amount is not distinct from old.refunded_amount then
    return new;
  end if;

  -- Otherwise, validate standard customer checkout payment transitions
  if new.total is distinct from old.total
     or new.refunded_amount is distinct from old.refunded_amount
     or new.customer_id is distinct from old.customer_id
     or new.payment_method is distinct from old.payment_method
     or new.order_type is distinct from old.order_type
     or new.payment_option is distinct from old.payment_option
     or new.amount_due_now is distinct from old.amount_due_now
     or new.fulfillment_status is distinct from old.fulfillment_status
     or new.est_arrival is distinct from old.est_arrival
     or new.supplier_ref is distinct from old.supplier_ref
     or new.admin_notes is distinct from old.admin_notes
     or new.courier_name is distinct from old.courier_name
     or new.tracking_number is distinct from old.tracking_number
     or new.review_status is distinct from old.review_status
     or new.ordered_at is distinct from old.ordered_at then
    raise exception 'Not allowed';
  end if;

  if new.status not in ('paid','deposit_paid','failed','cancelled') then
    raise exception 'Not allowed';
  end if;
  if new.status = 'deposit_paid' and not (old.order_type = 'preorder' and old.payment_option = 'deposit') then
    raise exception 'Not allowed';
  end if;
  if new.amount_paid is distinct from old.amount_paid and new.amount_paid <> old.amount_due_now then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
