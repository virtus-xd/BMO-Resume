import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { gsap } from "gsap";
import { bus, state, store } from "./state.js";
import { PROJECTS } from "./data/projects.js";
import { PROFILE } from "./data/profile.js";
import { t, line, pickLang, applyI18n } from "./data/i18n.js";
import { initStage } from "./scene/stage.js";
import { initBackground } from "./scene/background.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";
import { initParticles } from "./scene/particles.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
import { hasWebGL } from "./three/webgl.js";
import { createTapeButtons, bindDrag } from "./ui/tapeButtons.js";
import { createFlow } from "./ui/flow.js";
import { createScreen } from "./ui/screen.js";
import { createSpeech } from "./ui/speech.js";
import { initTopbar } from "./ui/topbar.js";
import { initListview } from "./ui/listview.js";
import { runLoader } from "./ui/loader.js";
import { createSfx } from "./audio/sfx.js";

const $ = (s) => document.querySelector(s);

/* Kilidi tutan animasyonlar (takma, zoom, kamera dönüşü) yavaş cihazda da gerçek sürede bitsin:
   GSAP'ın lag smoothing'i 500 ms'den uzun karelerde zamanı yavaşlatıp akışı saniyelerce kilitliyordu. */
gsap.ticker.lagSmoothing(0);
const params = new URLSearchParams(location.search);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- tercihler --- */
const forced = params.get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);
state.lang = pickLang(store.get("lang"), navigator.language);
state.sound = store.get("sound") === "on";
function applyLang() {
  document.documentElement.lang = state.lang;
  document.title = t(state.lang, "doc_title");
  applyI18n(document, state.lang);
}
applyLang();

/* fontlar: Google Fonts CSS'i (preload → stylesheet) uygulanınca üç yazı tipini açıkça yükle */
const FONTS = ['1em "Gochi Hand"', "1em VT323", '700 1em Nunito'];
const fontCss = new Promise((resolve) => {
  const link = document.querySelector('link[href*="fonts.googleapis.com/css"]');
  if (!link || link.sheet) { resolve(); return; }
  link.addEventListener("load", () => requestAnimationFrame(() => resolve()), { once: true });
  link.addEventListener("error", () => resolve(), { once: true });
}).then(() => Promise.all(FONTS.map((f) => document.fonts?.load(f))));
/* yazı tipi gelmese de sahne en geç 2,5 sn'de kurulur (etiketler gelince yeniden çizilir) */
const fontsReady = Promise.race([fontCss, new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

/* --- sahne --- */
let world = null, tapeBtns = null, flow = null;
const view = initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; relayout(); } });
const background = initBackground({ dayEl: $("#bgDay"), nightEl: $("#bgNight"), state, bus, reduced });
if (!reduced) initParticles($("#particles"), state);

/* --- ses + konuşma --- */
let face = null;
const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face?.talk(on),
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on, state.current?.id));
/* AudioContext yalnızca kullanıcı etkileşiminde kurulur */
const unlock = () => sfx.unlock();
addEventListener("pointerdown", unlock, { once: true, capture: true });
addEventListener("keydown", unlock, { once: true, capture: true });

let screen = null;
const byId = (id) => PROJECTS.find((p) => p.id === id);

/* BMO'ya tıklama: kaset takılıysa ekranı yeniden açar, değilse kıkırdar */
$("#bmoHit").addEventListener("click", () => {
  if (state.busy) return;
  if (state.current) { flow?.play(state.current); return; }
  bus.emit("face", { flash: "giggle", ms: 900 });
  bus.emit("sfx", "giggle");
  bus.emit("say", line(state.lang, "click"));
});

/* geniş düzende düğmeler 3D kasetlere, BMO'nun tıklama alanı BMO'ya oturur; dar düzende kasetler rafta */
function relayout() {
  if (!world) return;
  world.resize();
  world.tapes.forEach((tape, id) => { if (state.current?.id !== id && !state.busy) tape.group.visible = !state.narrow; });
  if (state.zoomed) { screen?.relayout(); return; } // zoomdayken kamera ekranda: düğmeler gizli, ekran yeniden hizalanır
  tapeBtns.layout();
  const r = world.bmoRect();
  Object.assign($("#bmoHit").style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
}

/* WebGL yoksa ya da bağlam kaybolursa: sahne bırakılır, Liste notla açılır */
let fellBack = false;
function fallback() {
  if (fellBack) return;
  fellBack = true;
  world?.pause(true);
  document.body.classList.add("no3d");
  listview.setNo3d(true);
}

async function bootWorld() {
  if (!hasWebGL()) { fallback(); return null; }
  const [{ createWorld }, { createChoreo }] = await Promise.all([import("./three/world.js"), import("./three/choreo3d.js")]);
  $("#world").addEventListener("webglcontextlost", fallback);
  world = await createWorld({
    canvas: $("#world"), state, bus, reduced, projects: PROJECTS, lang: state.lang, fontsReady,
    calib: params.has("calib"), onCameraChange: () => { if (!state.narrow) relayout(); },
  });
  if (params.has("test")) Object.assign(window, { __world: world, __state: state });

  face = createFace((n) => world.bmo.setFace(n));
  face.setBase("idle");
  const behavior = initBehavior({
    bmo: world.bmo, face, bus, state, reduced,
    screenCenter: () => { const r = world.screenClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; },
  });

  tapeBtns = createTapeButtons({
    host: $("#tapeBtns"), trayHost: $("#tray"), projects: PROJECTS.slice(0, world.tapes.size), lang: state.lang,
    rectOf: world.rectOf, narrow: () => state.narrow, thumbOf: world.thumbOf,
  });
  const choreo = createChoreo({ world, bus, state, reduced, notesHost: $("#stage") });
  screen = createScreen({
    uiEl: $("#screenUi"), backdropEl: $("#screenBackdrop"), world, view, state, bus, reduced, projects: PROJECTS,
    bgEls: [$("#bgDay"), $("#bgNight")],
    insets: () => ({ top: $("#topbar").getBoundingClientRect().bottom, bottom: state.narrow ? innerHeight - $("#tray").getBoundingClientRect().top : 0 }),
  });
  flow = createFlow({ anim: choreo, buttons: tapeBtns, bus, state, screen });
  const hideHint = () => { $("#speechHint").hidden = true; };
  Object.entries(tapeBtns.buttons).forEach(([id, b]) => {
    const hover = (on) => () => world.tapes.get(id).setHover(on);
    b.addEventListener("pointerenter", hover(true)); b.addEventListener("pointerleave", hover(false));
    b.addEventListener("focus", hover(true)); b.addEventListener("blur", hover(false));
    /* ıskalama/takma kilitliyse kaset kilitsiz yerine döner */
    const orHome = (ok) => { if (!ok) { choreo.snapHome(id); if (state.current?.id !== id) tapeBtns.setGone(id, false); } };
    bindDrag(b, id, {
      isBusy: () => state.busy,
      onTap: () => flow.play(byId(id)),
      onPick: (_, x, y) => { hideHint(); tapeBtns.setGone(id, true); world.tapes.get(id).setHover(false); bus.emit("sfx", "pick"); choreo.pick(id, x, y); },
      onDrag: (_, x, y, vx) => choreo.moveTo(id, x, y, vx),
      onReach: (on) => bus.emit("reach", on),
      onDrop: (_, x, y) => (choreo.release(id, x, y) ? flow.play(byId(id), { fromDrag: true }) : flow.miss(byId(id))).then(orHome),
      onCancel: () => { choreo.release(id, 0, 0); flow.miss(byId(id)).then(orHome); },
    });
  });
  relayout();
  /* yazı tipi geç gelirse kaset etiketleri yeniden çizilir */
  document.fonts?.addEventListener?.("loadingdone", () => {
    world.tapes.forEach((tape) => tape.setLabel(state.lang));
    if (state.narrow) tapeBtns.relabel(state.lang);
  });
  return behavior;
}

/* Esc / dışarı tıklama: ekran kapanır, kaset BMO'da kalır (odak BMO'ya). ⏏: kaset çıkar. */
bus.on("screen:close", () => flow?.close().then((ok) => { if (ok) $("#bmoHit").focus({ preventScroll: true }); }));
bus.on("screen:eject", () => flow?.eject());
bus.on("tape:loaded", (p) => sfx.startLoop(p.id));
bus.on("tape:ejected", () => sfx.stopLoop());

/* --- üst çubuk, liste, dil --- */
const listview = initListview({ el: $("#listview"), state, bus, projects: PROJECTS, profile: PROFILE });
initTopbar({ state, bus, store, onList: () => listview.open() });
/* Liste açıkken 3D döngü ve parçacıklar durur, boşta replikler susar (state.listOpen) */
bus.on("list:toggle", (open) => { if (!fellBack) world?.pause(open); });
const worldReady = bootWorld().catch((e) => { console.error("[world]", e); fallback(); return null; });
bus.on("lang:change", () => {
  applyLang();
  world?.tapes.forEach((tape) => tape.setLabel(state.lang));
  tapeBtns?.relabel(state.lang);
  screen?.rerender();
});

/* --- açılış --- */
runLoader({ el: $("#loader"), barEl: $("#loaderBar"), waits: [fontsReady, background.ready, worldReady] })
  .then(() => worldReady)
  .then((behavior) => {
    if (!behavior) return;
    bus.emit("say", t(state.lang, "welcome"));
    behavior.wave();
  });
