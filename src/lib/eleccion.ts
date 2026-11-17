/**
 * Puente entre islas: la sección de turnos y el botón de Trasformazione le avisan al
 * formulario qué eligió la clienta. Se guarda en `window` para que el formulario lo lea
 * aunque se hidrate después del click.
 */
import type { Linea } from './supabase';

export interface TurnoElegido {
  id: string;
  inicio: string;
}

interface Eleccion {
  turno?: TurnoElegido | null;
  linea?: Linea;
}

const EVENTO = 'cl:eleccion';

declare global {
  interface Window {
    __clEleccion?: Eleccion;
  }
}

export function elegir(cambio: Eleccion) {
  window.__clEleccion = { ...window.__clEleccion, ...cambio };
  window.dispatchEvent(new CustomEvent<Eleccion>(EVENTO, { detail: cambio }));
}

export function eleccionActual(): Eleccion {
  return window.__clEleccion ?? {};
}

export function alElegir(fn: (cambio: Eleccion) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<Eleccion>).detail);
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
}

export function irAlFormulario() {
  const destino = document.getElementById('idea');
  if (!destino) return;
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  destino.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
}
