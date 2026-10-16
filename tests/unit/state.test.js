import { describe, it, expect, vi, afterEach } from "vitest";
import { createBus, store } from "../../src/state.js";

describe("createBus", () => {
  it("dinleyiciye detayı iletir", () => {
    const b = createBus(); const fn = vi.fn();
    b.on("x", fn); b.emit("x", { a: 1 });
    expect(fn).toHaveBeenCalledWith({ a: 1 });
  });
  it("on() dönen fonksiyon aboneliği kaldırır", () => {
    const b = createBus(); const fn = vi.fn();
    const off = b.on("x", fn); off(); b.emit("x");
    expect(fn).not.toHaveBeenCalled();
  });
  it("dinleyicisi olmayan olay hata vermez", () => {
    expect(() => createBus().emit("yok")).not.toThrow();
  });
});

describe("store", () => {
  afterEach(() => vi.restoreAllMocks());
  it("yazar ve okur", () => {
    store.set("k", "v");
    expect(store.get("k")).toBe("v");
  });
  it("localStorage hata fırlatırsa null döner ve sessiz kalır", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(store.get("k")).toBeNull();
    expect(() => store.set("k", "v")).not.toThrow();
  });
});
