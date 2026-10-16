import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
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
import { createTapeButtons } from "./ui/tapeButtons.js";
import { createSpeech } from "./ui/speech.js";
import { initTopbar } from "./ui/topbar.js";
import { initListview } from "./ui/listview.js";
import { runLoader } from "./ui/loader.js";
import { createSfx } from "./audio/sfx.js";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- tercihler --- */
const forced = params.get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);
state.lang = pickLang(store.get("lang"), navigator.language);
state.sound = store.get("sound") === "on";
function applyLang() { document.documentElement.lang = state.lang; applyI18n(document, state.lang); }
applyLang();

/* --- sahne --- */
let world = null, tapeBtns = null;
initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; relayout(); } });
const background = initBackground({ dayEl: $("#bgDay"), nightEl: $("#bgNight"), state, bus, reduced });
if (!reduced) initParticles($("#particles"), state);

/* --- ses + konuşma --- */
let face = null;
const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"), anchorEl: $("#bmoHit"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face?.talk(on), isNarrow: () => state.narrow,
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on));
addEventListener("resize", () => speech.place());

/* --- BMO'ya ve kasetlere dokunma (3D takma akışı Görev 6'da) --- */
function giggle() {
  bus.emit("face", { flash: "giggle", ms: 900 });
  bus.emit("sfx", "giggle");
  bus.emit("say", line(state.lang, "click"));
}
$("#bmoHit").addEventListener("click", () => { if (!state.busy) giggle(); });

/* geniş düzende düğmeler 3D kasetlere, BMO'nun tıklama alanı BMO'ya oturur; dar düzende kasetler rafta */
function relayout() {
  if (!world) return;
  world.resize();
  world.tapes.forEach((tape) => { tape.group.visible = !state.narrow; });
  tapeBtns.layout();
  const r = world.bmoRect();
  Object.assign($("#bmoHit").style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
}

async function bootWorld() {
  if (!hasWebGL()) return null; // yedek yol Görev 9'da
  const { createWorld } = await import("./three/world.js");
  world = await createWorld({
    canvas: $("#world"), state, bus, reduced, projects: PROJECTS, lang: state.lang,
    calib: params.has("calib"), onCameraChange: () => { if (!state.narrow) relayout(); },
  });
  if (params.has("test")) window.__world = world;

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
  Object.entries(tapeBtns.buttons).forEach(([id, b]) => {
    const hover = (on) => () => world.tapes.get(id).setHover(on);
    b.addEventListener("pointerenter", hover(true)); b.addEventListener("pointerleave", hover(false));
    b.addEventListener("focus", hover(true)); b.addEventListener("blur", hover(false));
    b.addEventListener("click", () => { if (!state.busy) giggle(); });
  });
  relayout();
  return behavior;
}
const worldReady = bootWorld().catch((e) => { console.error("[world]", e); return null; });

/* --- üst çubuk, liste, dil --- */
const listview = initListview({ el: $("#listview"), state, bus, projects: PROJECTS, profile: PROFILE });
initTopbar({ state, bus, store, onList: () => listview.open() });
bus.on("lang:change", () => {
  applyLang();
  world?.tapes.forEach((tape) => tape.setLabel(state.lang));
  tapeBtns?.relabel(state.lang);
});

/* --- açılış --- */
runLoader({ el: $("#loader"), barEl: $("#loaderBar"), ready: Promise.all([document.fonts?.ready, background.ready, worldReady]) })
  .then(() => worldReady)
  .then((behavior) => {
    bus.emit("say", t(state.lang, "welcome"));
    behavior?.wave();
  });
