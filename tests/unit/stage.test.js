import { describe, it, expect } from "vitest";
import { coverScale, stageOffsetY, W, H } from "../../src/scene/stage.js";
import { SLOTS, ROOM_SVG, OBJECTS } from "../../src/scene/room.svg.js";

describe("coverScale", () => {
  it("geniş ekranda sahneyi kaplar (+%4 parallax payı)", () => {
    expect(coverScale(1920, 1080, false)).toBeCloseTo(1.04);
    expect(coverScale(2560, 1080, false)).toBeCloseTo((2560 / W) * 1.04);
  });
  it("dar düzende 1.3 kat yakınlaşır", () => {
    expect(coverScale(375, 812, true)).toBeCloseTo((812 / H) * 1.3);
  });
});

describe("stageOffsetY", () => {
  it("geniş düzende kaydırma yok", () => expect(stageOffsetY(900, 1, false)).toBe(0));
  it("dar düzende BMO'nun merkezi ekranın %45'ine gelir", () => {
    const vh = 812, k = coverScale(375, vh, true), oy = stageOffsetY(vh, k, true);
    expect(vh / 2 + oy + (770 - H / 2) * k).toBeCloseTo(0.45 * vh);
  });
});

describe("room", () => {
  it("10 kaset yuvası var ve hepsi güvenli bölgede", () => {
    expect(SLOTS).toHaveLength(10);
    SLOTS.forEach((s) => { expect(s.x).toBeGreaterThanOrEqual(240 + 70); expect(s.x).toBeLessThanOrEqual(1680 - 70); });
  });
  it("her Finn/Jake nesnesi tıklanabilir grup olarak var", () => {
    OBJECTS.forEach((o) => expect(ROOM_SVG).toContain(`data-obj="${o}" role="button"`));
  });
});
