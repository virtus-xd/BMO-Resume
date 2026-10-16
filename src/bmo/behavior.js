import { line } from "../data/i18n.js";

/* 3D BMO davranışları: yüz olayları, göz kırpma, göz bebekleri fareyi izler, kaset yaklaşınca uzanma, boşta dans/mırıldanma */
export function initBehavior({ bmo, face, bus, state, reduced, screenCenter }) {
  bus.on("face", ({ base, flash, ms } = {}) => {
    if (base) face.setBase(base);
    if (flash) face.flash(flash, ms);
  });

  bus.on("reach", (on) => {
    face.setBase(on ? "hungry" : state.current ? "happy" : "idle");
    bmo.setGlow(on);
    if (!reduced) bmo.setReach(on);
  });

  (function blinkLoop() {
    setTimeout(() => {
      if (face.current !== "loading" && !document.hidden) {
        face.flash("blink", 130);
        if (Math.random() < 0.25) setTimeout(() => face.flash("blink", 110), 260);
      }
      blinkLoop();
    }, 2500 + Math.random() * 3000);
  })();

  /* göz bebekleri en fazla 4 birim (v1 yüz birimi) */
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.zoomed) return;
    const c = screenCenter();
    const dx = e.clientX - c.x, dy = e.clientY - c.y;
    const d = Math.hypot(dx, dy) || 1, m = Math.min(4, d / 60);
    bmo.setFace(face.current, { x: (dx / d) * m, y: (dy / d) * m });
  });

  function dance() {
    if (reduced) return;
    bus.emit("face", { flash: "happy", ms: 1400 });
    bmo.dance();
  }
  function wave() { if (!reduced) bmo.wave(); }

  (function idleLoop() {
    setTimeout(() => {
      if (!state.busy && !state.current && !state.zoomed && !state.listOpen && !document.hidden) {
        if (Math.random() < 0.5) dance(); else bus.emit("say", line(state.lang, "idle"));
      }
      idleLoop();
    }, 20000 + Math.random() * 20000);
  })();

  return { dance, wave };
}
