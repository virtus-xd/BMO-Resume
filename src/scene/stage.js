/* Sahne 1920×1080 tasarım ölçeğinde çizilir ve ekranı "cover" ile doldurur. */
export const W = 1920, H = 1080;
export const NARROW_QUERY = "(max-width: 700px), (orientation: portrait)";
const BMO_CENTER_Y = 770;

export function coverScale(vw, vh, narrow) {
  return Math.max(vw / W, vh / H) * (narrow ? 1.3 : 1.04);
}

/* dar düzende BMO'yu ekranın üst %45'ine taşır (alttaki kaset rafına yer açar) */
export function stageOffsetY(vh, k, narrow) {
  return narrow ? 0.45 * vh - vh / 2 - (BMO_CENTER_Y - H / 2) * k : 0;
}

export function initStage(stageEl, { onLayout } = {}) {
  const mq = matchMedia(NARROW_QUERY);
  const view = { k: 1, oy: 0, narrow: mq.matches };
  function fit() {
    view.narrow = mq.matches;
    view.k = coverScale(innerWidth, innerHeight, view.narrow);
    view.oy = stageOffsetY(innerHeight, view.k, view.narrow);
    stageEl.style.transform = `translate(-50%, calc(-50% + ${view.oy}px)) scale(${view.k})`;
    onLayout?.(view);
  }
  addEventListener("resize", fit);
  mq.addEventListener("change", fit);
  fit();
  return view;
}
