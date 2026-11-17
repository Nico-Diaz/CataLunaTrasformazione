import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Confirmaciones y avisos del panel, con el estilo de la marca (reemplazan a window.confirm).
 *
 *   if (await confirmar({ titulo: '¿Eliminar este turno?', peligro: true })) …
 *   avisar('Turno guardado.');            // éxito
 *   avisar('No se pudo guardar.', 'error');
 *
 * <Avisos /> se monta una sola vez (en AdminApp).
 */

export interface OpcionesConfirmar {
  titulo: string;
  texto?: string;
  aceptar?: string;
  cancelar?: string;
  /** Acción destructiva: botón en rojo. */
  peligro?: boolean;
}

type TipoAviso = 'ok' | 'error';
interface Aviso {
  id: number;
  texto: string;
  tipo: TipoAviso;
}
interface Pedido extends OpcionesConfirmar {
  resolver: (ok: boolean) => void;
}

let pedido: Pedido | null = null;
let avisos: Aviso[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();
const notificar = () => oyentes.forEach((fn) => fn());
const suscribir = (fn: () => void) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};

export function confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
  pedido?.resolver(false);
  return new Promise((resolver) => {
    pedido = { ...opciones, resolver };
    notificar();
  });
}

export function avisar(texto: string, tipo: TipoAviso = 'ok') {
  const id = siguienteId++;
  avisos = [...avisos, { id, texto, tipo }];
  notificar();
  window.setTimeout(() => cerrarAviso(id), tipo === 'error' ? 7000 : 4000);
}

function cerrarAviso(id: number) {
  avisos = avisos.filter((a) => a.id !== id);
  notificar();
}

function responder(ok: boolean) {
  const p = pedido;
  pedido = null;
  notificar();
  p?.resolver(ok);
}

export default function Avisos() {
  const actual = useSyncExternalStore(suscribir, () => pedido, () => null);
  const lista = useSyncExternalStore(suscribir, () => avisos, () => avisos);
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState<OpcionesConfirmar | null>(null);

  // Se guarda el último pedido para que el texto no desaparezca durante la animación de cierre.
  useEffect(() => {
    if (actual) setVisible(actual);
    const d = ref.current;
    if (!d) return;
    if (actual && !d.open) d.showModal();
    if (!actual && d.open) d.close();
  }, [actual]);

  return (
    <>
      <dialog
        ref={ref}
        className="confirmar"
        aria-labelledby="confirmar-titulo"
        aria-describedby={visible?.texto ? 'confirmar-texto' : undefined}
        onCancel={(e) => {
          e.preventDefault();
          responder(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) responder(false);
        }}
      >
        {visible ? (
          <div className="confirmar__caja">
            <span className={`confirmar__icono${visible.peligro ? ' confirmar__icono--peligro' : ''}`} aria-hidden="true">
              {visible.peligro ? (
                <svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 12.5l2.7 2.7L16.5 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
            <h2 id="confirmar-titulo" className="confirmar__titulo">{visible.titulo}</h2>
            {visible.texto ? <p id="confirmar-texto" className="confirmar__texto">{visible.texto}</p> : null}
            <div className="confirmar__acciones">
              <button type="button" className="btn btn--linea" onClick={() => responder(false)}>
                {visible.cancelar ?? 'Cancelar'}
              </button>
              <button
                type="button"
                className={`btn ${visible.peligro ? 'btn--peligro' : 'btn--solido'}`}
                onClick={() => responder(true)}
                autoFocus
              >
                {visible.aceptar ?? 'Aceptar'}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <div className="avisos" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={`aviso aviso--${a.tipo}`} role={a.tipo === 'error' ? 'alert' : 'status'}>
            <span className="aviso__icono" aria-hidden="true">
              {a.tipo === 'ok' ? (
                <svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <svg viewBox="0 0 20 20"><path d="M10 5.5v5.5M10 14v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              )}
            </span>
            <p>{a.texto}</p>
            <button type="button" className="aviso__cerrar" onClick={() => cerrarAviso(a.id)} aria-label="Cerrar aviso">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
