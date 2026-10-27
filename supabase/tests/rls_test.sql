-- Pruebas de permisos y reglas. Correr en una base local después de local_stub.sql y las migraciones.
-- Cada bloque falla con un mensaje claro si la regla no se cumple.
\set ON_ERROR_STOP 1

-- Datos: dos proveedores (uno publicado, otro no) y dos usuarios.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'eclipse@demo.vibra'),
  ('00000000-0000-0000-0000-00000000000b', 'otro@demo.vibra');
insert into public.providers (id, slug, kind, business_name, published) values
  ('10000000-0000-0000-0000-000000000001', 'grupo-eclipse', 'musica', 'Grupo Eclipse', true),
  ('10000000-0000-0000-0000-000000000002', 'cerveceria-borrador', 'bebidas', 'Cervecería en borrador', false);
select public.link_provider_owner('grupo-eclipse', 'eclipse@demo.vibra');
select public.link_provider_owner('cerveceria-borrador', 'otro@demo.vibra');
insert into public.services (provider_id, name, category, pricing_mode, base_price, duration_hours, status) values
  ('10000000-0000-0000-0000-000000000001', 'Show publicado', 'musica', 'evento', 2500, 4, 'publicado'),
  ('10000000-0000-0000-0000-000000000001', 'Show en borrador', 'musica', 'evento', 1800, 3, 'borrador');
insert into public.booking_requests (provider_id, client_name, event_type, event_date, start_time, end_time, proposed_price, status) values
  ('10000000-0000-0000-0000-000000000001', 'Cliente A', 'Boda', '2026-11-14', '20:00', '00:00', 3500, 'confirmada');

-- Visitante sin sesión
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
do $$ begin
  if (select count(*) from public.providers) <> 1 then raise exception 'anon debería ver solo el proveedor publicado'; end if;
  if (select count(*) from public.services) <> 1 then raise exception 'anon debería ver solo servicios publicados'; end if;
  if (select count(*) from public.booking_requests) <> 0 then raise exception 'anon no debería ver solicitudes'; end if;
  if (select count(*) from public.provider_settings) <> 0 then raise exception 'anon no debería ver ajustes privados'; end if;
  raise notice 'OK anon: solo lo publicado';
end $$;
do $$ begin
  update public.providers set business_name = 'Hackeado';
  if exists (select 1 from public.providers where business_name = 'Hackeado') then raise exception 'anon no debería poder editar'; end if;
  raise notice 'OK anon: no edita';
exception when insufficient_privilege then raise notice 'OK anon: no edita (sin permiso)';
end $$;
reset role;

-- Dueño de Eclipse
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000000a"}', false);
do $$ begin
  if (select count(*) from public.services) <> 2 then raise exception 'el dueño debería ver también sus borradores'; end if;
  if (select count(*) from public.booking_requests) <> 1 then raise exception 'el dueño debería ver sus solicitudes'; end if;
  update public.providers set tagline = 'Nueva frase', verified = true, rating = 5, slug = 'otro-slug' where slug = 'grupo-eclipse';
  if not exists (select 1 from public.providers where tagline = 'Nueva frase' and verified = false and rating = 0 and slug = 'grupo-eclipse') then
    raise exception 'el dueño edita su perfil pero no puede verificarse, puntuarse ni cambiar su dirección';
  end if;
  update public.providers set tagline = 'Intruso' where slug = 'cerveceria-borrador';
  if exists (select 1 from public.providers where tagline = 'Intruso') then raise exception 'no debería editar a otro proveedor'; end if;
  raise notice 'OK dueño: edita lo suyo, no lo ajeno ni los campos de VIBRA';
end $$;
do $$ begin
  insert into public.services (provider_id, name, category, pricing_mode, base_price, duration_hours)
  values ('10000000-0000-0000-0000-000000000002', 'Servicio ajeno', 'bebidas', 'evento', 100, 2);
  raise exception 'no debería crear servicios para otro proveedor';
exception when insufficient_privilege then raise notice 'OK dueño: no crea filas en otro proveedor';
end $$;
do $$ begin
  update public.services set provider_id = '10000000-0000-0000-0000-000000000002' where name = 'Show publicado';
  raise exception 'no debería mover un servicio a otro proveedor';
exception when insufficient_privilege then raise notice 'OK dueño: no mueve filas a otro proveedor';
end $$;
do $$ begin
  insert into public.services (provider_id, name, category, pricing_mode, base_price, duration_hours)
  values ('10000000-0000-0000-0000-000000000001', 'Precio negativo', 'musica', 'evento', -5, 2);
  raise exception 'no debería aceptar precios negativos';
exception when check_violation then raise notice 'OK precios: rechaza negativos';
end $$;
do $$ begin
  insert into public.booking_requests (provider_id, client_name, event_type, event_date, start_time, end_time, proposed_price, status, source)
  values ('10000000-0000-0000-0000-000000000001', 'Cliente B', 'Cumpleaños', '2026-11-14', '23:00', '01:00', 1500, 'confirmada', 'manual');
  raise exception 'no debería confirmar una reserva que se cruza';
exception when exclusion_violation then raise notice 'OK reservas: rechaza confirmadas que se cruzan (pasando la medianoche)';
end $$;
do $$ begin
  insert into public.booking_requests (provider_id, client_name, event_type, event_date, start_time, end_time, proposed_price, status, source)
  values ('10000000-0000-0000-0000-000000000001', 'Cliente C', 'Almuerzo', '2026-11-14', '12:00', '15:00', 900, 'confirmada', 'manual');
  insert into public.booking_requests (provider_id, client_name, event_type, event_date, start_time, end_time, proposed_price, status)
  values ('10000000-0000-0000-0000-000000000001', 'Cliente D', 'Boda', '2026-11-14', '21:00', '23:00', 3000, 'pendiente');
  raise notice 'OK reservas: permite horarios libres y solicitudes pendientes que coinciden';
end $$;
do $$ begin
  insert into public.music_tracks (provider_id, title, youtube_id) values ('10000000-0000-0000-0000-000000000001', 'Mal', 'id con espacios');
  raise exception 'no debería aceptar un id de YouTube inválido';
exception when check_violation then raise notice 'OK música: valida el id de YouTube';
end $$;
reset role;

-- Otro proveedor no ve las solicitudes de Eclipse
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000000b"}', false);
do $$ begin
  if (select count(*) from public.booking_requests) <> 0 then raise exception 'otro proveedor no debería ver solicitudes ajenas'; end if;
  if (select count(*) from public.provider_settings) <> 1 then raise exception 'debería ver solo sus propios ajustes'; end if;
  if (select count(*) from public.providers) <> 2 then raise exception 'debería ver el publicado y el suyo en borrador'; end if;
  raise notice 'OK aislamiento: cada proveedor ve solo lo suyo';
end $$;
reset role;

-- Fotos: cada proveedor escribe solo en su carpeta
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000000a"}', false);
do $$ begin
  insert into storage.objects (bucket_id, name) values ('provider-media', '10000000-0000-0000-0000-000000000001/foto.jpg');
  raise notice 'OK fotos: sube a su carpeta';
end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('provider-media', '10000000-0000-0000-0000-000000000002/foto.jpg');
  raise exception 'no debería subir fotos a la carpeta de otro proveedor';
exception when insufficient_privilege then raise notice 'OK fotos: no sube a carpetas ajenas';
end $$;
reset role;

do $$ begin
  begin
    perform public.link_provider_owner('no-existe', 'eclipse@demo.vibra');
    raise exception 'debería fallar con un proveedor inexistente';
  exception when raise_exception then
    if sqlerrm not like 'No existe el proveedor%' then raise; end if;
  end;
  raise notice 'OK vincular: avisa si el proveedor no existe';
end $$;
