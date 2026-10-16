import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSpeech } from "../../src/ui/speech.js";

describe("createSpeech", () => {
  let els, talk, blip, sp;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div id="b"><p id="t"></p></div><p id="l"></p><div id="a"></div>`;
    els = { bubbleEl: document.getElementById("b"), textEl: document.getElementById("t"), liveEl: document.getElementById("l"), anchorEl: document.getElementById("a") };
    talk = vi.fn(); blip = vi.fn();
    sp = createSpeech({ ...els, onTalk: talk, onBlip: blip, isNarrow: () => false });
  });
  afterEach(() => vi.useRealTimers());

  it("metni harf harf yazar, erişilebilir bölgeye tamamını hemen koyar", () => {
    sp.say("Merhaba");
    expect(els.liveEl.textContent).toBe("Merhaba");
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
});
