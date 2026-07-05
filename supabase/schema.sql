-- AisleMate schema: profiles, friendships, locations.
-- Run this in the Supabase SQL editor (or `supabase db push` if you use the CLI).

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null unique,
  phone_number text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up. display_name/phone_number
-- come from the `options.data` passed to supabase.auth.signUp() on the client.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone_number', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- friendships
-- One row per pair, with user_a/user_b always sorted so there's exactly one
-- row no matter who sent the request. Status starts 'pending' and moves to
-- 'accepted' or 'declined'.
-- ============================================================
create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index friendships_user_a_idx on public.friendships (user_a);
create index friendships_user_b_idx on public.friendships (user_b);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can send a friend request"
  on public.friendships for insert
  to authenticated
  with check (
    (auth.uid() = user_a or auth.uid() = user_b)
    and requested_by = auth.uid()
    and status = 'pending'
  );

create policy "Either side can respond to a pending request"
  on public.friendships for update
  to authenticated
  using (
    (auth.uid() = user_a or auth.uid() = user_b)
    and status = 'pending'
  )
  with check (status in ('accepted', 'declined'));

create policy "Either side can remove a friendship"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- ============================================================
-- locations
-- One row per user. `store` is a jsonb blob shaped like
-- { name, address, placeId } (or null), written by the client after a
-- Google Places lookup.
-- ============================================================
create table public.locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  store jsonb,
  sharing boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create function public.is_accepted_friend(other_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and (
        (user_a = auth.uid() and user_b = other_id) or
        (user_b = auth.uid() and user_a = other_id)
      )
  );
$$;

create policy "Owner or accepted friends can view a location"
  on public.locations for select
  to authenticated
  using (auth.uid() = user_id or public.is_accepted_friend(user_id));

create policy "Users manage their own location"
  on public.locations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Realtime: broadcast changes on these tables (still filtered per-row by
-- the RLS policies above before being delivered to a given client).
-- ============================================================
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.locations;
