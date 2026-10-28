create table public.community_events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category text not null check (category in ('campana', 'limpieza', 'feria', 'salud', 'actividad')),
  title text not null check (char_length(trim(title)) between 5 and 100),
  organizer_name text not null check (char_length(trim(organizer_name)) between 2 and 100),
  description text not null check (char_length(trim(description)) between 20 and 2000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place text not null check (char_length(trim(place)) between 3 and 200),
  photo text check (photo is null or photo like (organizer_id::text || '/%')),
  is_free boolean not null default true,
  cost_note text not null default '' check (char_length(cost_note) <= 100),
  requirements text not null default '' check (char_length(requirements) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (is_free or char_length(trim(cost_note)) > 0)
);
create index community_events_starts_at on public.community_events(starts_at);

-- "Guardar evento" funciona como favoritos.
create table public.event_saves (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.community_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create trigger community_events_updated_at before update on public.community_events for each row execute function public.set_updated_at();

alter table public.community_events enable row level security;
alter table public.event_saves enable row level security;

revoke all on public.community_events, public.event_saves from anon, authenticated;
grant select on public.community_events to anon, authenticated;
grant insert (category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, cost_note, requirements),
  update (category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, cost_note, requirements),
  delete on public.community_events to authenticated;
grant select, insert (event_id), delete on public.event_saves to authenticated;

create policy events_read on public.community_events for select using (true);
create policy events_insert on public.community_events for insert to authenticated with check (organizer_id = auth.uid());
create policy events_update on public.community_events for update to authenticated using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy events_delete on public.community_events for delete to authenticated using (organizer_id = auth.uid());

create policy event_saves_read on public.event_saves for select to authenticated using (user_id = auth.uid());
create policy event_saves_insert on public.event_saves for insert to authenticated with check (user_id = auth.uid());
create policy event_saves_delete on public.event_saves for delete to authenticated using (user_id = auth.uid());
