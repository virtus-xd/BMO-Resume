import { gsap } from "gsap";
import { line } from "../data/i18n.js";

export function initBehavior({ bmoEl, faceEl, face, bus, state, reduced }) {
  bus.on("face", ({ base, flash, ms } = {}) => {
    if (base) face.setBase(base);
    if (flash) face.flash(flash, ms);
  });

  /* kaset yaklaşınca: kollar uzanır, yuva parlar, aç yüz */
  bus.on("reach", (on) => {
    bmoEl.classList.toggle("hungry", on);
    face.setBase(on ? "hungry" : state.current ? "happy" : "idle");
    if (reduced) return;
    gsap.to("#bmo-arm-l", { rotation: on ? 28 : 0, transformOrigin: "100% 0%", duration: 0.3, ease: "back.out(2)" });
    gsap.to("#bmo-arm-r", { rotation: on ? -28 : 0, transformOrigin: "0% 0%", duration: 0.3, ease: "back.out(2)" });
  });

  /* göz kırpma */
  (function blinkLoop() {
    setTimeout(() => {
      if (face.current !== "loading" && !document.hidden) {
        face.flash("blink", 130);
        if (Math.random() < 0.25) setTimeout(() => face.flash("blink", 110), 260);
      }
      blinkLoop();
    }, 2500 + Math.random() * 3000);
  })();

  /* göz bebekleri fareyi izler (en fazla 4 px) */
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = faceEl.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, m = Math.min(4, d / 60);
    faceEl.style.setProperty("--ex", ((dx / d) * m).toFixed(2) + "px");
    faceEl.style.setProperty("--ey", ((dy / d) * m).toFixed(2) + "px");
  });

  function dance() {
    if (reduced) return;
    bus.emit("face", { flash: "happy", ms: 1400 });
    gsap.timeline()
      .to(bmoEl, { rotation: -4, y: -8, transformOrigin: "50% 100%", duration: 0.18, ease: "sine.inOut", repeat: 5, yoyo: true })
      .to(bmoEl, { rotation: 0, y: 0, duration: 0.2 });
  }

  if (!reduced) {
    gsap.to("#bmo-body", { scaleY: 0.985, scaleX: 1.008, transformOrigin: "50% 100%", duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to("#bmo-leg-l", { rotation: 10, transformOrigin: "50% 0%", duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to("#bmo-leg-r", { rotation: -10, transformOrigin: "50% 0%", duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.45 });
  }

  /* boşta: 20–40 sn'de bir dans ya da mırıldanma */
  (function idleLoop() {
    setTimeout(() => {
      if (!state.busy && !state.current && !state.zoomed && !document.hidden) {
        if (Math.random() < 0.5) dance(); else bus.emit("say", line(state.lang, "idle"));
      }
      idleLoop();
    }, 20000 + Math.random() * 20000);
  })();

  return { dance };
}
