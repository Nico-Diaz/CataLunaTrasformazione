import { useEffect, useRef, type ReactNode } from 'react';

/** Diálogo modal nativo: foco atrapado, Escape y fondo los maneja el navegador. */
export default function Dialogo({
  titulo,
  abierto,
  onCerrar,
  children,
}: {
  titulo: string;
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
    >
      {abierto ? (
        <div className="dialogo__caja">
          <header className="dialogo__head">
            <h2 id="dialogo-titulo">{titulo}</h2>
            <button type="button" className="dialogo__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          </header>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
