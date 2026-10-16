import { applySlice, nextSlice } from "../scene/daycycle.js";

const ICON = { morning: "🌅", noon: "☀", sunset: "🌇", night: "🌙" };

export function initTopbar({ state, bus, store, onList }) {
  const $ = (id) => document.getElementById(id);
  const btnLang = $("btnLang"), btnTime = $("btnTime"), btnSound = $("btnSound"), btnList = $("btnList");

  function paint() {
    btnLang.textContent = state.lang.toUpperCase();
    btnTime.textContent = ICON[state.slice];
    btnSound.textContent = state.sound ? "🔊" : "🔇";
    btnSound.setAttribute("aria-pressed", String(state.sound));
  }

  btnLang.addEventListener("click", () => {
    state.lang = state.lang === "tr" ? "en" : "tr";
    store.set("lang", state.lang);
    bus.emit("lang:change", state.lang);
    paint();
  });
  btnTime.addEventListener("click", () => {
    state.slice = nextSlice(state.slice);
    applySlice(document.documentElement, state.slice);
    bus.emit("slice:change", state.slice);
    paint();
  });
  btnSound.addEventListener("click", () => {
    state.sound = !state.sound;
    store.set("sound", state.sound ? "on" : "off");
    bus.emit("sound:change", state.sound);
    paint();
  });
  btnList.addEventListener("click", () => onList());

  paint();
  return { paint };
}
