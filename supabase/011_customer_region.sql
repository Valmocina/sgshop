alter table public.orders
  add column if not exists customer_region text
  check (customer_region is null or length(customer_region) <= 80);
