-- Una sola tabla de guardados para toda la app. Cada usuario solo ve y maneja los suyos.
create table public.saved_items (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('listing', 'donation', 'adoption', 'event', 'resource', 'mano')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
create index saved_items_recent on public.saved_items(user_id, created_at desc);

alter table public.saved_items enable row level security;
revoke all on public.saved_items from anon, authenticated;
grant select, insert (item_type, item_id), delete on public.saved_items to authenticated;

create policy saved_items_read on public.saved_items for select to authenticated using (user_id = auth.uid());
create policy saved_items_insert on public.saved_items for insert to authenticated with check (user_id = auth.uid());
create policy saved_items_delete on public.saved_items for delete to authenticated using (user_id = auth.uid());

-- Se pasan los favoritos y eventos guardados que ya existían.
insert into public.saved_items(user_id, item_type, item_id, created_at)
select user_id, 'listing', listing_id, created_at from public.favorites
on conflict do nothing;
insert into public.saved_items(user_id, item_type, item_id, created_at)
select user_id, 'event', event_id, created_at from public.event_saves
on conflict do nothing;
