import { useEffect, useState } from 'react';
import CircularGallery, { type GalleryItem } from './reactbits/CircularGallery';

/**
 * Carrusel circular de trabajos (React Bits) con la estética de la marca.
 * En pantallas chicas se curva menos y las fotos son un poco más grandes.
 */
export default function CarruselTrabajos({ items }: { items: GalleryItem[] }) {
  const [chico, setChico] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const actualizar = () => setChico(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  return (
    <CircularGallery
      items={items}
      bend={chico ? 1.2 : 2.4}
      itemSize={chico ? 1.25 : 1}
      itemAspect={0.75}
      gap={0.22}
      borderRadius={0.04}
      textColor="#f5e9d9"
      font='600 26px "Inter Variable", Inter, sans-serif'
      wave={0.6}
      fadeEdges={0.14}
      shadow={0.35}
      scrollSpeed={2}
      scrollEase={0.06}
      autoScroll={0.6}
      snap
      openOnClick
      intro
    />
  );
}
