-- ═══════════════════════════════════════════════════════════════════════════
-- Pre-order upgrade for a database that already ran the earlier schema.
-- Safe to run once. (Fresh project? Use schema.sql instead.)
-- ═══════════════════════════════════════════════════════════════════════════

-- Product pre-order fields (no-ops if you already have them)
alter table public.products add column if not exists est_arrival text;
alter table public.products add column if not exists deposit_amount numeric(10,2);
alter table public.products add column if not exists sourcing_country text;

-- Order columns
alter table public.orders add column if not exists order_type text not null default 'stock';
alter table public.orders add column if not exists payment_option text;
alter table public.orders add column if not exists amount_due_now numeric(10,2) not null default 0;
alter table public.orders add column if not exists amount_paid numeric(10,2) not null default 0;
alter table public.orders add column if not exists fulfillment_status text;
alter table public.orders add column if not exists est_arrival text;
alter table public.orders add column if not exists supplier_ref text;
alter table public.orders add column if not exists admin_notes text;
alter table public.orders add column if not exists ordered_at timestamptz;

-- Backfill: existing orders were all full-price, in-stock orders
update public.orders set amount_due_now = total where amount_due_now = 0;
update public.orders set amount_paid = total where status in ('paid','refunded') and amount_paid = 0;

-- Constraints
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','deposit_paid','failed','cancelled','refunded'));
alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check check (order_type in ('stock','preorder'));
alter table public.orders drop constraint if exists orders_payment_option_check;
alter table public.orders add constraint orders_payment_option_check check (payment_option in ('full','deposit'));
alter table public.orders drop constraint if exists orders_fulfillment_status_check;
alter table public.orders add constraint orders_fulfillment_status_check
  check (fulfillment_status in ('awaiting_order','ordered','in_transit','arrived','delivered'));

create index if not exists orders_fulfillment_idx on public.orders (order_type, fulfillment_status, status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- Tighter insert policy
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders for insert to anon, authenticated
  with check (
    status = 'pending' and refunded_amount = 0 and amount_paid = 0
    and (fulfillment_status is null or fulfillment_status = 'awaiting_order')
    and supplier_ref is null and admin_notes is null and ordered_at is null
  );

-- Updated guard for non-admin updates
create or replace function public.orders_guard() returns trigger
language plpgsql as $$
begin
  if public.is_admin() then return new; end if;

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
drop trigger if exists orders_guard_trg on public.orders;
create trigger orders_guard_trg before update on public.orders
for each row execute function public.orders_guard();
