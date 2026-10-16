import { describe, it, expect, vi } from "vitest";
import { tuneFor, SCALE, createSfx } from "../../src/audio/sfx.js";

describe("tuneFor", () => {
  it("aynı id için hep aynı 8 notayı verir, notalar gamdan", () => {
    const a = tuneFor("okey");
    expect(a).toHaveLength(8);
    expect(tuneFor("okey")).toEqual(a);
    a.forEach((f) => expect(SCALE).toContain(f));
  });
});

describe("createSfx", () => {
  it("ses kapalıyken AudioContext oluşturmaz", () => {
    const AC = vi.fn();
    const sfx = createSfx({ AudioContext: AC });
    sfx.play("pick"); sfx.startLoop("okey");
    expect(AC).not.toHaveBeenCalled();
  });
  it("AudioContext yoksa ses açıkken de hata vermez", () => {
    const sfx = createSfx({});
    sfx.setEnabled(true);
    expect(() => sfx.play("clunk")).not.toThrow();
  });
});
