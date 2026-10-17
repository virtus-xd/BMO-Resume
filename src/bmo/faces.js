export const FACE_NAMES = ["idle", "blink", "hungry", "talkA", "talkB", "happy", "sad", "giggle", "loading"];

/* Yüz önceliği: flash > konuşma > temel. Çizimi `draw(name)` yapar (3D BMO ekran canvas'ı); aynı yüz yeniden çizilmez. */
export function createFace(draw) {
  let base = "idle", flashName = null, talking = false, mouthOpen = false;
  let flashT = 0, talkT = 0, shown = null;
  const current = () => flashName || (talking ? (mouthOpen ? "talkA" : "talkB") : base);
  const render = () => { const n = current(); if (n !== shown) { shown = n; draw(n); } };
  return {
    setBase(name) { base = name; render(); },
    flash(name, ms = 600) {
      flashName = name; render();
      clearTimeout(flashT);
      flashT = setTimeout(() => { flashName = null; render(); }, ms);
    },
    talk(on) {
      talking = on; mouthOpen = on; clearInterval(talkT);
      if (on) talkT = setInterval(() => { mouthOpen = !mouthOpen; render(); }, 110);
      render();
    },
    get current() { return current(); },
  };
}
