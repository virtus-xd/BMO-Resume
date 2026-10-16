import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { bus, state, store } from "./state.js";
import { initStage } from "./scene/stage.js";
import { SKY_SVG, WALL_SVG, ROOM_SVG, FRONT_SVG } from "./scene/room.svg.js";
import { initParallax } from "./scene/parallax.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";
import { BMO_SVG } from "./bmo/bmo.svg.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
import { initParticles } from "./scene/particles.js";
import { createSpeech } from "./ui/speech.js";
import { createSfx } from "./audio/sfx.js";
import { t, pickLang, applyI18n } from "./data/i18n.js";
import { PROJECTS, assignSlots } from "./data/projects.js";
import { SLOTS } from "./scene/room.svg.js";
import { createTapes, placeTapes, bindDrag } from "./tapes/tape.js";
import { insertTape, ejectTape, missTape } from "./tapes/choreo.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* gün dilimi: ?t=night gibi parametre önceliklidir */
const forced = new URLSearchParams(location.search).get("t");
state.slice = SLICES.includes(forced) ? forced : sliceForHour(new Date().getHours());
applySlice(document.documentElement, state.slice);

/* katmanlar (DOM sırası = Tab sırası: kasetler → nesneler) */
$("#l0").innerHTML = SKY_SVG;
$("#l1").innerHTML = WALL_SVG;
$("#l2").innerHTML = `<div class="tapes" id="tapes"></div><div class="bmo" id="bmo">${BMO_SVG}</div>` + ROOM_SVG + `<div class="beam"></div><canvas class="particles" id="particles"></canvas>`;
$("#l3").innerHTML = FRONT_SVG;

const view = initStage($("#stage"), { onLayout: (v) => { state.narrow = v.narrow; } });
if (!reduced) initParallax([...document.querySelectorAll(".layer")], state);

const faceEl = $("#bmo-face");
const face = createFace(faceEl);
face.setBase("idle");
const bmo = initBehavior({ bmoEl: $("#bmo"), faceEl, face, bus, state, reduced });
if (!reduced) initParticles($("#particles"), state);

/* dil + ses tercihleri */
state.lang = pickLang(store.get("lang"), navigator.language);
document.documentElement.lang = state.lang;
applyI18n(document, state.lang);
state.sound = store.get("sound") === "on";

const sfx = createSfx();
sfx.setEnabled(state.sound);
const speech = createSpeech({
  bubbleEl: $("#speech"), textEl: $("#speechText"), liveEl: $("#live"), anchorEl: $("#bmo"),
  onBlip: () => sfx.play("blip"), onTalk: (on) => face.talk(on), isNarrow: () => state.narrow,
});
bus.on("say", (text) => speech.say(text));
bus.on("sfx", (name) => sfx.play(name));
bus.on("sound:change", (on) => sfx.setEnabled(on));
addEventListener("resize", () => speech.place());

/* kasetler */
const { placed } = assignSlots(PROJECTS, SLOTS);
const tapes = createTapes(placed.map((e) => e.project), state.lang);
function layoutTapes() {
  placeTapes({ tapes, placed, sceneHost: $("#tapes"), trayHost: $("#tray"), narrow: state.narrow, currentId: state.current?.id ?? null });
}
layoutTapes();
matchMedia("(max-width: 700px), (orientation: portrait)").addEventListener("change", layoutTapes);

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
placed.forEach(({ project }) => bindDrag(tapes[project.id], project, handlers));
document.addEventListener("tape:pick", () => bus.emit("sfx", "pick"));

/* --- akış: busy kilidi yalnızca burada --- */
const choreo = { tapes, bus, state, reduced, stageEl: $("#l2") };

async function play(p, ghost) {
  if (state.busy) { ghost?.remove(); return; }
  if (state.current?.id === p.id) { ghost?.remove(); tapes[p.id].classList.add("gone"); return; }
  state.busy = true;
  try {
    if (state.current) await ejectTape(state.current, choreo, { quick: true });
    await insertTape(p, ghost, choreo);
  } finally { state.busy = false; }
}

async function eject() {
  if (state.busy || !state.current) return;
  state.busy = true;
  try {
    const p = state.current;
    await ejectTape(p, choreo);
    bus.emit("say", t(state.lang, "ejected"));
    tapes[p.id].focus({ preventScroll: true });
  } finally { state.busy = false; }
}

function miss(p, ghost) { missTape(p, ghost, choreo); }

bus.on("tape:loaded", (p) => sfx.startLoop(p.id));
bus.on("tape:ejected", () => sfx.stopLoop());

/* Görev 10'da BMO ekranındaki ⏏ düğmesiyle değişecek geçici çıkarma kısayolu */
addEventListener("keydown", (e) => { if (e.key === "Escape") eject(); });

bus.emit("say", t(state.lang, "welcome"));

export { view, face, bmo };
