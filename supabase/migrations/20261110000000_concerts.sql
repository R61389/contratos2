-- Conciertos: cartelera pública que cada artista administra desde su panel, con un contador de fans interesados.
-- Horas en hora de Bolivia (UTC−4, sin horario de verano). Si end_time es menor que start_time, termina al día siguiente.

create table public.concerts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  date date not null,
  start_time text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time text not null check (end_time ~ '^\d{2}:\d{2}$' and end_time <> start_time),
  venue text not null check (char_length(venue) between 2 and 160),
  city text not null default 'Cochabamba',
  address text not null default '',
  poster_url text,
  ticket_url text check (ticket_url is null or ticket_url ~ '^https?://'),
  -- null: por confirmar · 0: entrada libre
  price numeric(12, 2) check (price is null or price >= 0),
  published boolean not null default true,
  -- Solo lo cambia concert_interest(); ver trigger concerts_protect_interest.
  interested_count int not null default 0 check (interested_count >= 0),
  created_at timestamptz not null default now()
);
create index on public.concerts (provider_id, date);
create index on public.concerts (date) where published;

-- El artista no puede inflar su propio contador de fans.
create or replace function public.protect_concert_interest() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin')
     or current_setting('vibra.interest', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.interested_count := 0;
  else
    new.interested_count := old.interested_count;
  end if;
  return new;
end;
$$;
create trigger concerts_protect_interest before insert or update on public.concerts
  for each row execute function public.protect_concert_interest();

-- Un visitante marca (o desmarca) que le interesa un concierto publicado. Devuelve el total actualizado.
create or replace function public.concert_interest(concert_slug text, interested boolean) returns int
language plpgsql security definer set search_path = public as $$
declare
  total int;
begin
  perform set_config('vibra.interest', 'on', true);
  update public.concerts
     set interested_count = greatest(0, interested_count + case when interested then 1 else -1 end)
   where slug = concert_slug and published and public.is_published(provider_id)
  returning interested_count into total;
  perform set_config('vibra.interest', 'off', true);
  if total is null then raise exception 'Concierto no encontrado'; end if;
  return total;
end;
$$;

alter table public.concerts enable row level security;
create policy "lectura" on public.concerts for select using ((published and public.is_published(provider_id)) or public.is_member(provider_id));
create policy "edición" on public.concerts for all using (public.is_member(provider_id)) with check (public.is_member(provider_id));

grant select on public.concerts to anon, authenticated;
grant insert, update, delete on public.concerts to authenticated;
revoke all on function public.concert_interest(text, boolean) from public;
grant execute on function public.concert_interest(text, boolean) to anon, authenticated;
