import { describe, it, expect, vi, beforeEach } from "vitest";
import { initObjects } from "../../src/scene/objects.js";
import { createBus } from "../../src/state.js";
import { STRINGS } from "../../src/data/i18n.js";

describe("initObjects", () => {
  let bus, state, say, sfx;
  beforeEach(() => {
    document.body.innerHTML = `<svg><g class="obj" data-obj="viola" tabindex="0"></g><g class="obj" data-obj="hat" tabindex="0"></g></svg>`;
    bus = createBus(); state = { lang: "tr", zoomed: false };
    say = vi.fn(); sfx = vi.fn(); bus.on("say", say); bus.on("sfx", sfx);
    initObjects({ root: document, bus, state, reduced: true });
  });

  it("tıklanınca BMO repliği ve nesneye özgü ses", () => {
    document.querySelector('[data-obj="viola"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(say).toHaveBeenCalledWith(STRINGS.tr.obj_viola);
    expect(sfx).toHaveBeenCalledWith("viola");
  });
  it("Enter tuşu tıklama gibi çalışır", () => {
    document.querySelector('[data-obj="hat"]').dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(say).toHaveBeenCalledWith(STRINGS.tr.obj_hat);
  });
  it("BMO ekranı açıkken tepki vermez", () => {
    state.zoomed = true;
    document.querySelector('[data-obj="hat"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(say).not.toHaveBeenCalled();
  });
  it("aria-label dile göre ayarlanır ve dil değişince güncellenir", () => {
    const hat = document.querySelector('[data-obj="hat"]');
    expect(hat.getAttribute("aria-label")).toBe(STRINGS.tr.obj_hat);
    state.lang = "en"; bus.emit("lang:change", "en");
    expect(hat.getAttribute("aria-label")).toBe(STRINGS.en.obj_hat);
  });
});
