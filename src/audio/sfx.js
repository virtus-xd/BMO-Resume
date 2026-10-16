/* WebAudio sentez sesleri — dosya yok. Varsayılan kapalı; AudioContext yalnız bir kullanıcı etkileşiminden (unlock)
   sonra ve ses açıkken kurulur (tarayıcılar etkileşimsiz sesi engeller, konsol uyarısı da çıkmaz). */
export const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];

export function hashId(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function tuneFor(id) {
  let h = hashId(id) || 1;
  return Array.from({ length: 8 }, () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return SCALE[(h >>> 8) % SCALE.length];
  });
}

export function createSfx(win = window) {
  let ctx = null, on = false, unlocked = false, loopT = 0;

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
    giggle: () => [880, 988, 880, 1047].forEach((f, i) => later(i * 70, () => tone(f, 0.06, "square", 0.02))),
    coins: () => [1319, 1568, 1760, 2093].forEach((f, i) => later(i * 60, () => tone(f, 0.08, "triangle", 0.03))),
    viola: () => [392, 440, 494, 392].forEach((f, i) => later(i * 220, () => tone(f, 0.25, "sawtooth", 0.02))),
  };

  function stopLoop() { clearInterval(loopT); }

  return {
    /* kaset takılıyken ses açılırsa onun ezgisi başlar */
    setEnabled(v, currentId = null) { on = v; if (!v) stopLoop(); else if (currentId) this.startLoop(currentId); },
    unlock() { if (unlocked) return; unlocked = true; if (on) ensure(); },
    play(name) { if (on) SOUNDS[name]?.(); },
    startLoop(id) {
      stopLoop(); if (!on) return;
      const notes = tuneFor(id); let i = 0;
      loopT = setInterval(() => {
        tone(notes[i % 8], 0.14, "square", 0.035);
        if (i % 2 === 0) tone(notes[0] / 2, 0.12, "triangle", 0.03);
        i++;
      }, 180);
    },
    stopLoop,
  };
}
