begin;

create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (user_id, product_id)
);

alter table public.cart_items enable row level security;
grant select, insert, update, delete on public.cart_items to authenticated;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own" on public.cart_items for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own" on public.cart_items for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own" on public.cart_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own" on public.cart_items for delete to authenticated
  using (user_id = auth.uid());

commit;
