-- VIBRA · esquema inicial
-- Cada proveedor es dueño de sus filas. Lo publicado se puede leer sin sesión; todo lo demás solo lo leen y
-- editan los miembros del proveedor. Las cuentas de proveedor las vincula VIBRA (ver link_provider_owner).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ───────────── Tipos ─────────────

create type provider_kind as enum ('musica', 'dj', 'catering', 'bebidas', 'fotografia', 'decoracion', 'sonido', 'salon', 'otro');
create type pricing_mode as enum ('evento', 'hora', 'persona', 'paquete', 'cotizacion');
create type request_status as enum ('pendiente', 'modificacion', 'aceptada', 'confirmada', 'rechazada', 'cancelada');

-- ───────────── Proveedores ─────────────

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind provider_kind not null,
  business_name text not null check (char_length(business_name) between 2 and 120),
  tagline text not null default '',
  description text not null default '',
  logo_url text,
  cover_url text,
  categories provider_kind[] not null default '{}',
  city text not null default 'Cochabamba',
  zone text not null default '',
  phone text not null default '',
  socials jsonb not null default '{}'::jsonb,
  years_experience int not null default 0 check (years_experience between 0 and 80),
  featured_service_ids uuid[] not null default '{}',
  cover_media_id uuid,
  published boolean not null default false,
  -- Solo VIBRA (rol de servicio) cambia estos tres; ver trigger protect_provider_admin_fields.
  verified boolean not null default false,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  reviews_count int not null default 0 check (reviews_count >= 0),
  -- Tarifa
  base_price numeric(12, 2) not null default 0 check (base_price >= 0),
  pricing_mode pricing_mode not null default 'evento',
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  deposit_pct numeric(5, 2) not null default 0 check (deposit_pct between 0 and 100),
  payment_terms text not null default '',
  discount_enabled boolean not null default false,
  discount_pct numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  discount_from date,
  discount_to date,
  -- Disponibilidad
  rest_days smallint[] not null default '{}',
  hours_start text not null default '09:00' check (hours_start ~ '^\d{2}:\d{2}$'),
  hours_end text not null default '23:00' check (hours_end ~ '^\d{2}:\d{2}$'),
  availability_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_from is null or discount_to is null or discount_from <= discount_to)
);

create table public.provider_members (
  provider_id uuid not null references public.providers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (provider_id, user_id)
);
create index on public.provider_members (user_id);

-- Datos privados de la cuenta: nunca públicos, por eso no viven en providers.
create table public.provider_settings (
  provider_id uuid primary key references public.providers (id) on delete cascade,
  email text not null default '',
  notify_email boolean not null default true,
  notify_whatsapp boolean not null default false,
  weekly_summary boolean not null default true,
  auto_decline boolean not null default false
);

-- ───────────── Contenido del proveedor ─────────────

create table public.media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  url text not null,
  storage_path text,
  title text not null default '',
  alt text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.media (provider_id, position);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  category provider_kind not null,
  description text not null default '',
  cover_media_id uuid references public.media (id) on delete set null,
  gallery_media_ids uuid[] not null default '{}',
  base_price numeric(12, 2) check (base_price is null or base_price >= 0),
  pricing_mode pricing_mode not null,
  duration_hours numeric(5, 2) not null check (duration_hours > 0 and duration_hours <= 72),
  includes text[] not null default '{}',
  excludes text[] not null default '{}',
  capacity text not null default '',
  conditions text not null default '',
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  position int not null default 0,
  updated_at timestamptz not null default now(),
  check (pricing_mode = 'cotizacion' or base_price is not null)
);
create index on public.services (provider_id, position);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  unit text not null check (unit in ('evento', 'hora', 'persona')),
  position int not null default 0
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null,
  price numeric(12, 2) check (price is null or price >= 0),
  pricing_mode pricing_mode not null default 'paquete',
  previous_price numeric(12, 2) check (previous_price is null or previous_price >= 0),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  duration_hours numeric(5, 2) not null check (duration_hours > 0),
  capacity text not null default '',
  benefits text[] not null default '{}',
  addon_ids uuid[] not null default '{}',
  highlighted boolean not null default false,
  position int not null default 0,
  check (pricing_mode = 'cotizacion' or price is not null)
);

create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  basis text not null check (basis in ('invitados', 'horas')),
  min int not null check (min >= 0),
  max int check (max is null or max >= min),
  price numeric(12, 2) not null check (price >= 0),
  position int not null default 0
);

create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  position int not null default 0,
  unique (provider_id, youtube_id)
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name text not null,
  description text not null default '',
  type text not null check (type in ('porcentaje', 'monto')),
  value numeric(12, 2) not null check (value > 0),
  start_date date not null,
  end_date date not null,
  service_ids uuid[] not null default '{}',
  conditions text not null default '',
  active boolean not null default true,
  check (start_date <= end_date),
  check (type <> 'porcentaje' or value < 100)
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  question text not null default '',
  answer text not null default '',
  position int not null default 0
);

create table public.availability_overrides (
  provider_id uuid not null references public.providers (id) on delete cascade,
  day date not null,
  state text not null check (state in ('disponible', 'bloqueada')),
  primary key (provider_id, day)
);

-- ───────────── Solicitudes y reservas ─────────────

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  client_user_id uuid references auth.users (id) on delete set null,
  client_name text not null,
  event_type text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  days int not null default 1 check (days between 1 and 14),
  venue text not null default '',
  guests int check (guests is null or guests >= 0),
  service_id uuid references public.services (id) on delete set null,
  service_name text not null default '',
  proposed_price numeric(12, 2) not null check (proposed_price >= 0),
  message text not null default '',
  status request_status not null default 'pendiente',
  source text not null default 'vibra' check (source in ('vibra', 'manual')),
  counter_offer jsonb,
  change_request text,
  reject_reason text,
  history jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  -- Franja que ocupa el evento; si termina después de medianoche se pasa al día siguiente.
  slot tsrange generated always as (
    tsrange(
      event_date + start_time,
      event_date + (days - 1) + end_time + case when days = 1 and end_time <= start_time then interval '1 day' else interval '0' end,
      '[)'
    )
  ) stored,
  -- Dos reservas confirmadas del mismo proveedor nunca pueden cruzarse.
  constraint no_overlapping_confirmed exclude using gist (provider_id with =, slot with &&) where (status = 'confirmada')
);
create index on public.booking_requests (provider_id, event_date);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null,
  body text not null default '',
  href text not null default '/panel',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── Funciones de acceso ─────────────

create or replace function public.is_member(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.provider_members m where m.provider_id = pid and m.user_id = auth.uid());
$$;

create or replace function public.is_published(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.providers p where p.id = pid and p.published);
$$;

-- Los proveedores no pueden marcarse como verificados ni cambiar su calificación o su dirección pública.
create or replace function public.protect_provider_admin_fields() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin') then
    new.verified := old.verified;
    new.rating := old.rating;
    new.reviews_count := old.reviews_count;
    new.slug := old.slug;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger providers_protect before update on public.providers
  for each row execute function public.protect_provider_admin_fields();

-- Uso desde el editor SQL de Supabase: select link_provider_owner('grupo-musical-eclipse', 'correo@ejemplo.com');
create or replace function public.link_provider_owner(provider_slug text, user_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare
  pid uuid;
  uid uuid;
begin
  select id into pid from public.providers where slug = provider_slug;
  if pid is null then raise exception 'No existe el proveedor %', provider_slug; end if;
  select id into uid from auth.users where lower(email) = lower(user_email);
  if uid is null then raise exception 'No existe un usuario con el correo %', user_email; end if;
  insert into public.provider_members (provider_id, user_id) values (pid, uid) on conflict do nothing;
  insert into public.provider_settings (provider_id, email) values (pid, user_email) on conflict (provider_id) do nothing;
  return format('%s ahora administra %s', user_email, provider_slug);
end;
$$;
revoke all on function public.link_provider_owner(text, text) from public, anon, authenticated;

-- ───────────── Seguridad por fila ─────────────

alter table public.providers enable row level security;
alter table public.provider_members enable row level security;
alter table public.provider_settings enable row level security;
alter table public.media enable row level security;
alter table public.services enable row level security;
alter table public.addons enable row level security;
alter table public.packages enable row level security;
alter table public.price_tiers enable row level security;
alter table public.music_tracks enable row level security;
alter table public.promotions enable row level security;
alter table public.faqs enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.booking_requests enable row level security;
alter table public.notifications enable row level security;

create policy "proveedores publicados o propios" on public.providers for select using (published or public.is_member(id));
create policy "el miembro edita su proveedor" on public.providers for update using (public.is_member(id)) with check (public.is_member(id));

create policy "ver mis membresías" on public.provider_members for select using (user_id = auth.uid());

create policy "ajustes del miembro" on public.provider_settings for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

-- Contenido público de proveedores publicados; edición solo por sus miembros.
create policy "lectura" on public.media for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.media for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.services for select using ((status = 'publicado' and public.is_published(provider_id)) or public.is_member(provider_id));
create policy "edición" on public.services for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.addons for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.addons for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.packages for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.packages for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.price_tiers for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.price_tiers for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.music_tracks for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.music_tracks for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.promotions for select using ((active and public.is_published(provider_id)) or public.is_member(provider_id));
create policy "edición" on public.promotions for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "lectura" on public.faqs for select using (public.is_published(provider_id) or public.is_member(provider_id));
create policy "edición" on public.faqs for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

-- Privado por ahora: el directorio público podrá leerlo cuando muestre disponibilidad real.
create policy "solo miembros" on public.availability_overrides for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

create policy "el proveedor gestiona sus solicitudes" on public.booking_requests for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));
create policy "el cliente ve las suyas" on public.booking_requests for select using (client_user_id = auth.uid());

create policy "solo miembros" on public.notifications for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

-- ───────────── Permisos de rol ─────────────

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.provider_members from authenticated;
revoke insert, delete on public.providers from authenticated;
grant execute on function public.is_member(uuid), public.is_published(uuid) to anon, authenticated;
