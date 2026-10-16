/* Yalnız geliştirme: BMO'yu bg2 üstünde üç açıdan gösterir. Sürükle = döndür. ?face=happy&night */
import { DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from "three";
import { createBmo } from "../src/three/bmo.js";
import { FACE_NAMES } from "../src/bmo/faces.js";

const Q = new URLSearchParams(location.search);
await document.fonts.load("30px VT323").catch(() => {});
const canvas = document.getElementById("c");
const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
renderer.setScissorTest(true);

const scene = new Scene();
scene.add(new HemisphereLight(0xf4f8ff, 0x7a5434, 1.3));
const sun = new DirectionalLight(0xfff0d0, 2.0);
sun.position.set(4, 5, 3);   // bg2: ışık sağdaki pencereden
scene.add(sun);

const bmo = createBmo();
scene.add(bmo.group);
bmo.setFace(Q.get("face") || "idle");
window.bmo = bmo;

const VIEWS = [0, 0.65, Math.PI / 2 + 0.05];
const cam = new PerspectiveCamera(28, 1, 0.1, 50);
let spin = 0;

const bar = document.getElementById("bar");
const btn = (label, fn) => { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; bar.appendChild(b); };
const sel = document.createElement("select");
FACE_NAMES.forEach((n) => sel.add(new Option(n, n)));
sel.value = Q.get("face") || "idle";
sel.onchange = () => bmo.setFace(sel.value);
bar.appendChild(sel);
let lid = 0, reels = false, reach = false, glow = false;
btn("el salla", () => bmo.wave());
btn("dans", () => bmo.dance());
btn("esne", () => bmo.squash());
btn("kapak", () => { lid = lid ? 0 : 1; bmo.setLid(lid); });
btn("makaralar", () => { reels = !reels; bmo.setReels(reels); });
btn("uzan", () => { reach = !reach; bmo.setReach(reach); });
btn("parla", () => { glow = !glow; bmo.setGlow(glow); });
btn("arka", () => { spin = spin ? 0 : Math.PI; });

let drag = null;
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, s: spin }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", (e) => {
  if (drag) spin = drag.s + (e.clientX - drag.x) / 120;
  const dx = (e.clientX / innerWidth - 0.5) * 8, dy = (e.clientY / innerHeight - 0.5) * 8;
  bmo.setFace(sel.value, { x: Math.max(-4, Math.min(4, dx)), y: Math.max(-4, Math.min(4, dy)) });
});
canvas.addEventListener("pointerup", () => { drag = null; });

function resize() { renderer.setSize(innerWidth, innerHeight, false); }
addEventListener("resize", resize); resize();

renderer.setAnimationLoop((t) => {
  bmo.tick(t);
  const w = innerWidth / 3, h = innerHeight;
  cam.aspect = w / h; cam.updateProjectionMatrix();
  cam.position.set(0, 1.5, 4.4); cam.lookAt(0, 0.55, 0.15);
  VIEWS.forEach((ry, i) => {
    bmo.group.rotation.y = ry + spin;
    renderer.setViewport(i * w, 0, w, h); renderer.setScissor(i * w, 0, w, h);
    renderer.render(scene, cam);
  });
});
