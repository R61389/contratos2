-- Solicitudes de reserva enviadas por los clientes desde el sitio público (organizador de eventos).
-- El cliente no inicia sesión: la función valida los datos, registra la solicitud como «pendiente» en el panel del
-- proveedor y le crea una notificación. El proveedor la acepta o rechaza desde /panel/solicitudes.
-- Se puede ejecutar más de una vez.

alter table public.booking_requests add column if not exists client_phone text not null default '';
alter table public.booking_requests add column if not exists client_email text not null default '';

create or replace function public.submit_booking_request(
  provider_slug text,
  client_name text,
  client_phone text,
  client_email text,
  event_type text,
  event_date date,
  start_time time,
  end_time time,
  guests int,
  venue text,
  service_name text,
  proposed_price numeric,
  message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  rid uuid;
  phone_digits text := regexp_replace(coalesce(client_phone, ''), '\D', '', 'g');
begin
  select id into pid from public.providers where slug = provider_slug and published;
  if pid is null then raise exception 'Proveedor no disponible'; end if;
  if char_length(trim(coalesce(client_name, ''))) not between 2 and 80 then raise exception 'Indica tu nombre'; end if;
  if char_length(phone_digits) not between 7 and 15 then raise exception 'Indica un número de WhatsApp válido'; end if;
  if char_length(coalesce(client_email, '')) > 120 then raise exception 'Correo demasiado largo'; end if;
  if event_date is null or event_date < current_date then raise exception 'La fecha del evento ya pasó'; end if;
  if start_time is null or end_time is null or start_time = end_time then raise exception 'Indica el horario del evento'; end if;
  if guests is not null and guests not between 1 and 5000 then raise exception 'Número de invitados no válido'; end if;
  if coalesce(proposed_price, 0) < 0 then raise exception 'Precio no válido'; end if;
  if char_length(coalesce(message, '')) > 1000 or char_length(coalesce(venue, '')) > 160 then raise exception 'Texto demasiado largo'; end if;
  -- Freno básico contra envíos masivos desde un mismo número.
  if (select count(*) from public.booking_requests b
       where b.client_phone = phone_digits and b.received_at > now() - interval '1 hour') >= 20 then
    raise exception 'Demasiadas solicitudes; intenta más tarde';
  end if;

  insert into public.booking_requests (
    provider_id, client_name, client_phone, client_email, event_type, event_date, start_time, end_time,
    guests, venue, service_name, proposed_price, message, status, source, history
  ) values (
    pid, trim(client_name), phone_digits, trim(coalesce(client_email, '')), event_type, event_date, start_time, end_time,
    guests, trim(coalesce(venue, '')), coalesce(service_name, ''), coalesce(proposed_price, 0), trim(coalesce(message, '')),
    'pendiente', 'vibra',
    jsonb_build_array(jsonb_build_object('at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'label', 'Solicitud recibida desde VIBRA'))
  ) returning id into rid;

  insert into public.notifications (provider_id, title, body, href)
  values (pid, 'Nueva solicitud de ' || trim(client_name), event_type || ' · ' || to_char(event_date, 'DD/MM/YYYY'), '/panel/solicitudes?id=' || rid);

  return rid;
end;
$$;

revoke all on function public.submit_booking_request(text, text, text, text, text, date, time, time, int, text, text, numeric, text) from public;
grant execute on function public.submit_booking_request(text, text, text, text, text, date, time, time, int, text, text, numeric, text) to anon, authenticated;
