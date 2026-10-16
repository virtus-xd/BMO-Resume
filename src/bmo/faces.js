/* Ekran yerel koordinatları: ekran dikdörtgeni x 44–244, y 36–182; merkez (144,109) */
const EYES = `<g class="eyes"><circle class="f" cx="108" cy="100" r="8"/><circle class="f" cx="180" cy="100" r="8"/></g>`;
const SMILE = `<path class="fs" d="M126 128q18 16 36 0"/>`;
const OPEN_SMILE = `<path class="f" d="M120 124h48q-4 26-24 26t-24-26Z"/>`;

export const FACES = {
  idle: EYES + SMILE,
  blink: `<path class="fs" d="M98 100h20M170 100h20"/>` + SMILE,
  hungry: `<g class="eyes"><circle class="f" cx="108" cy="98" r="12"/><circle class="f" cx="180" cy="98" r="12"/><circle class="shine" cx="112" cy="94" r="4"/><circle class="shine" cx="184" cy="94" r="4"/></g><ellipse class="f" cx="144" cy="138" rx="12" ry="14"/>`,
  talkA: EYES + `<path class="f" d="M126 126h36q-3 20-18 20t-18-20Z"/>`,
  talkB: EYES + `<path class="fs" d="M132 132h24"/>`,
  happy: `<path class="fs" d="M96 104l12-12 12 12M168 104l12-12 12 12"/>` + OPEN_SMILE,
  sad: EYES + `<path class="fs" d="M128 140q16-14 32 0"/>`,
  giggle: `<path class="fs" d="M96 96l14 9-14 9M192 96l-14 9 14 9"/>` + OPEN_SMILE + `<ellipse class="blush" cx="86" cy="130" rx="12" ry="7"/><ellipse class="blush" cx="202" cy="130" rx="12" ry="7"/>`,
  loading: `<text class="f mono" x="144" y="100" text-anchor="middle">LOADING</text><rect class="fs" x="84" y="116" width="120" height="16"/><rect id="bmo-load-bar" class="f" x="88" y="120" width="0" height="8"/>`,
};

export function createFace(el, faces = FACES) {
  let base = "idle", flashName = null, talking = false, mouthOpen = false;
  let flashT = 0, talkT = 0, shown = null;
  const current = () => flashName || (talking ? (mouthOpen ? "talkA" : "talkB") : base);
  const render = () => { const n = current(); if (n !== shown) { el.innerHTML = faces[n]; shown = n; } };
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
