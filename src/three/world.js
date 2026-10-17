import {
  Box3, DirectionalLight, GridHelper, HemisphereLight, Matrix4, Mesh, MeshBasicMaterial, Plane, PointLight, Quaternion,
  Raycaster, RingGeometry, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { CAMERA, BMO, TAPE_SLOTS, TAPE_SCALE, TAPE_LEAN, makeCamera, projectRect, zoomPose } from "./layout.js";
import { createBmo } from "./bmo.js";
import { createTape3D, tapeThumbnail, TAPE } from "./tapes.js";
import { W, H, visibleStageRect } from "../scene/stage.js";

/* gün dilimine göre ışık: gündüz sıcak beyaz + sağdaki pencereden güneş; gece mavi ortam + fener ışıkları */
const LIGHTS = {
  morning: { sky: 0xfff4e6, ground: 0x7a5434, hemi: 1.25, sun: 1.8, sunColor: 0xffe2b8, lamp: 0, label: 1 },
  noon: { sky: 0xf4f8ff, ground: 0x7a5434, hemi: 1.3, sun: 2.0, sunColor: 0xfff0d0, lamp: 0, label: 1 },
  sunset: { sky: 0xfff0e2, ground: 0x7a4a30, hemi: 1.25, sun: 1.7, sunColor: 0xffc898, lamp: 0.5, label: 0.95 },
  night: { sky: 0x6b7bd6, ground: 0x3a2414, hemi: 0.7, sun: 0.35, sunColor: 0x9fb4ff, lamp: 1.6, label: 0.72 },
};

export async function createWorld({ canvas, state, bus, reduced, projects, lang, calib = false, onCameraChange, fontsReady, view }) {
  /* etiketler ve yüz canvas'a çizilmeden önce yazı tipleri */
  await Promise.all([
    fontsReady, document.fonts?.load("62px 'Gochi Hand'"), document.fonts?.load("30px VT323"),
  ].map((p) => Promise.resolve(p).catch(() => {})));

  /* Çizim tamponu bağlam kurulmadan önce son boyutuna getirilir: kurulumdan sonraki ilk yeniden ayırma (setPixelRatio)
     gerçek GPU'da boyuttan bağımsız ~100 ms sürüyordu. three.js'e piksel oranı 1 verilir; tampon pikseli doğrudan yönetilir. */
  const region = () => {
    const r = view ? visibleStageRect(view, innerWidth, innerHeight) : { x: 0, y: 0, w: W, h: H };
    const pr = Math.min(devicePixelRatio * (view?.k || 1), 2, Math.sqrt(4e6 / (r.w * r.h)));
    return { ...r, bw: Math.max(1, Math.round(r.w * pr)), bh: Math.max(1, Math.round(r.h * pr)) };
  };
  const first = region();
  canvas.width = first.bw; canvas.height = first.bh;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true }); // bağlam kurulamazsa fırlatır → yedek
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = makeCamera(W / H);
  const target = new Vector3(...CAMERA.target);
  const base = new Vector3(...CAMERA.position);

  const hemi = new HemisphereLight(0xffffff, 0x000000, 1);
  const sun = new DirectionalLight(0xffffff, 1);
  sun.position.set(4.5, 4, 2);            // bg2: ışık sağdaki yuvarlak pencereden
  const lamps = [[-1.6, 2.6, -1.2], [1.3, 2.7, -1.6]].map((p) => {
    const l = new PointLight(0xffa040, 0, 9, 1);
    l.position.set(...p); scene.add(l);
    return l;
  });
  scene.add(hemi, sun);

  /* BMO */
  /* kurulum parça parça: her adım arasında ana iş parçacığına nefes (uzun görev/TBT olmasın) */
  const breathe = () => new Promise((r) => setTimeout(r, 0));
  await breathe();
  const bmo = createBmo();
  bmo.group.updateMatrixWorld(true);       // yerel kutu: dönüşümler uygulanmadan önce (gölgeler hariç)
  const bmoLocalBox = new Box3().setFromObject(bmo.group.getObjectByName("rig"), true);
  if (reduced) bmo.setStill(true); // hareketi azalt: nefes/sallanma yok
  bmo.group.position.set(...BMO.position);
  bmo.group.rotation.y = BMO.rotY;
  bmo.group.scale.setScalar(BMO.scale);
  scene.add(bmo.group);

  /* kasetler: proje sırası = yuva sırası */
  const tapes = new Map();
  for (const [i, p] of projects.slice(0, TAPE_SLOTS.length).entries()) {
    await breathe();
    const tape = createTape3D(p, lang);
    const s = TAPE_SLOTS[i];
    tape.group.position.set(...s.position);
    tape.group.rotation.set(TAPE_LEAN, s.rotY, 0, "YXZ");
    tape.group.scale.setScalar(TAPE_SCALE);
    tape.home = { position: tape.group.position.clone(), rotation: tape.group.rotation.clone() };
    scene.add(tape.group);
    tapes.set(p.id, tape);
  }

  if (calib) {
    const grid = new GridHelper(12, 24, 0xff3366, 0x33ffcc);
    grid.position.y = 0.001; scene.add(grid);
    const mark = (pos, color) => {
      const m = new Mesh(new RingGeometry(0.16, 0.2, 24), new MeshBasicMaterial({ color, depthTest: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(pos[0], 0.003, pos[2]); scene.add(m);
    };
    TAPE_SLOTS.forEach((s) => mark(s.position, 0xffee00));
    mark(BMO.position, 0xff00ff);
  }

  function setSlice(slice) {
    const L = LIGHTS[slice] || LIGHTS.noon;
    hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
    sun.color.set(L.sunColor); sun.intensity = L.sun;
    lamps.forEach((l) => { l.intensity = L.lamp; });
    tapes.forEach((t) => t.group.getObjectByName("label").material.color.setScalar(L.label));
  }
  setSlice(state.slice);
  bus.on("slice:change", setSlice);

  /* Yalnızca stage'in ekranda görünen kısmı çizilir: canvas o bölgeye oturur, kamera setViewOffset ile aynı bölgeyi
     çizer (telefonda stage'in ~%25'i görünür → ~4 kat az piksel). Çözünürlük: görüntülenen boyut × dpr, en fazla 2,
     toplam ≤ ~4 MP. Yansıtma hesapları ofsetsiz "tam kare" kamera kopyasıyla stage pikselinde kalır. */
  const projCam = makeCamera(W / H);
  const full = () => {
    projCam.position.copy(camera.position); projCam.quaternion.copy(camera.quaternion);
    projCam.updateMatrixWorld();
    return projCam;
  };
  function resize() {
    const r = region();
    /* konum transform ile (düzen kayması/CLS sayılmaz), boyut width/height ile */
    Object.assign(canvas.style, { transform: `translate(${r.x}px, ${r.y}px)`, width: r.w + "px", height: r.h + "px" });
    if (canvas.width !== r.bw || canvas.height !== r.bh) renderer.setSize(r.bw, r.bh, false); // yalnız değişince yeniden ayır
    camera.setViewOffset(W, H, r.x, r.y, r.w, r.h);
  }
  resize();

  /* kamera parallax'ı: fareyle hedef etrafında küçük yay; dar düzende, hareketi azalt'ta ve zoom'da yok */
  const par = { x: 0, y: 0 };
  let parDirty = false;
  const toX = gsap.quickTo(par, "x", { duration: 0.9, ease: "power3", onUpdate: () => { parDirty = true; } });
  const toY = gsap.quickTo(par, "y", { duration: 0.9, ease: "power3", onUpdate: () => { parDirty = true; } });
  if (!reduced) addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.zoomed || state.narrow) return;
    toX((e.clientX / innerWidth - 0.5) * 0.24);
    toY(-(e.clientY / innerHeight - 0.5) * 0.12);
  });
  function applyParallax() {
    parDirty = false;
    const right = new Vector3().subVectors(target, base).cross(camera.up).normalize();
    camera.position.copy(base).addScaledVector(right, par.x).addScaledVector(camera.up, par.y);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    onCameraChange?.();
  }
  function resetCamera() { par.x = par.y = 0; toX(0); toY(0); lookT.copy(target); applyParallax(); }

  /* BMO ekranına zoom: ekran görünür bölgeyi (NDC) fill oranında dolduracak kamera pozu; uçuş GSAP ile */
  const lookT = target.clone();
  let camTween = null;
  const homePose = () => ({ position: base.clone(), target: target.clone() });
  function screenPose(visible, fill) {
    bmo.setStill(true);
    return zoomPose(bmo.screenFrame(), camera.fov, camera.aspect, visible, fill);
  }
  function snapCamera(pose) {
    const to = pose || homePose();
    camTween?.kill(); camTween = null;
    camera.position.copy(to.position); lookT.copy(to.target);
    camera.lookAt(lookT); camera.updateMatrixWorld();
  }
  function flyCamera(pose, duration = 0.8, ease = "power2.inOut") {
    const to = pose || homePose();
    camTween?.kill();
    const p0 = camera.position.clone(), t0 = lookT.clone(), k = { t: 0 };
    return new Promise((resolve) => {
      camTween = gsap.to(k, {
        t: 1, duration, ease,
        onUpdate: () => {
          camera.position.lerpVectors(p0, to.position, k.t);
          lookT.lerpVectors(t0, to.target, k.t);
          camera.lookAt(lookT); camera.updateMatrixWorld();
        },
        onComplete: () => { camTween = null; resolve(); },
        onInterrupt: resolve,
      });
    });
  }

  /* yansıtma yardımcıları (stage pikseli) */
  const boxCorners = (box) => {
    const out = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) out.push(new Vector3(x, y, z));
    return out;
  };
  const corners = (obj, box) => { obj.updateWorldMatrix(true, false); return boxCorners(box).map((v) => obj.localToWorld(v)); };
  /* kaset kutusu ev konumundan: kaset uçarken/sürüklenirken düğme yerinde kalır */
  const tapeCorners = boxCorners(new Box3(new Vector3(-TAPE.w / 2, 0, -TAPE.d / 2), new Vector3(TAPE.w / 2, TAPE.h, TAPE.d / 2)));
  const homeM = new Matrix4();
  function rectOf(id) {
    const t = tapes.get(id);
    homeM.compose(t.home.position, new Quaternion().setFromEuler(t.home.rotation), t.group.scale);
    return projectRect(full(), tapeCorners.map((c) => c.clone().applyMatrix4(homeM)));
  }
  const bmoRect = () => projectRect(full(), corners(bmo.group, bmoLocalBox));
  /* kasetin şu anki yeri (istemci px): telefonda rafa uçuş buradan başlar */
  function liveRect(id) {
    const g = tapes.get(id).group;
    g.updateWorldMatrix(true, false);
    return toClient(projectRect(full(), tapeCorners.map((c) => g.localToWorld(c.clone()))));
  }
  function toClient(r) {
    const c = canvas.parentElement.getBoundingClientRect(), k = c.width / W; // stage
    return { left: c.left + r.left * k, top: c.top + r.top * k, width: r.width * k, height: r.height * k, right: c.left + (r.left + r.width) * k, bottom: c.top + (r.top + r.height) * k };
  }
  const screenClientRect = () => toClient(projectRect(full(), bmo.screenCorners()));
  const keyRect = (name) => projectRect(full(), bmo.keyCorners(name)); // BMO tuşu (stage pikseli, bmoRect gibi)

  /* imleç → ışın */
  const ray = new Raycaster(), ndc = new Vector2();
  function aim(clientX, clientY) {
    const c = canvas.getBoundingClientRect();
    ndc.set(((clientX - c.left) / c.width) * 2 - 1, -(((clientY - c.top) / c.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return ray;
  }
  function pick(clientX, clientY) {
    const hits = aim(clientX, clientY).intersectObjects([...tapes.values()].map((t) => t.group), true);
    for (const h of hits) {
      let o = h.object;
      while (o && o.name !== "tape") o = o.parent;
      if (o?.visible) return o.userData.id;
    }
    return null;
  }
  /* imlecin altındaki y yüksekliğindeki yatay düzlem noktası; ufka bakan ışınlar sahnenin içine (R=4) kırpılır */
  function floorPoint(clientX, clientY, y = 0) {
    const r = aim(clientX, clientY).ray;
    const p = r.intersectPlane(new Plane(new Vector3(0, 1, 0), -y), new Vector3()) || r.at(8, new Vector3());
    p.y = y;
    const dx = p.x - target.x, dz = p.z - target.z, d = Math.hypot(dx, dz), R = 4;
    if (d > R) { p.x = target.x + (dx / d) * R; p.z = target.z + (dz / d) * R; }
    return p;
  }

  /* döngü */
  let drawn = 0, warmed;
  const warm = new Promise((r) => { warmed = r; });
  function frame(t) {
    if (document.hidden) return;
    if (drawn < 3 && ++drawn === 3) warmed();
    if (parDirty && !state.zoomed && !camTween) applyParallax(); // kamera uçarken parallax karışmaz
    bmo.tick(t);
    renderer.render(scene, camera);
  }
  /* shader'lar yükleme ekranı sürerken derlensin: ilk karede ana iş parçacığı takılmasın */
  await breathe();
  /* paralel derleme yoksa (ör. yazılım GPU) ön derleme atlanır: ilk kare derler */
  if (renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera).catch(() => {});
  await breathe();
  renderer.setAnimationLoop(frame);
  function pause(on) { renderer.setAnimationLoop(on ? null : frame); }
  const render = () => renderer.render(scene, camera);

  /* raf küçük resimleri: sahne birkaç kare çizdikten sonra (dokular yüklü), boşta ve tek tek — açılışta uzun görev olmasın */
  const thumbs = new Map();
  let thumbChain = Promise.resolve();
  const idle = () => new Promise((r) => (window.requestIdleCallback || ((f) => setTimeout(f, 30)))(() => r(), { timeout: 600 }));
  function thumbOf(id) {
    const key = id + ":" + tapes.get(id).group.getObjectByName("label").userData.lines.join("|");
    if (!thumbs.has(key)) {
      thumbChain = thumbChain.then(() => warm).then(idle).then(() => tapeThumbnail(renderer, tapes.get(id), Math.round(160 * Math.min(devicePixelRatio, 2)))).catch(() => null);
      thumbs.set(key, thumbChain);
    }
    return thumbs.get(key);
  }

  return {
    bmo, tapes, camera, scene, renderer, target,
    rectOf, liveRect, bmoRect, screenClientRect, keyRect, toClient, setSlice, pause, render, resize, resetCamera, pick, floorPoint, thumbOf,
    screenPose, flyCamera, snapCamera,
  };
}
