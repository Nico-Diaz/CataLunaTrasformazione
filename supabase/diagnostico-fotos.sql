-- ============================================================================
-- Diagnóstico: ¿por qué no se borran las fotos?
-- Pegar en Supabase → SQL Editor → Run. Solo lee, no cambia nada.
-- Supabase muestra el resultado de la ÚLTIMA consulta: ejecutá cada bloque por separado
-- (seleccionalo y "Run selected"), o mirá las tres pestañas de resultados.
-- ============================================================================

-- 1) Políticas del bucket. Tienen que aparecer las tres:
--    "inspiracion: cualquiera sube" (INSERT), "inspiracion: admin lee" (SELECT),
--    "inspiracion: admin borra" (DELETE). Si falta "admin lee", ejecutá borrar-fotos.sql.
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'inspiracion:%'
order by cmd;

-- 2) Fotos que hay hoy en el bucket.
select name, created_at
from storage.objects
where bucket_id = 'inspiracion'
order by created_at desc
limit 50;

-- 3) Cuántas fotos están en uso por alguna consulta.
select count(*) as consultas, coalesce(sum(cardinality(imagenes)), 0) as fotos_en_uso
from public.consultas;
