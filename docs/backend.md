# Backend de VIBRA (Supabase)

El sitio funciona en dos modos:

- **Sin Supabase** (sin variables de entorno): el sitio muestra los proveedores escritos en `lib/providers.ts` y el panel
  queda en **modo demostración** (los cambios viven sólo en la pestaña).
- **Con Supabase**: los proveedores entran al panel con correo y contraseña, todo lo que cambian se guarda en la base de
  datos y su perfil público se actualiza solo (como máximo un minuto después).

## Qué hay en la base de datos

| Archivo | Contenido |
| --- | --- |
| `supabase/migrations/20261022000000_init.sql` | Tablas, reglas de seguridad (RLS) y funciones. |
| `supabase/migrations/20261022000100_storage.sql` | Bucket `provider-media` para las fotos que suben los proveedores. |
| `supabase/seed.sql` | Los 10 proveedores actuales del sitio, para empezar con datos. Se regenera con `npm run db:seed-sql`. |
| `supabase/tests/` | Pruebas de seguridad (`rls_test.sql`) y de guardado de punta a punta (`sync_e2e.ts`). |

Reglas importantes que aplica la base de datos (no sólo la app):

- Cada proveedor sólo puede ver y cambiar **sus propios** datos y sus propias fotos.
- El público sólo ve proveedores **publicados**. La configuración privada (correo, avisos) nunca es pública.
- Un proveedor **no puede** marcarse como verificado ni cambiar su calificación, su número de reseñas o la dirección de
  su página: eso lo hace sólo VIBRA.
- No se pueden guardar precios negativos ni **dos reservas confirmadas que se crucen** en horario (también si el evento
  pasa de medianoche).

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com) → *New project*. Elige la región más cercana
   (São Paulo) y guarda la contraseña de la base de datos.
2. **Crear las tablas.** En el proyecto, abre *SQL Editor* → *New query*, pega el contenido de
   `supabase/migrations/20261022000000_init.sql` y pulsa *Run*. Repite con `20261022000100_storage.sql`.
3. **Cargar los proveedores actuales.** En otra consulta pega `supabase/seed.sql` y pulsa *Run*.
   Se puede volver a ejecutar sin duplicar nada y nunca pisa lo que un proveedor ya editó.
4. **Cerrar el registro público.** *Authentication* → *Sign In / Providers* → desactiva *Allow new users to sign up*.
   Las cuentas de proveedores las crea VIBRA.
5. **Copiar las claves.** *Project Settings* → *API*: copia la *Project URL* y la clave pública (*anon* o
   *publishable*). **Nunca** uses la clave `service_role` / `secret` en el sitio.
6. **Configurar Vercel.** En el proyecto de Vercel → *Settings* → *Environment Variables*, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = la Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clave pública

   Luego *Deployments* → *Redeploy* para que tome las variables.
7. **En tu computadora** (opcional), copia `.env.example` como `.env.local` y completa los mismos dos valores.

## Dar acceso a un proveedor

1. *Authentication* → *Users* → *Add user* → *Create new user*. Escribe su correo y una contraseña temporal y marca
   *Auto Confirm User*.
2. En *SQL Editor*, vincula la cuenta con su negocio (la dirección de su página, por ejemplo
   `vibra.com/proveedores/dj-nightflow` → `dj-nightflow`):

   ```sql
   select link_provider_owner('dj-nightflow', 'correo@del-proveedor.com');
   ```

3. Comparte con el proveedor el enlace `/acceso`, su correo y la contraseña temporal.

Una misma cuenta puede administrar varios negocios (ejecuta la función una vez por negocio) y un negocio puede tener
varias cuentas.

### Agregar un proveedor nuevo

Desde *SQL Editor* (los tipos válidos para el sitio son `musica`, `dj`, `catering` y `bebidas`):

```sql
insert into providers (slug, kind, business_name, published)
values ('mi-nuevo-proveedor', 'dj', 'Nombre del negocio', false);
insert into provider_settings (provider_id) select id from providers where slug = 'mi-nuevo-proveedor';
```

Luego crea su cuenta y vincúlala como arriba. El proveedor completa su perfil desde el panel y lo publica desde
*Configuración*.

### Tareas que sólo hace VIBRA

```sql
update providers set verified = true where slug = 'dj-nightflow';                 -- insignia de verificado
update providers set rating = 4.9, reviews_count = 120 where slug = 'dj-nightflow'; -- calificación
```

## Cómo llegan los cambios al sitio

- El panel guarda cada cambio en segundo plano; arriba a la derecha se ve *Guardando… / Guardado*. Si la base de datos
  rechaza algo (por ejemplo, una reserva que se cruza), aparece un aviso y el panel recarga los datos reales.
- Las fotos se suben al bucket `provider-media`, dentro de una carpeta por proveedor (máximo 5 MB; JPG, PNG o WebP).
- Las páginas de proveedores, el directorio y el organizador de eventos se regeneran como máximo **cada 60 segundos**.
  Un proveedor despublicado deja de aparecer en el sitio.
- Si la base de datos no responde, el sitio muestra los datos de `lib/providers.ts` para no quedar en blanco.
- El carrusel de la página de inicio sigue usando los datos del código.

Lo que el panel todavía no edita (equipo, reseñas, videos, y los platos y fotos de los menús de catering) se sigue
tomando de `lib/providers.ts`.

## Pendiente para próximas etapas

- Que los **clientes** envíen solicitudes de reserva desde el sitio (hoy las registra el proveedor desde el panel).
- **Estadísticas reales** (visitas al perfil y conversión). Mientras tanto la sección muestra que aún no hay métricas.
- Avisos por **correo y WhatsApp** al recibir solicitudes.
- Recuperar contraseña desde la página de acceso.
- **Pagos** y anticipos en línea, y el contrato firmado dentro de la app.

## Probar en local

`supabase/tests/rls_test.sql` y `supabase/tests/sync_e2e.ts` se ejecutan sobre un Postgres local con
`supabase/tests/local_stub.sql`, que imita las partes de Supabase que usan las migraciones (roles, `auth.uid()` y el
esquema de Storage). Con la CLI de Supabase también se puede usar `supabase start` y `supabase db reset`, que aplica las
migraciones y el seed automáticamente.
