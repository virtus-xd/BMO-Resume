import { describe, it, expect, vi } from "vitest";
import { songFor, createSfx } from "../../src/audio/sfx.js";

const IDS = ["hakkimda", "okey", "tbh", "davetiye", "oxxo", "stok", "radar", "esp32", "jarvis"];
const lead = (s) => s.notes.filter((n) => n.voice === "lead");

describe("songFor (kaset ezgisi)", () => {
  it("aynı id için hep aynı parça; notalar Do majör gamından", () => {
    const s = songFor("okey");
    expect(songFor("okey")).toEqual(s);
    s.notes.forEach((n) => expect([0, 2, 4, 5, 7, 9, 11]).toContain(((Math.round(12 * Math.log2(n.f / 261.63)) % 12) + 12) % 12));
  });
  it("sakin tempo: dakikada en çok 90 vuruş, en kısa ezgi notası bir sekizlik (≥ 0,33 sn)", () => {
    IDS.forEach((id) => {
      const s = songFor(id), beat = 60 / s.bpm;
      expect(s.bpm).toBeLessThanOrEqual(90);
      lead(s).forEach((n) => expect(n.len * beat).toBeGreaterThanOrEqual(0.33));
    });
  });
  it("ritim tekdüze değil: en az 3 farklı nota uzunluğu, susmalar ve en az 4 farklı ölçü ritmi", () => {
    IDS.forEach((id) => {
      const s = songFor(id), l = lead(s);
      expect(new Set(l.map((n) => n.len)).size).toBeGreaterThanOrEqual(3);
      expect(l.reduce((a, n) => a + n.len, 0)).toBeLessThan(s.beats * 0.9);
      const bar = (b) => l.filter((n) => Math.floor(n.at / 4) === b).map((n) => `${n.at % 4}:${n.len}`).join(",");
      expect(new Set(Array.from({ length: s.beats / 4 }, (_, b) => bar(b))).size).toBeGreaterThanOrEqual(4);
    });
  });
  it("her kasetin ezgisi farklı; altında bas çalar", () => {
    expect(new Set(IDS.map((id) => lead(songFor(id)).map((n) => n.f).join(","))).size).toBe(IDS.length);
    IDS.forEach((id) => expect(songFor(id).notes.some((n) => n.voice === "bass")).toBe(true));
  });
});

describe("createSfx", () => {
  it("ses kapalıyken AudioContext oluşturmaz", () => {
    const AC = vi.fn();
    const sfx = createSfx({ AudioContext: AC });
    sfx.play("pick"); sfx.startLoop("okey");
    expect(AC).not.toHaveBeenCalled();
  });
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  const fakeCtx = (starts = []) => {
    const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), start: (t) => starts.push(t), stop: vi.fn(), type: "", frequency: param(), gain: param(), Q: param() });
    return { state: "running", currentTime: 0, destination: {}, createOscillator: node, createGain: node, createBiquadFilter: node, resume: vi.fn() };
  };
  const fakeAC = () => vi.fn(function () { return fakeCtx(); });
  it("ses açık olsa bile kullanıcı etkileşimi (unlock) olmadan AudioContext kurulmaz", () => {
    const AC = fakeAC();
    const sfx = createSfx({ AudioContext: AC });
    sfx.setEnabled(true);
    sfx.play("pick");
    expect(AC).not.toHaveBeenCalled();
    sfx.unlock();
    sfx.play("pick");
    expect(AC).toHaveBeenCalledTimes(1);
  });
  it("ses açma tıklaması (etkileşim içinde) AudioContext'i hemen kurar/sürdürür — iOS'ta sonradan zamanlayıcıdan değil", () => {
    const AC = fakeAC();
    const sfx = createSfx({ AudioContext: AC });
    sfx.unlock();
    expect(AC).not.toHaveBeenCalled(); // ses kapalıyken kurulmaz
    sfx.setEnabled(true);
    expect(AC).toHaveBeenCalledTimes(1);
  });
  it("kaset takılıyken ses açılınca chiptune başlar", () => {
    vi.useFakeTimers();
    const AC = fakeAC();
    const sfx = createSfx({ AudioContext: AC });
    sfx.unlock();
    sfx.setEnabled(true, "okey");
    vi.advanceTimersByTime(200);
    expect(AC).toHaveBeenCalled();
    sfx.setEnabled(false);
    vi.useRealTimers();
  });
  it("ezgi ses saatine göre önceden zamanlanır: notalar arası en az bir sekizlik; durunca yeni nota gelmez", () => {
    vi.useFakeTimers();
    const starts = [], ctx = fakeCtx(starts);
    const sfx = createSfx({ AudioContext: vi.fn(function () { return ctx; }) });
    sfx.unlock(); sfx.setEnabled(true);
    sfx.startLoop("okey");
    for (let i = 0; i < 40; i++) { ctx.currentTime += 0.1; vi.advanceTimersByTime(100); } // 4 sn
    const t = [...new Set(starts.map((x) => x.toFixed(3)))].map(Number).sort((a, b) => a - b);
    expect(t.length).toBeGreaterThan(4);
    expect(Math.min(...t.slice(1).map((x, i) => x - t[i]))).toBeGreaterThanOrEqual(0.32);
    sfx.stopLoop();
    const n = starts.length;
    for (let i = 0; i < 20; i++) { ctx.currentTime += 0.1; vi.advanceTimersByTime(100); }
    expect(starts.length).toBe(n);
    vi.useRealTimers();
  });
  it("AudioContext yoksa ses açıkken de hata vermez", () => {
    const sfx = createSfx({});
    sfx.setEnabled(true);
    expect(() => sfx.play("clunk")).not.toThrow();
  });
});
