import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { bus, state, store } from "./state.js";
import { PROJECTS, assignSlots } from "./data/projects.js";
import { PROFILE } from "./data/profile.js";
import { t, line, pickLang, applyI18n } from "./data/i18n.js";
import { initStage, NARROW_QUERY } from "./scene/stage.js";
import { SKY_SVG, WALL_SVG, ROOM_SVG, FRONT_SVG, SLOTS } from "./scene/room.svg.js";
import { initParallax } from "./scene/parallax.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";
import { initParticles } from "./scene/particles.js";
import { BMO_SVG } from "./bmo/bmo.svg.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
import { createTapes, placeTapes, bindDrag, relabelTapes } from "./tapes/tape.js";
import { insertTape, ejectTape, missTape } from "./tapes/choreo.js";
import { createSpeech } from "./ui/speech.js";
import { createScreen } from "./ui/screen.js";
import { initTopbar } from "./ui/topbar.js";
import { initListview } from "./ui/listview.js";
import { runLoader } from "./ui/loader.js";
import { createSfx } from "./audio/sfx.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- tercihler --- */
const forced = new URLSearchParams(location.search).get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);
state.lang = pickLang(store.get("lang"), navigator.language);
state.sound = store.get("sound") === "on";
function applyLang() { document.documentElement.lang = state.lang; applyI18n(document, state.lang); }
applyLang();

/* --- sahne (DOM sırası = Tab sırası: kasetler → BMO → nesneler) --- */
$("#l0").innerHTML = SKY_SVG;
$("#l1").innerHTML = WALL_SVG;
$("#l2").innerHTML = `<div class="tapes" id="tapes"></div><div class="bmo" id="bmo">${BMO_SVG}</div>` + ROOM_SVG +
  `<div class="beam"></div><canvas class="particles" id="particles"></canvas>`;
$("#l3").innerHTML = FRONT_SVG;

const view = initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; } });
const parallax = reduced ? null : initParallax([...document.querySelectorAll(".layer")], state);
if (!reduced) initParticles($("#particles"), state);

/* --- BMO --- */
const faceEl = $("#bmo-face");
const face = createFace(faceEl);
face.setBase("idle");
const bmo = initBehavior({ bmoEl: $("#bmo"), faceEl, face, bus, state, reduced });

/* --- ses + konuşma --- */
const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"), anchorEl: $("#bmo"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face.talk(on), isNarrow: () => state.narrow,
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on));

/* --- kasetler --- */
const { placed } = assignSlots(PROJECTS, SLOTS);
const shelf = placed.map((e) => e.project);
const tapes = createTapes(shelf, state.lang);
function layoutTapes() {
  placeTapes({ tapes, placed, sceneHost: $("#tapes"), trayHost: $("#tray"), narrow: state.narrow, currentId: state.current?.id ?? null });
}
layoutTapes();

/* --- BMO ekranı --- */
const screen = createScreen({ cameraEl: $("#camera"), uiEl: $("#screenUi"), backdropEl: $("#screenBackdrop"), view, state, bus, reduced, parallax, projects: PROJECTS });
addEventListener("resize", () => { speech.place(); screen.relayout(); });
matchMedia(NARROW_QUERY).addEventListener("change", layoutTapes);

/* --- akış: busy kilidi yalnızca burada --- */
const choreo = { tapes, bus, state, reduced, stageEl: $("#l2") };

async function play(p, ghost) {
  if (state.busy) {
    ghost?.remove();
    if (state.current?.id !== p.id) tapes[p.id].classList.remove("gone");
    return;
  }
  state.busy = true;
  try {
    if (state.current?.id === p.id) { ghost?.remove(); tapes[p.id].classList.add("gone"); await screen.open(p); return; }
    if (state.current) { await screen.close(); await ejectTape(state.current, choreo, { quick: true }); }
    await insertTape(p, ghost, choreo);
    await screen.open(p);
  } finally { state.busy = false; }
}

async function eject() {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const p = state.current;
    await screen.close();
    await ejectTape(p, choreo);
    bus.emit("say", t(state.lang, "ejected"));
    tapes[p.id].focus({ preventScroll: true });
  } finally { state.busy = false; }
}

function miss(p, ghost) { missTape(p, ghost, choreo); }

bus.on("screen:closed", eject);
bus.on("tape:loaded", (p) => sfx.startLoop(p.id));
bus.on("tape:ejected", () => sfx.stopLoop());

function overBmo(x, y) {
  const r = $("#bmo-slot").getBoundingClientRect();
  return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 220 * view.k;
}
const handlers = {
  isBusy: () => state.busy,
  overBmo,
  onReach: (on) => bus.emit("reach", on),
  onInsert: (p, ghost) => play(p, ghost),
  onMiss: (p, ghost) => miss(p, ghost),
};
shelf.forEach((p) => bindDrag(tapes[p.id], p, handlers));
document.addEventListener("tape:pick", () => bus.emit("sfx", "pick"));

/* BMO'ya tıklama: kaset takılıysa ekranı yeniden açar, değilse kıkırdar */
$("#bmo").addEventListener("click", () => {
  if (state.busy) return;
  if (state.current) { play(state.current, null); return; }
  bus.emit("face", { flash: "giggle", ms: 900 });
  bus.emit("sfx", "giggle");
  bus.emit("say", line(state.lang, "click"));
});

/* --- üst çubuk, liste, dil --- */
const listview = initListview({ el: $("#listview"), state, bus, projects: PROJECTS, profile: PROFILE });
initTopbar({ state, bus, store, onList: () => listview.open() });
bus.on("lang:change", () => { applyLang(); relabelTapes(tapes, shelf, state.lang); screen.rerender(); });

/* --- açılış --- */
runLoader({ el: $("#loader"), barEl: $("#loaderBar") }).then(() => {
  bus.emit("say", t(state.lang, "welcome"));
  bmo.wave();
});
