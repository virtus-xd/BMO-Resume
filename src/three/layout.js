import { PerspectiveCamera, Vector3 } from "three";
import { W, H } from "../scene/stage.js";

/* Sahne kalibrasyonu tek yerde: kamera, BMO ve kaset yuvaları bg2'nin perspektifine göre (bkz. ?calib).
   Dünya: y yukarı, zemin y=0, kamera +z tarafından bakar. */
export const CAMERA = { fov: 30, position: [0, 3.0, 7.6], target: [0, 0.55, 0] };
export const BMO = { position: [0, 0, 1.15], rotY: 0.3, scale: 0.7 };
/* bg2'deki zemin boşlukları (stage px → zemin), proje sırasıyla: sol arka, sol, sol ön, ön sol,
   BMO'nun sağ arkası (kanepe önü), ön sağ, sağ, sağ arka */
export const TAPE_SLOTS = [
  { position: [-0.77, 0, 0.44], rotY: 0.3 },
  { position: [-1.36, 0, 1.04], rotY: 0.35 },
  { position: [-1.75, 0, 1.96], rotY: 0.25 },
  { position: [-0.82, 0, 2.12], rotY: 0.1 },
  { position: [0.7, 0, 0.25], rotY: -0.3 },
  { position: [0.84, 0, 2.12], rotY: -0.12 },
  { position: [1.67, 0, 1.58], rotY: -0.3 },
  { position: [1.09, 0, 1.02], rotY: -0.25 },
];
export const TAPE_SCALE = 0.6;    // kaset (0.7 genişlik) BMO'ya göre ölçeklenir
export const TAPE_LEAN = -0.14;   // kasetler hafif arkaya yaslanır
export const SAFE = { x0: 240, x1: 1680, y0: 95, y1: 985 };

export function makeCamera(aspect = W / H) {
  const cam = new PerspectiveCamera(CAMERA.fov, aspect, 0.1, 100);
  cam.position.set(...CAMERA.position);
  cam.lookAt(...CAMERA.target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return cam;
}

/* dünya noktası → stage pikseli (1920×1080) */
export function projectToStage(camera, vec3) {
  const v = vec3.clone().project(camera);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
}

export function projectRect(camera, points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) {
    const { x, y } = projectToStage(camera, p);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}

export function inSafeBand(r) {
  return r.left >= SAFE.x0 && r.left + r.width <= SAFE.x1 && r.top >= SAFE.y0 && r.top + r.height <= SAFE.y1;
}

/* Kamerayı ekranın normali boyunca, ekran görünür bölgeyi (NDC: merkez cx,cy; boyut w,h) fill oranında
   dolduracak uzaklığa koyar; yanal kaydırmayla ekran merkezi (cx, cy)'ye yansır. */
export function zoomPose({ center, normal, up, width, height }, fov, aspect, visible, fill) {
  const tan = Math.tan((fov * Math.PI) / 360);
  const n = normal.clone().normalize();
  const right = new Vector3().crossVectors(up, n).normalize();
  const u = new Vector3().crossVectors(n, right);
  const d = Math.max(height / (fill * visible.h * tan), width / (fill * visible.w * tan * aspect));
  const position = center.clone().addScaledVector(n, d)
    .addScaledVector(right, -visible.cx * d * tan * aspect)
    .addScaledVector(u, -visible.cy * d * tan);
  return { position, target: position.clone().addScaledVector(n, -d) };
}

/* Kaset etiketi: en fazla 2 satır, kelimeden böler; sığmayan ikinci satır … ile biter */
export function wrapTitle(text, maxChars) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const take = () => {
    let line = words.shift() ?? "";
    while (words.length && (line + " " + words[0]).length <= maxChars) line += " " + words.shift();
    return line;
  };
  const first = take();
  if (!words.length) return [first];
  let second = take();
  if (words.length) second = second.slice(0, maxChars - 1).trimEnd() + "…";
  return [first, second];
}
