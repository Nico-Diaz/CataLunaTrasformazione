import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, type EstadoTurno, type Turno } from '../../lib/supabase';
import {
  describirTurno,
  diaCorto,
  fechaLocal,
  horaCorta,
  hoy,
  instante,
  lunesDe,
  rangoSemana,
  sumarDias,
} from '../../lib/fechas';
import Dialogo from './Dialogo';
import { avisar, confirmar } from './Avisos';

const ESTADOS: { valor: EstadoTurno; label: string; ayuda: string }[] = [
  { valor: 'libre', label: 'Libre', ayuda: 'Se ve como disponible en la web.' },
  { valor: 'reservado', label: 'Reservado', ayuda: 'Una clienta lo tomó.' },
  { valor: 'bloqueado', label: 'Bloqueado', ayuda: 'No atendés en ese horario.' },
];

type Edicion = { tipo: 'turno'; turno: Turno } | { tipo: 'nuevo'; fecha: string } | null;

export default function TurnosAdmin() {
  const sb = supabase!;
  const [lunes, setLunes] = useState(() => lunesDe(hoy()));
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Edicion>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const { data, error } = await sb
      .from('turnos')
      .select('id, inicio, fin, estado, nota')
      .gte('inicio', instante(lunes, '00:00'))
      .lt('inicio', instante(sumarDias(lunes, 7), '00:00'))
      .order('inicio');
    if (error) setError('No se pudieron cargar los turnos.');
    else setTurnos(data as Turno[]);
  }, [sb, lunes]);

  useEffect(() => {
    setTurnos(null);
    cargar();
  }, [cargar]);

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const cuenta = (e: EstadoTurno) => turnos?.filter((t) => t.estado === e).length ?? 0;

  async function guardar(id: string, estado: EstadoTurno, nota: string) {
    const { error } = await sb.from('turnos').update({ estado, nota: nota.trim() || null }).eq('id', id);
    if (error) return 'No se pudo guardar.';
    setTurnos((prev) => prev?.map((t) => (t.id === id ? { ...t, estado, nota: nota.trim() || null } : t)) ?? null);
    setEdicion(null);
    avisar('Turno guardado.');
    return null;
  }

  async function eliminar(id: string) {
    const { error } = await sb.from('turnos').delete().eq('id', id);
    if (error) return 'No se pudo eliminar.';
    setTurnos((prev) => prev?.filter((t) => t.id !== id) ?? null);
    setEdicion(null);
    avisar('Turno eliminado.');
    return null;
  }

  async function crear(fecha: string, hora: string, duracion: number, estado: EstadoTurno, nota: string) {
    const inicio = instante(fecha, hora);
    const fin = new Date(new Date(inicio).getTime() + duracion * 60_000).toISOString();
    const { error } = await sb.from('turnos').insert({ inicio, fin, estado, nota: nota.trim() || null });
    if (error) return error.code === '23505' ? 'Ya hay un turno que empieza a esa hora.' : 'No se pudo crear el turno.';
    setEdicion(null);
    avisar('Turno creado.');
    if (fecha >= lunes && fecha < sumarDias(lunes, 7)) cargar();
    else setLunes(lunesDe(fecha));
    return null;
  }

  return (
    <section className="seccion-panel" aria-labelledby="turnos-admin-titulo">
      <header className="seccion-panel__head">
        <div>
          <h1 id="turnos-admin-titulo">Turnos</h1>
          <p className="seccion-panel__bajada">Tocá un turno para marcarlo como reservado, bloqueado o libre.</p>
        </div>
        <button type="button" className="btn btn--solido" onClick={() => setEdicion({ tipo: 'nuevo', fecha: hoy() })}>
          Agregar turno
        </button>
      </header>

      <div className="semana-nav">
        <button type="button" className="semana-nav__btn" onClick={() => setLunes(sumarDias(lunes, -7))} aria-label="Semana anterior">
          ←
        </button>
        <p className="semana-nav__rango" aria-live="polite">{rangoSemana(lunes)}</p>
        <button type="button" className="semana-nav__btn" onClick={() => setLunes(sumarDias(lunes, 7))} aria-label="Semana siguiente">
          →
        </button>
        {lunes !== lunesDe(hoy()) ? (
          <button type="button" className="semana-nav__hoy" onClick={() => setLunes(lunesDe(hoy()))}>
            Hoy
          </button>
        ) : null}
        {turnos ? (
          <p className="semana-nav__resumen">
            <span className="chip chip--libre">{cuenta('libre')} libres</span>
            <span className="chip chip--reservado">{cuenta('reservado')} reservados</span>
            <span className="chip chip--bloqueado">{cuenta('bloqueado')} bloqueados</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="estado-panel" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--linea" onClick={cargar}>Reintentar</button>
        </div>
      ) : turnos === null ? (
        <p className="estado-panel" role="status">Cargando…</p>
      ) : (
        <div className="semana">
          {dias.map((dia) => {
            const delDia = turnos.filter((t) => fechaLocal(t.inicio) === dia);
            const pasado = dia < hoy();
            return (
              <div key={dia} className="semana__dia" data-pasado={pasado} data-hoy={dia === hoy()}>
                <h2 className="semana__fecha">{diaCorto(dia)}</h2>
                {delDia.length === 0 ? <p className="semana__vacio">Sin turnos</p> : null}
                <ul className="semana__turnos">
                  {delDia.map((t) => (
                    <li key={t.id}>
                      <button type="button" className={`turno-admin turno-admin--${t.estado}`} onClick={() => setEdicion({ tipo: 'turno', turno: t })}>
                        <span className="turno-admin__hora">{horaCorta(t.inicio)}</span>
                        <span className="turno-admin__estado">{ESTADOS.find((e) => e.valor === t.estado)?.label}</span>
                        {t.nota ? <span className="turno-admin__nota">{t.nota}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
                {!pasado ? (
                  <button type="button" className="semana__agregar" onClick={() => setEdicion({ tipo: 'nuevo', fecha: dia })}>
                    + Agregar
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialogo
        titulo={edicion?.tipo === 'turno' ? describirTurno(edicion.turno.inicio) : 'Nuevo turno'}
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
      >
        {edicion?.tipo === 'turno' ? (
          <EditorTurno turno={edicion.turno} onGuardar={guardar} onEliminar={eliminar} />
        ) : edicion?.tipo === 'nuevo' ? (
          <NuevoTurno fecha={edicion.fecha} onCrear={crear} />
        ) : null}
      </Dialogo>
    </section>
  );
}

function SelectorEstado({ valor, onCambio }: { valor: EstadoTurno; onCambio: (e: EstadoTurno) => void }) {
  return (
    <fieldset className="campo estados">
      <legend>Estado</legend>
      <div className="estados__opciones">
        {ESTADOS.map((e) => (
          <label key={e.valor} className={`estado-op estado-op--${e.valor}`}>
            <input type="radio" name="estado" value={e.valor} checked={valor === e.valor} onChange={() => onCambio(e.valor)} />
            <span className="estado-op__label">{e.label}</span>
            <span className="estado-op__ayuda">{e.ayuda}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EditorTurno({
  turno,
  onGuardar,
  onEliminar,
}: {
  turno: Turno;
  onGuardar: (id: string, estado: EstadoTurno, nota: string) => Promise<string | null>;
  onEliminar: (id: string) => Promise<string | null>;
}) {
  const [estado, setEstado] = useState<EstadoTurno>(turno.estado);
  const [nota, setNota] = useState(turno.nota ?? '');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(await onGuardar(turno.id, estado, nota));
    setOcupado(false);
  }

  async function borrar() {
    const ok = await confirmar({
      titulo: '¿Eliminar este turno?',
      texto: `${describirTurno(turno.inicio)}. Deja de aparecer en la web.`,
      aceptar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    setOcupado(true);
    setError(await onEliminar(turno.id));
    setOcupado(false);
  }

  return (
    <form className="dialogo__form" onSubmit={enviar}>
      <p className="dialogo__sub">
        {horaCorta(turno.inicio)} a {horaCorta(turno.fin)} h
      </p>
      <SelectorEstado valor={estado} onCambio={setEstado} />
      <div className="campo">
        <label htmlFor="ed-nota">Nota privada</label>
        <input
          id="ed-nota"
          className="input"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nombre de la clienta, prueba n.º 2…"
          maxLength={200}
        />
        <p className="campo__ayuda">No se muestra en la web.</p>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="dialogo__acciones">
        <button type="button" className="btn-peligro" onClick={borrar} disabled={ocupado}>
          Eliminar turno
        </button>
        <button type="submit" className="btn btn--solido" disabled={ocupado}>
          Guardar
        </button>
      </div>
    </form>
  );
}

function NuevoTurno({
  fecha,
  onCrear,
}: {
  fecha: string;
  onCrear: (fecha: string, hora: string, duracion: number, estado: EstadoTurno, nota: string) => Promise<string | null>;
}) {
  const [estado, setEstado] = useState<EstadoTurno>('libre');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = String(fd.get('fecha'));
    const h = String(fd.get('hora'));
    if (!f || !h) {
      setError('Completá fecha y hora.');
      return;
    }
    if (new Date(instante(f, h)).getTime() < Date.now()) {
      setError('Ese horario ya pasó.');
      return;
    }
    setOcupado(true);
    setError(await onCrear(f, h, Number(fd.get('duracion')), estado, String(fd.get('nota') ?? '')));
    setOcupado(false);
  }

  return (
    <form className="dialogo__form" onSubmit={enviar}>
      <div className="dialogo__fila">
        <div className="campo">
          <label htmlFor="nt-fecha">Fecha</label>
          <input id="nt-fecha" name="fecha" type="date" className="input" defaultValue={fecha} min={hoy()} required />
        </div>
        <div className="campo">
          <label htmlFor="nt-hora">Hora</label>
          <input id="nt-hora" name="hora" type="time" className="input" defaultValue="10:00" step={900} required />
        </div>
        <div className="campo">
          <label htmlFor="nt-duracion">Duración</label>
          <select id="nt-duracion" name="duracion" className="input" defaultValue="60">
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 h</option>
            <option value="90">1 h 30</option>
            <option value="120">2 h</option>
          </select>
        </div>
      </div>
      <SelectorEstado valor={estado} onCambio={setEstado} />
      <div className="campo">
        <label htmlFor="nt-nota">Nota privada</label>
        <input id="nt-nota" name="nota" className="input" maxLength={200} />
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="dialogo__acciones">
        <button type="submit" className="btn btn--solido" disabled={ocupado}>
          Crear turno
        </button>
      </div>
    </form>
  );
}
