import { describe, it, expect, vi, beforeEach } from "vitest";
import { createControls } from "../../src/ui/controls.js";
import { createBus } from "../../src/state.js";

describe("createControls (BMO tuşları, ekran simgeleri ve yedek liste aynı işlemleri kullanır)", () => {
  let state, bus, store, onList, c;
  beforeEach(() => {
    state = { lang: "tr", slice: "noon", sound: false };
    bus = createBus(); store = { set: vi.fn(), get: vi.fn() }; onList = vi.fn();
    c = createControls({ state, bus, store, onList });
  });

  it("dil TR↔EN değişir, kaydedilir ve olay yayılır", () => {
    const fn = vi.fn(); bus.on("lang:change", fn);
    c.run("lang");
    expect(state.lang).toBe("en");
    expect(store.set).toHaveBeenCalledWith("lang", "en");
    expect(fn).toHaveBeenCalledWith("en");
  });
  it("saat sıradaki dilime geçer, sınıfı uygular ve olay yayılır", () => {
    const fn = vi.fn(); bus.on("slice:change", fn);
    c.run("time");
    expect(state.slice).toBe("sunset");
    expect(document.documentElement.classList.contains("t-sunset")).toBe(true);
    expect(fn).toHaveBeenCalledWith("sunset");
  });
  it("ses açılır/kapanır, kaydedilir ve olay yayılır", () => {
    const fn = vi.fn(); bus.on("sound:change", fn);
    c.run("sound");
    expect(state.sound).toBe(true);
    expect(store.set).toHaveBeenCalledWith("sound", "on");
    expect(fn).toHaveBeenCalledWith(true);
    c.run("sound");
    expect(store.set).toHaveBeenLastCalledWith("sound", "off");
  });
  it("liste onList çağırır; bilinmeyen ad yok sayılır", () => {
    c.run("list");
    expect(onList).toHaveBeenCalled();
    expect(() => c.run("yok")).not.toThrow();
  });
});
