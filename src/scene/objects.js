import { gsap } from "gsap";
import { t } from "../data/i18n.js";

const SOUND = { viola: "viola", gold: "coins" };
const SVGNS = "http://www.w3.org/2000/svg";

function coinBurst(g) {
  const svg = g.ownerSVGElement;
  for (let i = 0; i < 6; i++) {
    const c = document.createElementNS(SVGNS, "ellipse");
    c.setAttribute("class", "c-gold o");
    c.setAttribute("cx", "1520"); c.setAttribute("cy", "880"); c.setAttribute("rx", "12"); c.setAttribute("ry", "12");
    svg.appendChild(c);
    const dx = (Math.random() - 0.5) * 240;
    gsap.timeline({ onComplete: () => c.remove() })
      .to(c, { x: dx / 2, y: -120 - Math.random() * 60, duration: 0.35, ease: "power2.out" })
      .to(c, { x: dx, y: 60, opacity: 0, duration: 0.5, ease: "power2.in" });
  }
}

export function initObjects({ root = document, bus, state, reduced }) {
  const objs = [...root.querySelectorAll(".obj")];
  const label = () => objs.forEach((o) => o.setAttribute("aria-label", t(state.lang, "obj_" + o.dataset.obj)));

  function act(o) {
    if (state.zoomed) return;
    const k = o.dataset.obj;
    bus.emit("say", t(state.lang, "obj_" + k));
    bus.emit("face", { flash: "giggle", ms: 900 });
    if (SOUND[k]) bus.emit("sfx", SOUND[k]);
    if (reduced) return;
    gsap.fromTo(o, { y: 0 }, { y: -10, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out" });
    if (k === "gold") coinBurst(o);
  }

  objs.forEach((o) => {
    o.addEventListener("click", () => act(o));
    o.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(o); } });
  });
  bus.on("lang:change", label);
  label();
}
