import { describe, it, expect } from "vitest";
import { inBeam } from "../../src/scene/particles.js";

describe("inBeam", () => {
  it("huzmenin içindeki noktalar", () => {
    expect(inBeam(400, 400)).toBe(true);
    expect(inBeam(800, 1000)).toBe(true);
  });
  it("huzmenin dışındaki noktalar", () => {
    expect(inBeam(200, 200)).toBe(false);   // huzmenin üstü
    expect(inBeam(300, 900)).toBe(false);   // sol kenarın solu
    expect(inBeam(1300, 900)).toBe(false);  // sağ kenarın sağı
  });
});
