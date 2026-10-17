import { gsap } from "gsap";

/* bg2 boyalı arka plan: gündüz görseli altta, gece görseli üstte opaklıkla karışır */
export function bgSources(variant) {
  return { src: `/bg/${variant}-1920.webp`, srcset: `/bg/${variant}-1920.webp 1920w, /bg/${variant}-2752.webp 2752w` };
}

/* Sahne cover ile ölçeklenir (genişlik 1920 × k). Ön yükleme tarayıcısı max() anlamadığı için medya koşullarıyla:
   16:9'dan genişte 104vw, değilse 185vh; dar düzende (telefon) 100vw → 1920'lik görsel yeter, büyüğü indirilmez. */
export const BG_SIZES = "(max-width: 700px) 100vw, (orientation: portrait) 100vw, (min-aspect-ratio: 16/9) 104vw, 185vh";

export function bgOpacity(slice) {
  if (slice === "night") return { day: 0, night: 1 };
  if (slice === "sunset") return { day: 1, night: 0.35 };
  return { day: 1, night: 0 };
}

export function initBackground({ dayEl, nightEl, state, bus, reduced, timeout = 2500 }) {
  /* gündüz görseli HTML'de (tarayıcı erken keşfetsin, LCP); yalnız eksikse buradan verilir.
     Gece görseli yalnız gerekince (gece/gün batımı) iner: açılışta bant genişliğini LCP ile paylaşmasın. */
  function load(el, v) {
    if (el.getAttribute("src")) return;
    const s = bgSources(v);
    el.setAttribute("sizes", BG_SIZES);
    el.setAttribute("srcset", s.srcset);
    el.setAttribute("src", s.src);
  }
  const needsNight = (slice) => bgOpacity(slice).night > 0;
  let nightReady = null;
  const ensureNight = () => { load(nightEl, "night"); return (nightReady ||= Promise.resolve(nightEl.decode?.()).catch(() => {})); };
  load(dayEl, "day");
  if (needsNight(state.slice)) ensureNight();

  const o = bgOpacity(state.slice);
  gsap.set(dayEl, { opacity: o.day });
  gsap.set(nightEl, { opacity: o.night });
  /* gece görseli o an iniyorsa çapraz geçiş çözülünce başlar; arada dilim yine değiştiyse eski istek yok sayılır */
  let turn = 0;
  bus.on("slice:change", (slice) => {
    const mine = ++turn, n = bgOpacity(slice);
    const fade = () => {
      if (mine !== turn) return;
      gsap.to(dayEl, { opacity: n.day, duration: 0.6, ease: "sine.inOut" });
      gsap.to(nightEl, { opacity: n.night, duration: 0.6, ease: "sine.inOut" });
    };
    if (needsNight(slice)) ensureNight().then(fade); else fade();
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

  /* yalnız açılışta görünecek görsel(ler)in çözülmesi beklenir */
  const visible = [o.day > 0 && dayEl, o.night > 0 && nightEl].filter(Boolean);
  const decoded = Promise.all(visible.map((el) => Promise.resolve(el.decode?.()).catch(() => {})));
  const ready = Promise.race([decoded, new Promise((r) => setTimeout(r, timeout))]).then(() => {});
  return { ready };
}
