/* WebAudio sentez sesleri — dosya yok. Varsayılan kapalı; AudioContext yalnız bir kullanıcı etkileşiminden (unlock)
   sonra ve ses açıkken kurulur (tarayıcılar etkileşimsiz sesi engeller, konsol uyarısı da çıkmaz). */
export function hashId(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/* --- kaset ezgisi: Do majörde yavaş, 8 ölçülük parça (A B A D · C C A kapanış), altında akor kökünü çalan bas.
   Kaset id'si tohum: tempo, akor yürüyüşü, ölçü ritimleri ve ezgi her kasette farklı. --- */
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const hz = (deg) => 261.63 * 2 ** ((12 * Math.floor(deg / 7) + MAJOR[((deg % 7) + 7) % 7]) / 12); // derece 0 = Do4
const PROGRESSIONS = [[0, 5, 3, 4], [0, 4, 5, 3], [5, 3, 0, 4], [0, 3, 1, 4]]; // I–vi–IV–V, I–V–vi–IV, vi–IV–I–V, I–IV–ii–V
/* ölçü ritimleri: [başlangıç, uzunluk] sekizlik cinsinden (ölçü 8 sekizlik); her birinde susma payı var */
const RHYTHMS = [
  [[0, 2], [2, 1], [3, 1], [4, 3]],
  [[0, 3], [3, 1], [4, 2]],
  [[1, 1], [2, 2], [4, 1], [5, 2]],
  [[0, 1], [1, 1], [2, 2], [4, 3]],
  [[0, 2], [3, 1], [4, 2]],
  [[0, 4], [4, 1], [5, 1], [6, 1]],
];
const CADENCE = [[0, 6]];
const LOW = 2, HIGH = 11; // ezgi Mi4–Fa5 arasında

function rng(seed) {
  let h = seed || 1;
  return () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 8) / 16777216;
}

export function songFor(id) {
  const r = rng(hashId(id));
  const pick = (a) => a[Math.floor(r() * a.length)];
  const bpm = 76 + 4 * Math.floor(r() * 4);
  const prog = pick(PROGRESSIONS);
  const pool = [...RHYTHMS];
  const [A, B, C, D] = Array.from({ length: 4 }, () => pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const chordTones = (root) => Array.from({ length: HIGH - LOW + 1 }, (_, i) => LOW + i).filter((d) => [0, 2, 4].includes((((d - root) % 7) + 7) % 7));
  let prev = LOW + 3 + Math.floor(r() * 3);
  /* güçlü zamanlarda (ölçü başı, ortası) en yakın akor notası, arada adım adım yürüyüş */
  const phrase = (rhythm, root) => rhythm.map(([s]) => {
    if (s === 0 || s === 4) {
      const near = chordTones(root).sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev));
      prev = near[r() < 0.7 ? 0 : 1];
    } else {
      prev = Math.min(HIGH, Math.max(LOW, prev + pick([-2, -1, -1, 1, 1, 2])));
    }
    return prev;
  });
  const shift = (degs, by) => degs.map((d) => { let x = d + by; while (x > HIGH) x -= 7; while (x < LOW) x += 7; return x; });

  const motif = phrase(A, prog[0]);
  const bars = [
    [A, motif], [B, phrase(B, prog[1])], [A, shift(motif, prog[2] - prog[0])], [D, phrase(D, prog[3])],
    [C, (prev = Math.min(HIGH, prev + 2), phrase(C, prog[0]))], [C, phrase(C, prog[1])],
    [A, shift(motif, prog[2] - prog[0])], [CADENCE, phrase(CADENCE, prog[3])],
  ];
  const notes = [];
  bars.forEach(([rhythm, degs], b) => {
    rhythm.forEach(([s, len], i) => notes.push({ voice: "lead", at: b * 4 + s / 2, len: len / 2, f: hz(degs[i]) }));
    const root = prog[b % 4] - 7;
    const bass = b === 4 || b === 5 ? [[0, 6, root], [6, 2, root + 4]] : [[0, 3, root], [4, 2, root + 4], [6, 2, root + 7]];
    bass.forEach(([s, len, d]) => notes.push({ voice: "bass", at: b * 4 + s / 2, len: len / 2, f: hz(d) }));
  });
  return { bpm, beats: bars.length * 4, notes: notes.sort((a, b) => a.at - b.at) };
}

export function createSfx(win = window) {
  let ctx = null, on = false, unlocked = false, loop = null;

  function ensure() {
    if (!on || !unlocked) return null;
    try {
      const AC = win.AudioContext || win.webkitAudioContext;
      if (!AC) return null;
      ctx = ctx || new AC();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch { return null; }
  }

  function tone(f, d = 0.06, type = "square", vol = 0.03, slide) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d);
  }
  const later = (ms, fn) => setTimeout(fn, ms);

  const SOUNDS = {
    pick: () => tone(700, 0.07, "triangle", 0.05, 1100),
    drop: () => tone(500, 0.1, "triangle", 0.05, 250),
    lid: () => tone(320, 0.05, "square", 0.03, 180),
    clunk: () => { tone(150, 0.12, "triangle", 0.14, 80); later(90, () => tone(95, 0.16, "triangle", 0.12)); later(320, () => { tone(523, 0.09, "square", 0.025); later(90, () => tone(784, 0.12, "square", 0.025)); }); },
    eject: () => { tone(220, 0.08, "triangle", 0.12); later(70, () => tone(440, 0.1, "triangle", 0.06, 880)); },
    blip: () => tone(560 + Math.random() * 140, 0.025, "square", 0.018),
    key: () => tone(1250, 0.03, "square", 0.02, 900),
    shelf: () => { tone(420, 0.05, "triangle", 0.08, 300); later(55, () => tone(640, 0.04, "triangle", 0.04)); }, // rafa oturan kaset: tık-tık
    giggle: () => [880, 988, 880, 1047].forEach((f, i) => later(i * 70, () => tone(f, 0.06, "square", 0.02))),
    coins: () => [1319, 1568, 1760, 2093].forEach((f, i) => later(i * 60, () => tone(f, 0.08, "triangle", 0.03))),
    viola: () => [392, 440, 494, 392].forEach((f, i) => later(i * 220, () => tone(f, 0.25, "sawtooth", 0.02))),
  };

  /* ezgi sesi: yumuşak atak, nota boyunca söner; ezgiye hafif bir kare dalga parlaklık katar */
  function note(c, out, f, t, d, type, vol) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.95);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d);
  }
  const VOICES = {
    lead: (c, out, f, t, d) => { note(c, out, f, t, d, "triangle", 0.04); note(c, out, f, t, d * 0.6, "square", 0.006); },
    bass: (c, out, f, t, d) => note(c, out, f, t, d, "triangle", 0.035),
  };

  /* ses saatine göre ileriye zamanlama: zamanlayıcı gecikse de ritim kaymaz; geç kalan nota çalınmaz */
  function stopLoop() {
    if (!loop) return;
    const { timer, out } = loop;
    loop = null;
    clearInterval(timer);
    try {
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.4);
      setTimeout(() => out.disconnect(), 600);
    } catch { /* bağlam kapanmış olabilir */ }
  }

  return {
    /* kaset takılıyken ses açılırsa onun ezgisi başlar */
    /* ses düğmesine tıklama bir kullanıcı etkileşimidir: bağlam burada (zamanlayıcıda değil) kurulur/sürdürülür */
    setEnabled(v, currentId = null) {
      on = v;
      if (!v) { stopLoop(); return; }
      ensure();
      if (currentId) this.startLoop(currentId);
    },
    unlock() { if (unlocked) return; unlocked = true; if (on) ensure(); },
    play(name) { if (on) SOUNDS[name]?.(); },
    startLoop(id) {
      stopLoop();
      const c = ensure(); if (!c) return;
      const song = songFor(id), beat = 60 / song.bpm, length = song.beats * beat;
      const out = c.createGain(), lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(2400, c.currentTime);
      out.gain.setValueAtTime(0, c.currentTime);
      out.gain.linearRampToValueAtTime(1, c.currentTime + 0.8);
      out.connect(lp); lp.connect(c.destination);
      const t0 = c.currentTime + 0.1;
      let k = 0, pass = 0;
      const pump = () => {
        const now = c.currentTime;
        for (;;) {
          const n = song.notes[k], t = t0 + pass * length + n.at * beat;
          if (t > now + 1.2) break; // arka plan sekmesinde zamanlayıcı saniyede bire düşse de boşluk olmaz
          if (t >= now - 0.05) VOICES[n.voice](c, out, n.f, t, n.len * beat);
          if (++k === song.notes.length) { k = 0; pass++; }
        }
      };
      pump();
      loop = { timer: setInterval(pump, 200), out };
    },
    stopLoop,
  };
}
