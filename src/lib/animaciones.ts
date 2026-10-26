import gsap from "gsap";

// Con `prefers-reduced-motion: reduce` toda duración es 0 (el estado final se aplica igual).
let reducir = false;
if (typeof window !== "undefined")
  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
    reducir = true;
    return () => {
      reducir = false;
    };
  });
const d = (s: number) => (reducir ? 0 : s);

type Objetivo = gsap.TweenTarget;

/** 3 · Las tarjetas entran en cascada. */
export function cascada(objetivos: Objetivo) {
  if (!gsap.utils.toArray(objetivos).length) return;
  gsap.from(objetivos, {
    y: 10,
    opacity: 0,
    duration: d(0.28),
    stagger: d(0.03),
    ease: "power2.out",
    clearProps: "transform,opacity",
  });
}

/** 8 · Las etiquetas que cambiaron hoy pulsan una vez. */
export function pulso(objetivos: Objetivo) {
  if (reducir || !gsap.utils.toArray(objetivos).length) return;
  gsap.fromTo(
    objetivos,
    { scale: 1 },
    {
      scale: 1.18,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      delay: 0.35,
      ease: "power1.inOut",
      clearProps: "transform",
    },
  );
}

/** 2 · Los números cuentan hasta el destino (snap de 100 en el camino, exacto al final). */
export function contar<T extends Record<string, number>>(
  estado: T,
  destino: T,
  pintar: () => void,
) {
  gsap.to(estado, {
    ...destino,
    duration: d(0.5),
    ease: "power2.out",
    snap: Object.fromEntries(Object.keys(destino).map((k) => [k, 100])),
    onUpdate: pintar,
    onComplete() {
      Object.assign(estado, destino);
      pintar();
    },
  });
}

/** 1 · Rebote del icono del carrito. */
export function rebote(el: Element) {
  if (reducir) return;
  gsap.fromTo(
    el,
    { scale: 1 },
    {
      scale: 1.15,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      clearProps: "transform",
    },
  );
}

/** 1 · El emoji vuela en arco desde `origen` hasta `destino` y el destino rebota. */
export function volar(origen: Element, destino: Element) {
  if (reducir) return;
  const a = origen.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const copia = document.createElement("span");
  copia.textContent = origen.textContent;
  copia.setAttribute("aria-hidden", "true");
  copia.style.cssText =
    "position:fixed;left:0;top:0;z-index:60;font-size:30px;pointer-events:none";
  document.body.appendChild(copia);
  gsap.set(copia, { x: a.left, y: a.top });
  gsap
    .timeline({
      onComplete() {
        copia.remove();
        rebote(destino);
      },
    })
    .to(copia, { x: b.left + 4, duration: 0.55, ease: "none" }, 0)
    .to(copia, { y: a.top - 60, duration: 0.2, ease: "power1.out" }, 0)
    .to(copia, { y: b.top + 2, duration: 0.35, ease: "power2.in" }, 0.2)
    .to(
      copia,
      { scale: 0.45, opacity: 0.6, duration: 0.55, ease: "power1.in" },
      0,
    );
}

/** 6 · El subrayado de la pestaña se desliza hasta `x` con ancho `ancho`. */
export function deslizar(
  indicador: Element,
  x: number,
  ancho: number,
  instantaneo = false,
) {
  gsap.to(indicador, {
    x,
    width: ancho,
    duration: instantaneo ? 0 : d(0.3),
    ease: "power3.out",
  });
}
