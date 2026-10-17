import { describe, it, expect } from "vitest";
import { coverScale, stageOffsetY, visibleStageRect, W, H, BMO_CENTER_Y } from "../../src/scene/stage.js";

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
    expect(vh / 2 + oy + (BMO_CENTER_Y - H / 2) * k).toBeCloseTo(0.45 * vh);
  });
});

describe("visibleStageRect", () => {
  it("16:9 ekranda stage'in ortadaki kırpılmamış kısmı", () => {
    const k = 1.04, r = visibleStageRect({ k, oy: 0 }, 1920, 1080);
    const near = (a, b) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1.01);
    near(r.x, 960 - 960 / k); near(r.w, 1920 / k + 1); near(r.y, 540 - 540 / k); near(r.h, 1080 / k + 1);
  });
  it("dar dikey ekranda yalnızca ince bir dilim görünür", () => {
    const vw = 375, vh = 812, k = coverScale(vw, vh, true), oy = stageOffsetY(vh, k, true);
    const r = visibleStageRect({ k, oy }, vw, vh);
    expect(Math.abs(r.w - vw / k)).toBeLessThanOrEqual(2);
    expect(r.w * r.h).toBeLessThan(W * H * 0.3);
  });
  it("stage sınırına kırpılır ve tam sayı piksel kutusu döner", () => {
    const r = visibleStageRect({ k: 1, oy: -300 }, 400, 800);
    expect(r.y + r.h).toBeLessThanOrEqual(H);
    [r.x, r.y, r.w, r.h].forEach((v) => expect(Number.isInteger(v)).toBe(true));
  });
});

