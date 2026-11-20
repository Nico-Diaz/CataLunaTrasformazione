import Stack from './reactbits/Stack';

export type FotoPila = { src: string; alt: string };

/**
 * Pila de fotos de una clienta de Trasformazione (Stack de React Bits): se arrastra, se tira o se toca
 * para pasar a la siguiente.
 */
export default function PilaTrasformazione({ fotos, label }: { fotos: FotoPila[]; label: string }) {
  return (
    <Stack
      cards={fotos.map((f) => (
        <img key={f.src} src={f.src} alt={f.alt} draggable={false} loading="lazy" decoding="async" />
      ))}
      label={label}
      layout="fan"
      visible={Math.min(fotos.length, 4)}
      spread={0.6}
      depth={0.4}
      radius={14}
      frame={6}
      frameColor="#f5e9d9"
      sendToBackOnClick
    />
  );
}
