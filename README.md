# Catalina Luna — web y panel de turnos

Landing de Catalina Luna (vestidos de fiesta y novia a medida, y la línea Trasformazione) con:

- **Contame tu idea**: la clienta sube fotos y links de Pinterest; se guardan en Supabase y se arma un mensaje para el WhatsApp de Catalina con todo incluido.
- **Turnos**: agenda pública que muestra horarios disponibles / no disponibles. La clienta no reserva: elige un turno libre y se lo pide a Catalina por WhatsApp.
- **Panel** (`/admin`): Catalina inicia sesión, carga su horario semanal, genera turnos, los marca como reservados o bloqueados y revisa las consultas recibidas.

Hecho con Astro 7 + React. El sitio es estático; las partes dinámicas hablan directo con Supabase.

## Correr en local

```bash
npm install
npm run dev
```

Sin `.env` el sitio funciona en **modo demo**: la agenda muestra turnos de ejemplo y el formulario arma el mensaje de WhatsApp sin subir fotos (se adjuntan en el chat). El panel avisa que falta la configuración.

> En esta PC Windows bloquea un binario de Astro; `npm install` corre `scripts/satteri-wasi-fallback.mjs` y lo resuelve solo. Si `npm run build` falla con `satteri`, ejecutá `node scripts/satteri-wasi-fallback.mjs`.

## Configurar Supabase (una sola vez)

1. Crear un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: pegar todo `supabase/schema.sql` y ejecutar. Crea las tablas, la vista pública de turnos, el bucket de fotos y las reglas de seguridad.
3. **Authentication → Sign In / Providers → Email**: desactivar *Allow new users to sign up* (así nadie más puede crearse una cuenta).
4. **Authentication → Users → Add user**: crear el usuario de Catalina con su correo y una contraseña (marcar *Auto confirm*).
5. Darle permisos de administradora con `supabase/agregar-admin.sql` (cambiando el correo si hace falta), o en el SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'cata.luna0499@gmail.com';
   ```
6. **Authentication → URL Configuration**: en *Site URL* poner la dirección final de la web (para que funcione "Olvidé mi contraseña").
7. Copiar `.env.example` como `.env` y completar con *Project URL* y *anon public key* (Project Settings → API).

## Publicar

Cualquier hosting estático sirve (Vercel, Netlify, Cloudflare Pages):

- Comando de build: `npm run build` · carpeta de salida: `dist`
- Variables de entorno: `SUPABASE_URL` y `SUPABASE_ANON_KEY`

## Uso del panel

1. **Horario**: agregar franjas (por ejemplo, martes 15 a 19 h, turnos de 1 h) y tocar **Generar turnos** para las próximas semanas. Generar de nuevo no pisa los turnos existentes.
2. **Turnos**: tocar un turno para marcarlo **Reservado** (se ve "No disponible" en la web), **Bloqueado** o **Libre**, y anotar el nombre de la clienta (la nota es privada). También se pueden agregar turnos sueltos.
3. **Consultas**: ver las fotos, links e ideas que mandaron desde la web y marcarlas como atendidas.

## Dónde se editan los textos

Todo el contenido de la landing está en `src/data/sitio.ts`: datos de contacto, proceso, qué incluye el presupuesto, condiciones, anticipación y la sección Trasformazione. Los logos salen del manual de marca y están en `src/assets/marca/`.

**Fotos de trabajos**: van en `src/assets/trabajos/` (JPG, sin datos de ubicación) y se listan en `trabajos` dentro de `sitio.ts`; el carrusel circular las toma de ahí. Usar solo fotos de clientas que hayan dado permiso para publicarlas.

## Efectos

Las animaciones están en `src/scripts/efectos.ts` (GSAP + ScrollTrigger) y `src/styles/efectos.css`. El carrusel de trabajos es el componente *Circular Gallery* de [React Bits](https://reactbits.dev) (licencia MIT + Commons Clause, en `src/components/reactbits/`). Si el dispositivo tiene activado "reducir movimiento", no se anima nada.
