-- ============================================================================
-- Catalina Luna — esquema de Supabase
-- Pegar completo en Supabase → SQL Editor → Run. Se puede volver a ejecutar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Administradoras: solo los usuarios cargados acá pueden usar el dashboard.
-- Después de crear el usuario de Catalina (Authentication → Users → Add user):
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'cata.luna0499@gmail.com';
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins: verse a sí misma" on public.admins;
create policy "admins: verse a sí misma" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Horario semanal de atención (plantilla para generar turnos).
-- dia_semana: 0 = domingo … 6 = sábado.
-- ---------------------------------------------------------------------------
create table if not exists public.horario_semanal (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  duracion_min smallint not null default 60 check (duracion_min between 15 and 240),
  check (hora_fin > hora_inicio)
);
alter table public.horario_semanal enable row level security;

drop policy if exists "horario: admin" on public.horario_semanal;
create policy "horario: admin" on public.horario_semanal
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Turnos. La nota es privada (puede tener el nombre de la clienta).
-- ---------------------------------------------------------------------------
create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  inicio timestamptz not null unique,
  fin timestamptz not null,
  estado text not null default 'libre' check (estado in ('libre', 'reservado', 'bloqueado')),
  nota text,
  creado timestamptz not null default now(),
  check (fin > inicio)
);
alter table public.turnos enable row level security;

drop policy if exists "turnos: admin" on public.turnos;
create policy "turnos: admin" on public.turnos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Vista pública: solo horario y si está disponible. Nunca expone la nota.
-- (security_invoker = false: corre con permisos del dueño y saltea el RLS de turnos)
drop view if exists public.turnos_publicos;
create view public.turnos_publicos
with (security_invoker = false) as
  select id, inicio, fin, (estado = 'libre') as disponible
  from public.turnos
  where inicio >= date_trunc('day', now() at time zone 'America/Argentina/Mendoza') at time zone 'America/Argentina/Mendoza';

revoke all on public.turnos_publicos from anon, authenticated;
grant select on public.turnos_publicos to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Consultas de inspiración enviadas desde la web.
-- La clienta puede crear, nunca leer. Catalina lee y marca como atendida.
-- ---------------------------------------------------------------------------
create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 1 and 120),
  linea text not null check (linea in ('Catalina Luna', 'Trasformazione')),
  prenda text not null check (char_length(prenda) <= 60),
  fecha_evento date,
  links text[] not null default '{}' check (cardinality(links) <= 10),
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 5),
  mensaje text check (char_length(mensaje) <= 2000),
  turno_id uuid references public.turnos (id) on delete set null,
  atendida boolean not null default false
);
alter table public.consultas enable row level security;

drop policy if exists "consultas: cualquiera crea" on public.consultas;
create policy "consultas: cualquiera crea" on public.consultas
  for insert to anon, authenticated with check (atendida = false);

drop policy if exists "consultas: admin lee" on public.consultas;
create policy "consultas: admin lee" on public.consultas
  for select to authenticated using (public.is_admin());

drop policy if exists "consultas: admin edita" on public.consultas;
create policy "consultas: admin edita" on public.consultas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "consultas: admin borra" on public.consultas;
create policy "consultas: admin borra" on public.consultas
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: fotos de inspiración.
-- Público para lectura (el link viaja por WhatsApp); las rutas son UUID.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspiracion', 'inspiracion', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "inspiracion: cualquiera sube" on storage.objects;
create policy "inspiracion: cualquiera sube" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'inspiracion');

-- Para borrar, Storage también necesita poder leer el registro del archivo.
drop policy if exists "inspiracion: admin lee" on storage.objects;
create policy "inspiracion: admin lee" on storage.objects
  for select to authenticated using (bucket_id = 'inspiracion' and public.is_admin());

drop policy if exists "inspiracion: admin borra" on storage.objects;
create policy "inspiracion: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'inspiracion' and public.is_admin());
