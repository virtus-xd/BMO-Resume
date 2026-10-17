import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSpeech } from "../../src/ui/speech.js";

describe("createSpeech", () => {
  let els, talk, blip, sp;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="b" hidden><p id="t"></p></div><p id="l"></p>`;
    els = { bubbleEl: document.getElementById("b"), textEl: document.getElementById("t"), liveEl: document.getElementById("l") };
    talk = vi.fn(); blip = vi.fn();
    sp = createSpeech({ ...els, onTalk: talk, onBlip: blip });
  });
  afterEach(() => vi.useRealTimers());

  it("metni harf harf yazar, erişilebilir bölgeye konuşanla birlikte tamamını hemen koyar", () => {
    sp.say("Merhaba");
    expect(els.liveEl.textContent).toBe("BMO: Merhaba");
    expect(els.bubbleEl.hidden).toBe(false);
    vi.advanceTimersByTime(28 * 3);
    expect(els.textEl.textContent).toBe("Mer");
    vi.advanceTimersByTime(28 * 10);
    expect(els.textEl.textContent).toBe("Merhaba");
  });
  it("konuşma başında ve sonunda onTalk çağrılır", () => {
    sp.say("Hi");
    expect(talk).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(28 * 5);
    expect(talk).toHaveBeenLastCalledWith(false);
  });
  it("yeni replik eskisini keser", () => {
    sp.say("Uzun bir cümle"); vi.advanceTimersByTime(28 * 2);
    sp.say("Yeni"); vi.advanceTimersByTime(28 * 20);
    expect(els.textEl.textContent).toBe("Yeni");
  });
  it("her 3 harfte bir blip çalar", () => {
    sp.say("abcdef"); vi.advanceTimersByTime(28 * 6);
    expect(blip).toHaveBeenCalledTimes(2);
  });
  it("konumlandırma yok: place API'si kalktı, kutu hep altta (CSS)", () => {
    expect(sp.place).toBeUndefined();
  });
  it("stop yazımı keser ve konuşmayı bitirir", () => {
    sp.say("Uzun bir cümle"); vi.advanceTimersByTime(28 * 2);
    sp.stop(); vi.advanceTimersByTime(28 * 20);
    expect(els.textEl.textContent).toBe("Uz");
    expect(talk).toHaveBeenLastCalledWith(false);
  });
  it("replik bitince 6 sn sonra kutu dinlenir (ön sıradaki kasetleri kapatmasın), yeni replikte geri gelir", () => {
    sp.say("Hi"); vi.advanceTimersByTime(28 * 2);
    vi.advanceTimersByTime(5900);
    expect(els.bubbleEl.classList.contains("rest")).toBe(false);
    vi.advanceTimersByTime(200);
    expect(els.bubbleEl.classList.contains("rest")).toBe(true);
    sp.say("Yeni");
    expect(els.bubbleEl.classList.contains("rest")).toBe(false);
  });
});


describe("tip (BMO tuşunun üstüne gelince terminal satırı)", () => {
  let b, hint, tip, sp;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="b" hidden><p id="t"></p><small id="h">ipucu</small><small id="tip" hidden></small></div><p id="l"></p>`;
    b = document.getElementById("b"); hint = document.getElementById("h"); tip = document.getElementById("tip");
    sp = createSpeech({ bubbleEl: b, textEl: document.getElementById("t"), liveEl: document.getElementById("l"), tipEl: tip, onTalk: vi.fn(), onBlip: vi.fn() });
  });
  afterEach(() => vi.useRealTimers());

  it("açıklamayı yazar ve dinlenen kutuyu geri getirir; üstündeyken kutu dinlenmez", () => {
    sp.say("Hi"); vi.advanceTimersByTime(28 * 2 + 6100);
    expect(b.classList.contains("rest")).toBe(true);
    sp.tip("[kırmızı] ses: kapalı");
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toBe("[kırmızı] ses: kapalı");
    expect(b.classList.contains("tipping")).toBe(true);
    expect(b.classList.contains("rest")).toBe(false);
    vi.advanceTimersByTime(10000);
    expect(b.classList.contains("rest")).toBe(false);
  });
  it("tip(null) açıklamayı kaldırır, 2 sn sonra kutu yine dinlenir", () => {
    sp.tip("x");
    expect(b.hidden).toBe(false);
    sp.tip(null);
    expect(tip.hidden).toBe(true);
    expect(b.classList.contains("tipping")).toBe(false);
    vi.advanceTimersByTime(1900);
    expect(b.classList.contains("rest")).toBe(false);
    vi.advanceTimersByTime(200);
    expect(b.classList.contains("rest")).toBe(true);
  });
  it("replik yazılırken açıklama kalkarsa kutu replik bitene kadar dinlenmez", () => {
    sp.say("Uzun bir cümle burada");
    sp.tip("x"); sp.tip(null);
    vi.advanceTimersByTime(2100);
    expect(b.classList.contains("rest")).toBe(false);
  });
});
