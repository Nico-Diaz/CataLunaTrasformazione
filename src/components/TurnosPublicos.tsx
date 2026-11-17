import { useEffect, useState } from 'react';
import { supabase, type TurnoPublico } from '../lib/supabase';
import {
  diaCorto,
  fechaLocal,
  generarTurnos,
  horaCorta,
  hoy,
  instante,
  lunesDe,
  rangoSemana,
  sumarDias,
} from '../lib/fechas';
import { alElegir, eleccionActual, elegir, irAlFormulario } from '../lib/eleccion';
import './TurnosPublicos.css';

const SEMANAS_ADELANTE = 8;

/** Horario de ejemplo para el modo demo (sin Supabase configurado). */
const HORARIO_DEMO = [2, 4, 6].map((dia) => ({
  dia_semana: dia,
  hora_inicio: dia === 6 ? '10:00' : '15:00',
  hora_fin: dia === 6 ? '13:00' : '19:00',
  duracion_min: 60,
}));

function turnosDemo(lunes: string): TurnoPublico[] {
  return generarTurnos(HORARIO_DEMO, lunes, 7).map((t) => {
    // Pseudoaleatorio estable: el mismo turno siempre sale igual.
    const semilla = [...t.inicio].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return { id: `demo-${t.inicio}`, inicio: t.inicio, fin: t.fin, disponible: semilla % 3 !== 0 };
  });
}

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; turnos: TurnoPublico[] };

export default function TurnosPublicos() {
  const primerLunes = lunesDe(hoy());
  const [lunes, setLunes] = useState(primerLunes);
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [elegido, setElegido] = useState<string | null>(() => eleccionActual().turno?.id ?? null);
  const [reintento, setReintento] = useState(0);

  useEffect(
    () =>
      alElegir((c) => {
        if (c.turno !== undefined) setElegido(c.turno?.id ?? null);
      }),
    [],
  );

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });

    if (!supabase) {
      setEstado({ tipo: 'listo', turnos: turnosDemo(lunes) });
      return;
    }

    supabase
      .from('turnos_publicos')
      .select('id, inicio, fin, disponible')
      .gte('inicio', instante(lunes, '00:00'))
      .lt('inicio', instante(sumarDias(lunes, 7), '00:00'))
      .order('inicio')
      .then(({ data, error }) => {
        if (!vigente) return;
        setEstado(error ? { tipo: 'error' } : { tipo: 'listo', turnos: (data ?? []) as TurnoPublico[] });
      });

    return () => {
      vigente = false;
    };
  }, [lunes, reintento]);

  const ultimoLunes = sumarDias(primerLunes, 7 * SEMANAS_ADELANTE);
  const ahora = Date.now();

  // Agrupar por día, dejando afuera lo que ya pasó.
  const porDia = new Map<string, TurnoPublico[]>();
  if (estado.tipo === 'listo') {
    for (const t of estado.turnos) {
      if (new Date(t.inicio).getTime() <= ahora) continue;
      const dia = fechaLocal(t.inicio);
      porDia.set(dia, [...(porDia.get(dia) ?? []), t]);
    }
  }
  const libres = [...porDia.values()].flat().filter((t) => t.disponible).length;

  function elegirTurno(t: TurnoPublico) {
    elegir({ turno: { id: t.id, inicio: t.inicio } });
    irAlFormulario();
  }

  return (
    <div className="agenda">
      <div className="agenda__barra">
        <button
          type="button"
          className="agenda__nav"
          onClick={() => setLunes(sumarDias(lunes, -7))}
          disabled={lunes <= primerLunes}
          aria-label="Semana anterior"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
        <p className="agenda__semana" aria-live="polite">
          <span className="label">{lunes === primerLunes ? 'Esta semana' : 'Semana'}</span>
          <span>{rangoSemana(lunes)}</span>
        </p>
        <button
          type="button"
          className="agenda__nav"
          onClick={() => setLunes(sumarDias(lunes, 7))}
          disabled={lunes >= ultimoLunes}
          aria-label="Semana siguiente"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </div>

      {estado.tipo === 'cargando' ? (
        <div className="agenda__estado" role="status">Cargando turnos…</div>
      ) : estado.tipo === 'error' ? (
        <div className="agenda__estado" role="alert">
          <p>No pude cargar los turnos. Revisá tu conexión.</p>
          <button type="button" className="btn btn--linea" onClick={() => setReintento((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : porDia.size === 0 ? (
        <div className="agenda__estado">
          <p>No hay turnos cargados para esta semana.</p>
          {lunes < ultimoLunes ? (
            <button type="button" className="btn btn--linea" onClick={() => setLunes(sumarDias(lunes, 7))}>
              Ver la semana siguiente
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {libres === 1 ? '1 turno disponible' : `${libres} turnos disponibles`} esta semana.
          </p>
          <ul className="agenda__dias">
            {[...porDia.entries()].map(([dia, turnos]) => (
              <li key={dia} className="agenda__dia">
                <h3 className="agenda__fecha">{diaCorto(dia)}</h3>
                <ul className="agenda__turnos">
                  {turnos.map((t) => (
                    <li key={t.id}>
                      {t.disponible ? (
                        <button
                          type="button"
                          className="turno turno--libre"
                          aria-pressed={elegido === t.id}
                          onClick={() => elegirTurno(t)}
                        >
                          <span className="turno__hora">{horaCorta(t.inicio)}</span>
                          <span className="turno__estado">{elegido === t.id ? 'Elegido' : 'Disponible'}</span>
                        </button>
                      ) : (
                        <span className="turno turno--ocupado">
                          <span className="turno__hora">{horaCorta(t.inicio)}</span>
                          <span className="turno__estado">No disponible</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="agenda__pie">
        <ul className="agenda__leyenda" aria-label="Referencias">
          <li><span className="punto punto--libre" aria-hidden="true" />Disponible</li>
          <li><span className="punto punto--ocupado" aria-hidden="true" />No disponible</li>
        </ul>
        {!supabase ? <p className="agenda__demo">Vista de ejemplo: todavía no hay turnos reales cargados.</p> : null}
      </div>
    </div>
  );
}
