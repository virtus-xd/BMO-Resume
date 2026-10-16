/* Beklenenlerin hepsi (fontlar, arka plan, 3D dünya) hazır olunca — en geç timeout ms — yükleme ekranını kapatır */
export async function runLoader({ el, barEl, timeout = 2500, waits = [] }) {
  barEl.style.transition = `width ${timeout}ms cubic-bezier(.2,.7,.3,1)`;
  barEl.style.width = "10%";
  void barEl.offsetWidth;
  barEl.style.width = "92%";
  const all = Promise.all(waits.map((w) => Promise.resolve(w).catch(() => {})));
  await Promise.race([all, new Promise((r) => setTimeout(r, timeout))]);
  barEl.style.transition = "width .2s"; barEl.style.width = "100%";
  el.classList.add("out");
  await new Promise((r) => setTimeout(r, 450));
  el.hidden = true;
}
