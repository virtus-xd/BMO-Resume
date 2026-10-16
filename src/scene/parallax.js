import { gsap } from "gsap";

/* L2 katmanı (derinlik 0.7) yatay ±12, dikey ±8 px kayar; diğerleri derinlikle orantılı */
export function initParallax(layerEls, state) {
  const movers = layerEls.map((el) => ({
    d: Number(el.dataset.depth),
    x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
    y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
  }));
  function set(mx, my) {
    movers.forEach((m) => { m.x((-mx * 24 * m.d) / 0.7); m.y((-my * 16 * m.d) / 0.7); });
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.zoomed || state.narrow) return;
    set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  });
  return { reset: () => set(0, 0) };
}
