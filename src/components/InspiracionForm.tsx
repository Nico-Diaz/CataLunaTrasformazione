import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { anticipacion, prendas } from '../data/sitio';
import { BUCKET_INSPIRACION, supabase, type Linea } from '../lib/supabase';
import { describirTurno, hoy, mesesHasta } from '../lib/fechas';
import { alElegir, eleccionActual, elegir, type TurnoElegido } from '../lib/eleccion';
import { comprimirImagen } from '../lib/imagen';
import { armarMensaje, urlWhatsApp } from '../lib/whatsapp';
import './InspiracionForm.css';

const MAX_FOTOS = 5;
const MAX_MB = 25;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

interface Foto {
  id: string;
  archivo: File;
  vista: string;
}

type Campo = 'nombre' | 'prenda' | 'links' | 'fotos';
type Errores = Partial<Record<Campo, string>>;

type Fase =
  | { tipo: 'editando' }
  | { tipo: 'enviando'; paso: string }
  | { tipo: 'listo'; url: string; mensaje: string; pendientes: number };

const LINEAS: { valor: Linea; titulo: string; detalle: string }[] = [
  { valor: 'Catalina Luna', titulo: 'Catalina Luna', detalle: 'Fiesta y novias' },
  { valor: 'Trasformazione', titulo: 'Trasformazione', detalle: 'Formal y cotidiana' },
];

function prendasDe(linea: Linea) {
  return prendas.filter((p) => p.linea === linea || p.linea === null);
}

function extraerLinks(texto: string) {
  return [...new Set((texto.match(URL_RE) ?? []).map((u) => u.replace(/[),.;]+$/, '')))];
}

export default function InspiracionForm() {
  const [linea, setLinea] = useState<Linea>('Catalina Luna');
  const [prenda, setPrenda] = useState<string>(prendas[0].valor);
  const [fecha, setFecha] = useState('');
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [turno, setTurno] = useState<TurnoElegido | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [fase, setFase] = useState<Fase>({ tipo: 'editando' });
  const [minFecha, setMinFecha] = useState<string | undefined>(undefined);
  const inputFotos = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Lo que la clienta eligió en otras secciones (turno, línea), antes o después de hidratar.
  useEffect(() => {
    const aplicar = (c: { turno?: TurnoElegido | null; linea?: Linea }) => {
      if (c.turno !== undefined) setTurno(c.turno);
      if (c.linea) {
        setLinea(c.linea);
        setPrenda(prendasDe(c.linea)[0].valor);
      }
    };
    aplicar(eleccionActual());
    setMinFecha(hoy());
    return alElegir(aplicar);
  }, []);

  // Liberar las vistas previas al desmontar.
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.vista)), []);

  const esNovia = prendas.find((p) => p.valor === prenda && 'novia' in p) !== undefined;
  const mesesMinimos = esNovia ? anticipacion.novias : anticipacion.general;
  const meses = fecha ? mesesHasta(fecha) : null;
  const pocoTiempo = meses !== null && meses >= 0 && meses < mesesMinimos;

  function cambiarLinea(nueva: Linea) {
    setLinea(nueva);
    if (!prendasDe(nueva).some((p) => p.valor === prenda)) setPrenda(prendasDe(nueva)[0].valor);
  }

  function agregarFotos(e: ChangeEvent<HTMLInputElement>) {
    const elegidas = [...(e.target.files ?? [])];
    e.target.value = '';
    const lugar = MAX_FOTOS - fotos.length;
    const validas = elegidas.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    const grandes = validas.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const aceptadas = validas.filter((f) => f.size <= MAX_MB * 1024 * 1024).slice(0, lugar);

    let aviso: string | undefined;
    if (elegidas.length > validas.length) aviso = 'Algunos archivos no son imágenes y no se agregaron.';
    else if (grandes.length) aviso = `Hay fotos de más de ${MAX_MB} MB que no se agregaron.`;
    else if (validas.length > lugar) aviso = `Podés subir hasta ${MAX_FOTOS} fotos. Si tenés más, mandalas por WhatsApp.`;
    setErrores((prev) => ({ ...prev, fotos: aviso }));

    setFotos((prev) => [
      ...prev,
      ...aceptadas.map((archivo) => ({ id: crypto.randomUUID(), archivo, vista: URL.createObjectURL(archivo) })),
    ]);
  }

  function quitarFoto(id: string) {
    setFotos((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.vista);
      return prev.filter((x) => x.id !== id);
    });
    setErrores((prev) => ({ ...prev, fotos: undefined }));
  }

  function limpiar(campo: Campo) {
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  async function subirFotos(): Promise<{ urls: string[]; fallidas: number }> {
    if (!supabase || fotos.length === 0) return { urls: [], fallidas: fotos.length };
    const urls: string[] = [];
    let fallidas = 0;
    for (const [i, f] of fotos.entries()) {
      setFase({ tipo: 'enviando', paso: `Subiendo fotos (${i + 1} de ${fotos.length})…` });
      try {
        const blob = await comprimirImagen(f.archivo);
        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
        const ruta = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET_INSPIRACION)
          // Caché corta: al marcar la consulta como atendida, el link deja de abrir en ~1 minuto
          // (con el valor por defecto, la CDN lo seguía mostrando hasta 1 hora).
          .upload(ruta, blob, { contentType: blob.type, upsert: false, cacheControl: '60' });
        if (error) throw error;
        urls.push(supabase.storage.from(BUCKET_INSPIRACION).getPublicUrl(ruta).data.publicUrl);
      } catch {
        fallidas++;
      }
    }
    return { urls, fallidas };
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const nombre = String(fd.get('nombre') ?? '').trim();
    const textoLinks = String(fd.get('links') ?? '');
    const mensaje = String(fd.get('mensaje') ?? '').trim();
    const links = extraerLinks(textoLinks);

    const nuevos: Errores = {};
    if (!nombre) nuevos.nombre = 'Escribí tu nombre.';
    if (!prenda) nuevos.prenda = 'Elegí qué prenda querés hacer.';
    if (textoLinks.trim() && links.length === 0) {
      nuevos.links = 'No encontré ningún link. Copialo completo, empezando con https://';
    }
    setErrores(nuevos);
    const primero = (Object.keys(nuevos) as Campo[])[0];
    if (primero) {
      form.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      return;
    }

    setFase({ tipo: 'enviando', paso: 'Preparando tu consulta…' });
    const { urls, fallidas } = await subirFotos();

    let guardada = false;
    if (supabase) {
      setFase({ tipo: 'enviando', paso: 'Guardando…' });
      const esTurnoReal = turno && !turno.id.startsWith('demo-');
      const { error } = await supabase.from('consultas').insert({
        nombre,
        linea,
        prenda,
        fecha_evento: fecha || null,
        links,
        imagenes: urls,
        mensaje: mensaje || null,
        turno_id: esTurnoReal ? turno.id : null,
      });
      // Si falla el guardado no se frena nada: el mensaje de WhatsApp lleva la idea escrita
      // y pide adjuntar las fotos en el chat.
      guardada = !error;
    }
    const pendientes = guardada ? fallidas : fotos.length;

    const texto = armarMensaje({
      nombre,
      linea,
      prenda,
      fechaEvento: fecha || null,
      links,
      imagenes: urls,
      mensaje,
      turnoInicio: turno?.inicio ?? null,
      fotosPendientes: pendientes,
      guardada,
    });
    setFase({ tipo: 'listo', url: urlWhatsApp(texto), mensaje: texto, pendientes });
  }

  function empezarDeNuevo() {
    fotos.forEach((f) => URL.revokeObjectURL(f.vista));
    setFotos([]);
    setFecha('');
    setTurno(null);
    elegir({ turno: null });
    setFase({ tipo: 'editando' });
  }

  if (fase.tipo === 'listo') {
    return (
      <div className="idea-listo" role="status">
        <p className="label">Último paso</p>
        <h3 className="idea-listo__titulo">Tu consulta está lista para enviar.</h3>
        <p>
          Tocá el botón para abrir WhatsApp con el mensaje escrito. Solo te queda enviarlo.
          {fase.pendientes === 0
            ? ''
            : supabase
              ? fase.pendientes === 1
                ? ' No pude subir una foto: adjuntala en el chat.'
                : ` No pude subir ${fase.pendientes} fotos: adjuntalas en el chat.`
              : ` Acordate de adjuntar ${fase.pendientes === 1 ? 'la foto' : 'las fotos'} en el chat.`}
        </p>
        <a className="btn btn--solido idea-listo__wa" href={fase.url} target="_blank" rel="noopener">
          <IconoWhatsApp />
          Enviar por WhatsApp
        </a>
        <details className="idea-listo__vista">
          <summary>Ver el mensaje</summary>
          <pre>{fase.mensaje}</pre>
        </details>
        <button type="button" className="idea-listo__otra" onClick={empezarDeNuevo}>
          Escribir otra consulta
        </button>
      </div>
    );
  }

  const enviando = fase.tipo === 'enviando';

  return (
    <form ref={formRef} className="idea" noValidate onSubmit={onSubmit} aria-busy={enviando}>
      <fieldset className="campo idea__lineas">
        <legend>¿Para qué línea?</legend>
        <div className="idea__opciones">
          {LINEAS.map((l) => (
            <label key={l.valor} className="opcion">
              <input
                type="radio"
                name="linea"
                value={l.valor}
                checked={linea === l.valor}
                onChange={() => cambiarLinea(l.valor)}
              />
              <span className="opcion__titulo">{l.titulo}</span>
              <span className="opcion__detalle">{l.detalle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="idea__fila">
        <div className="campo">
          <label htmlFor="if-nombre">Tu nombre</label>
          <input
            id="if-nombre"
            name="nombre"
            className="input"
            type="text"
            autoComplete="name"
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? 'if-nombre-error' : undefined}
            onChange={() => limpiar('nombre')}
          />
          {errores.nombre ? <p id="if-nombre-error" className="error">{errores.nombre}</p> : null}
        </div>

        <div className="campo">
          <label htmlFor="if-prenda">Prenda</label>
          <select
            id="if-prenda"
            name="prenda"
            className="input"
            value={prenda}
            onChange={(e) => {
              setPrenda(e.target.value);
              limpiar('prenda');
            }}
          >
            {prendasDe(linea).map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.valor}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="if-fecha">
          {linea === 'Trasformazione' ? 'Para cuándo la necesitás' : 'Fecha del evento'}{' '}
          <span className="idea__opcional">(opcional)</span>
        </label>
        <input
          id="if-fecha"
          name="fecha"
          className="input idea__fecha"
          type="date"
          min={minFecha}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-describedby={pocoTiempo ? 'if-fecha-aviso' : undefined}
        />
        {pocoTiempo ? (
          <p id="if-fecha-aviso" className="idea__aviso">
            Faltan menos de {mesesMinimos} meses{esNovia ? ' (para novias recomiendo de 4 a 5)' : ''}. Escribime igual y
            vemos si llegamos con los tiempos.
          </p>
        ) : null}
      </div>

      <div className="campo">
        <span className="campo__titulo" id="if-fotos-titulo">
          Fotos de inspiración <span className="idea__opcional">(hasta {MAX_FOTOS})</span>
        </span>
        <p className="campo__ayuda">Capturas, fotos de vestidos que te gusten, un boceto tuyo…</p>
        <div className="fotos">
          {fotos.map((f) => (
            <figure key={f.id} className="foto">
              <img src={f.vista} alt={f.archivo.name} />
              <button
                type="button"
                className="foto__quitar"
                onClick={() => quitarFoto(f.id)}
                aria-label={`Quitar ${f.archivo.name}`}
                disabled={enviando}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" /></svg>
              </button>
            </figure>
          ))}
          {fotos.length < MAX_FOTOS ? (
            <button
              type="button"
              className="fotos__agregar"
              onClick={() => inputFotos.current?.click()}
              aria-describedby="if-fotos-titulo"
              disabled={enviando}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" /></svg>
              <span>{fotos.length ? 'Agregar más' : 'Subir fotos'}</span>
            </button>
          ) : null}
        </div>
        <input
          ref={inputFotos}
          className="sr-only"
          type="file"
          name="fotos"
          accept="image/*"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          onChange={agregarFotos}
        />
        {errores.fotos ? <p className="error" role="alert">{errores.fotos}</p> : null}
      </div>

      <div className="campo">
        <label htmlFor="if-links">
          Links de Pinterest u otras páginas <span className="idea__opcional">(opcional)</span>
        </label>
        <textarea
          id="if-links"
          name="links"
          className="input idea__links"
          rows={2}
          placeholder="https://pin.it/…"
          spellCheck={false}
          aria-invalid={errores.links ? true : undefined}
          aria-describedby={errores.links ? 'if-links-error' : 'if-links-ayuda'}
          onChange={() => limpiar('links')}
        />
        <p id="if-links-ayuda" className="campo__ayuda">Pegá uno o varios: un tablero, un pin, una publicación.</p>
        {errores.links ? <p id="if-links-error" className="error">{errores.links}</p> : null}
      </div>

      <div className="campo">
        <label htmlFor="if-mensaje">
          Contame tu idea <span className="idea__opcional">(opcional)</span>
        </label>
        <textarea
          id="if-mensaje"
          name="mensaje"
          className="input"
          rows={4}
          maxLength={2000}
          placeholder="Color, largo, escote, el tipo de evento…"
        />
      </div>

      <div className="idea__turno">
        {turno ? (
          <>
            <p>
              <span className="label">Turno que te gustaría</span>
              <strong>{describirTurno(turno.inicio)}</strong>
            </p>
            <button type="button" className="idea__quitar-turno" onClick={() => elegir({ turno: null })}>
              Quitar
            </button>
          </>
        ) : (
          <p>
            ¿Viste un turno libre? <a href="#turnos">Elegilo en la agenda</a> y se suma al mensaje.
          </p>
        )}
      </div>

      <div className="idea__enviar">
        <button type="submit" className="btn btn--solido" disabled={enviando}>
          {enviando ? fase.paso : 'Preparar mensaje de WhatsApp'}
        </button>
        <p className="campo__ayuda">
          {supabase
            ? 'Tus fotos y tu idea le llegan a Catalina por la web; el WhatsApp solo le avisa.'
            : 'Las fotos las vas a adjuntar en el chat de WhatsApp.'}
        </p>
      </div>
    </form>
  );
}

function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"
      />
    </svg>
  );
}
