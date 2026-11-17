import { useCallback, useEffect, useState } from 'react';
import { BUCKET_INSPIRACION, PREFIJO_FOTOS, supabase, type Consulta } from '../../lib/supabase';
import { describirTurno } from '../../lib/fechas';
import { avisar, confirmar } from './Avisos';

type ConsultaConTurno = Consulta & { turnos: { inicio: string } | null };

const fmtCreado = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Mendoza',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function fechaEvento(f: string) {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

/**
 * Cualquiera puede crear consultas, así que no se confía en lo guardado:
 * solo se muestran links http(s) y fotos de nuestro propio bucket.
 */
const esLinkSeguro = (u: string) => /^https?:\/\//i.test(u);
const esFotoPropia = (u: string) => u.startsWith(PREFIJO_FOTOS);

/** Ruta dentro del bucket a partir de la URL pública. */
function rutaDe(url: string) {
  const marca = `/${BUCKET_INSPIRACION}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}

export default function ConsultasAdmin() {
  const sb = supabase!;
  const [consultas, setConsultas] = useState<ConsultaConTurno[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const { data, error } = await sb
      .from('consultas')
      .select('*, turnos(inicio)')
      .order('creado', { ascending: false })
      .limit(100);
    if (error) setError('No se pudieron cargar las consultas.');
    else setConsultas(data as ConsultaConTurno[]);
  }, [sb]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const [limpiando, setLimpiando] = useState(false);

  /** Fotos del bucket que no pertenecen a ninguna consulta (quedaron de borrados anteriores). */
  async function limpiarSueltas() {
    setLimpiando(true);
    try {
      const bucket = sb.storage.from(BUCKET_INSPIRACION);
      const raiz = await bucket.list('', { limit: 1000 });
      if (raiz.error) throw raiz.error;
      const rutas: string[] = [];
      for (const entrada of raiz.data) {
        if (entrada.id) {
          rutas.push(entrada.name);
          continue;
        }
        // Sin id = carpeta (una por mes, ej. "2026-11").
        const carpeta = await bucket.list(entrada.name, { limit: 1000 });
        if (carpeta.error) throw carpeta.error;
        for (const f of carpeta.data) if (f.id) rutas.push(`${entrada.name}/${f.name}`);
      }

      // Se vuelve a leer la base para no borrar fotos de una consulta recién llegada.
      const { data: todas, error } = await sb.from('consultas').select('imagenes');
      if (error) throw error;
      const enUso = new Set(
        (todas ?? []).flatMap((c) => (c.imagenes as string[]).map(rutaDe)).filter((r): r is string => !!r),
      );
      const sueltas = rutas.filter((r) => !enUso.has(r));

      if (!sueltas.length) {
        avisar(rutas.length ? 'No hay fotos sueltas: todas pertenecen a una consulta.' : 'El bucket de fotos está vacío.');
        return;
      }
      const ok = await confirmar({
        titulo: `¿Borrar ${sueltas.length === 1 ? '1 foto suelta' : `${sueltas.length} fotos sueltas`}?`,
        texto: 'Son fotos que ya no pertenecen a ninguna consulta. No se puede deshacer.',
        aceptar: 'Borrar',
        peligro: true,
      });
      if (!ok) return;

      const { data: borradas, error: errBorrar } = await bucket.remove(sueltas);
      const n = borradas?.length ?? 0;
      if (errBorrar || n === 0) {
        console.warn('No se borraron las fotos sueltas', { errBorrar, sueltas });
        avisar('Supabase no dejó borrar las fotos: falta el permiso de lectura. Ejecutá supabase/borrar-fotos.sql en el SQL Editor y probá de nuevo.', 'error');
      } else if (n < sueltas.length) {
        avisar(`Se borraron ${n} de ${sueltas.length} fotos sueltas.`, 'error');
      } else {
        avisar(n === 1 ? 'Se borró 1 foto suelta.' : `Se borraron ${n} fotos sueltas.`);
      }
    } catch (e) {
      console.warn('Error al limpiar fotos', e);
      avisar('No se pudo revisar el bucket de fotos.', 'error');
    } finally {
      setLimpiando(false);
    }
  }

  /**
   * Consulta atendida = se borra todo: las fotos del bucket y la fila (con la idea y los links).
   * La consulta se borra aunque fallen las fotos, y se verifica que la base la haya borrado de
   * verdad: si una regla de seguridad lo impide, Supabase no da error, solo borra 0 filas.
   */
  async function atendida(c: ConsultaConTurno) {
    const ok = await confirmar({
      titulo: `¿Ya atendiste la consulta de ${c.nombre}?`,
      texto: 'Se borra por completo: la idea, los links y las fotos. No se puede deshacer.',
      aceptar: 'Sí, ya la atendí',
      cancelar: 'Todavía no',
      peligro: true,
    });
    if (!ok) return;
    setBorrando(c.id);
    try {
      const rutas = c.imagenes.filter(esFotoPropia).map(rutaDe).filter((r): r is string => !!r);
      let fotosOk = true;
      if (rutas.length) {
        const { data, error } = await sb.storage.from(BUCKET_INSPIRACION).remove(rutas);
        fotosOk = !error && (data?.length ?? 0) >= rutas.length;
        if (!fotosOk) console.warn('No se borraron todas las fotos', { error, borradas: data?.length, rutas });
      }

      const { data: borradas, error } = await sb.from('consultas').delete().eq('id', c.id).select('id');
      if (error || !borradas?.length) {
        console.warn('No se borró la consulta', { error });
        avisar(
          `No se pudo borrar la consulta de ${c.nombre}. Revisá que se haya ejecutado supabase/schema.sql completo.`,
          'error',
        );
        return;
      }

      setConsultas((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
      if (fotosOk) {
        avisar(`Consulta de ${c.nombre} atendida y borrada.`);
      } else {
        avisar(
          `Se borró la consulta de ${c.nombre}, pero Supabase no dejó borrar sus fotos: falta el permiso de lectura. Ejecutá supabase/borrar-fotos.sql en el SQL Editor y después tocá "Limpiar fotos sueltas".`,
          'error',
        );
      }
    } finally {
      setBorrando(null);
    }
  }

  return (
    <section className="seccion-panel" aria-labelledby="consultas-titulo">
      <header className="seccion-panel__head">
        <div>
          <h1 id="consultas-titulo">Consultas</h1>
          <p className="seccion-panel__bajada">
            Lo que mandaron desde la web: fotos, links e ideas. Cuando la atiendas, marcala y se borra todo.
          </p>
        </div>
        <button type="button" className="btn btn--linea" onClick={limpiarSueltas} disabled={limpiando}>
          {limpiando ? 'Revisando…' : 'Limpiar fotos sueltas'}
        </button>
      </header>

      {error ? (
        <div className="estado-panel" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--linea" onClick={cargar}>Reintentar</button>
        </div>
      ) : consultas === null ? (
        <p className="estado-panel" role="status">Cargando…</p>
      ) : consultas.length === 0 ? (
        <p className="estado-panel">No hay consultas pendientes.</p>
      ) : (
        <ul className="consultas">
          {consultas.map(({ imagenes, links, ...c }) => {
            const fotos = imagenes.filter(esFotoPropia);
            const enlaces = links.filter(esLinkSeguro);
            const completa = { ...c, imagenes, links };
            return (
            <li key={c.id} className="consulta" aria-busy={borrando === c.id}>
              <header className="consulta__head">
                <div>
                  <h2 className="consulta__nombre">{c.nombre}</h2>
                  <p className="consulta__meta">
                    <span className={`chip ${c.linea === 'Trasformazione' ? 'chip--trasf' : 'chip--cl'}`}>{c.linea}</span>
                    {c.prenda}
                  </p>
                </div>
                <time className="consulta__creado" dateTime={c.creado}>{fmtCreado.format(new Date(c.creado))}</time>
              </header>

              <dl className="consulta__datos">
                {c.fecha_evento ? (
                  <div><dt>Evento</dt><dd>{fechaEvento(c.fecha_evento)}</dd></div>
                ) : null}
                {c.turnos ? (
                  <div><dt>Turno pedido</dt><dd>{describirTurno(c.turnos.inicio)}</dd></div>
                ) : null}
              </dl>

              {c.mensaje ? <p className="consulta__mensaje">{c.mensaje}</p> : null}

              {fotos.length ? (
                <ul className="consulta__fotos">
                  {fotos.map((url, i) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener">
                        <img src={url} alt={`Foto ${i + 1} de ${c.nombre}`} loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              {enlaces.length ? (
                <ul className="consulta__links">
                  {enlaces.map((l) => (
                    <li key={l}>
                      <a href={l} target="_blank" rel="noopener noreferrer">{l.replace(/^https?:\/\//, '')}</a>
                    </li>
                  ))}
                </ul>
              ) : null}

              <footer className="consulta__acciones">
                <button
                  type="button"
                  className="btn btn--solido"
                  onClick={() => atendida(completa)}
                  disabled={borrando !== null}
                >
                  {borrando === c.id ? 'Borrando…' : 'Marcar atendida'}
                </button>
              </footer>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
