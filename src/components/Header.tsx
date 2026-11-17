import { useEffect, useRef, useState } from 'react';
import monograma from '../assets/marca/monograma-navy.png';
import './Header.css';

const LINKS = [
  { href: '#trabajos', label: 'Trabajos' },
  { href: '#proceso', label: 'Cómo trabajo' },
  { href: '#presupuesto', label: 'Presupuesto' },
  { href: '#turnos', label: 'Turnos' },
  { href: '#trasformazione', label: 'Trasformazione' },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [conFondo, setConFondo] = useState(false);
  const ultimoY = useRef(0);

  // Se esconde al bajar y vuelve al subir. La posición vive en un ref.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setConFondo(y > 24);
        const delta = y - ultimoY.current;
        if (Math.abs(delta) > 6) {
          setOculto(delta > 0 && y > 160);
          ultimoY.current = y;
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__bar" data-oculto={oculto && !open} data-fondo={conFondo || open}>
        <a className="site-header__brand" href="#inicio" onClick={close}>
          <img src={monograma.src} alt="" width={36} height={36} />
          <span>Catalina Luna</span>
        </a>

        <nav className="site-header__nav" aria-label="Principal">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a className="btn btn--solido site-header__cta" href="#idea">
          Contame tu idea
        </a>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="label">{open ? 'Cerrar' : 'Menú'}</span>
        </button>
      </div>

      <div id="menu-movil" className="site-header__panel" hidden={!open}>
        <nav aria-label="Menú móvil">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={close}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="btn btn--solido" href="#idea" onClick={close}>
          Contame tu idea
        </a>
      </div>
    </header>
  );
}
