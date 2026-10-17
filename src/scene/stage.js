/* Sahne 1920×1080 tasarım ölçeğinde çizilir ve ekranı "cover" ile doldurur. */
export const W = 1920, H = 1080;
export const NARROW_QUERY = "(max-width: 700px), (orientation: portrait)";
/* 3D BMO'nun yansıtılmış merkezi (stage px; layout.js'teki BMO/CAMERA ile birlikte değişir) */
export const BMO_CENTER_Y = 673;

export function coverScale(vw, vh, narrow) {
  return Math.max(vw / W, vh / H) * (narrow ? 1.3 : 1.04);
}

/* dar düzende BMO'yu ekranın üst %45'ine taşır (alttaki kaset rafına yer açar) */
export function stageOffsetY(vh, k, narrow) {
  return narrow ? 0.45 * vh - vh / 2 - (BMO_CENTER_Y - H / 2) * k : 0;
}

/* Stage'in ekranda kırpılmadan görünen kısmı, stage pikselinde (tam sayıya genişletilmiş kutu) */
export function visibleStageRect(view, vw, vh, { top = 0, bottom = 0 } = {}) {
  const sx = (px) => W / 2 + (px - vw / 2) / view.k;
  const sy = (py) => H / 2 + (py - vh / 2 - view.oy) / view.k;
  const x0 = Math.max(0, Math.floor(sx(0))), x1 = Math.min(W, Math.ceil(sx(vw)));
  const y0 = Math.max(0, Math.floor(sy(top))), y1 = Math.min(H, Math.ceil(sy(vh - bottom)));
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
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
