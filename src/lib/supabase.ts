import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Acepta la URL con o sin "/rest/v1/" al final (el panel de Supabase muestra ambas).
const url = (import.meta.env.SUPABASE_URL as string | undefined)?.trim().replace(/\/(rest\/v1\/?)?$/, '');
const anonKey = import.meta.env.SUPABASE_ANON_KEY as string | undefined;

/**
 * Cliente de Supabase. Es `null` mientras no estén cargadas las variables de entorno:
 * en ese caso la web funciona en modo demo (turnos de ejemplo, sin subir fotos).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const BUCKET_INSPIRACION = 'inspiracion';

/** Prefijo de las URLs públicas de las fotos subidas desde la web. */
export const PREFIJO_FOTOS = `${url ?? ''}/storage/v1/object/public/${BUCKET_INSPIRACION}/`;

export type EstadoTurno = 'libre' | 'reservado' | 'bloqueado';

export interface TurnoPublico {
  id: string;
  inicio: string;
  fin: string;
  disponible: boolean;
}

export interface Turno {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  nota: string | null;
}

export interface FranjaHoraria {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_min: number;
}

export type Linea = 'Catalina Luna' | 'Trasformazione';

export interface Consulta {
  id: string;
  creado: string;
  nombre: string;
  linea: Linea;
  prenda: string;
  fecha_evento: string | null;
  links: string[];
  imagenes: string[];
  mensaje: string | null;
  turno_id: string | null;
  atendida: boolean;
}
