/* Gündüz: pencere huzmesinde toz. Gece: odada dolaşan ateş böcekleri. Tek canvas, sahne ölçeğinde. */
const DPR = 2;

/* .beam çokgeni: (240,260) (430,380) (1180,1080) (470,1080) */
export function inBeam(x, y) {
  if (y < 260 || y > 1080) return false;
  const left = 240 + ((470 - 240) * (y - 260)) / 820;
  const right = y < 380 ? 240 + ((430 - 240) * (y - 260)) / 120 : 430 + ((1180 - 430) * (y - 380)) / 700;
  return x > left && x < right;
}

export function initParticles(canvas, state) {
  canvas.width = 1920 * DPR; canvas.height = 1080 * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dust = Array.from({ length: 70 }, () => ({ x: rnd(260, 1100), y: rnd(280, 1060), r: rnd(0.8, 2.2), vx: rnd(-0.05, 0.12), vy: rnd(-0.06, 0.06), ph: rnd(0, 6) }));
  const flies = Array.from({ length: 24 }, () => ({ x: rnd(260, 1660), y: rnd(320, 1000), a: rnd(0, 6.28), sp: rnd(0.25, 0.6), ph: rnd(0, 6) }));

  function drawDust(t) {
    ctx.fillStyle = "#fff2c8";
    for (const p of dust) {
      p.x += p.vx + Math.sin(t / 2000 + p.ph) * 0.06;
      p.y += p.vy + Math.cos(t / 2500 + p.ph) * 0.05;
      if (p.y > 1070 || p.y < 270 || p.x > 1170 || p.x < 250) { p.y = rnd(300, 1040); p.x = rnd(300, 900); }
      if (!inBeam(p.x, p.y)) continue;
      ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(t / 900 + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  }
  function drawFlies(t) {
    for (const f of flies) {
      f.a += Math.sin(t / 1500 + f.ph) * 0.03;
      f.x += Math.cos(f.a) * f.sp; f.y += Math.sin(f.a) * f.sp * 0.6;
      if (f.x < 240 || f.x > 1680) f.a = Math.PI - f.a;
      if (f.y < 300 || f.y > 1020) f.a = -f.a;
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
