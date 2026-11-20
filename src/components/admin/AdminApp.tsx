import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import monograma from '../../assets/marca/monograma-navy.png';
import TurnosAdmin from './TurnosAdmin';
import HorarioAdmin from './HorarioAdmin';
import ConsultasAdmin from './ConsultasAdmin';
import Avisos from './Avisos';
import './admin.css';

type Pestania = 'turnos' | 'horario' | 'consultas';

const PESTANIAS: { id: Pestania; label: string }[] = [
  { id: 'turnos', label: 'Turnos' },
  { id: 'horario', label: 'Horario' },
  { id: 'consultas', label: 'Consultas' },
];

export default function AdminApp() {
  if (!supabase) return <SinConfigurar />;
  return <Panel />;
}

function Panel() {
  const sb = supabase!;
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [esAdmin, setEsAdmin] = useState<boolean | undefined>(undefined);
  const [recuperando, setRecuperando] = useState(false);
  const [pestania, setPestania] = useState<Pestania>(() => {
    const h = window.location.hash.slice(1);
    return PESTANIAS.some((p) => p.id === h) ? (h as Pestania) : 'turnos';
  });

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!session) {
      setEsAdmin(undefined);
      return;
    }
    let vigente = true;
    sb.from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => vigente && setEsAdmin(!!data));
    return () => {
      vigente = false;
    };
  }, [sb, session]);

  function cambiarPestania(p: Pestania) {
    setPestania(p);
    history.replaceState(null, '', `#${p}`);
  }

  if (session === undefined) return <p className="admin-cargando" role="status">Cargando…</p>;
  if (recuperando && session) return <NuevaClave onListo={() => setRecuperando(false)} />;
  if (!session) return <Login />;
  if (esAdmin === undefined) return <p className="admin-cargando" role="status">Verificando acceso…</p>;

  if (!esAdmin) {
    return (
      <div className="acceso">
        <div className="acceso__caja">
          <h1>Sin acceso</h1>
          <p>La cuenta {session.user.email} no tiene permiso para usar el panel.</p>
          <button type="button" className="btn btn--linea" onClick={() => sb.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <header className="panel__top">
        <a className="panel__marca" href="/">
          <img src={monograma.src} alt="" width={32} height={32} />
          <span>Panel</span>
        </a>
        <nav className="panel__tabs" aria-label="Secciones del panel">
          {PESTANIAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="panel__tab"
              aria-current={pestania === p.id ? 'page' : undefined}
              onClick={() => cambiarPestania(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <a className="panel__web" href="/" title="Abrir la página pública">
          Ver la web <span aria-hidden="true">↗</span>
        </a>
        <button type="button" className="panel__salir" onClick={() => sb.auth.signOut()}>
          Salir
        </button>
      </header>

      <div className="panel__cuerpo">
        {pestania === 'turnos' ? <TurnosAdmin /> : null}
        {pestania === 'horario' ? <HorarioAdmin /> : null}
        {pestania === 'consultas' ? <ConsultasAdmin /> : null}
      </div>
      <Avisos />
    </div>
  );
}

function Login() {
  const sb = supabase!;
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCargando(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({
      email: String(fd.get('email') ?? '').trim(),
      password: String(fd.get('clave') ?? ''),
    });
    setCargando(false);
    if (error) setError('El correo o la contraseña no coinciden.');
  }

  async function olvide(e: MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form!;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!email) {
      setError('Escribí tu correo y volvé a tocar "Olvidé mi contraseña".');
      return;
    }
    setError(null);
    await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin` });
    setAviso('Si el correo está registrado, te llega un link para crear una contraseña nueva.');
  }

  return (
    <div className="acceso">
      <form className="acceso__caja" onSubmit={entrar}>
        <img className="acceso__logo" src={monograma.src} alt="" width={56} height={56} />
        <h1>Panel de Catalina</h1>
        <div className="campo">
          <label htmlFor="lg-email">Correo</label>
          <input id="lg-email" name="email" type="email" className="input" autoComplete="username" required />
        </div>
        <div className="campo">
          <label htmlFor="lg-clave">Contraseña</label>
          <input id="lg-clave" name="clave" type="password" className="input" autoComplete="current-password" required />
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {aviso ? <p className="acceso__aviso" role="status">{aviso}</p> : null}
        <button type="submit" className="btn btn--solido" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="acceso__link" onClick={olvide}>
          Olvidé mi contraseña
        </button>
        <a className="acceso__link acceso__volver" href="/">
          ← Volver a la web
        </a>
      </form>
    </div>
  );
}

function NuevaClave({ onListo }: { onListo: () => void }) {
  const sb = supabase!;
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clave = String(new FormData(e.currentTarget).get('clave') ?? '');
    if (clave.length < 8) {
      setError('Usá al menos 8 caracteres.');
      return;
    }
    const { error } = await sb.auth.updateUser({ password: clave });
    if (error) setError('No se pudo guardar. Probá de nuevo.');
    else onListo();
  }

  return (
    <div className="acceso">
      <form className="acceso__caja" onSubmit={guardar}>
        <h1>Contraseña nueva</h1>
        <div className="campo">
          <label htmlFor="nc-clave">Nueva contraseña</label>
          <input id="nc-clave" name="clave" type="password" className="input" autoComplete="new-password" minLength={8} required />
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button type="submit" className="btn btn--solido">Guardar</button>
      </form>
    </div>
  );
}

function SinConfigurar() {
  return (
    <div className="acceso">
      <div className="acceso__caja acceso__caja--ancha">
        <h1>Falta conectar Supabase</h1>
        <p>
          El panel necesita la base de datos. Creá el archivo <code>.env</code> con <code>SUPABASE_URL</code> y{' '}
          <code>SUPABASE_ANON_KEY</code> (ver <code>README.md</code>) y volvé a publicar el sitio.
        </p>
        <a className="btn btn--linea" href="/">Volver a la web</a>
      </div>
    </div>
  );
}
