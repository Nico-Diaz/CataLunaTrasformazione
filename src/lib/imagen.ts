/**
 * Achica una foto en el navegador antes de subirla: lado mayor ≤ `max` px, WebP (o JPEG
 * si el navegador no sabe codificar WebP). Así una foto de 8 MB del celular pasa a ~300 KB.
 */
export async function comprimirImagen(archivo: File, max = 1600, calidad = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const aBlob = (tipo: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, calidad));

  const webp = await aBlob('image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await aBlob('image/jpeg');
  if (jpeg) return jpeg;
  throw new Error('No se pudo procesar la imagen.');
}
