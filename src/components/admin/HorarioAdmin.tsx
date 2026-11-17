import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, type FranjaHoraria } from '../../lib/supabase';
import { generarTurnos, hoy, instante, NOMBRES_DIAS } from '../../lib/fechas';
import { avisar, confirmar } from './Avisos';

/** Lunes primero, domingo al final. */
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

function hora(t: string) {
  return t.slice(0, 5);
}

export default function HorarioAdmin() {
  const sb = supabase!;
  const [franjas, setFranjas] = useState<FranjaHoraria[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [semanas, setSemanas] = useState(8);
  const [resultado, setResultado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await sb
      .from('horario_semanal')
      .select('id, dia_semana, hora_inicio, hora_fin, duracion_min')
      .order('hora_inicio');
    if (error) setError('No se pudo cargar el horario.');
    else setFranjas(data as FranjaHoraria[]);
  }, [sb]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function agregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const desde = String(fd.get('desde'));
    const hasta = String(fd.get('hasta'));
    if (hasta <= desde) {
      setErrorForm('La hora de fin tiene que ser después de la de inicio.');
      return;
    }
    setErrorForm(null);
    const { error } = await sb.from('horario_semanal').insert({
      dia_semana: Number(fd.get('dia')),
      hora_inicio: desde,
      hora_fin: hasta,
      duracion_min: Number(fd.get('duracion')),
    });
    if (error) setErrorForm('No se pudo agregar la franja.');
    else cargar();
  }

  async function quitar(id: string) {
    const { error } = await sb.from('horario_semanal').delete().eq('id', id);
    if (!error) setFranjas((prev) => prev?.filter((f) => f.id !== id) ?? null);
  }

  async function generar() {
    if (!franjas?.length) return;
    setOcupado(true);
    setResultado(null);
    const nuevos = generarTurnos(franjas, hoy(), semanas * 7).map((t) => ({ ...t, estado: 'libre' }));
    const { data, error } = await sb
      .from('turnos')
      .upsert(nuevos, { onConflict: 'inicio', ignoreDuplicates: true })
      .select('id');
    setOcupado(false);
    if (error) {
      setResultado('No se pudieron generar los turnos.');
      return;
    }
    const creados = data?.length ?? 0;
    const existentes = nuevos.length - creados;
    setResultado(
      `${creados === 1 ? 'Se creó 1 turno' : `Se crearon ${creados} turnos`}` +
        (existentes > 0 ? ` (${existentes} ya existían y no se tocaron).` : '.'),
    );
  }

  async function borrarLibres() {
    const ok = await confirmar({
      titulo: '¿Borrar los turnos libres?',
      texto: 'Se borran todos los turnos libres desde hoy en adelante. Los reservados y bloqueados no se tocan.',
      aceptar: 'Borrar libres',
      peligro: true,
    });
    if (!ok) return;
    setOcupado(true);
    const { data, error } = await sb
      .from('turnos')
      .delete()
      .eq('estado', 'libre')
      .gte('inicio', instante(hoy(), '00:00'))
      .select('id');
    setOcupado(false);
    setResultado(null);
    if (error) avisar('No se pudieron borrar los turnos.', 'error');
    else avisar(`Se borraron ${data?.length ?? 0} turnos libres.`);
  }

  return (
    <section className="seccion-panel" aria-labelledby="horario-titulo">
      <header className="seccion-panel__head">
        <div>
          <h1 id="horario-titulo">Horario de atención</h1>
          <p className="seccion-panel__bajada">
            Cargá los días y horarios en que atendés. Después generá los turnos de las próximas semanas: aparecen en la web
            como disponibles.
          </p>
        </div>
      </header>

      {error ? (
        <p className="estado-panel" role="alert">{error}</p>
      ) : franjas === null ? (
        <p className="estado-panel" role="status">Cargando…</p>
      ) : (
        <div className="horario">
          <ul className="horario__dias">
            {ORDEN_DIAS.map((d) => {
              const delDia = franjas.filter((f) => f.dia_semana === d);
              return (
                <li key={d} className="horario__dia">
                  <span className="horario__nombre">{NOMBRES_DIAS[d]}</span>
                  {delDia.length === 0 ? (
                    <span className="horario__cerrado">No atiendo</span>
                  ) : (
                    <ul className="horario__franjas">
                      {delDia.map((f) => (
                        <li key={f.id} className="franja">
                          {hora(f.hora_inicio)} a {hora(f.hora_fin)} · turnos de {f.duracion_min} min
                          <button type="button" className="franja__quitar" onClick={() => quitar(f.id)} aria-label={`Quitar franja de ${NOMBRES_DIAS[d]} ${hora(f.hora_inicio)}`}>
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <form className="horario__form" onSubmit={agregar}>
            <h2>Agregar franja</h2>
            <div className="horario__campos">
              <div className="campo">
                <label htmlFor="hf-dia">Día</label>
                <select id="hf-dia" name="dia" className="input" defaultValue="2">
                  {ORDEN_DIAS.map((d) => (
                    <option key={d} value={d}>{NOMBRES_DIAS[d]}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="hf-desde">Desde</label>
                <input id="hf-desde" name="desde" type="time" className="input" defaultValue="10:00" step={900} required />
              </div>
              <div className="campo">
                <label htmlFor="hf-hasta">Hasta</label>
                <input id="hf-hasta" name="hasta" type="time" className="input" defaultValue="13:00" step={900} required />
              </div>
              <div className="campo">
                <label htmlFor="hf-duracion">Cada turno</label>
                <select id="hf-duracion" name="duracion" className="input" defaultValue="60">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 h</option>
                  <option value="90">1 h 30</option>
                  <option value="120">2 h</option>
                </select>
              </div>
            </div>
            {errorForm ? <p className="error" role="alert">{errorForm}</p> : null}
            <button type="submit" className="btn btn--linea">Agregar</button>
          </form>

          <div className="horario__generar">
            <h2>Generar turnos</h2>
            <p className="campo__ayuda">
              Crea los turnos libres según el horario. Los que ya existen (reservados, bloqueados o libres) no se modifican.
            </p>
            <div className="horario__generar-fila">
              <label htmlFor="hg-semanas" className="sr-only">Cantidad de semanas</label>
              <select id="hg-semanas" className="input" value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}>
                <option value={2}>Próximas 2 semanas</option>
                <option value={4}>Próximas 4 semanas</option>
                <option value={8}>Próximas 8 semanas</option>
                <option value={12}>Próximas 12 semanas</option>
              </select>
              <button type="button" className="btn btn--solido" onClick={generar} disabled={ocupado || franjas.length === 0}>
                Generar turnos
              </button>
            </div>
            {franjas.length === 0 ? <p className="campo__ayuda">Primero agregá al menos una franja.</p> : null}
            {resultado ? <p className="horario__resultado" role="status">{resultado}</p> : null}
            <button type="button" className="btn-peligro" onClick={borrarLibres} disabled={ocupado}>
              Borrar turnos libres a futuro
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
