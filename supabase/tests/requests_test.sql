-- Pruebas de las solicitudes enviadas desde el sitio público. Correr después de local_stub.sql, todas las migraciones y seed.sql.
\set ON_ERROR_STOP 1

update public.providers set published = false where slug = 'cerveceria-valle-beer';

set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
do $$
declare rid uuid;
begin
  rid := public.submit_booking_request('dj-nightflow', 'Ana Pérez', '+591 7123-4567', 'ana@correo.bo', 'Boda', current_date + 30, '20:00', '02:00', 150, 'Salón Los Pinos', 'DJ', 1800, 'Queremos música toda la noche');
  if rid is null then raise exception 'debería devolver el id de la solicitud'; end if;
  raise notice 'OK anon: envía una solicitud';
end $$;
do $$ begin
  if (select count(*) from public.booking_requests) <> 0 then raise exception 'anon no debería poder leer solicitudes'; end if;
  raise notice 'OK anon: no lee solicitudes';
end $$;
do $$ begin
  perform public.submit_booking_request('cerveceria-valle-beer', 'Ana Pérez', '71234567', '', 'Boda', current_date + 30, '20:00', '23:00', 100, '', 'Bebidas', 500, '');
  raise exception 'no debería aceptar proveedores no publicados';
exception when raise_exception then
  if sqlerrm <> 'Proveedor no disponible' then raise; end if;
  raise notice 'OK anon: proveedor no publicado rechazado';
end $$;
do $$ begin
  perform public.submit_booking_request('dj-nightflow', 'Ana', '123', '', 'Boda', current_date + 30, '20:00', '23:00', 100, '', 'DJ', 500, '');
  raise exception 'no debería aceptar un teléfono inválido';
exception when raise_exception then
  if sqlerrm not like '%WhatsApp%' then raise; end if;
  raise notice 'OK anon: teléfono validado';
end $$;
do $$ begin
  perform public.submit_booking_request('dj-nightflow', 'Ana', '71234567', '', 'Boda', current_date - 1, '20:00', '23:00', 100, '', 'DJ', 500, '');
  raise exception 'no debería aceptar fechas pasadas';
exception when raise_exception then
  if sqlerrm <> 'La fecha del evento ya pasó' then raise; end if;
  raise notice 'OK anon: fecha pasada rechazada';
end $$;
do $$ begin
  insert into public.booking_requests (provider_id, client_name, event_type, event_date, start_time, end_time, proposed_price)
    select id, 'Directo', 'Boda', current_date + 5, '20:00', '22:00', 1 from public.providers where slug = 'dj-nightflow';
  raise exception 'anon no debería insertar directamente';
exception when insufficient_privilege then raise notice 'OK anon: sin inserción directa';
end $$;
reset role;

do $$ begin
  if not exists (select 1 from public.booking_requests where client_phone = '59171234567' and status = 'pendiente' and source = 'vibra'
                 and jsonb_array_length(history) = 1) then
    raise exception 'la solicitud debería quedar pendiente, con teléfono normalizado e historial';
  end if;
  if not exists (select 1 from public.notifications n join public.providers p on p.id = n.provider_id
                 where p.slug = 'dj-nightflow' and n.title = 'Nueva solicitud de Ana Pérez' and n.href like '/panel/solicitudes?id=%') then
    raise exception 'el proveedor debería recibir una notificación';
  end if;
  raise notice 'OK: solicitud pendiente y notificación al proveedor';
end $$;
