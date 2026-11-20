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
  email: 'catalinaluna.tz@gmail.com',
  ciudad: 'Mendoza, Argentina',
  horarioConsultas: 'Lunes a viernes de 9 a 20 h',
  /** Dejar en null para ocultar el enlace. */
  instagram: null as string | null,
};

export const hero = {
  bajada: 'Indumentaria para eventos formales, con diseño y confección personalizados.',
  texto:
    'Traeme tu idea, una foto o un tablero de Pinterest. Lo convertimos juntas en una prenda pensada para vos, desde la moldería hasta la última prueba.',
};

export const sobreMi = {
  titulo: 'Diseño a medida, de principio a fin.',
  parrafos: [
    'Soy Catalina, licenciada en diseño de indumentaria y textil. Trabajo con prendas elegantes, sobre todo para eventos formales, hechas para una persona y un momento.',
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
    'Trasformazione es mi marca para prendas que se usan más allá de un evento formal: sastrería, ropa formal y piezas para el día a día, con el mismo cuidado en la moldería y la terminación.',
    'Se trabaja igual que un vestido a medida: primera cita, medidas, presupuesto y pruebas. La consulta va al mismo WhatsApp.',
  ],
  ejemplos: ['Sastrería y trajes', 'Camisas y blusas', 'Pantalones y faldas', 'Prendas para el día a día'],
  /**
   * Una pila de fotos por chica. `carpeta` es la subcarpeta de src/assets/trasformazione/
   * (entran todas sus fotos .jpg, en orden de nombre).
   */
  chicas: [
    { carpeta: 'ari', nombre: 'Ari' },
    { carpeta: 'clari', nombre: 'Clari' },
    { carpeta: 'sofi', nombre: 'Sofi' },
    { carpeta: 'valentina', nombre: 'Valentina' },
    { carpeta: 'irene', nombre: 'Irene' },
    { carpeta: 'vicki', nombre: 'Vicki' },
  ],
};

/**
 * Clientas del carrusel. `foto` es el nombre del archivo en src/assets/clientas/ (sin .jpg);
 * debajo de cada foto se muestra solo el nombre.
 */
export const clientas = [
  { foto: 'luli', nombre: 'Luli' },
  { foto: 'amparo', nombre: 'Amparo' },
  { foto: 'victoria', nombre: 'Victoria' },
  { foto: 'josefina', nombre: 'Josefina' },
  { foto: 'catalina', nombre: 'Catalina' },
  { foto: 'luna', nombre: 'Luna' },
  { foto: 'giuliana', nombre: 'Giuliana' },
  { foto: 'leila', nombre: 'Leila' },
  { foto: 'marcela', nombre: 'Marcela' },
  { foto: 'ariadna', nombre: 'Ariadna' },
  { foto: 'lourdes', nombre: 'Lourdes' },
  { foto: 'pilar', nombre: 'Pilar' },
  { foto: 'malena', nombre: 'Malena' },
  { foto: 'martina', nombre: 'Martina' },
  { foto: 'clara', nombre: 'Clara' },
  { foto: 'sofia', nombre: 'Sofía' },
  { foto: 'valentina', nombre: 'Valentina' },
] as const;

/** Palabras de la franja en movimiento. */
export const franja = ['Eventos formales', 'A medida', 'Moldería', 'Pruebas', 'Trasformazione'];

/**
 * Tipos de prenda del formulario, según la línea elegida. `linea: null` aparece en las dos.
 * `novia` activa la recomendación de 4 meses.
 */
export const prendas = [
  { valor: 'Vestido para 15', linea: 'Catalina Luna' },
  { valor: 'Vestido de novia', linea: 'Catalina Luna', novia: true },
  { valor: 'Vestido de egresada', linea: 'Catalina Luna' },
  { valor: 'Evento formal', linea: 'Catalina Luna' },
  { valor: 'Vestido', linea: 'Trasformazione' },
  { valor: 'Conjunto', linea: 'Trasformazione' },
  { valor: 'Blusa', linea: 'Trasformazione' },
  { valor: 'Falda', linea: 'Trasformazione' },
  { valor: 'Pantalón', linea: 'Trasformazione' },
  { valor: 'Otro', linea: null },
] as const;
