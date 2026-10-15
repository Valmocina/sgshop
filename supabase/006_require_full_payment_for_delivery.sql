-- Require payment to be confirmed before an order can be marked delivered.
begin;

create or replace function public.orders_require_full_payment_for_delivery() returns trigger
language plpgsql as $$
begin
  if old.status is distinct from 'paid' or old.amount_paid < old.total then
    raise exception 'Full payment must be confirmed before delivery';
  end if;
  return new;
end $$;

drop trigger if exists orders_require_full_payment_for_delivery_trg on public.orders;
create trigger orders_require_full_payment_for_delivery_trg
before update of fulfillment_status on public.orders
for each row
when (new.fulfillment_status = 'delivered' and old.fulfillment_status is distinct from new.fulfillment_status)
execute function public.orders_require_full_payment_for_delivery();

commit;
