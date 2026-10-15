-- Archive orders without deleting records or their order items.
begin;

alter table public.orders
  add column if not exists archived_at timestamptz;

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
    and archived_at is null
  );

create or replace function public.orders_archive_admin_only() returns trigger
language plpgsql as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can archive orders';
  end if;
  return new;
end $$;

drop trigger if exists orders_archive_admin_only_trg on public.orders;
create trigger orders_archive_admin_only_trg
before update of archived_at on public.orders
for each row
when (new.archived_at is distinct from old.archived_at)
execute function public.orders_archive_admin_only();

commit;
