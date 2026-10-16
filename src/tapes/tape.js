import { gsap } from "gsap";
import { loc, t, fmt } from "../data/i18n.js";
import { esc } from "../ui/html.js";

export function tapeHTML(p, lang) {
  return `<span class="cas"><span class="lab"><em>A</em><b>${esc(loc(lang, p.title))}</b></span><span class="win"><i></i><i></i></span><span class="scr a"></span><span class="scr b"></span></span><span class="easel"><span class="contact"></span></span>`;
}

export function createTapes(projects, lang) {
  const tapes = {};
  projects.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tape"; b.dataset.id = p.id;
    b.style.setProperty("--shell", p.color.shell);
    b.style.setProperty("--lab", p.color.label);
    b.innerHTML = tapeHTML(p, lang);
    b.setAttribute("aria-label", fmt(t(lang, "tape_aria"), { t: loc(lang, p.title) }));
    tapes[p.id] = b;
  });
  return tapes;
}

export function relabelTapes(tapes, projects, lang) {
  projects.forEach((p) => {
    const b = tapes[p.id]; if (!b) return;
    b.querySelector(".lab b").textContent = loc(lang, p.title);
    b.setAttribute("aria-label", fmt(t(lang, "tape_aria"), { t: loc(lang, p.title) }));
  });
}

export function placeTapes({ tapes, placed, sceneHost, trayHost, narrow, currentId }) {
  placed.forEach(({ project, slot }) => {
    const el = tapes[project.id];
    if (narrow) {
      el.style.left = el.style.top = "";
      trayHost.appendChild(el);
    } else {
      el.style.left = slot.x + "px"; el.style.top = slot.y + "px";
      el.style.setProperty("--sc", String(slot.s));
      el.style.setProperty("--r", slot.r + "deg");
      sceneHost.appendChild(el);
    }
    el.classList.toggle("gone", project.id === currentId);
  });
}

/* sürüklenen/uçan kopya: ekran px'inde, sahne ölçeğinden bağımsız */
export function makeGhost(tapeEl) {
  const wasGone = tapeEl.classList.contains("gone");
  tapeEl.classList.remove("gone");
  const r = tapeEl.querySelector(".cas").getBoundingClientRect();
  if (wasGone) tapeEl.classList.add("gone");
  const g = tapeEl.cloneNode(true);
  g.className = "tape ghost"; g.removeAttribute("aria-label"); g.setAttribute("aria-hidden", "true");
  g._home = { x: r.left, y: r.top, fs: r.width / 7 };
  g.style.fontSize = g._home.fs + "px";
  document.body.appendChild(g);
  gsap.set(g, { x: r.left, y: r.top, rotation: 0 });
  return g;
}

export function bindDrag(el, p, { isBusy, overBmo, onReach, onInsert, onMiss }) {
  let sx = 0, sy = 0, lastX = 0, dragging = false, ghost = null, ox = 0, oy = 0, near = false;
  let toX, toY, toR;

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || isBusy()) return;
    sx = lastX = e.clientX; sy = e.clientY; dragging = false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      /* raftaki yatay kaydırmayı engelleme */
      if (el.closest(".tray") && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { el.releasePointerCapture(e.pointerId); return; }
      if (Math.hypot(dx, dy) < 7) return;
      dragging = true;
      ghost = makeGhost(el);
      ox = sx - ghost._home.x; oy = sy - ghost._home.y;
      el.classList.add("gone");
      gsap.to(ghost, { scale: 1.08, duration: 0.15 });
      toX = gsap.quickTo(ghost, "x", { duration: 0.12, ease: "power3" });
      toY = gsap.quickTo(ghost, "y", { duration: 0.12, ease: "power3" });
      toR = gsap.quickTo(ghost, "rotation", { duration: 0.35, ease: "back.out(3)" });
      el.dispatchEvent(new CustomEvent("tape:pick", { bubbles: true }));
    }
    toX(e.clientX - ox); toY(e.clientY - oy);
    toR(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.8)));
    lastX = e.clientX;
    const isNear = overBmo(e.clientX, e.clientY);
    if (isNear !== near) { near = isNear; onReach(near); }
  });

  const end = (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    el.releasePointerCapture(e.pointerId);
    if (near) { near = false; onReach(false); }
    if (!dragging) { if (e.type === "pointerup") onInsert(p, null); return; }
    const g = ghost; ghost = null; dragging = false;
    if (overBmo(e.clientX, e.clientY)) onInsert(p, g); else onMiss(p, g);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  /* klavye (Enter/Space) tıklaması: detail === 0 */
  el.addEventListener("click", (e) => { if (e.detail === 0 && !isBusy()) onInsert(p, null); });
}
