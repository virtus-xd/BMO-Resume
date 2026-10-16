import { gsap } from "gsap";
import { makeGhost } from "./tape.js";
import { loc, t } from "../data/i18n.js";

const reels = ["#bmo-reel-l", "#bmo-reel-r"];
let reelTween = null, noteTimer = 0;

function slotBox() {
  return document.querySelector("#bmo-slot .bmo-slot-hole").getBoundingClientRect();
}

function startNotes(host) {
  clearInterval(noteTimer);
  noteTimer = setInterval(() => {
    if (document.hidden) return;
    const n = document.createElement("span");
    const left = Math.random() < 0.5;
    n.className = "note"; n.textContent = Math.random() < 0.5 ? "♪" : "♫";
    n.style.left = (left ? 830 : 1080) + "px"; n.style.top = "590px";
    host.appendChild(n);
    gsap.fromTo(n, { opacity: 0, x: 0, y: 0, rotation: 0 },
      { opacity: 1, duration: 0.3, onComplete: () => gsap.to(n, { x: (left ? -1 : 1) * (20 + Math.random() * 30), y: -90, rotation: (left ? -1 : 1) * 20, opacity: 0, duration: 1.9, ease: "power1.out", onComplete: () => n.remove() }) });
  }, 700);
}
function stopNotes() { clearInterval(noteTimer); }

export async function insertTape(p, ghost, { tapes, bus, state, reduced, stageEl }) {
  const el = tapes[p.id];
  el.classList.add("gone");
  const g = ghost || makeGhost(el);
  bus.emit("reach", true);

  if (reduced) {
    g.remove();
  } else {
    const s = slotBox();
    const fs = (s.width * 0.92) / 7;               // yuva genişliğine sığan kaset
    const tx = s.left + s.width * 0.04, ty = s.top - fs * 4.5 * 0.55;
    const tl = gsap.timeline();
    bus.emit("sfx", "lid");
    tl.to("#bmo-lid", { scaleY: 0.15, transformOrigin: "50% 0%", duration: 0.18, ease: "power2.out" }, 0);
    if (!ghost) tl.to(g, { y: "-=90", scale: 1.1, duration: 0.25, ease: "power2.out" }, 0);
    tl.to(g, { x: tx, y: ty, fontSize: fs, scale: 1, rotation: 0, duration: ghost ? 0.32 : 0.45, ease: "power2.inOut" }, ghost ? 0 : 0.25)
      .to(g, { y: ty + fs * 4.5, clipPath: "inset(0% 0% 100% 0%)", duration: 0.25, ease: "power2.in" })
      .add(() => { g.remove(); bus.emit("sfx", "clunk"); })
      .to("#bmo-lid", { scaleY: 1, duration: 0.18, ease: "back.out(3)" })
      .to("#bmo", { scaleY: 0.92, scaleX: 1.06, transformOrigin: "50% 100%", duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, "<");
    await tl;
  }

  gsap.set("#bmo-reels", { opacity: 1 });
  if (!reduced) reelTween = gsap.to(reels, { rotation: 360, transformOrigin: "50% 50%", duration: 1.1, ease: "none", repeat: -1 });
  state.current = p;
  bus.emit("reach", false);
  bus.emit("face", { base: "happy" });
  bus.emit("say", loc(state.lang, p.line));
  if (!reduced) startNotes(stageEl);
  bus.emit("tape:loaded", p);
}

export async function ejectTape(p, { tapes, bus, state, reduced }, { quick = false } = {}) {
  const el = tapes[p.id];
  stopNotes();
  reelTween?.kill(); reelTween = null;
  gsap.set("#bmo-reels", { opacity: 0 });
  bus.emit("sfx", "eject");
  state.current = null;
  bus.emit("face", { base: "idle" });

  if (!reduced) {
    const g = makeGhost(el);
    const home = g._home, s = slotBox(), fs = (s.width * 0.92) / 7;
    gsap.set(g, { x: s.left + s.width * 0.04, y: s.top, fontSize: fs, opacity: 0 });
    const tl = gsap.timeline();
    tl.to("#bmo-lid", { scaleY: 0.15, transformOrigin: "50% 0%", duration: 0.12 })
      .to(g, { opacity: 1, y: s.top - fs * 6, duration: quick ? 0.18 : 0.25, ease: "power2.out" })
      .to("#bmo-lid", { scaleY: 1, duration: 0.15, ease: "back.out(3)" }, "<")
      .to(g, { x: home.x, fontSize: home.fs, duration: quick ? 0.3 : 0.45, ease: "power1.inOut" })
      .to(g, { y: home.y, duration: quick ? 0.3 : 0.45, ease: "bounce.out" }, "<");
    await tl;
    g.remove();
  }
  el.classList.remove("gone");
  gsap.fromTo(el, { filter: "brightness(1.6)" }, { filter: "brightness(1)", duration: 0.5, clearProps: "filter" });
  bus.emit("tape:ejected", p);
}

export async function missTape(p, ghost, { tapes, bus, state, reduced }) {
  const el = tapes[p.id];
  bus.emit("sfx", "drop");
  if (!reduced && ghost) {
    const h = ghost._home;
    await gsap.timeline()
      .to(ghost, { x: h.x, rotation: 0, scale: 1, duration: 0.45, ease: "power1.out" })
      .to(ghost, { y: h.y, duration: 0.45, ease: "bounce.out" }, "<");
  }
  ghost?.remove();
  if (state.current?.id !== p.id) el.classList.remove("gone");
  bus.emit("face", { flash: "sad", ms: 900 });
  bus.emit("say", t(state.lang, "miss"));
}
