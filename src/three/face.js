/* BMO ekranı: 512×360 canvas. İfadeler v1'in SVG koordinatlarında (ekran x 44–244, y 36–182; merkez 144,109)
   tanımlı; çizerken ×512/200 ölçeklenir. `eye` göz bebeği kayması, v1 birimiyle (±4). */
export const FACE_W = 512, FACE_H = 360;
const K = FACE_W / 200;
const FG = "#1f3b33", SCREEN = "#c9f2c7";

const EYES = [["c", 108, 100, 8], ["c", 180, 100, 8]];
const SMILE = ["s", "M126 128q18 16 36 0"];
const OPEN_SMILE = ["f", "M120 124h48q-4 26-24 26t-24-26Z"];

/* her ifade: [tür, ...] — c: dolu daire (göz), f: dolu yol, s: çizgi yol, e: elips, sh: parlama */
const SHAPES = {
  idle: [...EYES, SMILE],
  blink: [["s", "M98 100h20M170 100h20"], SMILE],
  hungry: [["c", 108, 98, 12], ["c", 180, 98, 12], ["sh", 112, 94, 4], ["sh", 184, 94, 4], ["e", 144, 138, 12, 14, FG]],
  talkA: [...EYES, ["f", "M126 126h36q-3 20-18 20t-18-20Z"]],
  talkB: [...EYES, ["s", "M132 132h24"]],
  happy: [["s", "M96 104l12-12 12 12M168 104l12-12 12 12"], OPEN_SMILE],
  sad: [...EYES, ["s", "M128 140q16-14 32 0"]],
  giggle: [["s", "M96 96l14 9-14 9M192 96l-14 9 14 9"], OPEN_SMILE, ["e", 86, 130, 12, 7, "rgba(244,154,176,.7)"], ["e", 202, 130, 12, 7, "rgba(244,154,176,.7)"]],
  loading: [["t", "LOADING", 144, 100], ["r", 84, 116, 120, 16]],
};

function screenBase(ctx) {
  const g = ctx.createRadialGradient(256, 170, 40, 256, 180, 330);
  g.addColorStop(0, "#e2fcdd"); g.addColorStop(1, "#b2e6ae");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
}

/* cam: iç gölge, tarama çizgileri ve çapraz yansıma şeridi */
function glass(ctx) {
  const edge = ctx.createRadialGradient(256, 180, 150, 256, 180, 340);
  edge.addColorStop(0, "rgba(10,40,25,0)"); edge.addColorStop(1, "rgba(10,40,25,.32)");
  ctx.fillStyle = edge; ctx.fillRect(0, 0, FACE_W, FACE_H);
  const top = ctx.createLinearGradient(0, 0, 0, 40);
  top.addColorStop(0, "rgba(10,40,25,.35)"); top.addColorStop(1, "rgba(10,40,25,0)");
  ctx.fillStyle = top; ctx.fillRect(0, 0, FACE_W, 40);
  ctx.fillStyle = "rgba(10,58,26,.06)";
  for (let y = 0; y < FACE_H; y += 6) ctx.fillRect(0, y, FACE_W, 2);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(380, 0); ctx.lineTo(250, FACE_H); ctx.lineTo(170, FACE_H); ctx.closePath();
  const r = ctx.createLinearGradient(170, 0, 380, 0);
  r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.5, "rgba(255,255,255,.16)"); r.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r; ctx.fill();
  ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(420, 0); ctx.lineTo(290, FACE_H); ctx.lineTo(270, FACE_H); ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
  ctx.restore();
}

export function drawFace(ctx, name, eye = { x: 0, y: 0 }, progress = 0) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  screenBase(ctx);
  ctx.setTransform(K, 0, 0, K, FACE_W / 2 - 144 * K, FACE_H / 2 - 109 * K);
  ctx.fillStyle = ctx.strokeStyle = FG;
  ctx.lineWidth = 6; ctx.lineCap = ctx.lineJoin = "round";
  for (const [kind, ...a] of SHAPES[name] || SHAPES.idle) {
    if (kind === "c") { ctx.beginPath(); ctx.arc(a[0] + eye.x, a[1] + eye.y, a[2], 0, Math.PI * 2); ctx.fill(); }
    else if (kind === "sh") { ctx.fillStyle = SCREEN; ctx.beginPath(); ctx.arc(a[0] + eye.x, a[1] + eye.y, a[2], 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = FG; }
    else if (kind === "f") ctx.fill(new Path2D(a[0]));
    else if (kind === "s") ctx.stroke(new Path2D(a[0]));
    else if (kind === "e") { ctx.fillStyle = a[4]; ctx.beginPath(); ctx.ellipse(a[0], a[1], a[2], a[3], 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = FG; }
    else if (kind === "t") { ctx.font = "30px VT323, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(a[0], a[1], a[2]); }
    else if (kind === "r") { ctx.lineWidth = 4; ctx.strokeRect(a[0], a[1], a[2], a[3]); ctx.fillRect(a[0] + 4, a[1] + 4, (a[2] - 8) * progress, a[3] - 8); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  glass(ctx);
  ctx.restore();
}
