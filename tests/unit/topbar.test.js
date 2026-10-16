import { describe, it, expect, vi, beforeEach } from "vitest";
import { initTopbar } from "../../src/ui/topbar.js";
import { createBus } from "../../src/state.js";

describe("initTopbar", () => {
  let state, bus, store, onList;
  beforeEach(() => {
    document.body.innerHTML = `<button id="btnList"></button><button id="btnLang"></button><button id="btnTime"></button><button id="btnSound"></button>`;
    state = { lang: "tr", slice: "noon", sound: false };
    bus = createBus(); store = { set: vi.fn(), get: vi.fn() }; onList = vi.fn();
    initTopbar({ state, bus, store, onList });
  });

  it("dil düğmesi TR↔EN değiştirir, kaydeder ve olay yayar", () => {
    const fn = vi.fn(); bus.on("lang:change", fn);
    document.getElementById("btnLang").click();
    expect(state.lang).toBe("en");
    expect(store.set).toHaveBeenCalledWith("lang", "en");
    expect(fn).toHaveBeenCalledWith("en");
    expect(document.getElementById("btnLang").textContent).toBe("EN");
  });
  it("saat düğmesi sıradaki dilime geçer ve sınıfı uygular", () => {
    document.getElementById("btnTime").click();
    expect(state.slice).toBe("sunset");
    expect(document.documentElement.classList.contains("t-sunset")).toBe(true);
  });
  it("ses düğmesi açar, kaydeder, aria-pressed günceller", () => {
    const fn = vi.fn(); bus.on("sound:change", fn);
    document.getElementById("btnSound").click();
    expect(fn).toHaveBeenCalledWith(true);
    expect(store.set).toHaveBeenCalledWith("sound", "on");
    expect(document.getElementById("btnSound").getAttribute("aria-pressed")).toBe("true");
  });
  it("liste düğmesi onList çağırır", () => {
    document.getElementById("btnList").click();
    expect(onList).toHaveBeenCalled();
  });
});
