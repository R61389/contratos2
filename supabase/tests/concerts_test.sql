-- Pruebas de la cartelera de conciertos. Correr después de local_stub.sql, todas las migraciones y seed.sql.
\set ON_ERROR_STOP 1

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'meraya@demo.vibra'),
  ('00000000-0000-0000-0000-0000000000c2', 'nightflow@demo.vibra');
select public.link_provider_owner('meraya', 'meraya@demo.vibra');
select public.link_provider_owner('dj-nightflow', 'nightflow@demo.vibra');
insert into public.concerts (provider_id, slug, title, date, start_time, end_time, venue, published)
  select id, 'meraya-borrador-2026-12-01', 'Ensayo abierto', '2026-12-01', '20:00', '22:00', 'Estudio', false from public.providers where slug = 'meraya';

-- Visitante
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
do $$ begin
  if (select count(*) from public.concerts) <> 1 then raise exception 'anon debería ver solo el concierto publicado'; end if;
  if public.concert_interest('meraya-en-vivo-universidad-salesiana-2026-11-24', true) <> 1 then raise exception 'el interés debería sumar 1'; end if;
  if public.concert_interest('meraya-en-vivo-universidad-salesiana-2026-11-24', true) <> 2 then raise exception 'el interés debería sumar 2'; end if;
  if public.concert_interest('meraya-en-vivo-universidad-salesiana-2026-11-24', false) <> 1 then raise exception 'quitar el interés debería restar'; end if;
  raise notice 'OK anon: ve lo publicado y marca interés';
end $$;
do $$ begin
  perform public.concert_interest('meraya-borrador-2026-12-01', true);
  raise exception 'no debería poder marcar un borrador';
exception when raise_exception then
  if sqlerrm <> 'Concierto no encontrado' then raise; end if;
  raise notice 'OK anon: no marca borradores';
end $$;
do $$ begin
  update public.concerts set title = 'Hackeado';
  raise exception 'anon no debería poder editar';
exception when insufficient_privilege then raise notice 'OK anon: no edita';
end $$;
reset role;

-- Meraya
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000c1"}', false);
do $$ begin
  if (select count(*) from public.concerts) <> 2 then raise exception 'el artista debería ver también su borrador'; end if;
  update public.concerts set title = 'Meraya en vivo · Salesiana', interested_count = 9999 where slug = 'meraya-en-vivo-universidad-salesiana-2026-11-24';
  if (select interested_count from public.concerts where slug = 'meraya-en-vivo-universidad-salesiana-2026-11-24') <> 1 then raise exception 'el artista no debería cambiar su contador de fans'; end if;
  if (select title from public.concerts where slug = 'meraya-en-vivo-universidad-salesiana-2026-11-24') <> 'Meraya en vivo · Salesiana' then raise exception 'el artista debería editar su concierto'; end if;
  insert into public.concerts (provider_id, slug, title, date, start_time, end_time, venue, interested_count)
    select id, 'meraya-nuevo-2026-12-20', 'Fin de año', '2026-12-20', '23:00', '02:00', 'Club', 500 from public.providers where slug = 'meraya';
  if (select interested_count from public.concerts where slug = 'meraya-nuevo-2026-12-20') <> 0 then raise exception 'un concierto nuevo empieza con 0 fans'; end if;
  raise notice 'OK artista: edita lo suyo, no infla fans';
end $$;
do $$ begin
  insert into public.concerts (provider_id, slug, title, date, start_time, end_time, venue)
    select id, 'robado-2026-12-01', 'Ajeno', '2026-12-01', '20:00', '21:00', 'X' from public.providers where slug = 'dj-nightflow';
  raise exception 'no debería crear conciertos de otro artista';
exception when insufficient_privilege then raise notice 'OK artista: no crea conciertos ajenos';
end $$;
do $$ begin
  insert into public.concerts (provider_id, slug, title, date, start_time, end_time, venue)
    select id, 'mal-2026-12-01', 'Sin duración', '2026-12-01', '20:00', '20:00', 'X' from public.providers where slug = 'meraya';
  raise exception 'no debería aceptar inicio igual al fin';
exception when check_violation then raise notice 'OK artista: horario válido';
end $$;
reset role;

-- Otro artista
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000c2"}', false);
do $$ begin
  delete from public.concerts where slug like 'meraya-%';
  if (select count(*) from public.concerts where slug like 'meraya-%') <> 2 then raise exception 'no debería poder borrar conciertos ajenos (ve los 2 publicados)'; end if;
  raise notice 'OK otro artista: no borra conciertos ajenos';
end $$;
reset role;
