import { applySlice, nextSlice } from "../scene/daycycle.js";

/* Ses, gün saati, dil ve liste: BMO'nun 3D tuşları, BMO ekranındaki simgeler ve yedek liste aynı işlemleri kullanır */
export function createControls({ state, bus, store, onList }) {
  const actions = {
    sound() {
      state.sound = !state.sound;
      store.set("sound", state.sound ? "on" : "off");
      bus.emit("sound:change", state.sound);
    },
    time() {
      state.slice = nextSlice(state.slice);
      applySlice(document.documentElement, state.slice);
      bus.emit("slice:change", state.slice);
    },
    lang() {
      state.lang = state.lang === "tr" ? "en" : "tr";
      store.set("lang", state.lang);
      bus.emit("lang:change", state.lang);
    },
    list() { onList(); },
  };
  return { run: (name) => actions[name]?.() };
}
