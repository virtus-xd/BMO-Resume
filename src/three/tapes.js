import {
  CanvasTexture, CircleGeometry, CylinderGeometry, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  PerspectiveCamera, PlaneGeometry, PointLight, Scene, SRGBColorSpace, Vector4,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap";
import { toonMaterial, withOutline, INK } from "./toon.js";
import { wrapTitle } from "./layout.js";
import { loc } from "../data/i18n.js";

/* Kaset: gövde 0.7 × 0.44 × 0.1; grup orijini alt-orta (zemine oturur). Etiket canvas'ı 512×256: üstte proje
   renginde şerit, ortada en fazla 2 satır başlık, altta pencere (makara mesh'leri pencerenin önünde). */
export const TAPE = { w: 0.7, h: 0.44, d: 0.1 };
/* raf küçük resminin kamerası; THUMB_FRAME: resmin eni/boyu kasetin kaç katı (kaset ortada) */
const THUMB = { fov: 20, dist: 1.75, ratio: 0.68 };
const thumbH = 2 * THUMB.dist * Math.tan((THUMB.fov * Math.PI) / 360);
export const THUMB_FRAME = { w: thumbH / THUMB.ratio / TAPE.w, h: thumbH / TAPE.h };
const LABEL = { w: 0.6, h: 0.3, y: 0.045 };
const WIN = { x0: 120, x1: 392, y0: 150, y1: 230, reels: [170, 342], r: 28 };
const toPlane = (px, py) => [(px / 512 - 0.5) * LABEL.w, LABEL.y + (0.5 - py / 256) * LABEL.h];

function drawLabel(ctx, project, lines, coverImg) {
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = "#f6ead0";
  ctx.beginPath(); ctx.roundRect(0, 0, 512, 256, 18); ctx.fill();
  ctx.fillStyle = "rgba(120,90,60,.2)";
  for (let y = 70; y < 150; y += 22) ctx.fillRect(16, y, 480, 2);
  if (coverImg) {
    const area = { x: 0, y: 54, w: 512, h: 202 };
    const k = Math.max(area.w / coverImg.width, area.h / coverImg.height);
    ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, 512, 256, 18); ctx.clip();
    ctx.drawImage(coverImg, area.x + (area.w - coverImg.width * k) / 2, area.y + (area.h - coverImg.height * k) / 2, coverImg.width * k, coverImg.height * k);
    ctx.restore();
  }
  ctx.fillStyle = project.color.label; ctx.fillRect(0, 0, 512, 54);
  ctx.fillStyle = INK_CSS; ctx.fillRect(0, 52, 512, 4);
  ctx.font = "34px 'Gochi Hand', cursive"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillText("A", 496, 28);
  if (!coverImg) {
    /* Gochi Hand bu ölçekte ince kalıyor: aynı renkte hafif konturla kalınlaştırılır (uzaktan da okunsun) */
    ctx.fillStyle = ctx.strokeStyle = "#3a2418"; ctx.textAlign = "left"; ctx.lineJoin = "round"; ctx.lineWidth = 2.5;
    const size = lines.length > 1 ? 50 : 66;
    lines.forEach((ln, i) => {
      let s = size;
      ctx.font = `${s}px 'Gochi Hand', cursive`;
      while (ctx.measureText(ln).width > 470 && s > 24) { s -= 2; ctx.font = `${s}px 'Gochi Hand', cursive`; }
      const y = lines.length > 1 ? 79 + i * 46 : 102;
      ctx.strokeText(ln, 22, y); ctx.fillText(ln, 22, y);
    });
  }
  /* pencere: koyu çerçeve, kahverengi bant; makaralar mesh olarak önünde döner */
  ctx.fillStyle = "#2a1810"; ctx.beginPath(); ctx.roundRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 40); ctx.fill();
  ctx.fillStyle = "#6b3f22"; ctx.fillRect(WIN.reels[0], WIN.y0 + 22, WIN.reels[1] - WIN.reels[0], WIN.y1 - WIN.y0 - 44);
}
const INK_CSS = "#2b1a12";

export function createTape3D(project, lang) {
  const group = new Group(); group.name = "tape"; group.userData.id = project.id;
  const body = new Group(); body.name = "tapeBody"; body.position.y = TAPE.h / 2;
  group.add(body);

  const shell = withOutline(new Mesh(new RoundedBoxGeometry(TAPE.w, TAPE.h, TAPE.d, 3, 0.03), toonMaterial(project.color.shell)), 0.012);
  shell.name = "shell";
  body.add(shell);
  const fz = TAPE.d / 2 + 0.001;

  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const tex = new CanvasTexture(canvas); tex.colorSpace = SRGBColorSpace; tex.anisotropy = 4;
  const label = new Mesh(new PlaneGeometry(LABEL.w, LABEL.h), new MeshBasicMaterial({ map: tex, transparent: true }));
  label.name = "label"; label.position.set(0, LABEL.y, fz);
  label.userData.cover = project.shots?.[0] ?? null;
  body.add(label);

  /* makaralar (göbek + 3 kol) pencerenin önünde */
  const reels = WIN.reels.map((px) => {
    const [x, y] = toPlane(px, (WIN.y0 + WIN.y1) / 2);
    const reel = new Mesh(new CylinderGeometry(0.031, 0.031, 0.008, 20), toonMaterial(0xe9dcc0));
    reel.name = "reel"; reel.rotation.x = Math.PI / 2; reel.position.set(x, y, fz + 0.004);
    const hub = new Mesh(new CircleGeometry(0.011, 12), new MeshBasicMaterial({ color: 0x2a1810 }));
    hub.rotation.x = -Math.PI / 2; hub.position.y = 0.0045; reel.add(hub);
    for (let i = 0; i < 3; i++) {
      const tooth = new Mesh(new PlaneGeometry(0.004, 0.012), new MeshBasicMaterial({ color: 0x2a1810 }));
      tooth.rotation.set(-Math.PI / 2, 0, (i * Math.PI * 2) / 3); tooth.position.y = 0.0046;
      tooth.translateY(0.016); reel.add(tooth);
    }
    body.add(reel);
    return reel;
  });

  /* köşe vidaları + alt kafa bölmesi */
  for (const [x, y] of [[-0.31, 0.18], [0.31, 0.18], [-0.31, -0.18], [0.31, -0.18]]) {
    const s = new Mesh(new CircleGeometry(0.013, 12), new MeshBasicMaterial({ color: INK }));
    s.position.set(x, y, fz); body.add(s);
  }
  const head = withOutline(new Mesh(new RoundedBoxGeometry(0.42, 0.075, 0.02, 2, 0.008), toonMaterial(project.color.shell)), 0.006);
  head.name = "head"; head.position.set(0, -0.175, fz); body.add(head);

  /* zemin temas gölgesi */
  const shadow = new Mesh(new CircleGeometry(0.5, 24), new MeshBasicMaterial({ color: 0x1e0c04, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.name = "tapeShadow"; shadow.rotation.x = -Math.PI / 2; shadow.scale.set(0.8, 0.22, 1); shadow.position.y = 0.002; shadow.renderOrder = -1;
  group.add(shadow);

  let coverImg = null;
  function paint() {
    if (!ctx) return;
    drawLabel(ctx, project, label.userData.lines, coverImg);
    tex.needsUpdate = true;
  }
  function setLabel(l) {
    label.userData.lines = wrapTitle(loc(l, project.title), 12);
    paint();
  }
  if (label.userData.cover && ctx) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { coverImg = img; paint(); };
    img.src = label.userData.cover;
  }
  setLabel(lang);

  function setHover(on) {
    gsap.to(body.position, { y: TAPE.h / 2 + (on ? 0.05 : 0), duration: 0.2, ease: "power2.out", overwrite: "auto" });
    gsap.to(body.scale, { x: on ? 1.06 : 1, y: on ? 1.06 : 1, z: on ? 1.06 : 1, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  }
  function spin(t) { reels.forEach((r) => { r.rotation.y = -t / 260; }); }

  return { group, id: project.id, setLabel, setHover, spin };
}

/* dar düzen rafı için: kaseti ana renderer'ın sol alt köşesine bir kez çizip 2D canvas'a kopyalar */
export function tapeThumbnail(renderer, tape3d, size = 160) {
  const h = Math.round(size * THUMB.ratio);
  const scene = new Scene();
  scene.add(new HemisphereLight(0xf4f8ff, 0x7a5434, 1.4));
  const sun = new DirectionalLight(0xfff0d0, 1.6); sun.position.set(2, 3, 4); scene.add(sun);
  /* ana sahneyle aynı ışık düzeni (2 nokta ışığı, sönük): shader programları yeniden derlenmesin */
  for (let i = 0; i < 2; i++) scene.add(new PointLight(0xffa040, 0, 9, 1));
  const g = tape3d.group.clone();
  g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1);
  g.visible = true; // dar düzende sahnedeki kaset gizlidir; küçük resim yine de çizilmeli
  g.getObjectByName("tapeShadow").visible = false;
  scene.add(g);
  const cam = new PerspectiveCamera(THUMB.fov, size / h, 0.1, 10);
  cam.position.set(0, TAPE.h / 2, THUMB.dist); cam.lookAt(0, TAPE.h / 2, 0);

  const vp = renderer.getViewport(new Vector4()), sc = renderer.getScissor(new Vector4()), test = renderer.getScissorTest();
  const pr = renderer.getPixelRatio();
  renderer.setScissorTest(true);
  renderer.setViewport(0, 0, size, h); renderer.setScissor(0, 0, size, h);
  renderer.clear();
  renderer.render(scene, cam);
  const out = document.createElement("canvas");
  out.width = Math.round(size * pr); out.height = Math.round(h * pr);
  out.getContext("2d")?.drawImage(renderer.domElement, 0, renderer.domElement.height - out.height, out.width, out.height, 0, 0, out.width, out.height);
  renderer.setViewport(vp); renderer.setScissor(sc); renderer.setScissorTest(test);
  return out.toDataURL("image/png");
}
