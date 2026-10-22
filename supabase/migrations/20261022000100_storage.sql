-- VIBRA · fotos de los proveedores
-- Bucket público de lectura. Cada proveedor escribe solo dentro de su carpeta: <provider_id>/<archivo>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-media', 'provider-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "fotos: subir a mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'provider-media' and public.is_member(((storage.foldername(name))[1])::uuid));

create policy "fotos: reemplazar en mi carpeta" on storage.objects for update to authenticated
  using (bucket_id = 'provider-media' and public.is_member(((storage.foldername(name))[1])::uuid));

create policy "fotos: borrar de mi carpeta" on storage.objects for delete to authenticated
  using (bucket_id = 'provider-media' and public.is_member(((storage.foldername(name))[1])::uuid));
