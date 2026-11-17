-- ============================================================================
-- Permite que el panel borre las fotos de una consulta atendida.
-- Pegar en Supabase → SQL Editor → Run. Se puede ejecutar varias veces.
-- (Ya está incluido en schema.sql.)
-- ============================================================================

-- Supabase exige poder leer el archivo para poder borrarlo.
drop policy if exists "inspiracion: admin lee" on storage.objects;
create policy "inspiracion: admin lee" on storage.objects
  for select to authenticated using (bucket_id = 'inspiracion' and public.is_admin());

drop policy if exists "inspiracion: admin borra" on storage.objects;
create policy "inspiracion: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'inspiracion' and public.is_admin());

-- Comprobación: tienen que aparecer INSERT, SELECT y DELETE.
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'inspiracion:%'
order by cmd;
