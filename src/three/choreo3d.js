import { Matrix4, Quaternion, Vector3 } from "three";
import { gsap } from "gsap";
import { TAPE } from "./tapes.js";
import { TAPE_SCALE } from "./layout.js";

const LIFT = 0.35;          // sürüklerken kasetin zeminden yüksekliği
const NEAR = 0.9;           // yuvaya bu uzaklıktan yakınsa takılır
const TILT = (12 * Math.PI) / 180;

/* Kasetlerin 3D koreografisi (spec §6): kaldır/sürükle, tak, çıkar, ıskala; takılıyken notalar */
export function createChoreo({ world, bus, state, reduced, notesHost }) {
  const { bmo, tapes } = world;
  const halfH = (TAPE.h * TAPE_SCALE) / 2;
  const homeQ = (tape) => new Quaternion().setFromEuler(tape.home.rotation);
  const tweenTo = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }));

  /* yuva yönelimi: kaset yüzü yukarı, üst kenarı BMO'nun içine doğru */
  function slotPose() {
    const f = bmo.screenFrame(), slot = bmo.slotWorld();
    const right = new Vector3().crossVectors(f.up, f.normal).normalize();
    const into = f.normal.clone().negate();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, into, new Vector3().crossVectors(right, into)));
    return { slot, normal: f.normal, q };
  }

  function slerpTo(group, q1, duration, ease = "power2.inOut") {
    const q0 = group.quaternion.clone(), p = { t: 0 };
    return tweenTo(p, { t: 1, duration, ease, onUpdate: () => group.quaternion.slerpQuaternions(q0, q1, p.t) });
  }
  function lid(open, duration, ease) {
    const p = { v: open ? 0 : 1 };
    return tweenTo(p, { v: open ? 1 : 0, duration, ease, onUpdate: () => bmo.setLid(p.v) });
  }

  /* --- sürükleme --- */
  const drag = new Map();
  function pick(id, x, y) {
    const tape = tapes.get(id), g = tape.group;
    gsap.killTweensOf(g.position); gsap.killTweensOf(g.rotation);
    g.visible = true;
    const p = world.floorPoint(x, y, LIFT + halfH);
    const d = {
      x: gsap.quickTo(g.position, "x", { duration: 0.12, ease: "power3" }),
      z: gsap.quickTo(g.position, "z", { duration: 0.12, ease: "power3" }),
      r: gsap.quickTo(g.rotation, "z", { duration: 0.35, ease: "back.out(3)" }),
      last: p,
    };
    drag.set(id, d);
    if (state.narrow) g.position.set(p.x, 0, p.z);       // raftan gelen kaset imlecin altında belirir
    if (!reduced) gsap.to(g.position, { y: LIFT, duration: 0.18, ease: "power2.out" });
    else g.position.y = LIFT;
    return moveTo(id, x, y, 0);
  }
  function moveTo(id, x, y, vx) {
    const d = drag.get(id); if (!d) return false;
    const p = world.floorPoint(x, y, LIFT + halfH);
    d.last = p;
    d.x(p.x); d.z(p.z);
    d.r(Math.max(-TILT, Math.min(TILT, -vx * 0.35)));
    return isNear(p);
  }
  function isNear(p) {
    const s = bmo.slotWorld();
    return Math.hypot(p.x - s.x, p.y - s.y, p.z - s.z) < NEAR;
  }
  function release(id, x, y) {
    const d = drag.get(id); drag.delete(id);
    const p = d ? world.floorPoint(x, y, LIFT + halfH) : null;
    return !!p && isNear(p);
  }
  /* meşgulken bırakılan kaset: kilitsiz, sessizce yerine */
  function snapHome(id) {
    drag.delete(id);
    const tape = tapes.get(id), g = tape.group;
    g.position.copy(tape.home.position); g.rotation.copy(tape.home.rotation);
    g.visible = !state.narrow;
  }

  /* --- tak (spec §6.1) --- */
  async function insert3D(id, { fromDrag = false } = {}) {
    drag.delete(id);
    const tape = tapes.get(id), g = tape.group;
    if (reduced) { g.visible = false; bmo.setReels(true); bus.emit("sfx", "clunk"); return; }
    gsap.killTweensOf(g.position);
    const { slot, normal, q } = slotPose();
    const scale = g.scale.x;
    const out = slot.clone().addScaledVector(normal, TAPE.h * scale + 0.08);   // yuvanın önünde bekleme noktası
    const hover = out.clone(); hover.y += 0.02;

    if (!g.visible) { g.visible = true; if (state.narrow) { const p = world.floorPoint(innerWidth / 2, innerHeight, 0); g.position.copy(p); } }
    if (!fromDrag) await tweenTo(g.position, { y: g.position.y + LIFT, duration: 0.25, ease: "power2.out" });
    bus.emit("sfx", "lid");
    const lidOpen = lid(true, 0.18, "power2.out");
    const dur = fromDrag ? 0.32 : 0.45;
    await Promise.all([tweenTo(g.position, { x: hover.x, y: hover.y, z: hover.z, duration: dur, ease: "power2.inOut" }), slerpTo(g, q, dur), lidOpen]);
    const inside = slot.clone().addScaledVector(normal, -0.02);
    await tweenTo(g.position, { x: inside.x, y: inside.y, z: inside.z, duration: 0.25, ease: "power2.in" });
    g.visible = false;
    bus.emit("sfx", "clunk");
    await Promise.all([lid(false, 0.18, "back.out(3)"), new Promise((r) => bmo.squash().eventCallback("onComplete", r))]);
    bmo.setReels(true);
  }

  /* --- çıkar: yuvadan fırlar, yerine seker --- */
  async function eject3D(id, { quick = false } = {}) {
    const tape = tapes.get(id), g = tape.group;
    bmo.setReels(false);
    bus.emit("sfx", "eject");
    const homeVisible = !state.narrow;
    if (reduced) { snapHome(id); return; }
    const { slot, normal, q } = slotPose();
    g.position.copy(slot).addScaledVector(normal, -0.02);
    g.quaternion.copy(q);
    g.visible = true;
    await lid(true, 0.12, "power2.out");
    const out = slot.clone().addScaledVector(normal, TAPE.h * g.scale.x + 0.15); out.y += 0.25;
    await tweenTo(g.position, { x: out.x, y: out.y, z: out.z, duration: quick ? 0.18 : 0.25, ease: "power2.out" });
    lid(false, 0.15, "back.out(3)");
    const h = tape.home.position, dur = quick ? 0.3 : 0.5;
    await Promise.all([
      tweenTo(g.position, { x: h.x, z: h.z, duration: dur, ease: "power1.inOut" }),
      tweenTo(g.position, { y: h.y, duration: dur, ease: "bounce.out" }),
      slerpTo(g, homeQ(tape), dur * 0.8),
    ]);
    g.rotation.copy(tape.home.rotation);
    g.visible = homeVisible;
  }

  /* --- ıskala: düşer, seker, yerine döner --- */
  async function miss3D(id) {
    drag.delete(id);
    const tape = tapes.get(id), g = tape.group, h = tape.home.position;
    if (reduced) { snapHome(id); return; }
    gsap.killTweensOf(g.position); gsap.killTweensOf(g.rotation);
    await tweenTo(g.position, { y: 0, duration: 0.28, ease: "bounce.out" });
    await Promise.all([
      tweenTo(g.position, { x: h.x, z: h.z, duration: 0.45, ease: "power1.out" }),
      tweenTo(g.position, { keyframes: [{ y: 0.18, duration: 0.18, ease: "power2.out" }, { y: 0, duration: 0.27, ease: "bounce.out" }] }),
      slerpTo(g, homeQ(tape), 0.4),
    ]);
    g.rotation.copy(tape.home.rotation);
    g.visible = !state.narrow;
  }

  /* --- notalar: BMO'nun yansıtılmış konumunda 2D ♪ --- */
  let noteTimer = 0;
  function notes(on) {
    clearInterval(noteTimer);
    if (!on || reduced || !notesHost) return;
    noteTimer = setInterval(() => {
      if (document.hidden || state.zoomed) return;
      const r = world.bmoRect(), left = Math.random() < 0.5;
      const n = document.createElement("span");
      n.className = "note"; n.textContent = Math.random() < 0.5 ? "♪" : "♫"; n.setAttribute("aria-hidden", "true");
      n.style.left = (left ? r.left + r.width * 0.05 : r.left + r.width * 0.85) + "px";
      n.style.top = r.top + r.height * 0.15 + "px";
      notesHost.appendChild(n);
      gsap.fromTo(n, { opacity: 0, x: 0, y: 0, rotation: 0 }, {
        opacity: 1, duration: 0.3,
        onComplete: () => gsap.to(n, { x: (left ? -1 : 1) * (20 + Math.random() * 30), y: -90, rotation: (left ? -1 : 1) * 20, opacity: 0, duration: 1.9, ease: "power1.out", onComplete: () => n.remove() }),
      });
    }, 700);
  }

  return { pick, moveTo, release, snapHome, insert3D, eject3D, miss3D, notes, isNear };
}
