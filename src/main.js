import "./styles/tokens.css";
import "./styles/scene.css";
import "./styles/ui.css";
import "./styles/screen.css";
import "./styles/listview.css";
import { bus, state } from "./state.js";
import { initStage } from "./scene/stage.js";
import { SKY_SVG, WALL_SVG, ROOM_SVG, FRONT_SVG } from "./scene/room.svg.js";
import { initParallax } from "./scene/parallax.js";
import { SLICES, sliceForHour, applySlice } from "./scene/daycycle.js";
import { BMO_SVG } from "./bmo/bmo.svg.js";
import { createFace } from "./bmo/faces.js";
import { initBehavior } from "./bmo/behavior.js";
import { initParticles } from "./scene/particles.js";

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

export { view, face, bmo };
