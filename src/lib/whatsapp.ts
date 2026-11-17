import { contacto } from '../data/sitio';
import { describirTurno } from './fechas';
import type { Linea } from './supabase';

export interface DatosConsulta {
  nombre: string;
  linea: Linea;
  prenda: string;
  fechaEvento: string | null;
  links: string[];
  imagenes: string[];
  mensaje: string;
  turnoInicio: string | null;
  /** Hay fotos elegidas que no se pudieron subir: se pide adjuntarlas en el chat. */
  fotosPendientes: number;
  /** La consulta quedó guardada en el panel: el mensaje no repite la idea ni las fotos. */
  guardada: boolean;
}

function fechaLegible(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export function armarMensaje(d: DatosConsulta): string {
  const lineas: string[] = [];
  // Solo texto plano y guiones: los emojis se ven como "�" en algunos teléfonos y en WhatsApp Web.
  lineas.push(`Hola Catalina! Soy ${d.nombre}.`);
  lineas.push(
    d.linea === 'Trasformazione'
      ? `Te escribo por una prenda de Trasformazione: ${d.prenda.toLowerCase()}.`
      : `Te escribo por un ${d.prenda.toLowerCase()}.`,
  );
  const datos: string[] = [];
  if (d.fechaEvento) datos.push(`- Fecha del evento: ${fechaLegible(d.fechaEvento)}`);
  if (d.turnoInicio) datos.push(`- Turno que me gustaría: ${describirTurno(d.turnoInicio)}, si sigue libre.`);
  // La idea escrita y las fotos quedan en el panel de Catalina: acá solo se avisa.
  // Si no se pudo guardar, el texto va en el mensaje para no perderlo.
  if (d.guardada) {
    if (d.imagenes.length) {
      datos.push(`- Ya te envié ${d.imagenes.length === 1 ? 'la imagen' : 'las imágenes'} de inspiración por la web.`);
    } else if (d.mensaje.trim()) {
      datos.push('- Ya te dejé mi idea por la web.');
    }
  }
  if (d.fotosPendientes > 0) {
    datos.push(`- Te adjunto ${d.fotosPendientes === 1 ? 'una foto' : `${d.fotosPendientes} fotos`} acá en el chat.`);
  }
  if (datos.length) lineas.push('', ...datos);
  if (!d.guardada && d.mensaje.trim()) lineas.push('', d.mensaje.trim());
  if (d.links.length) lineas.push('', 'Inspiración:', ...d.links.map((l) => `- ${l}`));
  return lineas.join('\n');
}

export function urlWhatsApp(texto?: string): string {
  const base = `https://wa.me/${contacto.whatsapp}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
