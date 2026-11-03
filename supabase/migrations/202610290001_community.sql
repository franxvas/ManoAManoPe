-- Fotos de donaciones, adopciones y eventos. Cada usuario sube solo dentro de su carpeta.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy community_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
