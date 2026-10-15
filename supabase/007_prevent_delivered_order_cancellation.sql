-- A delivered order cannot be cancelled through the admin or customer update paths.
begin;

create or replace function public.orders_prevent_delivered_cancellation() returns trigger
language plpgsql as $$
begin
  if old.fulfillment_status = 'delivered' and new.status = 'cancelled' then
    raise exception 'Delivered orders cannot be cancelled';
  end if;
  return new;
end $$;

drop trigger if exists orders_prevent_delivered_cancellation_trg on public.orders;
create trigger orders_prevent_delivered_cancellation_trg
before update of status on public.orders
for each row
when (new.status = 'cancelled' and old.status is distinct from new.status)
execute function public.orders_prevent_delivered_cancellation();

commit;
