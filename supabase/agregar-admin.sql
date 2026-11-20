-- ============================================================================
-- Dar acceso al panel (/admin) a una o varias cuentas.
-- Pegar en Supabase → SQL Editor → Run. Se puede ejecutar varias veces.
-- Cada cuenta tiene que existir antes en Authentication → Users.
-- Para sumar otra, agregala a la lista de correos (en los dos lugares).
-- ============================================================================

insert into public.admins (user_id)
select id from auth.users
where lower(email) in (
  'cataluna@admin.com',
  'catalinaluna.tz@gmail.com'
)
on conflict (user_id) do nothing;

-- Comprobación: tiene que devolver una fila por correo con es_admin = true.
-- Si falta alguno, esa cuenta no existe todavía: creala en
-- Authentication → Users → Add user (marcando "Auto Confirm User") y volvé a ejecutar.
select u.email, u.email_confirmed_at is not null as confirmada, a.user_id is not null as es_admin
from auth.users u
left join public.admins a on a.user_id = u.id
where lower(u.email) in (
  'cataluna@admin.com',
  'catalinaluna.tz@gmail.com'
);
