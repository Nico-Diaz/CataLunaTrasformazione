/**
 * Fechas en la hora de Mendoza. Argentina no tiene horario de verano: el desfase es fijo (-03:00).
 * Las fechas "de calendario" se manejan como texto YYYY-MM-DD para no depender
 * de la zona horaria del dispositivo de quien mira la página.
 */
export const ZONA = 'America/Argentina/Mendoza';
const DESFASE = '-03:00';

const fmtFechaISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const fmtHoraCorta = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const NOMBRES_DIAS = DIAS;

/** Día de calendario (YYYY-MM-DD) en Mendoza para un instante. */
export function fechaLocal(instante: string | Date = new Date()): string {
  return fmtFechaISO.format(typeof instante === 'string' ? new Date(instante) : instante);
}

export function hoy(): string {
  return fechaLocal(new Date());
}

function aUTC(fecha: string): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado */
export function diaSemana(fecha: string): number {
  return aUTC(fecha).getUTCDay();
}

/** Lunes de la semana que contiene la fecha. */
export function lunesDe(fecha: string): string {
  const dia = diaSemana(fecha);
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

/** Instante ISO para una fecha y hora (HH:MM) de Mendoza. */
export function instante(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora.slice(0, 5)}:00${DESFASE}`).toISOString();
}

export function horaCorta(iso: string): string {
  return fmtHoraCorta.format(new Date(iso));
}

/** "mar 18 nov" */
export function diaCorto(fecha: string): string {
  const d = aUTC(fecha);
  return `${DIAS_CORTOS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

/** "martes 18 de noviembre" */
export function diaLargo(fecha: string): string {
  const d = aUTC(fecha);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]}`;
}

/** "17 – 23 de noviembre" o "29 dic – 4 ene" */
export function rangoSemana(lunes: string): string {
  const a = aUTC(lunes);
  const b = aUTC(sumarDias(lunes, 6));
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()} – ${b.getUTCDate()} de ${MESES_LARGOS[a.getUTCMonth()]}`;
  }
  return `${a.getUTCDate()} ${MESES[a.getUTCMonth()]} – ${b.getUTCDate()} ${MESES[b.getUTCMonth()]}`;
}

/** "martes 18 de noviembre, 10:00 h" */
export function describirTurno(inicioISO: string): string {
  return `${diaLargo(fechaLocal(inicioISO))}, ${horaCorta(inicioISO)} h`;
}

/** Meses completos entre hoy y una fecha (aproximado a días / 30.44). */
export function mesesHasta(fecha: string): number {
  const dias = (aUTC(fecha).getTime() - aUTC(hoy()).getTime()) / 86_400_000;
  return dias / 30.44;
}

export interface FranjaBase {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_min: number;
}

function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Turnos que surgen del horario semanal entre `desde` (incluido) y `desde + dias`.
 * Omite los que ya empezaron.
 */
export function generarTurnos(horario: FranjaBase[], desde: string, dias: number) {
  const ahora = Date.now();
  const turnos: { inicio: string; fin: string }[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    const dia = diaSemana(fecha);
    for (const f of horario) {
      if (f.dia_semana !== dia) continue;
      const fin = minutos(f.hora_fin);
      for (let m = minutos(f.hora_inicio); m + f.duracion_min <= fin; m += f.duracion_min) {
        const inicio = instante(fecha, hhmm(m));
        if (new Date(inicio).getTime() <= ahora) continue;
        turnos.push({ inicio, fin: instante(fecha, hhmm(m + f.duracion_min)) });
      }
    }
  }
  return turnos.sort((a, b) => a.inicio.localeCompare(b.inicio));
}
