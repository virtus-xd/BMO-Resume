import { describe, it, expect } from "vitest";
import { inBand } from "../../src/scene/particles.js";

describe("inBand", () => {
  it("sahnenin orta bandındaki noktalar (x 240–1680, y 300–1000)", () => {
    expect(inBand(960, 600)).toBe(true);
    expect(inBand(240, 300)).toBe(true);
    expect(inBand(1680, 1000)).toBe(true);
  });
  it("bandın dışındaki noktalar", () => {
    expect(inBand(239, 600)).toBe(false);
    expect(inBand(1681, 600)).toBe(false);
    expect(inBand(960, 299)).toBe(false);
    expect(inBand(960, 1001)).toBe(false);
  });
});
