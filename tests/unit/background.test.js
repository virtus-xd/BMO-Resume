import { describe, it, expect, vi, afterEach } from "vitest";
import { bgSources, bgOpacity, initBackground } from "../../src/scene/background.js";
import { createBus } from "../../src/state.js";

const img = (decode) => { const el = document.createElement("img"); el.decode = decode; return el; };

describe("bgSources", () => {
  it("1920 ve 2752 genişlikli WebP srcset'i verir", () => {
    expect(bgSources("night").srcset).toBe("/bg/night-1920.webp 1920w, /bg/night-2752.webp 2752w");
    expect(bgSources("day").src).toBe("/bg/day-1920.webp");
  });
});

describe("bgOpacity", () => {
  it("gece yalnız gece görseli, gün batımında hafif karışım, diğerlerinde yalnız gündüz", () => {
    expect(bgOpacity("night")).toEqual({ day: 0, night: 1 });
    expect(bgOpacity("sunset")).toEqual({ day: 1, night: 0.35 });
    expect(bgOpacity("noon")).toEqual({ day: 1, night: 0 });
    expect(bgOpacity("morning")).toEqual({ day: 1, night: 0 });
  });
});

describe("initBackground", () => {
  afterEach(() => vi.useRealTimers());
  const setup = (decode) => {
    const dayEl = img(decode), nightEl = img(decode);
    const bg = initBackground({ dayEl, nightEl, state: { slice: "night", narrow: false }, bus: createBus(), reduced: true });
    return { dayEl, nightEl, bg };
  };

  it("görseller hiç çözülmezse ready 2500 ms'de yine çözülür", async () => {
    vi.useFakeTimers();
    const { bg } = setup(() => new Promise(() => {}));
    let done = false;
    bg.ready.then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(2499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it("iki görsel de çözülünce ready beklemeden çözülür", async () => {
    vi.useFakeTimers();
    const { bg } = setup(() => Promise.resolve());
    let done = false;
    bg.ready.then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });

  it("çözme hatası ready'yi bozmaz", async () => {
    const { bg } = setup(() => Promise.reject(new Error("bozuk")));
    await expect(bg.ready).resolves.toBeUndefined();
  });

  it("kaynakları ve başlangıç opaklığını dilime göre ayarlar", () => {
    const { dayEl, nightEl } = setup(() => Promise.resolve());
    expect(dayEl.getAttribute("srcset")).toBe(bgSources("day").srcset);
    expect(nightEl.getAttribute("src")).toBe("/bg/night-1920.webp");
    expect(nightEl.style.opacity).toBe("1");
    expect(dayEl.style.opacity).toBe("0");
  });
});
