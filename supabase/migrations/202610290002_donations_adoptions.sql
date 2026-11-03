create table public.donations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 5 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  condition text not null check (condition in ('nuevo', 'como_nuevo', 'buen_estado', 'usado', 'para_reparar')),
  quantity integer not null default 1 check (quantity between 1 and 999),
  zone text not null check (char_length(trim(zone)) between 3 and 80),
  pickup_terms text not null check (char_length(trim(pickup_terms)) between 5 and 500),
  photos text[] not null check (cardinality(photos) between 1 and 6),
  status text not null default 'available' check (status in ('available', 'reserved', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  pet_name text not null check (char_length(trim(pet_name)) between 2 and 60),
  species text not null check (species in ('perro', 'gato', 'conejo', 'ave', 'otro')),
  age_text text not null check (char_length(trim(age_text)) between 1 and 40),
  size text not null check (size in ('pequeno', 'mediano', 'grande')),
  description text not null check (char_length(trim(description)) between 20 and 2000),
  care_info text not null default '' check (char_length(care_info) <= 1000),
  conditions text not null check (char_length(trim(conditions)) between 5 and 1000),
  zone text not null check (char_length(trim(zone)) between 3 and 80),
  photos text[] not null check (cardinality(photos) between 1 and 6),
  status text not null default 'seeking' check (status in ('seeking', 'evaluating', 'agreed', 'adopted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger donations_updated_at before update on public.donations for each row execute function public.set_updated_at();
create trigger adoptions_updated_at before update on public.adoptions for each row execute function public.set_updated_at();

alter table public.donations enable row level security;
alter table public.adoptions enable row level security;

-- El estado no se edita directo: solo cambia con las funciones de solicitudes.
revoke all on public.donations, public.adoptions from anon, authenticated;
grant select on public.donations, public.adoptions to anon, authenticated;
grant insert (title, description, condition, quantity, zone, pickup_terms, photos),
  update (title, description, condition, quantity, zone, pickup_terms, photos) on public.donations to authenticated;
grant insert (pet_name, species, age_text, size, description, care_info, conditions, zone, photos),
  update (pet_name, species, age_text, size, description, care_info, conditions, zone, photos) on public.adoptions to authenticated;
grant delete on public.donations, public.adoptions to authenticated;

create policy donations_read on public.donations for select using (true);
create policy donations_insert on public.donations for insert to authenticated
  with check (owner_id = auth.uid() and not exists (select 1 from unnest(photos) p where p not like auth.uid()::text || '/%'));
create policy donations_update on public.donations for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and not exists (select 1 from unnest(photos) p where p not like auth.uid()::text || '/%'));
create policy donations_delete on public.donations for delete to authenticated using (owner_id = auth.uid() and status = 'available');

create policy adoptions_read on public.adoptions for select using (true);
create policy adoptions_insert on public.adoptions for insert to authenticated
  with check (owner_id = auth.uid() and not exists (select 1 from unnest(photos) p where p not like auth.uid()::text || '/%'));
create policy adoptions_update on public.adoptions for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and not exists (select 1 from unnest(photos) p where p not like auth.uid()::text || '/%'));
create policy adoptions_delete on public.adoptions for delete to authenticated using (owner_id = auth.uid() and status = 'seeking');
