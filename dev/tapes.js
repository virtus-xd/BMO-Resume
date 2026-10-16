/* Yalnız geliştirme: 7 kaseti iki dilde ve raf küçük resimleriyle gösterir. ?en */
import { DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from "three";
import { createTape3D, tapeThumbnail } from "../src/three/tapes.js";
import { PROJECTS } from "../src/data/projects.js";

await document.fonts.load("62px 'Gochi Hand'").catch(() => {});
const lang = new URLSearchParams(location.search).has("en") ? "en" : "tr";
const renderer = new WebGLRenderer({ canvas: document.getElementById("c"), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
renderer.setSize(innerWidth, innerHeight, false);
const scene = new Scene();
scene.add(new HemisphereLight(0xf4f8ff, 0x7a5434, 1.3));
const sun = new DirectionalLight(0xfff0d0, 2.0); sun.position.set(4, 5, 3); scene.add(sun);
const cam = new PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 50);
cam.position.set(0, 1.2, 4.2); cam.lookAt(0, 0.35, 0);
const tapes = PROJECTS.map((p, i) => {
  const t = createTape3D(p, lang);
  t.group.position.set((i % 4 - 1.5) * 0.9, i < 4 ? 0.55 : 0, i < 4 ? -0.4 : 0.6);
  t.group.rotation.set(-0.12, (i % 2 ? -1 : 1) * 0.18, 0);
  scene.add(t.group);
  return t;
});
renderer.render(scene, cam);
tapes.forEach((t) => { const img = new Image(); img.src = tapeThumbnail(renderer, t, 160); document.getElementById("thumbs").appendChild(img); });
renderer.setAnimationLoop((ms) => { tapes.forEach((t) => t.spin(ms)); renderer.render(scene, cam); });
