-- ============================================================================
-- Dar acceso al panel (/admin) a una cuenta.
-- Pegar en Supabase → SQL Editor → Run. Se puede ejecutar varias veces.
-- La cuenta tiene que existir antes en Authentication → Users.
-- ============================================================================

insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('cataluna@admin.com')
on conflict (user_id) do nothing;

-- Comprobación: tiene que devolver una fila con el correo.
-- Si no devuelve nada, la cuenta no existe todavía: creala en
-- Authentication → Users → Add user (marcando "Auto Confirm User") y volvé a ejecutar.
select u.email, u.email_confirmed_at is not null as confirmada, a.user_id is not null as es_admin
from auth.users u
left join public.admins a on a.user_id = u.id
where lower(u.email) = lower('cataluna@admin.com');
