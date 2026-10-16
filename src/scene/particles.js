/* Gündüz: havada toz. Gece: ateş böcekleri. Konumlar görselden bağımsız, sahnenin orta bandında. Tek canvas, sahne ölçeğinde. */
const DPR = 2;
const BAND = { x0: 240, x1: 1680, y0: 300, y1: 1000 };

export function inBand(x, y) {
  return x >= BAND.x0 && x <= BAND.x1 && y >= BAND.y0 && y <= BAND.y1;
}

export function initParticles(canvas, state) {
  canvas.width = 1920 * DPR; canvas.height = 1080 * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const inside = () => ({ x: rnd(BAND.x0, BAND.x1), y: rnd(BAND.y0, BAND.y1) });
  const dust = Array.from({ length: 70 }, () => ({ ...inside(), r: rnd(0.8, 2.2), vx: rnd(-0.05, 0.12), vy: rnd(-0.06, 0.06), ph: rnd(0, 6) }));
  const flies = Array.from({ length: 24 }, () => ({ ...inside(), a: rnd(0, 6.28), sp: rnd(0.25, 0.6), ph: rnd(0, 6) }));

  function drawDust(t) {
    ctx.fillStyle = "#fff2c8";
    for (const p of dust) {
      p.x += p.vx + Math.sin(t / 2000 + p.ph) * 0.06;
      p.y += p.vy + Math.cos(t / 2500 + p.ph) * 0.05;
      if (!inBand(p.x, p.y)) Object.assign(p, inside());
      ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(t / 900 + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  }
  function drawFlies(t) {
    for (const f of flies) {
      f.a += Math.sin(t / 1500 + f.ph) * 0.03;
      f.x += Math.cos(f.a) * f.sp; f.y += Math.sin(f.a) * f.sp * 0.6;
      if (f.x < BAND.x0 || f.x > BAND.x1) f.a = Math.PI - f.a;
      if (f.y < BAND.y0 || f.y > BAND.y1) f.a = -f.a;
      const glow = Math.max(0, Math.sin(t / 700 + f.ph));
      ctx.globalAlpha = 0.25 + 0.75 * glow;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14);
      g.addColorStop(0, "rgba(230,255,140,1)"); g.addColorStop(1, "rgba(230,255,140,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 14, 0, 7); ctx.fill();
    }
  }
  (function tick(t) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, 1920, 1080);
    if (state.slice === "night") drawFlies(t); else drawDust(t);
  })(0);
}
