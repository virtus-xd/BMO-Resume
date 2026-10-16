import { gsap } from "gsap";
import { SCREEN_RECT } from "../bmo/bmo.svg.js";
import { W, H } from "../scene/stage.js";
import { t, loc } from "../data/i18n.js";
import { usableLinks } from "../data/projects.js";
import { esc } from "./html.js";

/* .camera dönüşümü translate(x,y) scale(s), origin 0 0. Ekran merkezi (cx,cy) görüntü merkezine gelsin. */
export function cameraFor(rect, vw, vh, k, fill, oy) {
  const scale = Math.min((fill * vw) / (rect.w * k), (fill * vh) / (rect.h * k));
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  return { scale, x: W / 2 - scale * cx, y: H / 2 - oy / k - scale * cy };
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

export function createScreen({ cameraEl, uiEl, backdropEl, view, state, bus, reduced, parallax, projects }) {
  let shown = null, zoomTween = null;
  const target = () => cameraFor(SCREEN_RECT, innerWidth, innerHeight, view.k, view.narrow ? 0.94 : 0.8, view.oy);

  function placeUi() {
    if (reduced) return;
    const r = document.getElementById("bmo-screen-rect").getBoundingClientRect();
    const inset = Math.min(r.width, r.height) * 0.035;
    Object.assign(uiEl.style, { left: r.left + inset + "px", top: r.top + inset + "px", width: r.width - 2 * inset + "px", height: r.height - 2 * inset + "px" });
  }
  function fill(p) { uiEl.innerHTML = renderScreen(p, state.lang, projects.indexOf(p), projects.length); }

  async function open(p) {
    shown = p; fill(p);
    state.zoomed = true;
    parallax?.reset();
    backdropEl.hidden = false;
    if (reduced) uiEl.classList.add("panel");
    else {
      document.body.classList.add("zoomed");
      zoomTween = gsap.to(cameraEl, { ...target(), duration: 0.7, ease: "power2.inOut" });
      await zoomTween;
      zoomTween = null;
      gsap.set(cameraEl, target()); // tween sırasında boyut değiştiyse güncel hedefe otur
      placeUi();
    }
    uiEl.hidden = false;
    uiEl.classList.remove("on"); void uiEl.offsetWidth; uiEl.classList.add("on");
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }

  async function close() {
    if (!state.zoomed) return;
    uiEl.hidden = true; backdropEl.hidden = true; shown = null;
    document.body.classList.remove("zoomed");
    if (!reduced) await gsap.to(cameraEl, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "power2.inOut" });
    state.zoomed = false;
  }

  function relayout() {
    if (!state.zoomed || reduced || zoomTween) return; // zoom sürüyorsa open() bitince hizalar
    gsap.set(cameraEl, target());
    placeUi();
  }

  function rerender() {
    if (!shown || uiEl.hidden) return;
    fill(shown);
    uiEl.querySelector("#sTitle").focus({ preventScroll: true });
  }

  uiEl.addEventListener("click", (e) => { if (e.target.closest("[data-act=eject]")) bus.emit("screen:closed"); });
  backdropEl.addEventListener("click", () => bus.emit("screen:closed"));
  addEventListener("keydown", (e) => {
    if (uiEl.hidden || uiEl.inert) return; // liste görünümü üstteyken ekran klavyeyi almaz
    if (e.key === "Escape") { e.preventDefault(); bus.emit("screen:closed"); return; }
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
