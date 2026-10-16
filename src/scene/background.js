import { gsap } from "gsap";

/* bg2 boyalı arka plan: gündüz görseli altta, gece görseli üstte opaklıkla karışır */
export function bgSources(variant) {
  return { src: `/bg/${variant}-1920.webp`, srcset: `/bg/${variant}-1920.webp 1920w, /bg/${variant}-2752.webp 2752w` };
}

export function bgOpacity(slice) {
  if (slice === "night") return { day: 0, night: 1 };
  if (slice === "sunset") return { day: 1, night: 0.35 };
  return { day: 1, night: 0 };
}

export function initBackground({ dayEl, nightEl, state, bus, reduced, timeout = 2500 }) {
  [[dayEl, "day"], [nightEl, "night"]].forEach(([el, v]) => {
    const s = bgSources(v);
    el.setAttribute("sizes", "max(104vw, 185vh)"); // sahne cover ile ölçeklenir: 1920 × k
    el.setAttribute("srcset", s.srcset);
    el.setAttribute("src", s.src);
  });

  const o = bgOpacity(state.slice);
  gsap.set(dayEl, { opacity: o.day });
  gsap.set(nightEl, { opacity: o.night });
  bus.on("slice:change", (slice) => {
    const n = bgOpacity(slice);
    gsap.to(dayEl, { opacity: n.day, duration: 0.6, ease: "sine.inOut" });
    gsap.to(nightEl, { opacity: n.night, duration: 0.6, ease: "sine.inOut" });
  });

  /* fareyle ±10 px kayma; dar düzende ve hareketi azalt'ta yok */
  if (!reduced) {
    const els = [dayEl, nightEl];
    const toX = els.map((el) => gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }));
    const toY = els.map((el) => gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }));
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || state.zoomed || state.narrow) return;
      const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
      toX.forEach((f) => f(-mx * 20)); toY.forEach((f) => f(-my * 20));
    });
  }

  const decoded = Promise.all([dayEl, nightEl].map((el) => Promise.resolve(el.decode?.()).catch(() => {})));
  const ready = Promise.race([decoded, new Promise((r) => setTimeout(r, timeout))]).then(() => {});
  return { ready };
}
