import { gsap } from "gsap";
import { W, H } from "../scene/stage.js";
import { t, loc } from "../data/i18n.js";
import { usableLinks } from "../data/projects.js";
import { esc } from "./html.js";

/* Stage'in ekranda kırpılmadan görünen kısmı (NDC: merkez cx,cy ve boyut w,h). Üst/alt paylar (üst çubuk, raf)
   düşülür; canvas yalnız stage'i kapladığı için bölge stage sınırına kırpılır. */
export function visibleRegion(view, vw, vh, { top = 0, bottom = 0 } = {}) {
  const sx = (px) => W / 2 + (px - vw / 2) / view.k;
  const sy = (py) => H / 2 + (py - vh / 2 - view.oy) / view.k;
  const x0 = Math.max(0, sx(0)), x1 = Math.min(W, sx(vw));
  const y0 = Math.max(0, sy(top)), y1 = Math.min(H, sy(vh - bottom));
  return { cx: (x0 + x1) / W - 1, cy: 1 - (y0 + y1) / H, w: ((x1 - x0) / W) * 2, h: ((y1 - y0) / H) * 2 };
}

const pad = (n) => String(n).padStart(2, "0");

export function renderScreen(p, lang, index, total) {
  const links = usableLinks(p);
  const shots = p.shots || [];
  const title = loc(lang, p.title);
  return `
  <div class="crt">
    <div class="s-row"><span>${esc(t(lang, "side"))} · ${pad(index + 1)}/${pad(total)}</span><span class="chip${p.status === "live" ? " live" : ""}">${esc(t(lang, "status_" + p.status))}</span></div>
    <h2 id="sTitle" tabindex="-1">${esc(title)}</h2>
    <div class="s-kind">&gt; ${esc(loc(lang, p.kind))}</div>
    ${shots.length ? `<div class="s-shots" role="group" tabindex="0" aria-label="${esc(t(lang, "shots"))}">${shots.map((s, i) => `<img src="${esc(s)}" alt="${esc(title)} ${i + 1}" loading="lazy" decoding="async" onerror="this.remove()">`).join("")}</div>` : ""}
    <p class="s-desc">${esc(loc(lang, p.desc))}</p>
    <ul class="s-stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <div class="s-actions">${links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}<button type="button" class="s-eject" data-act="eject">${esc(t(lang, "eject"))}</button></div>
  </div>`;
}

/* BMO ekranı: 3D kamera ekrana dalar, HTML katmanı BMO ekranının yansıtılmış dikdörtgenine oturur (dar düzende tam genişlik).
   Esc / dışarı tıklama → screen:close (kaset kalır); ⏏ → screen:eject. */
export function createScreen({ uiEl, backdropEl, world, view, state, bus, reduced, projects, bgEls = [], insets = () => ({}), onClosed }) {
  let shown = null, zooming = null;
  const pose = () => world.screenPose(visibleRegion(view, innerWidth, innerHeight, insets()), state.narrow ? 0.92 : 0.8);

  function placeUi() {
    if (reduced) return;
    uiEl.classList.toggle("full", state.narrow);
    if (state.narrow) {
      const { top = 0, bottom = 0 } = insets();
      Object.assign(uiEl.style, { left: "16px", top: top + 8 + "px", width: innerWidth - 32 + "px", height: innerHeight - top - bottom - 16 + "px" });
      return;
    }
    const r = world.screenClientRect(), inset = Math.min(r.width, r.height) * 0.035;
    Object.assign(uiEl.style, { left: r.left + inset + "px", top: r.top + inset + "px", width: r.width - 2 * inset + "px", height: r.height - 2 * inset + "px" });
  }
  function fill(p) { uiEl.innerHTML = renderScreen(p, state.lang, projects.indexOf(p), projects.length); }
  function show() {
    uiEl.hidden = false;
    uiEl.classList.remove("on"); void uiEl.offsetWidth; uiEl.classList.add("on");
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }
  /* arka plan görseli BMO'ya doğru büyür (bulanıklık body.zoomed ile CSS'te) */
  function zoomBg(on, duration) {
    const r = world.bmoRect();
    gsap.to(bgEls, { scale: on ? 1.15 : 1, duration, ease: "power2.inOut", overwrite: "auto", transformOrigin: `${r.left + r.width / 2}px ${r.top + r.height * 0.35}px` });
  }

  async function open(p) {
    shown = p; fill(p);
    state.zoomed = true;
    backdropEl.hidden = false;
    if (reduced) { uiEl.classList.add("panel"); show(); return; }
    document.body.classList.add("zoomed");
    zoomBg(true, 0.8);
    zooming = world.flyCamera(pose(), 0.8);
    await zooming;
    zooming = null;
    world.snapCamera(pose()); // zoom sırasında boyut değiştiyse güncel hedefe otur
    placeUi();
    show();
  }

  /* Katman hemen kapanır; dönen Promise kamera evine dönünce (ya da yeni bir zoom dönüşü kesince) çözülür */
  let returning = Promise.resolve();
  function close() {
    if (!state.zoomed) return returning;
    uiEl.hidden = true; backdropEl.hidden = true; shown = null;
    document.body.classList.remove("zoomed");
    state.zoomed = false;
    /* zoom sırasında yerleşim ertelenmişti (ör. telefon döndürüldü): kapanınca kasetler doğru yere/rafa döner */
    if (reduced) { onClosed?.(); return (returning = Promise.resolve()); }
    zoomBg(false, 0.6);
    world.bmo.setStill(false);
    returning = world.flyCamera(null, 0.6).then(() => { if (!state.zoomed) { world.resetCamera(); onClosed?.(); } });
    return returning;
  }

  function relayout() {
    if (!state.zoomed || reduced || zooming) return; // zoom sürüyorsa open() bitince hizalar
    world.snapCamera(pose());
    placeUi();
  }

  function rerender() {
    if (!shown || uiEl.hidden) return;
    fill(shown);
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }

  uiEl.addEventListener("click", (e) => { if (e.target.closest("[data-act=eject]")) bus.emit("screen:eject"); });
  backdropEl.addEventListener("click", () => bus.emit("screen:close"));
  addEventListener("keydown", (e) => {
    if (uiEl.hidden || uiEl.inert) return; // liste görünümü üstteyken ekran klavyeyi almaz
    if (e.key === "Escape") { e.preventDefault(); bus.emit("screen:close"); return; }
    if (e.key !== "Tab") return;
    const f = [...uiEl.querySelectorAll("a, button, [tabindex='0']")];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!uiEl.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open, close, relayout, rerender };
}
