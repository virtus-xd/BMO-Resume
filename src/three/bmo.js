import {
  CanvasTexture, CapsuleGeometry, CircleGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry,
  Quaternion, SphereGeometry, SRGBColorSpace, Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap";
import { toonMaterial, withOutline, rimLight, INK } from "./toon.js";
import { drawFace, FACE_W, FACE_H } from "./face.js";

/* Yerel birimler: gövde 1 × 1.25 × 0.62 (dizideki oranlar), zemin y=0, ön yüz +z. Sahnede BMO.scale ile küçülür. */
const W = 1, H = 1.25, D = 0.62, R = 0.09;
const FZ = D / 2;                       // ön yüz düzlemi (gövde merkezine göre)
export const SCREEN = { w: 0.74, h: 0.52, y: 0.24 };
const SLOT_Y = -0.12;

const C = {
  front: 0x6ccbb6, side: 0x479f8f, limb: 0x7fd6c6, lid: 0x3f9483, slot: 0x150b07,
  dpad: 0xf3c83a, tri: 0x3a8fd6, green: 0x5cc45a, red: 0xe2453c, metal: 0x9fb3ad, reel: 0xe9dcc0,
};

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) draw(ctx);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const flat = (map, opts = {}) => new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, ...opts });

/* yan yüz: dikey "BMO" yazısı + 3×3 hoparlör delikleri */
function sideTexture() {
  return canvasTexture(256, 512, (c) => {
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const x = 74 + q * 32, y = 70 + r * 32;
      c.fillStyle = "#1d4d44"; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.arc(x + 2, y + 3, 7, 0, Math.PI); c.fill();
    }
    c.save(); c.translate(140, 330); c.rotate(Math.PI / 2);
    c.font = "900 120px 'Arial Black', Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round"; c.lineWidth = 12; c.strokeStyle = "#2b1a12"; c.strokeText("BMO", 0, 0);
    c.fillStyle = "#2f7d70"; c.fillText("BMO", 0, 0);
    c.restore();
  });
}

/* arka yüz: pil kapağı çizgisi + havalandırma çizgileri */
function backTexture() {
  return canvasTexture(256, 320, (c) => {
    c.strokeStyle = "#1f4f46"; c.lineWidth = 6;
    c.beginPath(); c.roundRect(48, 150, 160, 120, 14); c.stroke();
    c.fillStyle = "#1f4f46"; c.beginPath(); c.roundRect(112, 252, 32, 10, 4); c.fill();
    c.lineCap = "round"; c.lineWidth = 7;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(70, 52 + i * 20); c.lineTo(186, 52 + i * 20); c.stroke(); }
  });
}

function shadowTexture(stretch) {
  return canvasTexture(256, 128, (c) => {
    /* x'te 2 kat gerilmiş radyal geçiş: kenarlarda tamamen saydam */
    c.setTransform(2, 0, 0, 1, 0, 0);
    const g = c.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, `rgba(30,12,4,${stretch ? 0.3 : 0.6})`); g.addColorStop(0.55, `rgba(30,12,4,${stretch ? 0.14 : 0.28})`); g.addColorStop(1, "rgba(30,12,4,0)");
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
}

/* iki nokta arasında kapsül (kol/bacak parçası) */
const Y = new Vector3(0, 1, 0);
function segment(from, to, r, mat) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const m = withOutline(new Mesh(new CapsuleGeometry(r, Math.max(0.001, len), 4, 12), mat), 0.012);
  m.position.copy(from).addScaledVector(dir, 0.5);
  m.quaternion.copy(new Quaternion().setFromUnitVectors(Y, dir.normalize()));
  return m;
}

export function createBmo() {
  const mats = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, toonMaterial(v)]));
  rimLight(mats.front, 0xfff4d6, 0.35);
  rimLight(mats.side, 0xfff4d6, 0.45);
  rimLight(mats.limb, 0xfff4d6, 0.3);
  const ink = new MeshBasicMaterial({ color: INK });
  const add = (parent, mesh, name) => { if (name) mesh.name = name; parent.add(mesh); return mesh; };

  /* hiyerarşi: group (dünya yerleşimi) → rig (sallanma/dans) → squash (esneme, taban pivotu) → torso (nefes) → body */
  const group = new Group(); group.name = "bmo";
  const rig = add(group, new Group(), "rig");
  const squashG = add(rig, new Group(), "squash");
  const torso = add(squashG, new Group(), "torso");

  const body = add(torso, withOutline(new Mesh(new RoundedBoxGeometry(W, H, D, 6, R), mats.side), 0.022), "body");
  body.position.y = H / 2;

  /* ön yüz: yanlardan açık tonlu düz panel (pahlı kenarlar koyu kalır) */
  const plate = add(body, new Mesh(new RoundedBoxGeometry(W - 2 * R + 0.02, H - 2 * R + 0.02, 0.012, 2, 0.006), mats.front), "front");
  plate.position.z = FZ - 0.004;
  const PZ = FZ + 0.002;                 // panelin önü

  /* ekran: koyu çerçeve + canvas yüz (iç gölge, cam yansıması, tarama çizgisi canvas'ta) */
  const bezel = add(body, new Mesh(new RoundedBoxGeometry(SCREEN.w + 0.08, SCREEN.h + 0.08, 0.03, 3, 0.035), ink), "bezel");
  bezel.position.set(0, SCREEN.y, PZ);
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = FACE_W; faceCanvas.height = FACE_H;
  const fctx = faceCanvas.getContext("2d");
  const faceTex = new CanvasTexture(faceCanvas); faceTex.colorSpace = SRGBColorSpace;
  const screenMesh = add(body, new Mesh(new PlaneGeometry(SCREEN.w, SCREEN.h), new MeshBasicMaterial({ map: faceTex, toneMapped: false })), "screen");
  screenMesh.position.set(0, SCREEN.y, PZ + 0.016);

  /* kaset yuvası: koyu çerçeve, derin iç boşluk, parlama halkası, katlanır kapak, makara penceresi */
  const glowMat = new MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const glow = add(body, new Mesh(new RoundedBoxGeometry(0.74, 0.15, 0.006, 2, 0.003), glowMat), "slotGlow");
  glow.position.set(0, SLOT_Y, PZ + 0.002);
  const slot = add(body, new Mesh(new RoundedBoxGeometry(0.66, 0.095, 0.03, 2, 0.014), new MeshBasicMaterial({ color: C.slot })), "slot");
  slot.position.set(0, SLOT_Y, PZ);
  const hole = add(body, new Mesh(new PlaneGeometry(0.6, 0.06), new MeshBasicMaterial({ color: 0x030201 })), "slotHole");
  hole.position.set(0, SLOT_Y, PZ + 0.016);
  const lip = add(body, new Mesh(new PlaneGeometry(0.6, 0.008), new MeshBasicMaterial({ color: 0x3a2418 })), "slotLip");
  lip.position.set(0, SLOT_Y - 0.026, PZ + 0.0165);
  const lid = add(body, new Group(), "lid");          // pivot üst kenarda: scale.y ile yukarı katlanır
  lid.position.set(0, SLOT_Y + 0.03, PZ + 0.022);
  const lidMesh = add(lid, withOutline(new Mesh(new RoundedBoxGeometry(0.6, 0.06, 0.014, 2, 0.006), mats.lid), 0.006), "lidPanel");
  lidMesh.position.y = -0.03;
  const reelWin = add(body, new Mesh(new RoundedBoxGeometry(0.26, 0.042, 0.004, 2, 0.002), new MeshBasicMaterial({ color: 0x6b3f22 })), "reelWin");
  reelWin.position.set(0, SLOT_Y, PZ + 0.032);
  const reels = [-0.075, 0.075].map((x) => {
    const reel = add(body, new Mesh(new CylinderGeometry(0.017, 0.017, 0.006, 18), toonMaterial(C.reel)), "bmoReel");
    reel.rotation.x = Math.PI / 2;
    reel.position.set(x, SLOT_Y, PZ + 0.036);
    for (const rz of [0, Math.PI / 2]) {
      const spoke = add(reel, new Mesh(new PlaneGeometry(0.028, 0.005), ink));
      spoke.rotation.set(-Math.PI / 2, 0, rz); spoke.position.y = 0.0035;
    }
    return reel;
  });

  /* tuşlar: kabartmalı D-pad, mavi üçgen, yeşil küçük + kırmızı büyük; her birinde parlak nokta */
  const shine = (parent, x, y, r) => {
    const s = add(parent, new Mesh(new CircleGeometry(r, 14), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, toneMapped: false })), "shine");
    s.position.set(x, y, PZ + 0.0335);
    return s;
  };
  for (const [w, h] of [[0.22, 0.072], [0.072, 0.22]]) {
    const m = add(body, withOutline(new Mesh(new RoundedBoxGeometry(w, h, 0.04, 2, 0.014), mats.dpad), 0.008), "dpad");
    m.position.set(-0.24, -0.3, PZ + 0.012);
  }
  const dimple = add(body, new Mesh(new CircleGeometry(0.018, 16), toonMaterial(0xd9ac22)), "dpadDimple");
  dimple.position.set(-0.24, -0.3, PZ + 0.0325);
  shine(body, -0.31, -0.28, 0.008);
  const button = (geo, mat, x, y, rx, name) => {
    const m = add(body, withOutline(new Mesh(geo, mat), 0.008), name);
    m.position.set(x, y, PZ + 0.014); m.rotation.x = rx;
    return m;
  };
  button(new CylinderGeometry(0.065, 0.065, 0.035, 3), mats.tri, 0.1, -0.3, -Math.PI / 2, "triangle");
  shine(body, 0.085, -0.285, 0.008).position.z = PZ + 0.0325;
  button(new CylinderGeometry(0.036, 0.036, 0.03, 24), mats.green, 0.33, -0.21, Math.PI / 2, "green");
  shine(body, 0.32, -0.198, 0.008).position.z = PZ + 0.03;
  button(new CylinderGeometry(0.078, 0.078, 0.035, 32), mats.red, 0.29, -0.38, Math.PI / 2, "red");
  shine(body, 0.265, -0.355, 0.014).position.z = PZ + 0.0325;
  for (const y of [-0.45, -0.49]) {
    const s = add(body, new Mesh(new RoundedBoxGeometry(0.14, 0.018, 0.01, 1, 0.004), ink), "grill");
    s.position.set(-0.24, y, PZ + 0.003);
  }

  /* sol yan: BMO yazısı + hoparlör; sağ yan: kulaklık/şarj portu + yan düğme */
  const sidePlane = add(body, new Mesh(new PlaneGeometry(D - 2 * R - 0.02, H - 2 * R - 0.04), flat(sideTexture())), "sideL");
  sidePlane.position.x = -W / 2 - 0.002; sidePlane.rotation.y = -Math.PI / 2;
  const jack = add(body, new Mesh(new CylinderGeometry(0.022, 0.022, 0.01, 16), new MeshBasicMaterial({ color: C.slot })), "jack");
  jack.rotation.z = Math.PI / 2; jack.position.set(W / 2 + 0.001, -0.3, 0.06);
  const port = add(body, new Mesh(new RoundedBoxGeometry(0.01, 0.03, 0.09, 1, 0.004), new MeshBasicMaterial({ color: C.slot })), "port");
  port.position.set(W / 2 + 0.002, -0.38, -0.02);
  const sideBtn = add(body, withOutline(new Mesh(new RoundedBoxGeometry(0.04, 0.13, 0.07, 2, 0.015), mats.lid), 0.008), "sideButton");
  sideBtn.position.set(W / 2 + 0.008, 0.22, 0);

  /* arka: pil kapağı + vida başlıkları */
  const back = add(body, new Mesh(new PlaneGeometry(W - 2 * R - 0.06, H - 2 * R - 0.1), flat(backTexture())), "back");
  back.position.z = -FZ - 0.002; back.rotation.y = Math.PI;
  for (const [x, y] of [[-0.34, 0.46], [0.34, 0.46], [-0.34, -0.46], [0.34, -0.46]]) {
    const screw = add(body, withOutline(new Mesh(new CylinderGeometry(0.026, 0.026, 0.014, 16), mats.metal), 0.005), "screw");
    screw.rotation.x = Math.PI / 2; screw.position.set(x, y, -FZ - 0.005);
    for (const rz of [Math.PI / 4, -Math.PI / 4]) {
      const cut = add(screw, new Mesh(new PlaneGeometry(0.034, 0.006), ink));
      cut.rotation.set(Math.PI / 2, 0, rz); cut.position.y = -0.008;
    }
  }

  /* uzuvlar: omuz–dirsek–el (yuvarlak el + başparmak), kalça–diz–ayak (düz taban öne bakar); oturuş pozu */
  const arms = [-1, 1].map((sx) => {
    const S = new Vector3(sx * 0.5, 0.74, 0.16), E = new Vector3(sx * 0.67, 0.44, 0.3), Hd = new Vector3(sx * 0.74, 0.07, 0.5);
    const shoulder = add(torso, new Group(), sx < 0 ? "shoulderL" : "shoulderR");
    shoulder.position.copy(S);
    shoulder.add(segment(new Vector3(), E.clone().sub(S), 0.034, mats.limb));
    const elbow = add(shoulder, new Group(), "elbow");
    elbow.position.copy(E.clone().sub(S));
    elbow.add(segment(new Vector3(), Hd.clone().sub(E), 0.032, mats.limb));
    const hand = add(elbow, withOutline(new Mesh(new SphereGeometry(0.06, 18, 12), mats.limb), 0.012), "hand");
    hand.position.copy(Hd.clone().sub(E)); hand.scale.set(1, 0.68, 1.15);
    const thumb = add(hand, withOutline(new Mesh(new CapsuleGeometry(0.018, 0.035, 4, 10), mats.limb), 0.01), "thumb");
    thumb.position.set(-sx * 0.055, 0.015, 0.035); thumb.rotation.set(Math.PI / 2.4, 0, sx * 0.7);
    return { shoulder, elbow };
  });
  const legs = [-1, 1].map((sx) => {
    const Hp = new Vector3(sx * 0.2, 0.1, 0.18), K = new Vector3(sx * 0.22, 0.08, 0.45), A = new Vector3(sx * 0.25, 0.06, 0.74);
    const hip = add(squashG, new Group(), "hip");
    hip.position.copy(Hp);
    hip.add(segment(new Vector3(), K.clone().sub(Hp), 0.036, mats.limb));
    hip.add(segment(K.clone().sub(Hp), A.clone().sub(Hp), 0.034, mats.limb));
    const foot = add(hip, withOutline(new Mesh(new RoundedBoxGeometry(0.11, 0.15, 0.05, 3, 0.022), mats.limb), 0.012), "foot");
    foot.position.copy(A.clone().sub(Hp)).add(new Vector3(0, 0.05, 0.03));
    foot.rotation.y = sx * 0.12;
    return hip;
  });

  /* zemin: temas gölgesi (koyu halka) + sağdaki pencereden gelen ışığa göre sola uzanan gölge */
  const contact = add(group, new Mesh(new PlaneGeometry(1.7, 1.2), flat(shadowTexture(false))), "shadow");
  contact.rotation.x = -Math.PI / 2; contact.position.set(0, 0.003, 0.25); contact.renderOrder = -1;
  const longShadow = add(group, new Mesh(new PlaneGeometry(2.6, 0.9), flat(shadowTexture(true))), "shadowLong");
  longShadow.rotation.set(-Math.PI / 2, 0, 0.35); longShadow.position.set(-0.85, 0.002, -0.15); longShadow.renderOrder = -2;

  /* --- durum --- */
  let faceName = null, faceEye = { x: 0, y: 0 }, reelsOn = false, glowOn = false, still = false;
  function setFace(name, eye) {
    const e = eye || faceEye;
    if (name === faceName && Math.abs(e.x - faceEye.x) < 0.15 && Math.abs(e.y - faceEye.y) < 0.15) return;
    faceName = name; faceEye = { x: e.x, y: e.y };
    if (!fctx) return;
    drawFace(fctx, name, faceEye);
    faceTex.needsUpdate = true;
  }
  function setLid(open) { lid.scale.y = 1 - 0.85 * open; }
  function setReels(on) {
    reelsOn = on;
    reels.forEach((r) => { r.visible = on; });
    reelWin.visible = on;
  }
  function setGlow(on) { glowOn = on; if (!on) glowMat.opacity = 0; }
  function setReach(on) {
    arms.forEach(({ shoulder, elbow }, i) => {
      const sx = i ? 1 : -1;
      gsap.to(shoulder.rotation, { x: on ? -1.15 : 0, z: on ? -sx * 0.25 : 0, duration: 0.3, ease: "back.out(2)", overwrite: "auto" });
      gsap.to(elbow.rotation, { x: on ? 0.35 : 0, duration: 0.3, ease: "back.out(2)", overwrite: "auto" });
    });
  }
  setReels(false);
  setFace("idle");

  function tick(t) {
    if (!still) {
      const s = Math.sin(t / 900);
      torso.scale.set(1 + s * 0.006, 1 - s * 0.012, 1 + s * 0.006);
      rig.rotation.y = Math.sin(t / 2400) * 0.04;
      legs[0].rotation.y = Math.sin(t / 700) * 0.06;
      legs[1].rotation.y = -Math.sin(t / 700 + 1) * 0.06;
    }
    if (reelsOn) reels.forEach((r) => { r.rotation.y = -t / 180; });
    if (glowOn) glowMat.opacity = 0.55 + 0.35 * Math.sin(t / 120);
  }
  /* zoom sırasında ekran HTML katmanıyla hizalı kalsın diye nefes/sallanma durur */
  function setStill(on) {
    still = on;
    if (on) { torso.scale.set(1, 1, 1); rig.rotation.y = 0; }
  }

  const armR = arms[1];
  function wave() {
    return gsap.timeline()
      .to(armR.shoulder.rotation, { z: 2.5, x: -0.25, duration: 0.3, ease: "power2.out" })
      .to(armR.elbow.rotation, { z: 0.55, duration: 0.16, yoyo: true, repeat: 5, ease: "sine.inOut" })
      .to(armR.shoulder.rotation, { z: 0, x: 0, duration: 0.35, ease: "back.out(2)" });
  }
  function dance() {
    return gsap.timeline()
      .to(rig.rotation, { z: 0.08, duration: 0.18, ease: "sine.inOut", repeat: 5, yoyo: true })
      .to(rig.position, { y: 0.06, duration: 0.18, ease: "sine.inOut", repeat: 5, yoyo: true }, 0)
      .to(arms.map((a) => a.shoulder.rotation), { z: (i) => (i ? 1.2 : -1.2), duration: 0.18, repeat: 5, yoyo: true, ease: "sine.inOut" }, 0)
      .to(rig.rotation, { z: 0, duration: 0.2 })
      .to(rig.position, { y: 0, duration: 0.2 }, "<");
  }
  function squash() {
    return gsap.timeline().to(squashG.scale, { y: 0.92, x: 1.06, z: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
  }

  function slotWorld() {
    slot.updateWorldMatrix(true, false);
    return new Vector3().setFromMatrixPosition(slot.matrixWorld);
  }
  function screenFrame() {
    screenMesh.updateWorldMatrix(true, false);
    const m = screenMesh.matrixWorld, s = new Vector3().setFromMatrixScale(m);
    return {
      center: new Vector3().setFromMatrixPosition(m),
      normal: new Vector3(0, 0, 1).transformDirection(m),
      up: new Vector3(0, 1, 0).transformDirection(m),
      width: SCREEN.w * s.x, height: SCREEN.h * s.y,
    };
  }
  function screenCorners() {
    screenMesh.updateWorldMatrix(true, false);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => screenMesh.localToWorld(new Vector3((x * SCREEN.w) / 2, (y * SCREEN.h) / 2, 0)));
  }

  return {
    group, screenMesh, faceCanvas,
    setFace, setLid, setReels, setReach, setGlow, setStill, tick, wave, dance, squash, slotWorld, screenFrame, screenCorners,
  };
}
