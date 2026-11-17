/**
 * Efectos de la landing (GSAP + ScrollTrigger).
 *
 * Reglas:
 * · Si la persona pidió reducir movimiento, no se anima nada y todo queda visible.
 * · El contenido nunca depende de la animación: el <head> agrega la clase `anim` para ocultar
 *   lo que va a aparecer, y si este script no llega a correr en 3 s, la quita (ver Base.astro).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const raiz = document.documentElement;
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

/** Parte un texto en palabras y letras, dejando el texto completo para lectores de pantalla. */
function partirLetras(el: HTMLElement) {
  if (el.dataset.partido) return el.querySelectorAll<HTMLElement>('.letra');
  el.dataset.partido = '1';
  el.setAttribute('aria-label', el.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  const nodos = [...el.childNodes];
  el.textContent = '';
  for (const nodo of nodos) {
    // Respeta elementos internos (por ejemplo <span> de segunda línea).
    const destino = nodo.nodeType === Node.ELEMENT_NODE ? (nodo.cloneNode(false) as HTMLElement) : el;
    const texto = nodo.textContent ?? '';
    for (const palabra of texto.split(/(\s+)/)) {
      if (!palabra) continue;
      if (/^\s+$/.test(palabra)) {
        destino.append(' ');
        continue;
      }
      const p = document.createElement('span');
      p.className = 'palabra';
      p.setAttribute('aria-hidden', 'true');
      for (const ch of palabra) {
        const l = document.createElement('span');
        l.className = 'letra';
        l.textContent = ch;
        p.append(l);
      }
      destino.append(p);
    }
    if (destino !== el) el.append(destino);
  }
  return el.querySelectorAll<HTMLElement>('.letra');
}

/** Telón de entrada: solo la primera vez por sesión. */
function intro(): gsap.core.Timeline | null {
  const telon = document.querySelector<HTMLElement>('.telon');
  if (!telon || !raiz.hasAttribute('data-intro')) {
    telon?.remove();
    return null;
  }
  try {
    sessionStorage.setItem('cl-intro', '1');
  } catch {
    /* modo privado: no pasa nada */
  }
  const tl = gsap.timeline({
    onComplete: () => {
      telon.remove();
      raiz.removeAttribute('data-intro');
    },
  });
  tl.fromTo('.telon__logo', { opacity: 0, scale: 0.85, filter: 'blur(12px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE })
    .fromTo('.telon__linea', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, '-=0.5')
    .to('.telon__logo, .telon__linea', { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, '+=0.15')
    .to(telon, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.1');
  return tl;
}

function hero(espera: number) {
  const nombre = document.querySelector<HTMLElement>('.hero__nombre');
  if (!nombre) return;
  const tl = gsap.timeline({ delay: espera });
  const letras = partirLetras(nombre);
  gsap.set(nombre, { opacity: 1 });

  // fromTo con valores finales explícitos: el CSS los oculta antes de que cargue este script.
  tl.fromTo(
    letras,
    { yPercent: 110, rotate: 6, opacity: 0, filter: 'blur(8px)' },
    { yPercent: 0, rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: EASE, stagger: 0.035 },
  )
    .fromTo('.hero__foto--principal', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
    .fromTo('.hero__foto--principal img', { scale: 1.35 }, { scale: 1, duration: 2, ease: EASE }, 0.1)
    .fromTo('.hero__foto--secundaria', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.5)
    .fromTo('.hero [data-hero-in]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: EASE, stagger: 0.08 }, 0.6)
    .fromTo('.hero__sello', { scale: 0, rotate: -90, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.6)' }, 0.9);

  // Profundidad al bajar: cada capa se mueve a distinta velocidad (solo en escritorio,
  // donde texto y fotos están lado a lado; en celular dejaría huecos).
  const trigger = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__foto--principal img', { scale: 1.12, ease: 'none', scrollTrigger: trigger });
  gsap.to('.hero__sello', { rotate: 200, ease: 'none', scrollTrigger: trigger });
  gsap.matchMedia().add('(min-width: 861px)', () => {
    gsap.to('.hero__foto--principal', { yPercent: -12, ease: 'none', scrollTrigger: trigger });
    gsap.to('.hero__foto--secundaria', { yPercent: -45, ease: 'none', scrollTrigger: trigger });
    gsap.to('.hero__texto', { yPercent: 18, opacity: 0.2, ease: 'none', scrollTrigger: trigger });
  });
}

/** Títulos de sección: las letras suben cuando entran en pantalla. */
function titulos() {
  document.querySelectorAll<HTMLElement>('[data-titulo]').forEach((el) => {
    const letras = partirLetras(el);
    gsap.from(letras, {
      yPercent: 100,
      opacity: 0,
      duration: 0.9,
      ease: EASE,
      stagger: 0.018,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

function apariciones() {
  ScrollTrigger.batch('[data-aparece]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: EASE, stagger: 0.09, overwrite: true }),
  });

  document.querySelectorAll<HTMLElement>('[data-revela]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.inOut' });
    if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: EASE }, 0);
  });

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const cuanto = Number(el.dataset.parallax) || 10;
    gsap.fromTo(
      el,
      { yPercent: -cuanto },
      { yPercent: cuanto, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

/** Franja de palabras infinita; acelera y cambia de sentido según el scroll. */
function franjas() {
  document.querySelectorAll<HTMLElement>('[data-franja]').forEach((franja) => {
    const pista = franja.querySelector<HTMLElement>('.franja__pista');
    if (!pista) return;
    const loop = gsap.to(pista, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    let sentido = 1;
    ScrollTrigger.create({
      trigger: franja,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (v !== 0) sentido = v > 0 ? 1 : -1;
        gsap.to(loop, { timeScale: sentido * (1 + Math.min(Math.abs(v) / 250, 6)), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: sentido, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      },
    });
  });
}

/** Línea del proceso que se llena al avanzar. */
function proceso() {
  const linea = document.querySelector<HTMLElement>('.pasos__progreso');
  if (linea) {
    gsap.fromTo(
      linea,
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.pasos-linea', start: 'top 70%', end: 'bottom 60%', scrub: true } },
    );
  }
  document.querySelectorAll<HTMLElement>('.paso').forEach((paso) => {
    ScrollTrigger.create({
      trigger: paso,
      start: 'top 65%',
      end: 'bottom 65%',
      toggleClass: { targets: paso, className: 'paso--activo' },
    });
  });
}

/** Números que cuentan hasta su valor. */
function contadores() {
  document.querySelectorAll<HTMLElement>('[data-contar]').forEach((el) => {
    const fin = Number(el.dataset.contar);
    const estado = { n: 0 };
    gsap.to(estado, {
      n: fin,
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => {
        el.textContent = String(Math.round(estado.n));
      },
    });
  });
}

/** Botones principales que siguen un poco al cursor. */
function magneticos() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetico]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}

/** Barra fina arriba que muestra cuánto se recorrió la página. */
function progresoPagina() {
  const barra = document.querySelector<HTMLElement>('.progreso-pagina');
  if (!barra) return;
  gsap.to(barra, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

if (reducir) {
  document.querySelector('.telon')?.remove();
  raiz.removeAttribute('data-intro');
  raiz.classList.remove('anim');
} else {
  raiz.classList.add('anim-listo');
  const tl = intro();
  hero(tl ? tl.duration() - 0.75 : 0.1);
  titulos();
  apariciones();
  franjas();
  proceso();
  contadores();
  magneticos();
  progresoPagina();

  // Las fotos cargan después: recalcular posiciones cuando terminan.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
