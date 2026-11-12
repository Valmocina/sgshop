alter table public.products
  add column if not exists unit_cost numeric(10,2)
  check (unit_cost is null or unit_cost >= 0);

alter table public.order_items
  add column if not exists product_scale text
  check (product_scale is null or product_scale in ('1:32', '1:16', '1:8', '1:6', '1:4', '1:3', '1:2', 'Lifesize')),
  add column if not exists unit_cost numeric(10,2)
  check (unit_cost is null or unit_cost >= 0);

update public.order_items as oi
set product_scale = p.scale
from public.products as p
where oi.product_id = p.id
  and oi.product_scale is null;
