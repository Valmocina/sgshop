-- Customer-confirmed delivery and guarded admin fulfillment workflow.
-- Run in Supabase Dashboard -> SQL Editor after the existing migrations.

begin;

alter table public.orders
  add column if not exists cancellation_reason text;

alter table public.orders
  drop constraint if exists orders_cancellation_reason_check,
  add constraint orders_cancellation_reason_check
    check (cancellation_reason in ('customer_cancelled', 'admin_cancelled', 'admin_rejected'));

alter table public.orders
  drop constraint if exists orders_fulfillment_status_check,
  add constraint orders_fulfillment_status_check
    check (fulfillment_status in ('awaiting_order', 'ordered', 'in_transit', 'arrived', 'scheduled_delivery', 'delivered'));

alter table public.orders alter column review_status set default 'pending';

drop trigger if exists orders_guard_trg on public.orders;

drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders for insert to anon, authenticated
  with check (
    status = 'pending'
    and refunded_amount = 0
    and amount_paid = 0
    and cancellation_reason is null
    and delivery_date is null
    and delivery_time_slot is null
    and review_status = 'pending'
    and (fulfillment_status is null or fulfillment_status = 'awaiting_order')
    and supplier_ref is null
    and admin_notes is null
    and ordered_at is null
  );

-- Backfill existing paid pre-orders into the workflow, including already-confirmed schedules.
update public.orders
set fulfillment_status = case
  when delivery_date is not null and delivery_time_slot is not null then 'scheduled_delivery'
  else 'awaiting_order'
end
where order_type = 'preorder'
  and status in ('pending', 'paid', 'deposit_paid')
  and fulfillment_status is null;

update public.orders
set fulfillment_status = 'scheduled_delivery'
where fulfillment_status = 'arrived'
  and delivery_date is not null
  and delivery_time_slot is not null
  and status in ('paid', 'deposit_paid');

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders for update to anon, authenticated
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or (customer_id is null and status = 'pending')
  )
  with check (
    public.is_admin()
    or customer_id = auth.uid()
    or (customer_id is null and status in ('pending', 'paid', 'deposit_paid', 'failed', 'cancelled'))
  );

create or replace function public.orders_guard() returns trigger
language plpgsql as $$
begin
  if public.is_admin() then
    if old.status = 'cancelled' and (
      new.status is distinct from old.status
      or new.fulfillment_status is distinct from old.fulfillment_status
      or new.review_status is distinct from old.review_status
      or new.cancellation_reason is distinct from old.cancellation_reason
      or new.delivery_date is distinct from old.delivery_date
      or new.delivery_time_slot is distinct from old.delivery_time_slot
      or new.amount_paid is distinct from old.amount_paid
      or new.refunded_amount is distinct from old.refunded_amount
    ) then
      raise exception 'Cancelled orders cannot re-enter the fulfillment workflow';
    end if;

    if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      if new.cancellation_reason is null
         or new.cancellation_reason not in ('admin_cancelled', 'admin_rejected')
         or new.amount_paid is distinct from old.amount_paid
         or new.refunded_amount is distinct from old.refunded_amount
         or new.fulfillment_status is distinct from old.fulfillment_status
         or new.delivery_date is not null
         or new.delivery_time_slot is not null then
        raise exception 'Invalid admin cancellation';
      end if;
      if new.cancellation_reason = 'admin_rejected' and new.review_status is distinct from 'rejected' then
        raise exception 'Rejected pre-orders must have rejected review status';
      end if;
    elsif new.cancellation_reason is distinct from old.cancellation_reason then
      raise exception 'Cancellation reason can only be set when cancelling an order';
    end if;

    if new.review_status = 'rejected'
       and (new.status is distinct from 'cancelled' or new.cancellation_reason is distinct from 'admin_rejected') then
      raise exception 'Rejected pre-orders cannot continue fulfillment';
    end if;

    if new.review_status is distinct from old.review_status
       and old.fulfillment_status is distinct from 'awaiting_order' then
      raise exception 'Pre-order review is closed once supplier ordering begins';
    end if;

    if new.status is distinct from old.status
       and new.status is distinct from 'cancelled'
       and not (
         old.status = 'deposit_paid'
         and new.status = 'paid'
         and new.amount_paid = old.total
       ) then
      raise exception 'Invalid admin payment status change';
    end if;

    if new.delivery_date is distinct from old.delivery_date
       or new.delivery_time_slot is distinct from old.delivery_time_slot then
      if new.status is distinct from 'cancelled' then
        raise exception 'Customers must confirm their own delivery schedule';
      end if;
    end if;

    if new.fulfillment_status is distinct from old.fulfillment_status then
      if new.review_status is distinct from 'accepted'
         or old.status not in ('paid', 'deposit_paid')
         or old.order_type is distinct from 'preorder' then
        raise exception 'Pre-order must be paid and accepted before fulfillment';
      end if;
      if not (
        (old.fulfillment_status = 'awaiting_order' and new.fulfillment_status = 'ordered')
        or (old.fulfillment_status = 'ordered' and new.fulfillment_status = 'in_transit')
        or (old.fulfillment_status = 'in_transit' and new.fulfillment_status = 'arrived')
        or (
          old.fulfillment_status = 'scheduled_delivery'
          and new.fulfillment_status = 'delivered'
          and new.delivery_date is not null
          and new.delivery_time_slot is not null
        )
      ) then
        raise exception 'Fulfillment must follow the required order sequence';
      end if;
    end if;

    return new;
  end if;

  if old.customer_id = auth.uid()
     and (
       new.delivery_date is distinct from old.delivery_date
       or new.delivery_time_slot is distinct from old.delivery_time_slot
       or (
         new.status = 'cancelled'
         and old.order_type = 'preorder'
         and old.status in ('paid', 'deposit_paid')
         and old.fulfillment_status in ('arrived', 'scheduled_delivery')
       )
       or new.cancellation_reason is distinct from old.cancellation_reason
       or (
         old.order_type = 'preorder'
         and old.status in ('paid', 'deposit_paid')
         and old.fulfillment_status in ('arrived', 'scheduled_delivery')
       )
     ) then
    if new.total is distinct from old.total
       or new.amount_paid is distinct from old.amount_paid
       or new.refunded_amount is distinct from old.refunded_amount
       or new.customer_id is distinct from old.customer_id
       or new.customer_name is distinct from old.customer_name
       or new.customer_email is distinct from old.customer_email
       or new.customer_phone is distinct from old.customer_phone
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

    if new.status = 'cancelled' then
      if old.status not in ('paid', 'deposit_paid')
         or old.order_type is distinct from 'preorder'
         or old.fulfillment_status not in ('arrived', 'scheduled_delivery')
         or new.cancellation_reason is distinct from 'customer_cancelled'
         or new.fulfillment_status is distinct from old.fulfillment_status
         or new.delivery_date is not null
         or new.delivery_time_slot is not null then
        raise exception 'This order cannot be cancelled by the customer at this stage';
      end if;
      return new;
    end if;

    if new.status is distinct from old.status
       or new.cancellation_reason is distinct from old.cancellation_reason
       or old.status not in ('paid', 'deposit_paid')
       or old.order_type is distinct from 'preorder'
       or old.fulfillment_status not in ('arrived', 'scheduled_delivery')
       or new.fulfillment_status is distinct from old.fulfillment_status
       or new.delivery_date is null
       or new.delivery_date <= current_date
       or new.delivery_time_slot not in (
         'Morning (9:00 AM - 1:00 PM)',
         'Afternoon (1:00 PM - 5:00 PM)',
         'Evening (5:00 PM - 8:00 PM)'
       ) then
      raise exception 'Choose a valid future delivery date and time after the order has arrived';
    end if;

    if old.fulfillment_status = 'arrived' then
      new.fulfillment_status := 'scheduled_delivery';
    end if;
    return new;
  end if;

  if new.total is distinct from old.total
     or new.refunded_amount is distinct from old.refunded_amount
     or new.customer_id is distinct from old.customer_id
     or new.customer_name is distinct from old.customer_name
     or new.customer_email is distinct from old.customer_email
     or new.customer_phone is distinct from old.customer_phone
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
     or new.cancellation_reason is distinct from old.cancellation_reason
     or new.delivery_date is distinct from old.delivery_date
     or new.delivery_time_slot is distinct from old.delivery_time_slot
     or new.ordered_at is distinct from old.ordered_at then
    raise exception 'Not allowed';
  end if;

  if old.status is distinct from 'pending'
     or new.status not in ('paid', 'deposit_paid', 'failed', 'cancelled') then
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

create trigger orders_guard_trg before update on public.orders
for each row execute function public.orders_guard();

commit;
