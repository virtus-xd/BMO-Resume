import { t, loc } from "../data/i18n.js";

/* Takma/çıkarma/ıskalama akışı. Tek `busy` kilidi ıskalamayı da kapsar.
   Durumlar: idle → inserting → loaded ↔ zoomed → ejecting → idle (ıskalama: idle → missing → idle).
   `anim` 3D koreografiyi (choreo3d), `screen` BMO ekranını yönetir; ikisi de Promise döner. */
export function createFlow({ anim, buttons, bus, state, screen }) {
  let phase = "idle";

  async function locked(next, fn) {
    if (state.busy) return false;
    state.busy = true;
    try {
      phase = next;
      await fn();
      return true;
    } finally {
      state.busy = false;
      phase = state.current ? (state.zoomed ? "zoomed" : "loaded") : "idle";
    }
  }

  async function takeOut(p, quick) {
    anim.notes?.(false);
    await anim.eject3D(p.id, { quick });
    state.current = null;
    buttons.setGone(p.id, false);
    bus.emit("face", { base: "idle" });
    bus.emit("tape:ejected", p);
  }

  function play(p, { fromDrag = false } = {}) {
    if (state.busy) return Promise.resolve(false);
    if (state.current?.id === p.id) return locked("zoomed", () => screen.open(p));
    return locked("inserting", async () => {
      if (state.current) {
        const old = state.current;
        await screen.close();
        phase = "ejecting";
        await takeOut(old, true);
        phase = "inserting";
      }
      buttons.setGone(p.id, true);
      bus.emit("reach", true);
      try {
        await anim.insert3D(p.id, { fromDrag });
      } finally {
        bus.emit("reach", false);
      }
      state.current = p;
      bus.emit("face", { base: "happy" });
      bus.emit("say", loc(state.lang, p.line));
      anim.notes?.(true);
      bus.emit("tape:loaded", p);
      await screen.open(p);
    });
  }

  /* Esc / dışarı tıklama: ekran kapanır, kaset BMO'da kalır */
  function close() {
    if (state.busy || !state.current) return Promise.resolve(false);
    return locked("loaded", () => screen.close());
  }

  /* ⏏: önce ekranı kapat, sonra kaset yuvadan fırlayıp yerine seker */
  function eject() {
    if (state.busy || !state.current) return Promise.resolve(false);
    return locked("ejecting", async () => {
      const p = state.current;
      await screen.close();
      await takeOut(p, false);
      bus.emit("say", t(state.lang, "ejected"));
      buttons.focus(p.id);
    });
  }

  function miss(p) {
    return locked("missing", async () => {
      bus.emit("sfx", "drop");
      await anim.miss3D(p.id);
      if (state.current?.id !== p.id) buttons.setGone(p.id, false);
      bus.emit("face", { flash: "sad", ms: 900 });
      bus.emit("say", t(state.lang, "miss"));
    });
  }

  return { play, close, eject, miss, isBusy: () => state.busy, get phase() { return phase; } };
}
