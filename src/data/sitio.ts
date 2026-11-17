/**
 * Contenido editable del sitio. Todos los textos de la landing salen de acá.
 */

export const contacto = {
  nombre: 'Catalina Belén Luna',
  nombreCorto: 'Catalina Luna',
  titulo: 'Licenciada en diseño de indumentaria y textil',
  matricula: 'MAT. 58285',
  /** Formato internacional sin "+" ni espacios, con el 9 de celulares argentinos. */
  whatsapp: '5492614174225',
  whatsappVisible: '+54 261 417 4225',
  email: 'cata.luna0499@gmail.com',
  ciudad: 'Mendoza, Argentina',
  horarioConsultas: 'Lunes a viernes de 9 a 20 h',
  /** Dejar en null para ocultar el enlace. */
  instagram: null as string | null,
};

export const hero = {
  bajada: 'Vestidos de fiesta y de novia, diseñados y confeccionados a tu medida.',
  texto:
    'Traeme tu idea, una foto o un tablero de Pinterest. Lo convertimos juntas en una prenda pensada para vos, desde la moldería hasta la última prueba.',
};

export const sobreMi = {
  titulo: 'Diseño a medida, de principio a fin.',
  parrafos: [
    'Soy Catalina, licenciada en diseño de indumentaria y textil. Trabajo con prendas elegantes, sobre todo de fiesta y de novia, hechas para una persona y un momento.',
    'Me ocupo de todo el proceso: escucho la idea, tomo las medidas, hago la moldería, te acompaño a elegir los materiales y confecciono la prenda con las pruebas que hagan falta.',
  ],
};

export const proceso = [
  {
    titulo: 'Primera cita',
    texto:
      'Me escribís, coordinamos un turno y nos vemos. Miramos ideas, fotos y referencias, y te tomo las medidas.',
  },
  {
    titulo: 'Presupuesto y bocetos',
    texto: 'En los 3 días hábiles siguientes, aproximadamente, te paso el presupuesto y los bocetos.',
  },
  {
    titulo: 'Materiales',
    texto:
      'Podemos ir juntas a ver telas, o vas sola y te asesoro con materiales, cantidades y lugares donde comprar.',
    nota: 'No tomo trabajos si los materiales no los calculé yo.',
  },
  {
    titulo: 'Pruebas',
    texto:
      'Suelen ser una vez por semana y las coordinamos cita a cita. Son entre 3 y 6, según la prenda.',
  },
  {
    titulo: 'Entrega',
    texto:
      'Idealmente una semana antes del evento, por cualquier imprevisto. La prenda va con su bolsa y un kit de aguja e hilo de regalo.',
  },
];

export const presupuesto = {
  incluye: [
    'Toma de medidas',
    'Moldería',
    'Acompañamiento y asesoramiento en la compra de los materiales',
    'Confección',
    'Pruebas necesarias',
  ],
  noIncluye: [
    'Telas',
    'Avíos: cierres, botones, elásticos y apliques',
    'Arreglos o ajustes después de la entrega',
  ],
};

export const condiciones = [
  { titulo: 'Pago', texto: '50 % al iniciar y 50 % al momento de la entrega.' },
  {
    titulo: 'Medios de pago',
    texto: 'Transferencia o efectivo. Crédito con recargo según la cantidad de cuotas, con QR.',
  },
  {
    titulo: 'Consultas',
    texto: 'Por WhatsApp o e-mail. Respondo de lunes a viernes de 9 a 20 h.',
  },
  {
    titulo: 'Cambios de prueba',
    texto:
      'Un día u horario de prueba se puede cambiar con al menos 24 h de anticipación. Si no, se reagenda con un costo adicional.',
  },
  { titulo: 'Acompañantes', texto: 'A las pruebas puede venir 1 persona con vos.' },
  {
    titulo: 'Para cada prueba',
    texto: 'Traé las prendas y accesorios que vas a usar en el evento, y vení sin cremas ni aceites corporales.',
  },
  {
    titulo: 'Después de la entrega',
    texto: 'Cualquier ajuste, reparación o modificación posterior a la última prueba se cobra aparte.',
  },
];

export const anticipacion = {
  general: 2,
  novias: 4,
  texto: 'Te recomiendo encargar con un mínimo de 2 meses de anticipación. Si sos novia, de 4 a 5 meses.',
};

export const trasformazione = {
  nombre: 'Trasformazione',
  bajada: 'La línea de ropa formal y cotidiana de Catalina Luna.',
  parrafos: [
    'Trasformazione es mi marca para prendas que se usan más allá de una fiesta: sastrería, ropa formal y piezas para el día a día, con el mismo cuidado en la moldería y la terminación.',
    'Se trabaja igual que un vestido a medida: primera cita, medidas, presupuesto y pruebas. La consulta va al mismo WhatsApp.',
  ],
  ejemplos: ['Sastrería y trajes', 'Camisas y blusas', 'Pantalones y faldas', 'Prendas para el día a día'],
};

/**
 * Galería de trabajos. `foto` es el nombre del archivo en src/assets/trabajos/.
 * `credito` aparece debajo cuando la foto es de un fotógrafo.
 */
export const trabajos = [
  { foto: 'fucsia-sol', titulo: 'Vestido fucsia', detalle: 'Strapless con volado asimétrico' },
  { foto: 'negro-organza-espalda', titulo: 'Negro y organza', detalle: 'Espalda descubierta, capa traslúcida' },
  { foto: 'vestido-lila', titulo: 'Vestido de quince', detalle: 'Tul lila con bordado floral', credito: 'Foto: Fabio Galván' },
  { foto: 'fucsia-piedra', titulo: 'Fucsia, de noche', detalle: 'Drapeado y caída al bies' },
  { foto: 'negro-organza-piedra', titulo: 'Capa de organza', detalle: 'Mangas amplias sobre vestido corto' },
  { foto: 'conjunto-marron', titulo: 'Conjunto chocolate', detalle: 'Top asimétrico con recortes y falda' },
  { foto: 'fucsia-volado', titulo: 'Volado al viento', detalle: 'El mismo fucsia, en movimiento' },
  { foto: 'conjunto-negro', titulo: 'Conjunto negro', detalle: 'Top de un hombro con lazo y minifalda' },
  { foto: 'negro-organza-capa', titulo: 'Organza al sol', detalle: 'Capa traslúcida sobre negro' },
] as const;

/** Palabras de la franja en movimiento. */
export const franja = ['Fiesta', 'Novias', 'A medida', 'Moldería', 'Pruebas', 'Trasformazione'];

/** Tipos de prenda del formulario. `novia` activa la recomendación de 4 meses. */
export const prendas = [
  { valor: 'Vestido de fiesta', linea: 'Catalina Luna' },
  { valor: 'Vestido de novia', linea: 'Catalina Luna', novia: true },
  { valor: 'Prenda formal', linea: 'Trasformazione' },
  { valor: 'Prenda cotidiana', linea: 'Trasformazione' },
  { valor: 'Otra', linea: null },
] as const;
