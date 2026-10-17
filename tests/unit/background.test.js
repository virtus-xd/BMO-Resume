import { describe, it, expect, vi, afterEach } from "vitest";
import { bgSources, bgOpacity, initBackground, BG_SIZES } from "../../src/scene/background.js";
import { createBus } from "../../src/state.js";
import { gsap } from "gsap";

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

  it("gündüz dilimlerinde gece görseli sayfa yüklenip boşa çıkınca bile indirilmez (yalnız gerekince)", async () => {
    vi.useFakeTimers();
    const dayEl = img(() => Promise.resolve()), nightEl = img(() => Promise.resolve());
    initBackground({ dayEl, nightEl, state: { slice: "morning", narrow: false }, bus: createBus(), reduced: true });
    window.dispatchEvent(new Event("load"));
    await vi.advanceTimersByTimeAsync(10000);
    expect(nightEl.getAttribute("src")).toBeNull();
  });

  it("gece görseli geçiş anında iniyorsa çapraz geçiş çözülmesini bekler", async () => {
    let decoded;
    const dayEl = img(() => Promise.resolve()), nightEl = img(() => new Promise((r) => { decoded = r; })), bus = createBus();
    initBackground({ dayEl, nightEl, state: { slice: "noon", narrow: false }, bus, reduced: true });
    bus.emit("slice:change", "night");
    await Promise.resolve();
    expect(gsap.getTweensOf(nightEl)).toHaveLength(0); // çözülmeden geçiş başlamaz
    decoded();
    await new Promise((r) => setTimeout(r, 0));
    expect(gsap.getTweensOf(nightEl).length).toBeGreaterThan(0);
  });

  it("gündüz dilimlerinde gece görseli hemen indirilmez, geceye geçince yüklenir", () => {
    const dayEl = img(() => Promise.resolve()), nightEl = img(() => Promise.resolve()), bus = createBus();
    initBackground({ dayEl, nightEl, state: { slice: "noon", narrow: false }, bus, reduced: true });
    expect(nightEl.getAttribute("src")).toBeNull();
    bus.emit("slice:change", "night");
    expect(nightEl.getAttribute("src")).toBe("/bg/night-1920.webp");
  });

  it("ready yalnızca görünecek görselin çözülmesini bekler", async () => {
    vi.useFakeTimers();
    const dayEl = img(() => Promise.resolve()), nightEl = img(() => new Promise(() => {}));
    const bg = initBackground({ dayEl, nightEl, state: { slice: "noon", narrow: false }, bus: createBus(), reduced: true });
    let done = false;
    bg.ready.then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });

  it("HTML'de verilmiş kaynakları yeniden yazmaz (erken keşif bozulmasın)", () => {
    const dayEl = img(() => Promise.resolve()), nightEl = img(() => Promise.resolve());
    dayEl.setAttribute("src", "/bg/day-1920.webp");
    const set = vi.spyOn(dayEl, "setAttribute");
    initBackground({ dayEl, nightEl, state: { slice: "noon", narrow: false }, bus: createBus(), reduced: true });
    expect(set).not.toHaveBeenCalledWith("src", expect.anything());
  });

  it("sizes ön yükleme tarayıcısının anlayacağı biçimde (max() yok, çift indirme olmasın); dar düzende telefon boyu", () => {
    expect(BG_SIZES).not.toMatch(/max\(|min\(|calc\(/);
    expect(BG_SIZES.startsWith("(max-width: 700px) 100vw, (orientation: portrait) 100vw")).toBe(true);
    const html = require("node:fs").readFileSync("index.html", "utf8");
    expect(html).toContain(`sizes="${BG_SIZES}"`);
  });
});

